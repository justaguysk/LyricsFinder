import sys
import signal
import subprocess
import requests
import time
import json
import shutil
import asyncio
from pathlib import Path
from urllib.parse import quote

if sys.platform == 'win32':
    from winrt.windows.media.control import \
    GlobalSystemMediaTransportControlsSessionManager as MediaManager
    from winrt.windows.storage.streams import Buffer, DataReader
    from winrt.windows.applicationmodel import AppInfo


def shutdown(signum, frame):
    deleteTemp()
    sys.exit(0)


signal.signal(signal.SIGTERM, shutdown)
signal.signal(signal.SIGINT, shutdown)


temp = sys.argv[1]
resolvedTemp = Path(temp).resolve()

def deleteTemp():
    try:
        for item in resolvedTemp.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    except Exception as e:
        writeToMainJS({
            "error": f"deleteTemp(): {str(e)}"
        })


ENDPOINT = 'https://api.lyrics.ovh/v1'

noimage = Path(sys.argv[2]) / "noimage.png"

currentArtist = currentTitle = currentPlayer = currentStatus = currentImgObj = ''
currentImgPath = str(noimage)
plainJS = {
    "title": "No media playing",
    "artist": "",
    "lyrics": ". . .",
    "cover": "file:///" + str(noimage).replace('\\', '/'),
    "player": "N/A",
    "status": "N/A"
}

def formatInfo(string):
    charList = ['-', '/']

    for char in charList:
        if char in string:
            pos = string.find("-")
            string = string[:pos] if (pos > 0 and string[pos-1] == ' ') else string[:pos+1]

    return string


def writeToMainJS(object):
    try:
        sys.stdout.buffer.write(json.dumps(object).encode() + b'\0')
        sys.stdout.buffer.flush()
    except OSError:
        pass


async def getWindowsMetadata():
    if sys.platform != 'win32':
        return None

    sessions = await MediaManager.request_async()
    current_session = sessions.get_current_session()

    if current_session:
        info = await current_session.try_get_media_properties_async()

        if info:
            temp_dict = {}

            for attr in dir(info):
                if not attr.startswith('_'):
                    try:
                        value = getattr(info, attr)
                        if not callable(value):
                            temp_dict[attr] = value
                    except:
                        pass


            app_id = current_session.source_app_user_model_id
            try:
                app_info = AppInfo.get_from_app_user_model_id(app_id)
                app_name = app_info.display_info.display_name
            except:
                app_name = app_id

            status = current_session.get_playback_info().playback_status.name.capitalize()

            info_dict = {
                "title": temp_dict['title'],
                "artist": temp_dict['artist'],
                "imgObj": temp_dict['thumbnail'],
                "player": app_name,
                "status": status
            }

            return info_dict

    return None


async def saveThumbnail(obj):
    if sys.platform != 'win32':
        return None

    try:
        stream = await obj.open_read_async()
        reader = DataReader(stream)
        await reader.load_async(stream.size)
        buffer = reader.read_buffer(reader.unconsumed_buffer_length)
        image_bytes = bytes(buffer)

        Path(temp).parent.mkdir(parents=True, exist_ok=True)
        Path(temp).mkdir(parents=True, exist_ok=True)
        deleteTemp()
        
        filepath = Path(temp) / 'thumb.jpg'
        filepath.write_bytes(image_bytes)

        return filepath
    except Exception as e:
        writeToMainJS({
            "error": f"saveThumbnail(): {str(e)}"
        })

        return noimage


def runLyricFinder():
    while True:
        title = artist = imgPath = player = ''
        winImage = False
        global currentStatus
        global currentImgObj
        global currentImgPath

        if sys.platform == 'linux':
            status = subprocess.run(["playerctl", "status"], capture_output=True, text=True)

            if status.stderr != '':
                writeToMainJS(plainJS)
                time.sleep(2)
                continue

            if status.stdout != currentStatus:
                currentStatus = status.stdout
                writeToMainJS({
                    "status": currentStatus
                })
                

            metadata = subprocess.run(
                ["playerctl", 
                "metadata", 
                "--format", 
                "{{ title }}\n{{ artist }}\n{{ mpris:artUrl }}\n{{ playerName }}"], 
                capture_output=True, 
                text=True
            )

            if metadata.stderr != '':
                writeToMainJS(plainJS)
                time.sleep(2)
                continue

            listout = metadata.stdout.split('\n')
            title, artist, imgPath, player = listout[0], listout[1], listout[2].replace('file://', ''), listout[3] 
        else:
            metadata = asyncio.run(getWindowsMetadata())

            if not metadata:
                writeToMainJS(plainJS)
                time.sleep(2)
                continue

            title, artist, imgObj, player, status = metadata['title'], metadata['artist'], metadata['imgObj'], metadata['player'], metadata['status']

            if status != currentStatus:
                currentStatus = status
                writeToMainJS({
                    "status": currentStatus
                })

            if imgObj != currentImgObj:
                currentImgObj = imgObj
                currentImgPath = asyncio.run(saveThumbnail(currentImgObj))
                winImage = True

        
        global currentArtist
        global currentTitle
        global currentPlayer

        if artist == currentArtist and title == currentTitle:
            time.sleep(2)
            continue

        if player != currentPlayer:
            currentPlayer = player
            writeToMainJS({
                "player": currentPlayer
            })

        currentTitle = title
        currentArtist = artist

        writeToMainJS({
            "title": currentTitle,
            "artist": currentArtist
        })


        if sys.platform == 'linux' and imgPath != currentImgPath:
            try:
                currentImgPath = imgPath
                filename = Path(imgPath).name
                newpath = Path(temp) / filename

                newpath.parent.mkdir(parents=True, exist_ok=True)
                newpath.mkdir(parents=True, exist_ok=True)
                deleteTemp()

                shutil.copy2(currentImgPath, newpath)
                currentImgPath = newpath
                writeToMainJS({
                    "cover": str(newpath)
                })
            except Exception as e:
                writeToMainJS({
                    "error": f"Shutil error: {e}",
                    "cover": "file:///" + str(noimage)
                })

        elif winImage:
            writeToMainJS({
                "cover": "file:///" + str(currentImgPath).replace('\\', '/')
            })

        
        r = requests.get(f'{ENDPOINT}/{quote(formatInfo(currentArtist))}/{quote(formatInfo(currentTitle))}')

        lyrics = "Lyrics not found"

        if r.status_code == 200: 
            rdict = json.loads(r.text)
            lyrics = rdict["lyrics"].replace('\n', '<br>')

        elif '-' in currentArtist or '/' in currentArtist or '-' in currentTitle or '/' in currentTitle:
            r2 = requests.get(f'{ENDPOINT}/{quote(currentArtist, safe='')}/{quote(currentTitle, safe='')}')

            if r2.status_code == 200: 
                rdict = json.loads(r2.text)
                lyrics = rdict["lyrics"].replace('\n', '<br>')
            

        writeToMainJS({
            "lyrics": lyrics
        })
        time.sleep(2)

            
runLyricFinder()
import sys
import signal
import subprocess
import requests
import time
import json
import shutil
from pathlib import Path
from urllib.parse import quote


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
    except:
        pass


ENDPOINT = 'https://api.lyrics.ovh/v1'

noimage = './assets/noimage.png'

currentArtist = currentTitle = currentPlayer = currentStatus = ''
currentImgPath = noimage
plainJS = {
    "title": "No media playing",
    "artist": "",
    "lyrics": ". . .",
    "cover": noimage,
    "player": "N/A",
    "status": "N/A"
}

def formatInfo(string):
    charList = ['-', '/']

    for char in charList:
        if char in string:
            pos = string.find("-")
            string = string[:pos-1] if (pos > 0 and string[pos-1] == ' ') else string[:pos]

    return string


def writeToMainJS(object):
    sys.stdout.buffer.write(json.dumps(object).encode() + b'\0')
    sys.stdout.buffer.flush()


def runLyricFinder():
    while True:
        
        status = subprocess.run(["playerctl", "status"], capture_output=True, text=True)

        if status.stderr != '':
            writeToMainJS(plainJS)
            time.sleep(2)
            continue

        global currentStatus

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
        title, artist, imgPath, player = formatInfo(listout[0]), formatInfo(listout[1]), listout[2].replace('file://', ''), listout[3]

        
        global currentArtist
        global currentTitle
        global currentImgPath
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


        if imgPath != currentImgPath:
            try:
                deleteTemp()
                currentImgPath = imgPath
                filename = Path(imgPath).name
                newpath = Path(temp) / filename

                newpath.parent.mkdir(parents=True, exist_ok=True)

                shutil.copy2(currentImgPath, newpath)
                currentImgPath = newpath
                writeToMainJS({
                    "cover": str(newpath)
                })
            except Exception as e:
                writeToMainJS({
                    "error": f"Shutil error: {e}"
                })

        
        r = requests.get(f'{ENDPOINT}/{quote(currentArtist)}/{quote(currentTitle)}')

        lyrics = "Lyrics not found"

        if r.status_code == 200: 
            rdict = json.loads(r.text)
            lyrics = rdict["lyrics"].replace('\n', '<br>')
            

        writeToMainJS({
            "lyrics": lyrics
        })
        time.sleep(2)

            
runLyricFinder()
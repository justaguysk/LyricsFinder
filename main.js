const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('fs');

const config = require(path.join(__dirname, 'assets/config.json'));
let commandExists = require('command-exists').sync;


let mainWindow;
let windowReady = new Promise((resolve) => {
  global.resolveWindowReady = resolve;
});
let pythonProcess;
let isQuitting = false;



const createWindow = () => {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'assets/icon.png'),
    width: 460,
    height: 670,
    autoHideMenuBar: true,
    resizable: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('did-finish-load', () => {
    global.resolveWindowReady();

    if (process.platform !== 'linux') {
      mainWindow.webContents.send('no-linux');
    } else {
      if (config.mode === "light") {
        switchConfig();
        mainWindow.webContents.send('switch-mode');
      }

      let pyCom;

      if (!commandExists('python') && !commandExists('python3')) {
        mainWindow.webContents.send('no-python');
      } else if (!commandExists('playerctl')) {
        mainWindow.webContents.send('no-playerctl');
      } else {
        if (!commandExists('python')) {
          pyCom = 'python3'
        } else {
          pyCom = 'python'
        }

        spawnPy(pyCom);
      }
    }
  });
}


app.whenReady().then(() => {
  createWindow()
})


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


function spawnPy(pyCom) {
  pythonProcess = spawn(pyCom, [
    path.join(__dirname, 'main.py'),
    path.join(app.getPath('userData'), 'temp')
  ]);

  let buffer = '';


  pythonProcess.stdout.on('data', (data) => {

    if (mainWindow) {
      const messages = (buffer + data.toString()).split('\0');

      buffer = messages.pop();

      for (const message of messages) {
        try {
          const response = JSON.parse(message);
          
          if (Object.hasOwn(response, "artist")) {          
            mainWindow.webContents.send('update-title', response["title"]);
            mainWindow.webContents.send('update-artist', response["artist"]);
          }

          if (Object.hasOwn(response, "lyrics")) {
            mainWindow.webContents.send('update-lyrics', response["lyrics"]);
          } 
          
          if (Object.hasOwn(response, "cover")) {
            mainWindow.webContents.send('update-cover', path.normalize(response["cover"]));
          } 
          
          if (Object.hasOwn(response, "status")) {
            mainWindow.webContents.send('update-status', response["status"]);
          } 
          
          if (Object.hasOwn(response, "player")) {
            mainWindow.webContents.send('update-player', response["player"]);
          }  
          
          if (Object.hasOwn(response, "error")) {
            mainWindow.webContents.send('update-lyrics', response["error"]);
          } 
          
        } catch (error) {
          mainWindow.webContents.send('update-lyrics', error);
        }
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-lyrics', `${data.toString()}`);
    }
  });
}


function killPy() {
  return new Promise((resolve) => {
    if (!pythonProcess || pythonProcess.killed) {
      resolve();
      return;
    }

    pythonProcess.kill('SIGTERM');

    const killTimeout = setTimeout(() => {
      if (!pythonProcess.killed) {
        pythonProcess.kill('SIGKILL');
      }
      resolve();
    }, 2000);

    pythonProcess.on('exit', () => {
      clearTimeout(killTimeout);
      resolve();
    });
  });
}


function switchConfig() {
  if (config.mode === "light") {
    config.mode = "dark";
    fs.writeFileSync(path.join(__dirname, 'assets/config.json'), JSON.stringify(config, null, null))
  } else {
    config.mode = "light";
    fs.writeFileSync(path.join(__dirname, 'assets/config.json'), JSON.stringify(config, null, null))
  }
}


ipcMain.on('switch-config', () => {
  switchConfig();
})


ipcMain.on('quit-click', () => {
  app.quit();
})

ipcMain.on('install-py', () => {
  shell.openExternal('https://www.python.org/downloads/');    
})

ipcMain.on('install-player', () => {
  shell.openExternal('https://github.com/altdesktop/playerctl#installing');
})

app.on('before-quit', async (event) => {
  if (isQuitting) return;
  isQuitting = true;
  event.preventDefault();
  
  await killPy();
  app.quit();
});


windowReady.then(() => {
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

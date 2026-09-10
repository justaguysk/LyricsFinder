const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('fs');
const configPath = path.join(app.getPath('userData'), 'config.json');
const basedir = (app.isPackaged) ? path.join(process.resourcesPath, 'app.asar.unpacked') : __dirname;
let commandExists = require('command-exists').sync;


app.setAppUserModelId("com.windows.zebrak.LyricsFinder");

let mainWindow;
let config;
let windowReady = new Promise((resolve) => {
  global.resolveWindowReady = resolve;
});
let pythonProcess;
let isQuitting = false;

//npm run make -- --platform win32
const createWindow = () => {
  console.log(`basedir: ${basedir}`);
  
  if (!fs.existsSync(configPath)) {
    fs.copyFileSync(path.join(basedir, 'config.json'), configPath);
  }

  config = require(configPath);
  
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'assets', 'icon.png'),
    width: 460,
    height: 670,
    autoHideMenuBar: true,
    resizable: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  const rightClickMenu = Menu.buildFromTemplate([
    { role: 'copy' },
    { role: 'selectAll' }
  ]);
  mainWindow.webContents.on('context-menu', (_event, params) => {
    rightClickMenu.popup();
  });

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

    if (process.platform === 'darwin') {
      mainWindow.webContents.send('on-mac');
    } else {
      if (config.mode === "light") {
        switchConfig();
        mainWindow.webContents.send('switch-mode');
      }

      if (process.platform === 'linux' && !commandExists('playerctl')) {
        mainWindow.webContents.send('no-cli');
      } else {
        const pythonExe = (process.platform === 'linux') 
          ? path.join(basedir, 'pyInstaller', 'main') 
          : path.join(basedir, 'pyInstaller', 'main.exe');

        spawnPy(pythonExe);
      }
    }
  });
}

function spawnPy(pyCom) {
  pythonProcess = spawn(pyCom, [
    path.join(app.getPath('userData'), 'temp'),
    basedir
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
            mainWindow.webContents.send('update-cover', response["cover"]);
          } 
          
          if (Object.hasOwn(response, "status")) {
            mainWindow.webContents.send('update-status', response["status"]);
          } 
          
          if (Object.hasOwn(response, "player")) {
            mainWindow.webContents.send('update-player', response["player"]);
          }  
          
          if (Object.hasOwn(response, "error")) {
            mainWindow.webContents.send('console-log', response["error"])
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


app.whenReady().then(() => {
  createWindow();
})


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
})


function switchConfig() {
  if (config) {
    if (config.mode === "light") {
      config.mode = "dark";
      fs.writeFileSync(configPath, JSON.stringify(config, null, null));
    } else {
      config.mode = "light";
      fs.writeFileSync(configPath, JSON.stringify(config, null, null));
    }
  }
}


ipcMain.on('switch-config', () => {
  switchConfig();
})


ipcMain.on('quit-click', () => {
  app.quit();
})

ipcMain.on('install-player', () => {
  shell.openExternal('https://github.com/altdesktop/playerctl#installing');
})


function killPy() {
  return new Promise((resolve) => {
    if (!pythonProcess || pythonProcess.killed) {
      resolve();
      return;
    }

    if (process.platform === 'win32') {
      const { exec } = require('child_process');

      exec(`taskkill /PID ${pythonProcess.pid}`, (error) => {
          if (error && error.code !== 128) {
            exec(`taskkill /PID ${pythonProcess.pid} /F`, (forceError) => {
              if (forceError && forceError.code !== 128) {
                console.error('Force kill error:', forceError);
              }
              setTimeout(resolve, 500);
            });
          } else {
            setTimeout(resolve, 1000);
          }
      });
    } else {
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
    }
  });
}


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
  app.quit();
})

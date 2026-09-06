const path = require('path');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '{config.json,noimage.png}',
      unpackDir: 'pyInstaller'
    },
    executableName: 'lyricsfinder',
    ignore: '.venv',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
      setupIcon: path.join(__dirname, 'assets', 'icon.ico'),
      icon: path.join(__dirname, 'assets', 'icon.ico')
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
            icon: path.join(__dirname, 'assets', 'icon.png')
          }
      },
    },
  ],
};

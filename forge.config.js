const path = require('path');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '{main.py,config.json,noimage.png}'
    },
    executableName: 'lyricsfinder',
    extraResource: [
      './.venv'
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
            icon: path.join(__dirname, 'assets/icon.png')
          }
      },
    },
  ],
};

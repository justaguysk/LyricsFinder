# Why build the app yourself?

This project is **NOT** signed. Signing costs a lot of money every month. Money that I don't possess. 

That means there is no credible SHA-256 signature with which you could verify that the provided release distributables contain the same code the current Github repository does. The distributables could be filled with viruses for all you know (they're not) and the only assurance of safety you'd have is my word.

By building the app yourself, you insure that the code it runs is identical to the code in this repository, which is publicly available and thus can be checked for malicious intent. You can even tweak the app to your desires.

This guide is aimed at beginners, even though some basic coding/computer knowledge is expected.

# Prerequisites

- Code Editor (this guide uses [VSCode](https://code.visualstudio.com/download))
- [Python (with venv/pip)](https://www.python.org/downloads/) (code is built in Python3.12)
- [NodeJS (with npm)](https://nodejs.org/en/download)
- [Git](https://git-scm.com/install/)

## 1. Clone the repository

Open a folder and create a new terminal in your code editor (*Terminal/New Terminal* in VSCode) and run `git clone https://github.com/justaguysk/LyricsFinder`.

You should now have a folder named *LyricsFinder* that includes all the files in this repository.

Navigate to the root folder with:

`cd LyricsFinder`

## 2. Create a Python venv
> [!NOTE]
> Creating a Python virtual environment makes installing Python packages easier and cleaner later in the guide. It is not mandatory however. You can install packages directly onto your system with `py` or `python3 -m pip install package`, but it is not recommended you do so.

In your current terminal run:

### Windows

`py -m venv .venv`

### Linux

`python3 -m venv .venv`


You should now have a folder named *.venv* in your current directory, however the environment still needs to be activated.

Run:

### Windows

`.venv\Scripts\activate`

### Linux 

`source .venv/bin/activate`


There should now be *"(.venv)"* in front of the directory info in your terminal. That means your Python virtual environment is activated.

## 3. Install required packages

This is the whole reason a *.venv* needed to be created in the first place. Packages will be installed into it. They are different for each platform.

Run:

### Windows 

```
py -m pip install winrt-Windows.Foundation
py -m pip install winrt-Windows.Media.Control
py -m pip install winrt-Windows.Storage.Streams
py -m pip install winrt-Windows.ApplicationModel
py -m pip install winrt-Windows.Storage.Collections
py -m pip install winrt-Windows.Storage
py -m pip install requests
py -m pip install pyinstaller
```

### Linux

```
pip install requests
pip install pyinstaller
```

These packages are necessary for the program to function.

## 4. Build PyInstaller executable

The reason the main *Electron NodeJS* process runs this executable instead of *main.py* directly, is so that a user who wants to run *LyricsFinder* doesn't have to install Python and all the required packages. Everything is included inside the executable.

To create it, run:

### Windows

`pyinstaller --onefile --windowed --collect-all=winrt main.py`

### Linux

`pyinstaller --onefile --windowed main.py`

You should see 2 new folders and a new file: *build*, *dist* and *main.spec*. You only need dist. 

Inside dist, there is a file named *main.exe (Windows)* or *main (Linux)*. Move the file into the *pyInstaller* folder and have it replace the files that are already there.

## 5. Install npm dependencies

When you downloaded *NodeJS* (if you followed the instructions), it bundled the *npm package manager* with it. You'll need it to install *Electron*/*Electron Forge* and other dependencies, so that you can build the final distributable.

There is a file named *package.json*, where all the required dependencies are listed. *Npm* will read that file and install everything for you.

Run:

`npm install`

You may get warnings about deprecations/vulnerabilities. You can ignore them. They won't affect the final build.

You should now have a folder called *node_modules*, where all the dependencies are installed.

## 6. Build distributable

This is the app itself. You could theoretically already run the code from your code editor, but it's much nicer and more convenient to have it as an app. It was made for that purpose.

The build configuration is in the *forge.config.js* file. The 2 pre-configured distributable types are: *zip (Windows)* and *deb (Linux)*. You can configure other distributable types, but that requires knowledge of *Electron* and its packaging.

To install the distributable for your platform, run:

`npm run make`

You should now have a folder named *out*. The final build is in *out/make/..*. You can now safely use it.

# .
2026 - Made with ❤️ in 🇸🇰

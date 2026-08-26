const title = document.getElementById("trackName");
const artist = document.getElementById("artistName");
const cover = document.getElementById("coverArt");
const lyrics = document.getElementById("lyrics");
const stat = document.getElementById("status");
const player = document.getElementById("player");
const switchbutton = document.getElementById("switchButton");
const generalcss = document.getElementById("generalcss");
const headercss = document.getElementById("headercss");
const footercss = document.getElementById("footercss");
const switchImg = document.getElementById("switchImg");
const quitImg = document.getElementById("quitImg");
const header = document.getElementById("header");
const footer = document.getElementById("footer");
const nolinux = document.getElementById("nolinux");
const nopython = document.getElementById("nopython");
const noplayerctl = document.getElementById("noplayerctl");
const installpy = document.getElementById("installpy");
const installplayer = document.getElementById("installplayer");
const quits = document.querySelectorAll(".quits");
const alertcss = document.getElementById("alertcss");


function onSwitchClick() {
    if (switchImg.src.includes("lightmode.png")) {
        switchImg.src = "assets/darkmode.png";
        quitImg.src = "assets/quit-dark.png";

        generalcss.href = "assets/styles/general-dark.css";
        headercss.href = "assets/styles/header-dark.css";
        footercss.href = "assets/styles/footer-dark.css";
        alertcss.href = "assets/styles/alert-button-dark.css"
    } else {
        switchImg.src = "assets/lightmode.png";
        quitImg.src = "assets/quit-light.png";

        generalcss.href = "assets/styles/general-light.css";
        headercss.href = "assets/styles/header-light.css";
        footercss.href = "assets/styles/footer-light.css";
        alertcss.href = "assets/styles/alert-button-light.css"
    }

    window.electronAPI.onSwitchClicked(null);
}

function HideUI() {
    header.style.display = "none";
    footer.style.display = "none";
    lyrics.style.display = "none";
}

function NoLinux() {
    HideUI();
    nolinux.style.display = "flex";
}

function NoPython() {
    HideUI();
    nopython.style.display = "flex";
}

function NoPlayerctl() {
    HideUI();
    noplayerctl.style.display = "flex";
}


switchbutton.addEventListener('click', () => {
    onSwitchClick();
})

installpy.addEventListener('click', () => {
    window.electronAPI.onInstallPyClicked(null);
})

installplayer.addEventListener('click', () => {
    window.electronAPI.onInstallPlayerClicked(null);
})

quits.forEach(button => {
    button.addEventListener('click', () => {
        window.electronAPI.onQuitClicked(null);
    });
});


window.electronAPI.onUpdateTitle((value) => {
    title.innerHTML = value;
})

window.electronAPI.onUpdateArtist((value) => {
    artist.innerHTML = value;
})

window.electronAPI.onUpdateCover((value) => {
    cover.src = value;
})

window.electronAPI.onUpdateLyrics((value) => {
    lyrics.innerHTML = value;
})

window.electronAPI.onUpdateStatus((value) => {
    stat.innerHTML = value;
})

window.electronAPI.onUpdatePlayer((value) => {
    player.innerHTML = value;
})

window.electronAPI.onSwitchMode(() => {
    onSwitchClick();
})

window.electronAPI.onNoLinux(() => {
    NoLinux();
})

window.electronAPI.onNoPython(() => {
    NoPython();
})

window.electronAPI.onNoPlayerctl(() => {
    NoPlayerctl();
})
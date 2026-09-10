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
const onmac = document.getElementById("onmac");
const nocli = document.getElementById("nocli");
const installplayer = document.getElementById("installplayer");
const quits = document.querySelectorAll(".quits");
const alertcss = document.getElementById("alertcss");
const cliText = document.getElementById("clitext");
const root = document.querySelector(':root');


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

function scrollAnimate(element) {
    if (!(element.scrollWidth > element.clientWidth)) {
        if (element.classList.contains("scrolltext")) {
            element.classList.remove("scrolltext");
        }
        return;
    }

    const scrollDistance = element.scrollWidth - element.offsetWidth
    const duration = (scrollDistance / 50) + 2;


    root.style.setProperty('--duration', `${duration}s`);
    root.style.setProperty('--distance', `${scrollDistance}px`);

    const sheet = document.styleSheets[5];

    for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
        if (sheet.cssRules[i].name === 'custom') {
            sheet.deleteRule(i);
        }
    }
    
    const percent = 1 / (duration / 100);

    const keyframe = `
    @keyframes scroll {
        0% { transform: translateX(0); }
        ${percent}% { transform: translateX(0); }
        ${100-percent}% { transform: translateX(calc(-1 * var(--distance))); }
        100% { transform: translateX(calc(-1 * var(--distance))); }
    }`;

    sheet.insertRule(keyframe, sheet.cssRules.length);

    if (!element.classList.contains("scrolltext")) {
        element.classList.add("scrolltext");
    } else {
        element.classList.remove("scrolltext");
        void element.offsetWidth;
        element.classList.add("scrolltext");
    }
}

function HideUI() {
    header.style.display = "none";
    footer.style.display = "none";
    lyrics.style.display = "none";
}

function OnMac() {
    HideUI();
    onmac.style.display = "flex";
}

function NoCli() {
    HideUI();
    nocli.style.display = "flex";
}


switchbutton.addEventListener('click', () => {
    onSwitchClick();
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
    title.textContent = value;
    scrollAnimate(title);
})

window.electronAPI.onUpdateArtist((value) => {
    artist.textContent = value;
    scrollAnimate(artist);
})

window.electronAPI.onUpdateCover((value) => {
    const timestamp = new Date().getTime();
    cover.src = value + '?' + timestamp;
})

window.electronAPI.onUpdateLyrics((value) => {
    lyrics.innerHTML = value;
})

window.electronAPI.onUpdateStatus((value) => {
    stat.textContent = value;
})

window.electronAPI.onUpdatePlayer((value) => {
    player.textContent = value;
})

window.electronAPI.onConsoleLog((value) => {
    console.error(`Python error: ${value}`);
})

window.electronAPI.onSwitchMode(() => {
    onSwitchClick();
})

window.electronAPI.onOnMac(() => {
    OnMac();
})

window.electronAPI.onNoCli(() => {
    NoCli();
})
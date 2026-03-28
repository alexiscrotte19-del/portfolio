window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = link.href;
        }, 500);
    });
});

const bouton = document.getElementById('monBouton');
const musique = document.getElementById('musique');

if (bouton && musique) {
    bouton.addEventListener('click', () => {
        if (musique.paused) {
            musique.play();
            bouton.textContent = 'Pause Musique';
        } else {
            musique.pause();
            bouton.textContent = 'Jouer Musique';
        }
    });
}

// Music player controls
const playPauseBtn = document.getElementById('playPause');
const volumeSlider = document.getElementById('volume');
const audio = document.getElementById('musique');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentSongDisplay = document.getElementById('currentSong');

// Playlist
const playlist = [
    { title: "Insane - Black Gryph0n", src: "music/hazbinhotel/SpotiDown.App - Insane - Black Gryph0n.mp3" },
    { title: "Upside Down (paroles) - Black Gryph0n", src: "music/hazbinhotel/SpotiDown.App - Upside Down (paroles)- Black Gryph0n.mp3" },
    { title: "Upside Down - Black Gryph0n", src: "music/hazbinhotel/Upside Down.mp3" }
];

let currentSongIndex = 0;

/* ------------------------------
   SAVE / LOAD SYSTEM
--------------------------------*/

function saveState() {
    localStorage.setItem("music_index", currentSongIndex);
    localStorage.setItem("music_time", audio.currentTime);
    localStorage.setItem("music_volume", audio.volume);
}

function loadState() {
    const savedIndex = localStorage.getItem("music_index");
    const savedTime = localStorage.getItem("music_time");
    const savedVolume = localStorage.getItem("music_volume");

    if (savedIndex !== null) currentSongIndex = parseInt(savedIndex);
    if (savedVolume !== null) audio.volume = savedVolume;

    audio.src = playlist[currentSongIndex].src;
    currentSongDisplay.textContent = playlist[currentSongIndex].title;

    audio.addEventListener("loadedmetadata", () => {
        if (savedTime !== null) {
            audio.currentTime = parseFloat(savedTime);
        }
    });
}

/* ------------------------------
   FADE IN / FADE OUT FUNCTIONS
--------------------------------*/

function fadeOut(audioElement, callback) {
    if (audioElement.volume > 0) {
        audioElement.volume = Math.max(0, audioElement.volume - 0.1);
        setTimeout(() => fadeOut(audioElement, callback), 50);
    } else {
        callback();
    }
}

function fadeIn(audioElement) {
    audioElement.volume = 0;
    audioElement.play();
    const targetVolume = parseFloat(volumeSlider.value);

    const fadeInStep = () => {
        if (audioElement.volume < targetVolume) {
            audioElement.volume = Math.min(targetVolume, audioElement.volume + 0.1);
            setTimeout(fadeInStep, 50);
        }
    };
    fadeInStep();
}

/* ------------------------------
   SONG LOADING + TRANSITIONS
--------------------------------*/

function loadSong(index, userTriggered = false) {
    if (!playlist[index]) return;

    const wasPlaying = !audio.paused;

    fadeOut(audio, () => {
        audio.src = playlist[index].src;
        currentSongDisplay.textContent = playlist[index].title;
        currentSongIndex = index;

        if (wasPlaying || userTriggered) {
            fadeIn(audio);
        }
    });
}

function nextSong(userTriggered = false) {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    loadSong(currentSongIndex, userTriggered);
}

function prevSong(userTriggered = false) {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex, userTriggered);
}

/* ------------------------------
   INITIALISATION
--------------------------------*/

loadState();

/* ------------------------------
   BUTTON CONTROLS
--------------------------------*/

if (playPauseBtn && audio) {
    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            audio.pause();
            playPauseBtn.textContent = '▶️';
        }
    });
}

if (volumeSlider && audio) {
    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
        saveState();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        nextSong(true);
        saveState();
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        prevSong(true);
        saveState();
    });
}

/* ------------------------------
   AUTO-PLAY NEXT SONG
--------------------------------*/

audio.addEventListener('ended', () => {
    nextSong(false);
    saveState();
});

/* ------------------------------
   SAVE TIME EVERY SECOND
--------------------------------*/

setInterval(saveState, 1000);

/* ------------------------------
   RESUME AFTER FIRST CLICK
--------------------------------*/

document.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
    }
}, { once: true });

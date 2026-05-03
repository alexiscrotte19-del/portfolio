let originalHomeContent = "";

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    originalHomeContent = document.getElementById("content").innerHTML;
});

/* ============================================================
   SPA SYSTEM — Navigation sans rechargement
============================================================ */

function loadPage(page) {
    fetch(`pages/${page}.html`)
        .then(res => res.text())
        .then(html => {
            const content = document.getElementById("content");
            content.innerHTML = html;

            requestAnimationFrame(() => {
                content.style.opacity = 1;
                content.style.transform = "translateY(0)";
            });

            document.querySelectorAll("section").forEach(sec => observer.observe(sec));
        });
}

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();

        const page = link.getAttribute("data-page");
        const content = document.getElementById("content");

        playFlashTransition(() => {

            if (page === "home") {
                content.innerHTML = originalHomeContent;
                document.querySelectorAll("section").forEach(sec => observer.observe(sec));
                return;
            }

            fetch(`pages/${page}.html`)
                .then(res => res.text())
                .then(html => {
                    content.innerHTML = html;
                    document.querySelectorAll("section").forEach(sec => observer.observe(sec));
                });
        });
    });
});

/* ============================================================
   TRANSITION FLASH PREMIUM
============================================================ */

const flash = document.getElementById("flash-transition");

function playFlashTransition(callback) {
    flash.style.opacity = "1";
    setTimeout(() => {
        callback();
        flash.style.opacity = "0";
    }, 300);
}

/* ============================================================
   SECTIONS VIVANTES
============================================================ */

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
}, { threshold: 0.2 });

document.querySelectorAll("section").forEach(sec => observer.observe(sec));

/* ============================================================
   LUMIÈRE QUI SUIT LA SOURIS
============================================================ */

document.addEventListener("mousemove", e => {
    document.documentElement.style.setProperty("--mouse-x", e.clientX + "px");
    document.documentElement.style.setProperty("--mouse-y", e.clientY + "px");
});

/* ============================================================
   PARALLAXE DU FOND
============================================================ */

window.addEventListener("scroll", () => {
    const offset = window.scrollY * 0.1;
    document.body.style.backgroundPosition = `center ${offset}px`;
});

/* ============================================================
   MUSIC PLAYER
============================================================ */

const audio = document.getElementById('musique');
const playPauseBtn = document.getElementById('playPause');
const volumeSlider = document.getElementById('volume');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentSongDisplay = document.getElementById('currentSong');

/* ============================================================
   EQUALIZER CONTROL
============================================================ */

const bars = document.querySelectorAll(".equalizer .bar");

function startEqualizer() {
    bars.forEach(bar => bar.style.animationPlayState = "running");
}

function stopEqualizer() {
    bars.forEach(bar => bar.style.animationPlayState = "paused");
}

/* ============================================================
   PLAYLIST
============================================================ */

const playlist = [
    { title: "Upside Down (paroles) - Black Gryph0n", src:"music/hazbinhotel/Insane Black Gryph0n.mp3" },
    { title: "Upside Down - Black Gryph0n", src:"music/hazbinhotel/Upside Down.mp3" }
];

let currentSongIndex = 0;

/* ============================================================
   SAVE / LOAD SYSTEM
============================================================ */

function saveState() {
    localStorage.setItem("music_index", currentSongIndex);
    localStorage.setItem("music_time", audio.currentTime);
    localStorage.setItem("music_volume", audio.volume);
}

function loadState() {
    const savedIndex = parseInt(localStorage.getItem("music_index"));
    const savedVolume = localStorage.getItem("music_volume");

    if (!isNaN(savedIndex) && playlist[savedIndex]) {
        currentSongIndex = savedIndex;
    } else {
        currentSongIndex = 0;
        localStorage.setItem("music_index", 0);
    }

    if (savedVolume !== null) audio.volume = parseFloat(savedVolume);

    audio.src = playlist[currentSongIndex].src;
    currentSongDisplay.textContent = playlist[currentSongIndex].title;
    audio.currentTime = 0;
}

/* ============================================================
   FADE IN / FADE OUT MUSIQUE
============================================================ */

function fadeOut(audioElement, callback) {
    stopEqualizer();

    if (audioElement.paused) return callback();

    if (audioElement.volume > 0.05) {
        audioElement.volume = Math.max(0, audioElement.volume - 0.1);
        setTimeout(() => fadeOut(audioElement, callback), 50);
    } else {
        audioElement.volume = 0;
        callback();
    }
}

function fadeIn(audioElement) {
    const targetVolume = Math.max(0.01, parseFloat(volumeSlider.value));

    audioElement.volume = 0;
    audioElement.play();
    startEqualizer();

    const fadeInStep = () => {
        if (audioElement.volume < targetVolume) {
            audioElement.volume = Math.min(targetVolume, audioElement.volume + 0.1);
            setTimeout(fadeInStep, 50);
        }
    };
    fadeInStep();
}

/* ============================================================
   LECTURE DES MUSIQUES
============================================================ */

function loadSong(index, userTriggered = false) {
    if (!playlist[index]) return;

    const wasPlaying = !audio.paused;

    fadeOut(audio, () => {
        audio.src = playlist[index].src;
        audio.currentTime = 0;

        currentSongDisplay.textContent = playlist[index].title;
        currentSongIndex = index;

        if (wasPlaying || userTriggered) {
            setTimeout(() => fadeIn(audio), 50);
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

/* ============================================================
   INITIALISATION
============================================================ */

loadState();

/* ============================================================
   CONTRÔLES
============================================================ */

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸️';
        startEqualizer();
    } else {
        audio.pause();
        playPauseBtn.textContent = '▶️';
        stopEqualizer();
    }
});

volumeSlider.addEventListener('input', () => {
    audio.volume = Math.max(0.01, parseFloat(volumeSlider.value));
    saveState();
});

nextBtn.addEventListener('click', () => {
    nextSong(true);
    saveState();
});

prevBtn.addEventListener('click', () => {
    prevSong(true);
    saveState();
});

/* ============================================================
   PASSAGE AUTOMATIQUE À LA MUSIQUE SUIVANTE
============================================================ */

audio.addEventListener('ended', () => {
    stopEqualizer();
    nextSong(false);
    saveState();
});

/* ============================================================
   BARRE DE PROGRESSION — MISE À JOUR
============================================================ */

audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
});

/* ============================================================
   BARRE DE PROGRESSION — CLICK POUR AVANCER
============================================================ */

document.querySelector(".music-progress-container").addEventListener("click", e => {
    const rect = e.target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * audio.duration;
    audio.currentTime = newTime;
});

/* ============================================================
   SAUVEGARDE AUTOMATIQUE
============================================================ */

setInterval(saveState, 1000);

/* ============================================================
   IMPORTATION DE MUSIQUE
============================================================ */

const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);

    files.forEach(file => {
        playlist.push({
            title: file.name.replace(".mp3", ""),
            src: URL.createObjectURL(file)
        });
    });

    if (audio.paused && playlist.length > 0) {
        currentSongIndex = playlist.length - files.length;
        loadSong(currentSongIndex, true);
    }

    alert(files.length + " musique(s) ajoutée(s) !");
});

/* ============================================================
   HOVER 3D ULTRA PREMIUM
============================================================ */

document.querySelectorAll(".hover-3d").forEach(card => {
    card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;

        const rotateX = ((y / rect.height) - 0.5) * -15;
        const rotateY = ((x / rect.width) - 0.5) * 15;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    });
});

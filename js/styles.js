/* ============================================================
   VARIABLES GLOBALES & INITIALISATION
============================================================ */

let originalHomeContent = "";
let currentSongIndex = 0;
let isShuffle = false;
let isRepeat = false;

// Sélection sécurisée des éléments
const audio = document.getElementById('musique');
const playPauseBtn = document.getElementById('playPause');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volControl = document.getElementById('volume');

// Playlist initiale
const playlist = [
    { title: "Insane - Black Gryph0n", src: "music/hazbinhotel/Insane Black Gryph0n.mp3" },
    { title: "Upside Down - Black Gryph0n", src: "music/hazbinhotel/Upside Down.mp3" }
];

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    const contentEl = document.getElementById("content");
    if (contentEl) {
        originalHomeContent = contentEl.innerHTML;
    }
    loadState();
});

/* ============================================================
   SPA SYSTEM
============================================================ */
document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const page = link.getAttribute("data-page");

        const changePage = () => {
            const contentEl = document.getElementById("content");
            if (!contentEl) return;

            if (page === "home") {
                contentEl.innerHTML = originalHomeContent;
                reinitPageScripts();
                return;
            }

            fetch(`pages/${page}.html`)
                .then(res => res.text())
                .then(html => {
                    contentEl.innerHTML = html;
                    reinitPageScripts();
                })
                .catch(err => console.error("Erreur de navigation SPA:", err));
        };

        if (typeof playFlashTransition === "function") {
            playFlashTransition(changePage);
        } else {
            changePage();
        }
    });
});

function reinitPageScripts() {
    if (typeof initContactButton === "function") initContactButton();
    document.querySelectorAll("section").forEach(sec => observer.observe(sec));
}

/* ============================================================
   FONCTIONS CORE DU LECTEUR
============================================================ */

function loadSong(index, userTriggered = false) {
    if (!playlist[index] || !audio) return;

    const wasPlaying = !audio.paused;
    fadeOut(audio, () => {
        currentSongIndex = index;
        audio.src = playlist[index].src;
        audio.currentTime = 0;

        const display = document.getElementById('currentSong');
        if (display) display.textContent = playlist[index].title;

        const pBar = document.getElementById("progressBar");
        if (pBar) pBar.style.width = "0%";

        if (wasPlaying || userTriggered) {
            setTimeout(() => fadeIn(audio), 50);
            if (playPauseBtn) playPauseBtn.textContent = '⏸️';
        }
    });
}

function nextSong(userTriggered = false) {
    let index;
    
    if (isShuffle && !isRepeat) {
        // Choisit un index au hasard
        index = Math.floor(Math.random() * playlist.length);
        // Évite de retomber sur la même si possible
        if (index === currentSongIndex && playlist.length > 1) {
            index = (index + 1) % playlist.length;
        }
    } else {
        index = (currentSongIndex + 1) % playlist.length;
    }
    
    loadSong(index, userTriggered);
}

function prevSong(userTriggered = false) {
    let index = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(index, userTriggered);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
}

/* ============================================================
   FADE & EQUALIZER
============================================================ */

function fadeIn(audioElement) {

    // ... reste du code
    const targetVolume = volControl ? parseFloat(volControl.value) : 0.5;
    audioElement.volume = 0;
    audioElement.play().catch(e => console.log("Lecture bloquée"));
    startEqualizer();

    const fadeInStep = () => {
        if (audioElement.volume < targetVolume) {
            audioElement.volume = Math.min(targetVolume, audioElement.volume + 0.05);
            setTimeout(fadeInStep, 30);
        }
    };
    fadeInStep();
}

function fadeOut(audioElement, callback) {
    stopEqualizer();
    if (audioElement.paused || audioElement.volume <= 0) return callback();

    const fadeOutStep = () => {
        if (audioElement.volume > 0.05) {
            audioElement.volume -= 0.05;
            setTimeout(fadeOutStep, 30);
        } else {
            audioElement.volume = 0;
            audioElement.pause();
            callback();
        }
    };
    fadeOutStep();
}

function startEqualizer() {
    const activeBars = document.querySelectorAll(".equalizer .bar");
    activeBars.forEach(bar => bar.style.animationPlayState = "running");
}

function stopEqualizer() {
    const activeBars = document.querySelectorAll(".equalizer .bar");
    activeBars.forEach(bar => bar.style.animationPlayState = "paused");
}

/* ============================================================
   IMPORTATION DE DOSSIER COMPLET + GESTION DES FICHIERS AUDIO
============================================================ */
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const importFilesBtn = document.getElementById('importFilesBtn');
const importFolderBtn = document.getElementById('importFolderBtn');

// Fonction centrale pour traiter l'ajout à la playlist
function handleFiles(files) {
    if (files.length === 0) return;

    const oldLength = playlist.length;
    let musicAdded = false;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // On accepte uniquement l'audio
        if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
            playlist.push({
                title: file.name.replace(/\.[^/.]+$/, ""), // Nettoie le nom
                src: URL.createObjectURL(file)
            });
            musicAdded = true;
        }
    }

    // Si une musique a été ajoutée et que rien ne joue, on lance la lecture
    if (musicAdded && (audio.paused || !audio.src)) {
        loadSong(oldLength, true);
    }
}

// Configuration du bouton pour les FICHIERS
if (importFilesBtn && fileInput) {
    importFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = ""; // Permet de ré-importer le même fichier
    });
}

// Configuration du bouton pour les DOSSIERS
if (importFolderBtn && folderInput) {
    importFolderBtn.addEventListener('click', () => folderInput.click());
    folderInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        folderInput.value = ""; // Permet de ré-importer le même dossier
    });
}
/* ============================================================
   EVENT LISTENERS
============================================================ */

if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            fadeIn(audio);
            playPauseBtn.textContent = '⏸️';
        } else {
            fadeOut(audio, () => {
                playPauseBtn.textContent = '▶️';
            });
        }
    });
}

if (nextBtn) nextBtn.addEventListener('click', () => nextSong(true));
if (prevBtn) prevBtn.addEventListener('click', () => prevSong(true));

if (volControl) {
    volControl.addEventListener('input', () => {
        audio.volume = volControl.value;
        saveState();
    });
}

if (audio) {
    audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        const progress = (audio.currentTime / audio.duration) * 100;
        const pBar = document.getElementById("progressBar");
        if (pBar) pBar.style.width = progress + "%";

        const curT = document.getElementById("currentTime");
        const totT = document.getElementById("totalTime");
        if (curT) curT.textContent = formatTime(audio.currentTime);
        if (totT) totT.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (isRepeat) {
            loadSong(currentSongIndex, true);
        } else {
            nextSong(false);
        }
    });
}

const progressContainer = document.querySelector(".music-progress-container");
if (progressContainer) {
    progressContainer.addEventListener("click", e => {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        audio.currentTime = (clickX / rect.width) * audio.duration;
    });
}

/* ============================================================
    LOGIQUE DES BOUTONS REPEAT & SHUFFLE (AVEC BADGES)
============================================================ */

// Bouton Repeat
const repeatBtn = document.getElementById('repeatBtn');
const repeatStatus = document.getElementById('repeatStatus'); 

if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        
        // Style visuel du bouton
        repeatBtn.style.color = isRepeat ? "#00d4ff" : "#fff";
        repeatBtn.style.textShadow = isRepeat ? "0 0 15px #00d4ff" : "none";
        
        // Mise à jour du petit chiffre (Badge)
        if (repeatStatus) {
            repeatStatus.textContent = isRepeat ? "1" : "0";
            repeatStatus.style.opacity = isRepeat ? "1" : "0.5"; // Optionnel : plus discret quand désactivé
        }
    });
}

// Bouton Shuffle
const shuffleBtn = document.getElementById('shuffleBtn');
const shuffleStatus = document.getElementById('shuffleStatus');

if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        
        // Style visuel du bouton
        shuffleBtn.style.color = isShuffle ? "#9b5cff" : "#fff";
        shuffleBtn.style.textShadow = isShuffle ? "0 0 15px #9b5cff" : "none";
        
        // Mise à jour du petit chiffre (Badge)
        if (shuffleStatus) {
            shuffleStatus.textContent = isShuffle ? "1" : "0";
            shuffleStatus.style.opacity = isShuffle ? "1" : "0.5";
        }
    });
}
/* ============================================================
   STATE & OBSERVER
============================================================ */

function saveState() {
    if (!audio) return;
    localStorage.setItem("music_index", currentSongIndex);
    localStorage.setItem("music_volume", audio.volume);
}

function loadState() {
    if (!audio) return;
    const savedIndex = localStorage.getItem("music_index");
    const savedVolume = localStorage.getItem("music_volume");

    if (savedIndex !== null && playlist[parseInt(savedIndex)]) {
        currentSongIndex = parseInt(savedIndex);
    }
    if (savedVolume !== null) {
        audio.volume = parseFloat(savedVolume);
        if (volControl) volControl.value = savedVolume;
    }

    audio.src = playlist[currentSongIndex].src;
    const display = document.getElementById('currentSong');
    if (display) display.textContent = playlist[currentSongIndex].title;
}

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
}, { threshold: 0.2 });

document.querySelectorAll("section").forEach(sec => observer.observe(sec));


/* ============================================================
   GESTION DU FORMULAIRE DE CONTACT
============================================================ */

const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async function(event) {
        // Optionnel : si tu veux gérer l'envoi en arrière-plan (AJAX)
        // Sinon, laisse le comportement par défaut de Formspree
        console.log("Tentative d'envoi du message...");
    });
}

/* ============================================================
Boutons de contact linkedin et gmail
============================================================ */
function openGmail() {
    window.open("https://mail.google.com/mail/?view=cm&fs=1&to=alexiscrotte19@gmail.com", "_blank");
}
function openLinkedIn() {
    window.open("https://www.linkedin.com/feed/", "_blank");
}

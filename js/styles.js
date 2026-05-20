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
    // Alexis
    { title: "Insane - Black Gryph0n", src: "music/hazbinhotel/Insane Black Gryph0n.mp3" }, 
    { title: "Upside Down - Black Gryph0n", src: "music/hazbinhotel/Upside Down.mp3" },
    // Adridrou
    { title: "A Songus Amongus - The Chalkeaters", src: "music/adridrou/random_musics/music01.flac" }, // Random musics
    { title: "TETORIS - Kasane Teto", src: "music/adridrou/random_musics/music02.mp3" },
    { title: "エクストリーム空中戦 - NayutalieN", src: "music/adridrou/random_musics/music03.mp3" },
    { title: "Miss univers - Trust", src: "music/adridrou/random_musics/music04.flac" },
    { title: "You're Mine - DAGames", src: "music/adridrou/random_musics/music05.mp3" },
    { title: "Hung, Drawn And Quartered - Accept", src: "music/adridrou/accept_-_stalingrad/01.mp3" }, // Accept - Stalingrad (2012)
    { title: "Stalingrad - Accept", src: "music/adridrou/accept_-_stalingrad/02.mp3" },
    { title: "Hellfire - Accept", src: "music/adridrou/accept_-_stalingrad/03.mp3" },
    { title: "Flash To Bang Time - Accept", src: "music/adridrou/accept_-_stalingrad/04.mp3" },
    { title: "Shadow Soldiers - Accept", src: "music/adridrou/accept_-_stalingrad/05.mp3" },
    { title: "Revolution - Accept", src: "music/adridrou/accept_-_stalingrad/06.mp3" },
    { title: "Against The World - Accept", src: "music/adridrou/accept_-_stalingrad/07.mp3"},
    { title: "Twist Of Fate - Accept", src: "music/adridrou/accept_-_stalingrad/08.mp3" },
    { title: "The Quick And The Dead - Accept", src: "music/adridrou/accept_-_stalingrad/09.mp3" },
    { title: "The Galley - Accept", src: "music/adridrou/accept_-_stalingrad/10.mp3" }
];


function loadPage(pageName){
    const contentEl = document.getElementById("content");
    if (!contentEl) return;
    fetch(`pages/${pageName}.html`)
        .then(res => {
            if (!res.ok) throw new Error(`Fichier ${pageName}.html introuvable`);
            return res.text();
        })
        .then(html => {
            contentEl.innerHTML = html;
            originalHomeContent = html; // Met à jour le contenu d'origine pour le bouton retour
            reinitPageScripts();
            window.scrollTo(0, 0);
        })
        .catch(err => {
            console.error(`Erreur de chargement de ${pageName}:`, err);
            contentEl.innerHTML = `<p>Erreur de chargement de la page ${pageName}.</p>`;
        });
}
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    const contentEl = document.getElementById("content");
    if (contentEl) {
        originalHomeContent = contentEl.innerHTML;
    }
    loadState();
});

/* ============================================================
    SPA SYSTEM (Système de navigation)
============================================================ */
document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        const page = link.getAttribute("data-page");

        const changePage = () => {
            const contentEl = document.getElementById("content");
            if (!contentEl) return;

            // Retour à l'accueil
            if (page === "home") {
                contentEl.innerHTML = originalHomeContent;
                reinitPageScripts();
                window.scrollTo(0, 0);
                return;
            }

            // Chargement des autres pages
            fetch(`pages/${page}.html`)
                .then(res => res.text())
                .then(html => {
                    contentEl.innerHTML = html;

                    // NETTOYAGE : Vide le formulaire dès qu'on arrive sur la page
                    const form = contentEl.querySelector('form');
                    if (form) {
                        form.reset(); 
                        form.querySelectorAll('input, textarea').forEach(el => el.value = '');
                    }

                    reinitPageScripts();
                    window.scrollTo(0, 0);
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

/* ============================================================
    RÉINITIALISATION DES SCRIPTS (Après changement de page)
============================================================ */
function reinitPageScripts() {
    if (typeof initContactButton === "function") initContactButton();
    
    // Relance l'observateur d'animations
    document.querySelectorAll("section").forEach(sec => {
        if (typeof observer !== 'undefined') observer.observe(sec);
    });

    // --- LOGIQUE DE NETTOYAGE FORMSPREE ---
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function() {
            // On laisse un petit délai pour que Formspree récupère les données
            setTimeout(() => {
                form.reset();
                form.querySelectorAll('input, textarea').forEach(el => el.value = '');
            }, 500);
        });
    }

    // Ajout automatique du bouton retour si on n'est pas sur l'accueil
    const contentEl = document.getElementById("content");
    if (contentEl && contentEl.innerHTML !== originalHomeContent) {
        ajouterBoutonRetour();
    }
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
        index = Math.floor(Math.random() * playlist.length);
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
    IMPORTATION DE MUSIQUES
============================================================ */
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const importFilesBtn = document.getElementById('importFilesBtn');
const importFolderBtn = document.getElementById('importFolderBtn');

function handleFiles(files) {
    if (files.length === 0) return;
    const oldLength = playlist.length;
    let musicAdded = false;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3')) {
            playlist.push({
                title: file.name.replace(/\.[^/.]+$/, ""),
                src: URL.createObjectURL(file)
            });
            musicAdded = true;
        }
    }

    if (musicAdded && (audio.paused || !audio.src)) {
        loadSong(oldLength, true);
    }
}

if (importFilesBtn && fileInput) {
    importFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = "";
    });
}

if (importFolderBtn && folderInput) {
    importFolderBtn.addEventListener('click', () => folderInput.click());
    folderInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        folderInput.value = "";
    });
}

/* ============================================================
    EVENT LISTENERS (Lecteur)
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
        if (isRepeat) loadSong(currentSongIndex, true);
        else nextSong(false);
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
    REPEAT & SHUFFLE
============================================================ */
const repeatBtn = document.getElementById('repeatBtn');
const repeatStatus = document.getElementById('repeatStatus'); 

if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
        isRepeat = !isRepeat;
        repeatBtn.style.color = isRepeat ? "#00d4ff" : "#fff";
        repeatBtn.style.textShadow = isRepeat ? "0 0 15px #00d4ff" : "none";
        if (repeatStatus) {
            repeatStatus.textContent = isRepeat ? "1" : "0";
            repeatStatus.style.opacity = isRepeat ? "1" : "0.5";
        }
    });
}

const shuffleBtn = document.getElementById('shuffleBtn');
const shuffleStatus = document.getElementById('shuffleStatus');

if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.style.color = isShuffle ? "#9b5cff" : "#fff";
        shuffleBtn.style.textShadow = isShuffle ? "0 0 15px #9b5cff" : "none";
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

/* ============================================================
    CONTACT & NAVIGATION
============================================================ */
function openGmail() {
    window.open("https://mail.google.com/mail/?view=cm&fs=1&to=alexiscrotte19@gmail.com", "_blank");
}
function openLinkedIn() {
    window.open("https://www.linkedin.com/feed/", "_blank");
}

function ajouterBoutonRetour() {
    const contentEl = document.getElementById("content");
    if (!contentEl) return;

    const container = document.createElement("div");
    container.className = "back-home";
    container.style.marginTop = "30px";
    container.style.textAlign = "center";

    const btn = document.createElement("a");
    btn.href = "#";
    btn.className = "import-btn";
    btn.innerHTML = "Retour à l'accueil 🏠";
    btn.style.cursor = "pointer";
    btn.style.position = "relative";
    btn.style.zIndex = "1000";

    btn.onclick = (e) => {
        e.preventDefault();
        const changePage = () => {
            contentEl.innerHTML = originalHomeContent; 
            reinitPageScripts();
            window.scrollTo(0, 0);
        };
        if (typeof playFlashTransition === "function") playFlashTransition(changePage);
        else changePage();
    };

    container.appendChild(btn);
    contentEl.appendChild(container);
}

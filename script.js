const hevPlaylist = [
    {
        name: "Balisa",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - BALISA.mp3",
        cover: "res/assets/cover_1.jpg"
    },
    {
        name: "I know",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - I KNOW ft. Mcee Zabala - BONUS.mp3",
        cover: "res/assets/cover_1.jpg"
    },
    {
        name: "Introhan Natin",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - INTROHAN NATIN.mp3",
        cover: "res/assets/cover_1.jpg"
    },
    {
        name: "Manhid",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - MANHID.mp3",
        cover: "res/assets/cover_1.jpg"
    },
    {
        name: "Pantasya Panaginip",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - PANTASYA PANAGINIP.mp3",
        cover: "res/assets/cover_1.jpg"
    },
    {
        name: "Pulang Karpet",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - PULANG KARPET.mp3",
        cover: "res/assets/cover_1.jpg"
    },
    {
        name: "Pwede bang?",
        album: "Pautang ng Pagibig",
        src: "res/songs/Pautang ng Pagibig/Hev Abi - PWEDE BANG_.mp3",
        cover: "res/assets/cover_1.jpg"
    }
]

const musicName = document.querySelector('.song-name');
const albumName = document.querySelector('.album-name');;
const prog = document.querySelector('.progress-bar');
const fillBar = document.querySelector('.fill-bar');
const time = document.querySelector('.time')

const cover = document.getElementById('cover');
const playBtn = document.getElementById('play-pause-button');
const prevBtn = document.getElementById('backward-button');
const nextBtn = document.getElementById('forward-button');
const playImg = document.getElementById('play-pause')

let song = new Audio();
let currentSong = 0;
let playing = false;

document.addEventListener('DOMContentLoaded', () => {
    loadSong(currentSong);
    song.addEventListener('timeupdate', updateProgress);
    song.addEventListener('ended', nextSong);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    playBtn.addEventListener('click', togglePlayPause);
    prog.addEventListener('click', seek);
})

function loadSong(index) {
    const {name, album, src, cover: thumb} = hevPlaylist[index];
    musicName.innerText = name;
    albumName.innerText = album;
    song.src = src;
    cover.style.backgroundImage = `url(${thumb})`;
}

function updateProgress() {
    if(song.duration){
        const pos = (song.currentTime / song.duration) * 100;
        fillBar.style.width = `${pos}%`;

        const duration = formatTime(song.duration);
        const currentTime = formatTime(song.currentTime);
        time.innerText = `${currentTime} - ${duration}`
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`; 
}

function togglePlayPause() {
    if(playing){
        song.pause();
        playImg.src = "res/assets/play.svg";
    }else{
        song.play();
        playImg.src = "res/assets/pause.svg";
    }

    playing = !playing;
    cover.classList.toggle('active', playing);
}

function nextSong() {
    currentSong = (currentSong + 1) % hevPlaylist.length;
    playMusic();
}

function prevSong() {
    currentSong = (currentSong - 1 + hevPlaylist.length) % hevPlaylist.length;
    playMusic();
}

function playMusic() {
    loadSong(currentSong);
    song.play();
    playing = true;
    img.src = "res/assets/pause.svg";
    cover.classList.add('active', playing);
}

function seek(e) {
    const pos = (e.offsetX / prog.clientWidth) * song.duration;
    song.currentTime = pos;
}

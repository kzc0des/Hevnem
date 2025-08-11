import { hevPlaylist, hevAlbum } from "./APISource.js";
import { albumTemplate, cloneExtremes } from "./functions/album-creation.js";
import { swipe, titleChange } from "./functions/album-navigation.js";
import { openAlbum, showPlaylist } from "./functions/playlist-section.js";

const musicName = document.querySelector('.song-name');
const albumName = document.querySelector('.album-name');;
const cover = document.getElementById('cover');
const prog = document.querySelector('.progress-bar');
const fillBar = document.querySelector('.fill-bar');
const time = document.querySelector('.time')

const playBtn = document.getElementById('play-pause-button');
const playImg = document.getElementById('play-pause');
const prevBtn = document.getElementById('backward-button');
const nextBtn = document.getElementById('forward-button');
const shuffleBtn = document.getElementById('shuffle-button');
const shuffleIco = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat-button');
const repeatIco = document.getElementById('repeat');

document.addEventListener("DOMContentLoaded", () => {
    loadSong(userData?.currentSong);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', nextSong)
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    playBtn.addEventListener('click', playorpause);
    shuffleBtn.addEventListener('click', shuffleSongs);
    repeatBtn.addEventListener('click', repeatSong);
    prog.addEventListener('click', seek);

    populateAlbums();
    showPlaylist();
    initializeSwiping();
    openAlbum(userData);
})

const audio = new Audio();
let userData = {
    songs: [...hevPlaylist],
    albums: [...hevAlbum],
    currentSong: 0,
    currentAlbum: 0
}
let playing = false;
console.table(userData?.songs)

const loadSong = (index) => {
    if (!userData || !userData.songs || !userData.songs[index]) {
        console.error("Invalid song index or userData is undefined.");
        return;
    }
    const { name, album, src, cover: thumb } = userData.songs[index];
    musicName.innerText = name;
    albumName.innerText = album;
    audio.src = src;
    cover.style.backgroundImage = `url(${thumb})`;
    checkAlbum(index);
}

const updateProgress = () => {
    if (audio.duration) {
        const pos = (audio.currentTime / audio.duration) * 100;
        fillBar.style.width = `${pos}%`;

        const start = formatTime(audio.currentTime);
        const end = formatTime(audio.duration);
        time.innerText = `${start} - ${end}`;

        if (audio.ended && repeat) {
            playSong();
        }
    }
}

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

const nextSong = () => {
    const newSongID = (userData?.currentSong + 1) % userData?.songs.length;
    checkAlbum(newSongID);
    userData.currentSong = newSongID;
    console.log(`ID: ${userData?.currentSong} \nNow playing: ${userData?.songs[userData?.currentSong].name} \nAlbum: ${userData?.albums[userData?.currentAlbum].name}`);
    playSong();
}

const prevSong = () => {
    const newSongID = (userData?.currentSong - 1 + userData?.songs.length) % userData?.songs.length;
    checkAlbum(newSongID);
    userData.currentSong = newSongID;
    console.log(`ID: ${userData?.currentSong} \nNow Playing: ${userData?.songs[userData?.currentSong].name} \nAlbum: ${userData?.albums[userData?.currentAlbum].name}`);
    playSong();
}

const playSong = () => {
    loadSong(userData?.currentSong);
    audio.play();
    playing = true;
    playImg.src = "res/assets/pause.svg";
    cover.classList.toggle("active", playing)
}

const playSongClicked = () => {
    audio.play();
    playing = true;
    playImg.src = "res/assets/pause.svg";
    cover.classList.toggle("active", playing)
}

const playorpause = () => {
    if (playing) {
        playImg.src = "res/assets/play.svg";
        audio.pause();
    } else {
        playImg.src = "res/assets/pause.svg";
        audio.play();
    }

    playing = !playing;
    cover.classList.toggle("active", playing)
}

let shuffled = false;

const shuffleSongs = () => {
    const songTitle = userData?.songs[userData?.currentSong]?.name;

    if (shuffled) {
        userData.songs = [...hevPlaylist];
        shuffleIco.src = "res/assets/shuffle.svg";

        console.table(userData?.songs);
        console.log("normal");
    } else {
        shuffle(userData?.songs)
        shuffleIco.src = "res/assets/shuffled.svg";

        console.log("shuffled");
        console.table(userData?.songs);
    }

    userData.currentSong = userData?.songs.findIndex(song => song.name === songTitle);
    console.log(`ID: ${userData.currentSong} \nNow playing: ${userData?.songs[userData?.currentSong].name}`);
    shuffled = !shuffled;
}

const shuffle = (arr) => {
    for (let i = userData?.songs.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

let repeat = false;

const repeatSong = () => {
    repeat = !repeat;

    if (repeat) {
        repeatIco.src = "res/assets/repeated.svg";
    } else {
        repeatIco.src = "res/assets/repeat.svg";
    }
}

const seek = (e) => {
    const pos = (e.offsetX / prog.clientWidth) * audio.duration;
    audio.currentTime = pos;
}

const albumSongs = document.getElementById('album-songs');
const backBtn = document.getElementById('back');

let show = false;
let bottomVal;

const checkAlbum = (id) => {
    const currentAlbum = userData?.songs[id].album;
    let albumId;

    for (let i = 0; i < userData?.albums?.length; i++) {
        if (currentAlbum === userData?.albums[i].name) {
            albumId = userData?.albums.findIndex(album => album.name === currentAlbum);
            break;
        } else {
            albumId = 4;
        }
    }
    userData.currentAlbum = albumId;
    return albumId;
}

function populateAlbums() {
    const albums = document.querySelector('.albums');

    albums.innerHTML = '';

    albums.appendChild(albumTemplate("prev", userData?.albums?.length, userData?.albums));
    albums.appendChild(albumTemplate("present", userData?.albums?.length, userData?.albums));
    albums.appendChild(albumTemplate("next", userData?.albums?.length, userData?.albums));

    cloneExtremes("prev");
    cloneExtremes("present");
    cloneExtremes("next");
}

function initializeSwiping() {
    setTimeout(() => {
        swipe(userData, "present");
        titleChange(userData);
    }, 100)
}

export {loadSong, playSongClicked}
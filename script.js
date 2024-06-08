import hevPlaylist from "./APISource.js";

const musicName = document.querySelector('.song-name');   // media display
const albumName = document.querySelector('.album-name');;
const cover = document.getElementById('cover');
const prog = document.querySelector('.progress-bar');
const fillBar = document.querySelector('.fill-bar');
const time = document.querySelector('.time')

const playBtn = document.getElementById('play-pause-button'); // controls
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
})

const audio = new Audio();
let userData = {
    songs: [...hevPlaylist],
    currentSong: 0
    }
let playing = false;
console.table(userData?.songs)

const loadSong = (index) => { //ung index jan, manggagaling sa value ng currentSong
    const {name, album, src, cover: thumb} = userData?.songs[index];
    musicName.innerText = name;
    albumName.innerText = album;
    audio.src = src;
    cover.style.backgroundImage = `url(${thumb})`;
}

const updateProgress = () => {
    if(audio.duration){ // if ung kanta ba is still playing kumbaga nasa loob pa ng duration
        const pos = (audio.currentTime / audio.duration) * 100;
        fillBar.style.width = `${pos}%`;

        const start = formatTime(audio.currentTime);
        const end = formatTime(audio.duration);
        time.innerText = `${start} - ${end}`;

        if(audio.ended && repeat){
            playSong();
        }
    }
}

const formatTime = (seconds) => { //kasi ang irereturn sakin is seconds
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}` // so kunwari ung seconds na nacompute is 43 since di naman siya less than 10 ung else code block ung gagawin which is empty
}

const nextSong = () => {
    const newSongID = (userData?.currentSong + 1) % userData?.songs.length;
    userData.currentSong = newSongID;
    console.log(`ID: ${userData?.currentSong} \nTitle: ${userData?.songs[userData?.currentSong].name}`);
    playSong();
}

const prevSong = () => {
    const newSongID = (userData?.currentSong - 1 + userData?.songs.length) % userData?.songs.length;
    userData.currentSong = newSongID;
    console.log(`ID: ${userData?.currentSong} \nTitle: ${userData?.songs[userData?.currentSong].name}`);
    playSong();
}

const playSong = () => {
    loadSong(userData?.currentSong); //
    audio.play();

    playing = true;
    cover.classList.toggle("active", playing)

    playImg.src = "res/assets/pause.svg";
    cover.classList.toggle("active", playing)
}

const playorpause = () => {
    if(playing){
        playImg.src = "res/assets/play.svg";
        audio.pause();
        }else{
        playImg.src = "res/assets/pause.svg";
        audio.play(); 
    }

    playing = !playing;
    cover.classList.toggle("active", playing)
}

let shuffled = false;

const shuffleSongs = () => {
    const songTitle = userData?.songs[userData?.currentSong]?.name; // kinukuha neto ung title ng kantang tumutugtog the moment we clicked the shuffle btn

    if(shuffled){
        userData.songs = [...hevPlaylist];
        shuffleIco.src = "res/assets/shuffle.svg";

        console.table(userData?.songs);
        console.log("normal");
    }else{
        shuffle(userData?.songs)
        shuffleIco.src = "res/assets/shuffled.svg";

        console.log("shuffled");
        console.table(userData?.songs);
    }

    userData.currentSong = userData?.songs.findIndex(song => song.name === songTitle); // once nastore ung title kukunin natin ung index niya after ishuffle or vice versa para gamitin uli sa loadSong na function
    console.log(userData.currentSong);
    shuffled = !shuffled;
}

const shuffle = (arr) => {
    for (let i = userData?.songs.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

let repeat = false;

const repeatSong = () => {
    repeat = !repeat;

    if(repeat){
        repeatIco.src = "res/assets/repeated.svg";
    }else{
        repeatIco.src = "res/assets/repeat.svg";
    }
}

const seek = (e) => {
    const pos = (e.offsetX / prog.clientWidth) * audio.duration;
    audio.currentTime = pos;
}
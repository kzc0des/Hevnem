import { hevPlaylist, hevAlbum } from "./APISource.js";

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
    playlistBtn.addEventListener('click', (e) => {
        const album = e.target.closest(".present-slide");
        const button = e.target.closest("img");
        const song = e.target.closest("button")

        if(!album && !button){
            showAlbumPanel();
            while (albumSongs.firstChild) {
                albumSongs.removeChild(albumSongs.firstChild);
            }
            playlist.style.display = 'flex';
            backBtn.classList.remove('active');
            
        }
    })
    swipe();
    presentAlbum.addEventListener('click', clickHandler);
    backBtn.addEventListener('click', (e) => {
        while (albumSongs.firstChild) {
            albumSongs.removeChild(albumSongs.firstChild);
        }
        playlist.style.display = 'flex';
        backBtn.classList.toggle('active');
    });
    albumSongs.addEventListener('click', songClick);
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
    const {name, album, src, cover: thumb} = userData?.songs[index];
    musicName.innerText = name;
    albumName.innerText = album;
    audio.src = src;
    cover.style.backgroundImage = `url(${thumb})`;
    checkAlbum(index);
}

const updateProgress = () => {
    if(audio.duration){
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
    const songTitle = userData?.songs[userData?.currentSong]?.name;

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

    userData.currentSong = userData?.songs.findIndex(song => song.name === songTitle); 
    console.log(`ID: ${userData.currentSong} \nNow playing: ${userData?.songs[userData?.currentSong].name}`);
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

const logo = document.querySelector(".logo");                         // second portion
const logoBox = document.querySelector(".logo-container");
const musicBox = document.querySelector(".container");
const playlistLbl = document.querySelector(".playlist-label");
const playlistPanel = document.querySelector(".playlist-songs");
const playlist = playlistPanel.querySelector('.playlist');
const playlistBtn = document.querySelector(".playlist-songs");
const album = document.getElementById("album-title");
const albumTracks = document.getElementById("album-tracks");
const albumSongs = document.getElementById('album-songs');
const backBtn = document.getElementById('back');

let show = false;
let bottomVal;

const showAlbumPanel = () => {
    const returnStyle = getComputedStyle(playlistPanel);

    if(!bottomVal){
        bottomVal = returnStyle.bottom;
    }

    if (show) {
        playlistPanel.style.bottom = bottomVal;
        
    }else {
        playlistPanel.style.bottom = "0";       
    }
            
    playlistPanel.style.transition = "all 0.7s ease"
    logo.classList.toggle("active");
    musicBox.classList.toggle("active");
    musicBox.style.transition = "all 0.7s ease";
    logoBox.classList.toggle("active");
    playlistLbl.classList.toggle("active");
    playlistPanel.classList.toggle("active");

    show = !show;
}

// FC = FIRST CLONE || SC = SECOND CLONE
const prevSlider = document.getElementById('prev-album-slider');
const prevSlides = document.querySelectorAll('.prev-slide');
const prevFC = prevSlides[0].cloneNode(true);
const prevSC = prevSlides[prevSlides.length - 1].cloneNode(true);
prevSlider.appendChild(prevFC);
prevSlider.insertBefore(prevSC, prevSlides[0]);
prevSlider.style.transform = `translateX(-120px)`;

const presentAlbum = document.getElementById('present-album-slider');
const presentSlider = document.getElementById('present-album-slider');
const presentSlides = document.querySelectorAll('.present-slide');
const presentFC = presentSlides[0].cloneNode(true);
const presentSC = presentSlides[presentSlides.length - 1].cloneNode(true);
presentSlider.appendChild(presentFC);
presentSlider.insertBefore(presentSC, presentSlides[0]);
presentSlider.style.transform = `translateX(-160px)`;

const nextSlider = document.getElementById('next-album-slider');
const nextSlides = document.querySelectorAll('.next-slide');
const nextFC = nextSlides[0].cloneNode(true);
const nextSC = nextSlides[nextSlides.length - 1].cloneNode(true);
nextSlider.appendChild(nextFC);
nextSlider.insertBefore(nextSC, nextSlides[0]);
nextSlider.style.transform = `translateX(-120px)`;

let touchStartX, touchEndX;

const handleMovement = () => {
    const threshold = 50;

    if (touchEndX < touchStartX - threshold) {
        nextAlbum();
        console.log('next')
    } else if (touchEndX > touchStartX + threshold) {
        prevAlbum();
        console.log('prev')
    }else if (touchEndX === touchStartX) {
        songMatches();
        console.log('tap')
    }
}

const nextAlbum = () => {
    userData.currentAlbum++;
    transition();

    if(userData.currentAlbum > prevSlides.length - 1) {
        setTimeout(() => {
            prevSlider.style.transform = `translateX(-120px)`;
            prevSlider.style.transition = `none`;
            presentSlider.style.transform = `translateX(-160px)`;
            presentSlider.style.transition = `none`;
            nextSlider.style.transform = `translateX(-120px)`;
            nextSlider.style.transition = `none`;
            userData.currentAlbum = 0;

            titleChange();
        }, 500)
    }
    titleChange();
}

const transition = () => {
    prevSlider.style.transform = `translateX(-${(userData.currentAlbum + 1) * 120}px)`;
    prevSlider.style.transition = `transform 0.5s ease`;

    presentSlider.style.transform = `translateX(-${(userData.currentAlbum + 1) * 160}px)`;
    presentSlider.style.transition = `transform 0.5s ease`;

    nextSlider.style.transform = `translateX(-${(userData.currentAlbum + 1) * 120}px)`;
    nextSlider.style.transition = `transform 0.5s ease`;
}

const titleChange = () => {
    album.innerText = userData?.albums[userData?.currentAlbum].name;
    albumTracks.innerText = `${userData?.albums[userData?.currentAlbum].tracks} tracks`;
}

const prevAlbum = () => {
    userData.currentAlbum--;
    transition();

    if(userData.currentAlbum < 0) {
        setTimeout(() => {
            prevSlider.style.transform = `translateX(-${prevSlides.length * 120}px)`;
            prevSlider.style.transition = `none`;
            presentSlider.style.transform = `translateX(-${prevSlides.length * 160}px)`;
            presentSlider.style.transition = `none`;
            nextSlider.style.transform = `translateX(-${prevSlides.length * 120}px)`;
            nextSlider.style.transition = `none`;
            userData.currentAlbum = prevSlides.length - 1;

            titleChange();
        }, 500)
    }
    titleChange();
}

const swipe = () => {
    presentSlider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    })

    presentSlider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleMovement();
    })
}

const checkAlbum = (id) => {
    const currentAlbum = userData?.songs[id].album; 
    let albumId;

    for (let i = 0; i < userData?.albums?.length; i++){
        if(currentAlbum === userData?.albums[i].name) {
            albumId = userData?.albums.findIndex(album => album.name === currentAlbum);
            break;
        }else{
            albumId = 4;
        }
    }
    userData.currentAlbum = albumId;
    transition();
    titleChange();    
    return albumId;
}

const clickHandler = (e) => {
    const album = e.target.closest('.present-slide');
    if(album){
        const src = album.querySelector('img').getAttribute('src');
        handleAlbumSelection(src);

        playlist.style.display = "none";
        backBtn.classList.toggle('active');
    }
}

const handleAlbumSelection = (src) => {
    const albumID = userData?.albums.findIndex((album) => album.cover === src);
    const albumName = userData?.albums[albumID]?.name;

    if(albumName){
        songMatches(albumName);
    }else{
        console.error('No album found');
    }
}

const songMatches = async (album) => {
    try {
        const playlist = await getSongs(userData?.songs, album);

        const songs = document.createElement('div');
        songs.id = 'album-songs-list';
        songs.classList = 'album-songs-list';
        songs.innerHTML = playlist.join('');

        albumSongs.appendChild(songs);
    }catch(error){
        console.error('Error ing song matches: ', error)
    }
}

const getSongDuration = (src) => {
    if(!src){
        return Promise.reject("invalid Audio Source");
    }

    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = src;
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
        audio.addEventListener('error', () => reject('Error Loading Audio'));
    })
}

const songCatalogue = ({cover, name, src, album}, index) => {
    return getSongDuration(src)
    .then((duration) => {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');

        const id = userData?.songs.findIndex(song => song.name === name);
        index = id;
        return `
            <button id="${src}" data-id="${id}" data-album="${album}" class="song-button">
                <div class="song-album">
                    <img src="${cover}" alt="">
                </div>
                <div class="song-info">
                    <div id="${name}" class="title"> ${name} </div>
                    <div class="duration">${minutes}:${seconds}</div>
                </div>
            </button>
            `;
        })
        .catch(error => {
            console.error(error);
            return `
            <button>
                <div class="song-album">
                    <img src="${cover}" alt="">
                </div>
                <div class="song-info">
                    <div id="${name}" class="title"> ${name} </div>
                    <div class="duration">N/A</div>
                </div>
            </button>
            `;
        });
}

const songClick = (e) => {
    const song = e.target.closest('.song-button');
    if(song) {
        const id = parseInt(song.getAttribute('data-id'));
        const album = song.getAttribute('data-album');
        userData.currentSong = id;
        console.log(`ID: ${id} \nNow playing: ${userData?.songs[id].name} \nAlbum: ${album}`);
        loadSong(id);
        playSongClicked();
    }
}

const getSongs = async (songs, album) => {
    const songAlbumFilter = songs.filter((song) => song.album === album).map((song, index) => songCatalogue(song, index)); 

    const songPromises = await Promise.all(songAlbumFilter);
    return songPromises;
}
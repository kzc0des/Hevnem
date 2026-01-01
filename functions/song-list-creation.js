import { loadSong, playSongClicked } from "../script.js";

async function songItem({ name, src, cover: thumb }, index) {
    try {
        const duration = await getSongDuration(src);

        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');

        return `
            <button class="song-item" id="${src}" song-name="${name}">
                <div class="song-album">
                    <img src="${thumb}" alt="${name}-cover">
                </div>
                <div class="song-info">
                    <div id="${name}" class="title"> ${name} </div>
                    <div class="duration">${minutes}:${seconds}</div>
                </div>
            </button>
        `;
    } catch (error) {
        console.error("Error fetching song duration:", error);
        return `
            <button class="song-item" id="${src}" song-name="${name}">
                <div class="song-album">
                    <img src="${thumb}" alt="">
                </div>
                <div class="song-info">
                    <div id="${name}" class="title"> ${name} </div>
                    <div class="duration">N/A</div>
                </div>
            </button>
        `;
    }
}

async function getSongDuration(src) {
    if (!src) {
        return Promise.reject("Invalid Audio Source");
    }

    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = src;

        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        })

        audio.addEventListener('error', () => {
            reject('Error Loading Audio');
        })
    })
}

async function albumSelect(e, src) {
    const selectedAlbum = e.target.closest('.present-slide');
    if (!selectedAlbum) return;

    const title = selectedAlbum.getAttribute('id');
    if (!title) return;

    const songSection = document.querySelector('#album-songs');
    if (!songSection) return;

    const label = albumLabel(title);

    // --- Start Loading State ---
    songSection.innerHTML = ''; // Clear previous list
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    songSection.appendChild(spinner);
    // --- End Loading State ---

    const songs = await Promise.all(
        src?.songs
            .filter((song) => song.album === title)
            .map(async (song, index) => {
                try {
                    const songHTML = await songItem(song, index);
                    const songElement = new DOMParser().parseFromString(songHTML, 'text/html').body.firstChild;

                    songElement.addEventListener('click', (e) => songSelect(e, src));

                    return songElement;
                } catch (error) {
                    console.error(`Error processing song ${song.name}:`, error);
                    return null;
                }
            })
    );

    const songList = document.createElement('div');
    songList.className = "song-list";
    songs.forEach(song => {
        if (song) {
            songList.appendChild(song);
        }
    });

    // --- Render Final Content ---
    songSection.innerHTML = ''; // Clear the spinner
    songSection.appendChild(label);
    songSection.appendChild(songList); // Append new songs
    // --- End Render ---
}

function albumLabel(str) {
    const header = document.createElement('div');
    header.className = "header";
    header.innerHTML =
        `
        <img src="res/assets/stash--arrow-left-solid.png" alt="back-album">
        <h2 class="album-label">${str}</h2>
    `
    return header;
}

function songSelect(e, src) {
    const songItem = e.target.closest('.song-item');
    if (songItem) {
        const songName = songItem.getAttribute('song-name');
        const songIndex = src?.songs.findIndex((songTitle) => songTitle.name === songName);
        src.currentSong = songIndex;
        loadSong(songIndex);
        playSongClicked();
    }
}

export { albumSelect };
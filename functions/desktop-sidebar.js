import { hevAlbum, hevPlaylist } from "../APISource.js";
import { loadSong, playSongClicked } from "../script.js";

// Main setup function for the desktop sidebar
function setupDesktopSidebar() {
    const sidebar = document.querySelector('.desktop-sidebar');
    const toggleButton = document.querySelector('.desktop-sidebar-toggle');
    const albumsContainer = sidebar.querySelector('.desktop-albums-container');

    if (!sidebar || !toggleButton || !albumsContainer) return;

    // 1. Setup the toggle button
    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // 2. Populate the album list
    populateDesktopAlbumList(albumsContainer);
    
    // 3. Handle clicks on albums to show songs
    albumsContainer.addEventListener('click', (e) => {
        const albumElement = e.target.closest('.album-item');
        if (albumElement) {
            const albumTitle = albumElement.dataset.albumTitle;
            showSongsForAlbum(albumTitle);
        }
    });
}

// Creates a simple vertical list of albums
function populateDesktopAlbumList(container) {
    hevAlbum.forEach(album => {
        const albumElement = document.createElement('button');
        albumElement.className = 'album-item';
        albumElement.dataset.albumTitle = album.name;

        albumElement.innerHTML = `
            <img src="${album.cover}" alt="${album.name}" class="album-item-cover">
            <div class="album-item-info">
                <h3 class="album-item-title">${album.name}</h3>
                <p class="album-item-tracks">${album.tracks} tracks</p>
            </div>
        `;
        container.appendChild(albumElement);
    });
}

// Shows the list of songs for a given album
async function showSongsForAlbum(albumTitle) {
    const songsContainer = document.querySelector('#desktop-album-songs');
    if (!songsContainer) return;
    
    // Create and show a 'back' button
    const backButton = document.createElement('button');
    backButton.className = 'back-to-albums';
    backButton.innerHTML = `&larr; Back to Albums`;
    backButton.addEventListener('click', () => {
        songsContainer.classList.remove('active');
    });

    // Get songs for the selected album
    const songsForAlbum = hevPlaylist.filter(song => song.album === albumTitle);
    
    const songList = document.createElement('div');
    songList.className = 'song-list';

    for (const song of songsForAlbum) {
        const songElement = await createSongElement(song);
        songList.appendChild(songElement);
    }
    
    songsContainer.innerHTML = ''; // Clear previous songs
    songsContainer.appendChild(backButton);
    songsContainer.appendChild(songList);
    songsContainer.classList.add('active'); // Show the song list view
}

// Creates a single song item element
async function createSongElement(song) {
    const { name, src, cover } = song;
    let durationText = 'N/A';
    try {
        const duration = await getSongDuration(src);
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60).toString().padStart(2, '0');
        durationText = `${minutes}:${seconds}`;
    } catch (error) {
        console.error("Could not get duration for", name, error);
    }

    const songElement = document.createElement('button');
    songElement.className = 'song-item';
    songElement.dataset.songSrc = src;
    songElement.dataset.songName = name;
    
    songElement.innerHTML = `
        <div class="song-album">
            <img src="${cover}" alt="${name}-cover">
        </div>
        <div class="song-info">
            <div class="title">${name}</div>
            <div class="duration">${durationText}</div>
        </div>
    `;

    songElement.addEventListener('click', () => {
        const songIndex = hevPlaylist.findIndex(s => s.name === name);
        if (songIndex !== -1) {
            loadSong(songIndex);
            playSongClicked();
        }
    });

    return songElement;
}

// Utility to get song duration
function getSongDuration(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = src;
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
        audio.addEventListener('error', (e) => reject(e));
    });
}

export { setupDesktopSidebar };

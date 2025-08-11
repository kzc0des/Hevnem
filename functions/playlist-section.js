import { albumSelect } from "./song-list-creation.js";

const albums = document.querySelector('.albums');
const playlist = document.querySelector('.playlist');
const songs = document.querySelector(".songs");

function showPlaylist() {
    const playlistButton = document.querySelector('.playlist-button');
    const playlistSection = document.querySelector('.playlist-section');
    let show = false;

    if (playlistButton) {
        playlistButton.addEventListener('click', () => {
            if (!show) {
                playlistSection.classList.add('active');
                playlistButton.classList.add('hide');
                show = true;
            }
        })
    }

    if (playlistSection) {
        playlistSection.addEventListener('click', (e) => {

            if (show) {
                playlistSection.classList.remove('active');
                playlistButton.classList.remove('hide');
                show = false;
            }
        })
    }

    if (albums) albums.addEventListener("click", (e) => e.stopPropagation());
    if (songs) songs.addEventListener("click", (e) => e.stopPropagation());

    if (songs) {
        songs.addEventListener("click", (e) => {
            const backBtn = e.target.closest(".header > img");
            if (!backBtn) return;

            songs.classList.remove("active");
            playlist.classList.remove("move-up");
            e.stopPropagation();
        });
    }
}

function openAlbum(src) {
    if (!songs || !albums) return;

    albums.addEventListener("click", (e) => {
        const selectedAlbum = e.target.closest(".present-slide");
        if (!selectedAlbum) return;

        songs.classList.add("active");
        playlist.classList.add("move-up");
        albumSelect(e, src);
        e.stopPropagation();
    });
}

export { showPlaylist, openAlbum }
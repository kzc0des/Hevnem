import { prevOffset, presentOffset, nextOffset } from "./album-creation.js";
const movements = ["prev", "present", "next"];

function swipe(src, str) {
    const slider = document.querySelector(`.${str}-album`);
    let touchStart;
    let touchEnd;
    const threshold = 50;

    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStart = e.changedTouches[0].screenX;
        })

        slider.addEventListener('touchend', (e) => {
            touchEnd = e.changedTouches[0].screenX;
            const totalMovement = touchEnd - touchStart;

            if (Math.abs(totalMovement) < threshold) {
                console.log('tap');
            } else if (touchEnd < touchStart - threshold) {
                swipeLeft(src, "prev");
            } else if (touchEnd > touchStart - threshold) {
                swipeRight(src, "next");
            }
        })
    }
}

function move(src) {
    movements.forEach(album => {
        const slider = document.querySelector(`.${album}-album-slider`);
        let movement;
        switch (album) {
            case "prev":
                movement = prevOffset;
                break;
            case "present":
                movement = presentOffset;
                break;
            case "next":
                movement = nextOffset;
                break;
            default:
                break;
        }

        if (slider) {
            slider.style.transform = `translateX(-${(src.currentAlbum + 1) * movement}px)`;
            slider.style.transition = 'transform 0.4s ease-in-out';
        }
    })
}

function defaultPos(str, src) {
    movements.forEach(album => {
        const slider = document.querySelector(`.${album}-album-slider`);
        let movement;
        switch (album) {
            case "prev":
                movement = prevOffset;
                break;
            case "present":
                movement = presentOffset;
                break;
            case "next":
                movement = nextOffset;
                break;
            default:
                break;
        }

        if (slider) {
            if (str == "prev") {
                slider.style.transform = `translateX(-${movement}px)`;
                slider.style.transition = 'none';
            } else if (str == "next") {
                slider.style.transform = `translateX(-${src.albums.length * movement}px)`;
                slider.style.transition = 'none';
            }
        }
    })
}

function swipeRight(src, str) {
    src.currentAlbum--;
    move(src);
    titleChange(src);
    if (src?.currentAlbum < 0) {
        setTimeout(() => {
            defaultPos(str, src);
            src.currentAlbum = src.albums.length - 1;
            titleChange(src);
        }, 500)
    }
}

function swipeLeft(src, str) {
    src.currentAlbum++;
    move(src);
    titleChange(src);
    if (src?.currentAlbum > src.albums.length - 1) {
        setTimeout(() => {
            defaultPos(str, src);
            src.currentAlbum = 0;
            titleChange(src);
        }, 500)
    }
}

function titleChange(src) {
    const albumTitle = document.querySelector('.album-title');
    const albumTracks = document.querySelector('.album-tracks');
    const album = src.albums[src.currentAlbum];

    if (album) {
        const { name, tracks } = album;
        albumTitle.innerHTML = name || "Unknown Album"; 
        albumTracks.innerHTML = tracks + " tracks" 
    }
}

export { swipe, titleChange }
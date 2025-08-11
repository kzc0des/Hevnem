let prevOffset, presentOffset, nextOffset;

function prevSlider(arr) {
    const rawArray = [...arr];
    rawArray.unshift(rawArray.pop());
    return rawArray;
}

function nextSlider(arr) {
    const rawArray = [...arr];
    const firstElement = rawArray.shift();
    rawArray.push(firstElement);
    return rawArray;
}

function albumTemplate(str, num, src) {
    const album = document.createElement('section');
    const albumSlider = document.createElement('div');

    album.classList.add(`${str}-album`);
    albumSlider.classList.add(`${str}-album-slider`);

    const arr = generateArray(num);
    let albumPatterns = [];

    if (str == "prev") {
        albumPatterns = prevSlider(arr);
        albumSlider.innerHTML = populateSliders(str, albumPatterns, num, src)
    } else if (str == "next") {
        albumPatterns = nextSlider(arr);
        albumSlider.innerHTML = populateSliders(str, albumPatterns, num, src)
    } else {
        albumSlider.innerHTML = populateSliders(str, arr, num, src)
    }

    album.appendChild(albumSlider);
    return album;
}

function populateSliders(str, arr, num, album) {
    const template = [];
    if (album) {
        for (let i = 0; i < num; i++) {
            const { name, cover: thumb } = album[arr[i]];

            template.push(
                `
            <button class="${str}-slide" id="${name}"> 
                <img src=${thumb} alt=${thumb}}>
            </button>
            `
            )
        }
    }
    return template.join(``);
}

function generateArray(num) {
    let arr = [];
    for (let i = 0; i < num; i++) {
        arr.push(i);
    }
    return arr;
}

function cloneExtremes(str) {
    const slides = document.querySelectorAll(`.${str}-slide`);
    if (slides.length === 0) return;

    const slider = document.querySelector(`.${str}-album-slider`);
    if (slider) {
        const firstSlide = slides[0].cloneNode(true);
        const lastSlide = slides[slides.length - 1].cloneNode(true);
        slider.appendChild(firstSlide);
        slider.insertBefore(lastSlide, slides[0]);

        setTimeout(() => {
            const width = slides[0].offsetWidth;
            slider.style.transform = `translateX(-${width}px)`

            switch (str) {
                case "prev":
                    prevOffset = width;
                    break;

                case "present":
                    presentOffset = width;
                    break;

                case "next":
                    nextOffset = width;
                    break;

                default:
                    break;
            }
        }, 100);
    }
}

export { albumTemplate, cloneExtremes, prevOffset, presentOffset, nextOffset };
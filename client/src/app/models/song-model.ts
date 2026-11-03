interface Song {
    id: number;
    name: string;
    album: AlbumName;
    src: string;
    cover: string;
    duration: string;
}

interface SelectedSong {
    name: string;
    albumName: AlbumName;
    cover: string;
    src?: string;
    duration?: string;
}

type AlbumName = "Maduming Timog" | "Kung Alam Mo Lang" | "Pautang ng Pag-ibig" | "Kwentong Jimenez" | "Sakred Boy" | "Featuring" | "Gang Mobile" | "Bahay Namin Maliit Lamang";

interface AlbumSummary {
    id: string | number;
    name: AlbumName;
    tracks: number;
    thumbnail: string;
}

export type { Song, SelectedSong, AlbumName, AlbumSummary };

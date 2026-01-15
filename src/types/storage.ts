export type ImageSource = "apod" | "mars" | "epic";

export interface SavedImage {
    id: string;
    source: ImageSource;
    title: string;
    imageUrl: string;
    date: string;
    description?: string;
    savedAt: string;
}

export interface FavoriteItem extends SavedImage {
    addedAt: string;
}

export interface HistoryItem extends SavedImage {
    viewedAt: string;
}


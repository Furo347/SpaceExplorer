// Types pour les images sauvegardées (Favoris et Historique)

export type ImageSource = "apod" | "mars" | "epic";

export interface SavedImage {
    id: string;
    source: ImageSource;
    title: string;
    imageUrl: string;
    date: string;
    description?: string;
    savedAt: string; // ISO date string
}

export interface FavoriteItem extends SavedImage {
    addedAt: string; // ISO date string
}

export interface HistoryItem extends SavedImage {
    viewedAt: string; // ISO date string
}


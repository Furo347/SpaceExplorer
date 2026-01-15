import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FavoriteItem, SavedImage } from "../types/storage";

const FAVORITES_KEY = "@spaceexplorer_favorites";

type FavoritesContextType = {
    favorites: FavoriteItem[];
    loading: boolean;
    isFavorite: (imageId: string) => boolean;
    addFavorite: (image: SavedImage) => Promise<void>;
    removeFavorite: (imageId: string) => Promise<void>;
    toggleFavorite: (image: SavedImage) => Promise<void>;
    clearFavorites: () => Promise<void>;
    refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load favorites from AsyncStorage
    const loadFavorites = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error("Error loading favorites:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFavorites();
    }, [loadFavorites]);

    // Save favorites to AsyncStorage
    const saveFavorites = async (newFavorites: FavoriteItem[]) => {
        try {
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            setFavorites(newFavorites);
        } catch (error) {
            console.error("Error saving favorites:", error);
        }
    };

    // Check if an image is in favorites
    const isFavorite = useCallback(
        (imageId: string): boolean => {
            return favorites.some((fav) => fav.id === imageId);
        },
        [favorites]
    );

    // Add image to favorites
    const addFavorite = useCallback(async (image: SavedImage) => {
        if (favorites.some((fav) => fav.id === image.id)) return;

        const newFavorite: FavoriteItem = {
            ...image,
            addedAt: new Date().toISOString(),
        };

        const newFavorites = [newFavorite, ...favorites];
        await saveFavorites(newFavorites);
    }, [favorites]);

    // Remove image from favorites
    const removeFavorite = useCallback(async (imageId: string) => {
        const newFavorites = favorites.filter((fav) => fav.id !== imageId);
        await saveFavorites(newFavorites);
    }, [favorites]);

    // Toggle favorite status
    const toggleFavorite = useCallback(async (image: SavedImage) => {
        if (favorites.some((fav) => fav.id === image.id)) {
            const newFavorites = favorites.filter((fav) => fav.id !== image.id);
            await saveFavorites(newFavorites);
        } else {
            const newFavorite: FavoriteItem = {
                ...image,
                addedAt: new Date().toISOString(),
            };
            const newFavorites = [newFavorite, ...favorites];
            await saveFavorites(newFavorites);
        }
    }, [favorites]);

    // Clear all favorites
    const clearFavorites = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(FAVORITES_KEY);
            setFavorites([]);
        } catch (error) {
            console.error("Error clearing favorites:", error);
        }
    }, []);

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                loading,
                isFavorite,
                addFavorite,
                removeFavorite,
                toggleFavorite,
                clearFavorites,
                refreshFavorites: loadFavorites,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites(): FavoritesContextType {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error("useFavorites must be used within a FavoritesProvider");
    }
    return context;
}


import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FavoriteItem, SavedImage } from "../types/storage";

const FAVORITES_KEY = "@spaceexplorer_favorites";

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load favorites from AsyncStorage
    const loadFavorites = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
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
    const addFavorite = async (image: SavedImage) => {
        if (isFavorite(image.id)) return;

        const newFavorite: FavoriteItem = {
            ...image,
            addedAt: new Date().toISOString(),
        };

        const newFavorites = [newFavorite, ...favorites];
        await saveFavorites(newFavorites);
    };

    // Remove image from favorites
    const removeFavorite = async (imageId: string) => {
        const newFavorites = favorites.filter((fav) => fav.id !== imageId);
        await saveFavorites(newFavorites);
    };

    // Toggle favorite status
    const toggleFavorite = async (image: SavedImage) => {
        if (isFavorite(image.id)) {
            await removeFavorite(image.id);
        } else {
            await addFavorite(image);
        }
    };

    // Clear all favorites
    const clearFavorites = async () => {
        try {
            await AsyncStorage.removeItem(FAVORITES_KEY);
            setFavorites([]);
        } catch (error) {
            console.error("Error clearing favorites:", error);
        }
    };

    return {
        favorites,
        loading,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites,
        refreshFavorites: loadFavorites,
    };
}


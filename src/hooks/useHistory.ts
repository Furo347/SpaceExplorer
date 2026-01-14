import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HistoryItem, SavedImage } from "../types/storage";

const HISTORY_KEY = "@spaceexplorer_history";
const MAX_HISTORY_ITEMS = 100; // Limit history size

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load history from AsyncStorage
    const loadHistory = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(HISTORY_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Save history to AsyncStorage
    const saveHistory = async (newHistory: HistoryItem[]) => {
        try {
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            setHistory(newHistory);
        } catch (error) {
            console.error("Error saving history:", error);
        }
    };

    // Add image to history
    const addToHistory = async (image: SavedImage) => {
        // Remove existing entry if present (to move it to top)
        const filteredHistory = history.filter((item) => item.id !== image.id);

        const newHistoryItem: HistoryItem = {
            ...image,
            viewedAt: new Date().toISOString(),
        };

        // Add new item at the beginning, limit total size
        const newHistory = [newHistoryItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
        await saveHistory(newHistory);
    };

    // Remove item from history
    const removeFromHistory = async (imageId: string) => {
        const newHistory = history.filter((item) => item.id !== imageId);
        await saveHistory(newHistory);
    };

    // Clear all history
    const clearHistory = async () => {
        try {
            await AsyncStorage.removeItem(HISTORY_KEY);
            setHistory([]);
        } catch (error) {
            console.error("Error clearing history:", error);
        }
    };

    // Check if image is in history
    const isInHistory = useCallback(
        (imageId: string): boolean => {
            return history.some((item) => item.id === imageId);
        },
        [history]
    );

    return {
        history,
        loading,
        addToHistory,
        removeFromHistory,
        clearHistory,
        isInHistory,
        refreshHistory: loadHistory,
    };
}


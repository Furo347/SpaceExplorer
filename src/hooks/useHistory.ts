import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HistoryItem, SavedImage } from "../types/storage";

const HISTORY_KEY = "@spaceexplorer_history";
const MAX_HISTORY_ITEMS = 100;

export function useHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

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

    const saveHistory = async (newHistory: HistoryItem[]) => {
        try {
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            setHistory(newHistory);
        } catch (error) {
            console.error("Error saving history:", error);
        }
    };

    const addToHistory = async (image: SavedImage) => {
        const filteredHistory = history.filter((item) => item.id !== image.id);

        const newHistoryItem: HistoryItem = {
            ...image,
            viewedAt: new Date().toISOString(),
        };

        const newHistory = [newHistoryItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
        await saveHistory(newHistory);
    };

    const removeFromHistory = async (imageId: string) => {
        const newHistory = history.filter((item) => item.id !== imageId);
        await saveHistory(newHistory);
    };

    const clearHistory = async () => {
        try {
            await AsyncStorage.removeItem(HISTORY_KEY);
            setHistory([]);
        } catch (error) {
            console.error("Error clearing history:", error);
        }
    };

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


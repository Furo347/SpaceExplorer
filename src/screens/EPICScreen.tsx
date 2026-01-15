import React, { useState, useEffect, useCallback, useRef } from "react";
import { Text, Platform, ScrollView, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import FavoriteButton from "../ui/components/FavoriteButton";
import ErrorDisplay from "../ui/components/ErrorDisplay";
import OptimizedImage from "../ui/components/OptimizedImage";

import { getEPICImages, getEPICImageUrl, getEPICAvailableDates, EPICImage } from "../services/nasa";
import { theme } from "../ui/theme";
import { useFavorites } from "../hooks/useFavorites";
import { useHistory } from "../hooks/useHistory";
import { SavedImage } from "../types/storage";
import { ApiError, createApiError, createEmptyDataError } from "../types/errors";

export default function EPICScreen() {
    const [images, setImages] = useState<EPICImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const isFetching = useRef(false);
    const hasInitialFetch = useRef(false);

    const { isFavorite, toggleFavorite, refreshFavorites } = useFavorites();
    const { addToHistory } = useHistory();

    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites])
    );

    const MIN_DATE = new Date("2015-06-13");
    const MAX_DATE = new Date();

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const formatDisplayDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const fetchEPICData = useCallback(async (selectedDate?: Date, isInitialLoad = false) => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            setLoading(true);
            setError(null);

            const dateToFetch = selectedDate || date;
            let data: EPICImage[] = [];

            try {
                data = await getEPICImages(formatDate(dateToFetch));
            } catch (e) {
                if (isInitialLoad) {
                    console.log("[EPIC] Initial fetch failed, trying to find available date...");
                    try {
                        const availableDates = await getEPICAvailableDates();
                        if (availableDates.length > 0) {
                            const latestDate = availableDates[0];
                            console.log("[EPIC] Found latest date:", latestDate);
                            setDate(new Date(latestDate));
                            data = await getEPICImages(latestDate);
                        }
                    } catch (fallbackError) {
                        console.log("[EPIC] Fallback also failed:", fallbackError);
                        throw e;
                    }
                } else {
                    throw e;
                }
            }

            if (data.length === 0) {
                setError(createEmptyDataError("epic"));
                setImages([]);
                return;
            }

            data.slice(0, 5).forEach((image) => {
                const imageUrl = getEPICImageUrl(formatDate(dateToFetch), image.image);
                const savedImage: SavedImage = {
                    id: `epic-${image.identifier}`,
                    source: "epic",
                    title: "Terre vue de l'espace",
                    imageUrl: imageUrl,
                    date: image.date.split(" ")[0],
                    description: image.caption || `Lat: ${image.centroid_coordinates.lat.toFixed(2)}° | Lon: ${image.centroid_coordinates.lon.toFixed(2)}°`,
                    savedAt: new Date().toISOString(),
                };
                addToHistory(savedImage);
            });

            setImages(data);
        } catch (e) {
            setError(createApiError(e, "epic"));
            setImages([]);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [date, addToHistory]);

    useEffect(() => {
        if (hasInitialFetch.current) return;
        hasInitialFetch.current = true;

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);
        setDate(pastDate);
        fetchEPICData(pastDate, true);
    }, [fetchEPICData]);

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate) return;
        if (selectedDate < MIN_DATE || selectedDate > MAX_DATE) {
            setError({
                type: "empty",
                message: "Veuillez choisir une date entre le 13/06/2015 et aujourd'hui.",
                canRetry: false,
            });
            return;
        }
        setDate(selectedDate);
    };

    const handleRetry = useCallback(() => {
        fetchEPICData(date);
    }, [date, fetchEPICData]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <Title size="lg" style={{ textAlign: "center", marginBottom: 20 }}>
                    NASA EPIC
                </Title>

                <Text
                    style={{
                        color: theme.colors.textSecondary,
                        textAlign: "center",
                        marginBottom: 15,
                        fontSize: 14,
                    }}
                >
                    Images de la Terre depuis le satellite DSCOVR
                </Text>

                <PrimaryButton
                    title="Choisir une date"
                    onPress={() => setShowPicker(true)}
                    disabled={loading}
                />

                {showPicker && (
                    <Card
                        style={{
                            marginVertical: 15,
                            padding: 10,
                            backgroundColor: theme.colors.surface,
                            borderRadius: 10,
                        }}
                    >
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={MIN_DATE}
                            maximumDate={MAX_DATE}
                            onChange={onChangeDate}
                            style={{ width: "100%" }}
                            textColor={theme.colors.textPrimary}
                            themeVariant="dark"
                        />

                        <PrimaryButton
                            title="Valider la date"
                            onPress={() => {
                                fetchEPICData(date);
                                setShowPicker(false);
                            }}
                            loading={loading}
                            style={{ marginTop: 10 }}
                        />
                    </Card>
                )}

                <Text
                    style={{
                        color: theme.colors.textSecondary,
                        textAlign: "center",
                        marginTop: 10,
                        fontSize: 12,
                    }}
                >
                    Date sélectionnée : {formatDate(date)}
                </Text>

                {loading ? (
                    <Loader />
                ) : error ? (
                    <ErrorDisplay error={error} onRetry={handleRetry} />
                ) : (
                    <View style={{ marginTop: 15 }}>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                textAlign: "center",
                                marginBottom: 10,
                            }}
                        >
                            {images.length} image{images.length > 1 ? "s" : ""} disponible{images.length > 1 ? "s" : ""}
                        </Text>

                        {images.map((image) => (
                            <Card key={image.identifier} style={{ marginTop: 10 }}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <Title size="md" style={{ flex: 1, textAlign: "center" }}>
                                        Terre vue de l'espace
                                    </Title>
                                    <FavoriteButton
                                        isFavorite={isFavorite(`epic-${image.identifier}`)}
                                        onPress={() => {
                                            const imageUrl = getEPICImageUrl(formatDate(date), image.image);
                                            const savedImage: SavedImage = {
                                                id: `epic-${image.identifier}`,
                                                source: "epic",
                                                title: "Terre vue de l'espace",
                                                imageUrl: imageUrl,
                                                date: image.date.split(" ")[0],
                                                description: image.caption || `Lat: ${image.centroid_coordinates.lat.toFixed(2)}° | Lon: ${image.centroid_coordinates.lon.toFixed(2)}°`,
                                                savedAt: new Date().toISOString(),
                                            };
                                            toggleFavorite(savedImage);
                                        }}
                                        size={28}
                                    />
                                </View>

                                <OptimizedImage
                                    uri={getEPICImageUrl(formatDate(date), image.image)}
                                    style={{
                                        width: "100%",
                                        height: 300,
                                        borderRadius: theme.radius.md,
                                        marginBottom: theme.spacing.sm,
                                    }}
                                    resizeMode="cover"
                                />

                                <Text
                                    style={{
                                        color: theme.colors.textPrimary,
                                        fontSize: 14,
                                        marginBottom: theme.spacing.xs,
                                    }}
                                >
                                    📅 {formatDisplayDate(image.date)}
                                </Text>

                                <Text
                                    style={{
                                        color: theme.colors.textSecondary,
                                        fontSize: 12,
                                        marginBottom: theme.spacing.xs,
                                    }}
                                >
                                    📍 Lat: {image.centroid_coordinates.lat.toFixed(2)}° | Lon: {image.centroid_coordinates.lon.toFixed(2)}°
                                </Text>

                                {image.caption && (
                                    <Text
                                        style={{
                                            color: theme.colors.textPrimary,
                                            fontSize: 14,
                                            lineHeight: 20,
                                            marginTop: theme.spacing.xs,
                                        }}
                                    >
                                        {image.caption}
                                    </Text>
                                )}
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
}


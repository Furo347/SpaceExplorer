import React, { useState, useEffect, useCallback, useRef } from "react";
import { Text, Platform, ScrollView, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import FavoriteButton from "../ui/components/FavoriteButton";
import ErrorDisplay from "../ui/components/ErrorDisplay";
import OptimizedImage from "../ui/components/OptimizedImage";

import { getAPOD } from "../services/nasa";
import { theme } from "../ui/theme";
import { useFavorites } from "../hooks/useFavorites";
import { useHistory } from "../hooks/useHistory";
import { SavedImage } from "../types/storage";
import { ApiError, createApiError, createEmptyDataError } from "../types/errors";

export default function APODScreen() {
    const [apod, setApod] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    // Ref pour éviter les appels API en double
    const isFetching = useRef(false);
    const hasInitialFetch = useRef(false);

    const { isFavorite, toggleFavorite } = useFavorites();
    const { addToHistory } = useHistory();

    const MIN_DATE = new Date("1995-06-16");
    const MAX_DATE = new Date();

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const fetchAPODData = useCallback(async (selectedDate?: Date) => {
        // Éviter les appels en double
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            setLoading(true);
            setError(null);

            const data = selectedDate
                ? await getAPOD(formatDate(selectedDate))
                : await getAPOD();

            if (!data) {
                setError(createEmptyDataError("apod"));
                setApod(null);
                return;
            }

            setApod(data);

            // Add to history
            if (data && data.media_type === "image") {
                const savedImage: SavedImage = {
                    id: `apod-${data.date}`,
                    source: "apod",
                    title: data.title,
                    imageUrl: data.url,
                    date: data.date,
                    description: data.explanation,
                    savedAt: new Date().toISOString(),
                };
                addToHistory(savedImage);
            }
        } catch (e) {
            setError(createApiError(e, "apod"));
            setApod(null);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [addToHistory]);

    useEffect(() => {
        // Éviter le double fetch au montage (React StrictMode)
        if (hasInitialFetch.current) return;
        hasInitialFetch.current = true;
        fetchAPODData();
    }, [fetchAPODData]);

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate) return;
        if (selectedDate < MIN_DATE || selectedDate > MAX_DATE) {
            setError({
                type: "empty",
                message: "Veuillez choisir une date entre le 16/06/1995 et aujourd'hui.",
                canRetry: false,
            });
            return;
        }
        setDate(selectedDate);
    };

    const handleRetry = useCallback(() => {
        fetchAPODData(date);
    }, [date, fetchAPODData]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <Title size="lg" style={{ textAlign: "center", marginBottom: 20 }}>
                    NASA APOD
                </Title>

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
                            backgroundColor: theme.colors.backgroundSecondary,
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
                        />

                        <PrimaryButton
                            title="Valider la date"
                            onPress={() => {
                                fetchAPODData(date);
                                setShowPicker(false);
                            }}
                            loading={loading}
                            style={{ marginTop: 10 }}
                        />
                    </Card>
                )}

                {loading ? (
                    <Loader />
                ) : error ? (
                    <ErrorDisplay error={error} onRetry={handleRetry} />
                ) : (
                    apod && (
                        <Card style={{ marginTop: 15 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <Title size="md" style={{ flex: 1, textAlign: "center" }}>
                                    {apod.title}
                                </Title>
                                {apod.media_type === "image" && (
                                    <FavoriteButton
                                        isFavorite={isFavorite(`apod-${apod.date}`)}
                                        onPress={() => {
                                            const savedImage: SavedImage = {
                                                id: `apod-${apod.date}`,
                                                source: "apod",
                                                title: apod.title,
                                                imageUrl: apod.url,
                                                date: apod.date,
                                                description: apod.explanation,
                                                savedAt: new Date().toISOString(),
                                            };
                                            toggleFavorite(savedImage);
                                        }}
                                        size={28}
                                    />
                                )}
                            </View>

                            {apod.media_type === "image" ? (
                                <OptimizedImage
                                    uri={apod.url}
                                    style={{
                                        width: "100%",
                                        height: 300,
                                        borderRadius: theme.radius.md,
                                        marginBottom: theme.spacing.sm,
                                    }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Card style={{ backgroundColor: theme.colors.primary + "15", marginBottom: theme.spacing.sm }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Ionicons name="videocam" size={24} color={theme.colors.primary} />
                                        <Text
                                            style={{
                                                color: theme.colors.textPrimary,
                                                marginLeft: theme.spacing.sm,
                                                flex: 1,
                                            }}
                                        >
                                            Contenu non-image (ex : vidéo YouTube) non affichable.
                                        </Text>
                                    </View>
                                </Card>
                            )}

                            <Text
                                style={{
                                    color: theme.colors.textPrimary,
                                    fontSize: 16,
                                    lineHeight: 22,
                                }}
                            >
                                {apod.explanation}
                            </Text>
                        </Card>
                    )
                )}
            </ScrollView>
        </Screen>
    );
}

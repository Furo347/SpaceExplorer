import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Platform, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import FavoriteButton from "../ui/components/FavoriteButton";
import ErrorDisplay from "../ui/components/ErrorDisplay";
import OptimizedImage from "../ui/components/OptimizedImage";

import { getMarsPhotos, MarsPhoto } from "../services/nasa";
import { theme } from "../ui/theme";
import { useFavorites } from "../hooks/useFavorites";
import { useHistory } from "../hooks/useHistory";
import { SavedImage } from "../types/storage";
import { ApiError, createApiError, createEmptyDataError } from "../types/errors";

type RoverOption = {
    label: string;
    value: "curiosity" | "opportunity" | "spirit";
    // Date connue avec des photos pour ce rover
    defaultDate: string;
    // Date de fin de mission (null si toujours actif)
    endDate: string | null;
};

const ROVERS: RoverOption[] = [
    {
        label: "Curiosity",
        value: "curiosity",
        defaultDate: "2024-01-15", // Curiosity est toujours actif
        endDate: null
    },
    {
        label: "Opportunity",
        value: "opportunity",
        defaultDate: "2018-06-10", // Dernière période active d'Opportunity
        endDate: "2019-02-13"
    },
    {
        label: "Spirit",
        value: "spirit",
        defaultDate: "2010-01-15", // Période active de Spirit
        endDate: "2010-03-22"
    },
];

export default function MarsRoverScreen() {
    const [rover, setRover] = useState<string>(ROVERS[0].value);
    const [photos, setPhotos] = useState<MarsPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);

    // Utiliser la date par défaut du premier rover (Curiosity)
    const [date, setDate] = useState(new Date(ROVERS[0].defaultDate));
    const [showPicker, setShowPicker] = useState(false);

    // Refs pour éviter les appels API en double
    const isFetching = useRef(false);
    const hasInitialFetch = useRef(false);

    const { isFavorite, toggleFavorite, refreshFavorites } = useFavorites();
    const { addToHistory } = useHistory();

    // Rafraîchir les favoris quand l'écran devient visible
    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites])
    );

    const getRoverConfig = (roverName: string): RoverOption => {
        return ROVERS.find(r => r.value === roverName.toLowerCase()) || ROVERS[0];
    };

    const getMinDateForRover = (roverName: string) => {
        switch (roverName.toLowerCase()) {
            case "curiosity":
                return new Date("2012-08-06");
            case "opportunity":
                return new Date("2004-01-25");
            case "spirit":
                return new Date("2004-01-04");
            default:
                return new Date("2004-01-04");
        }
    };

    const getMaxDateForRover = (roverName: string): Date => {
        const config = getRoverConfig(roverName);
        return config.endDate ? new Date(config.endDate) : new Date();
    };

    const MIN_DATE = getMinDateForRover(rover);
    const MAX_DATE = getMaxDateForRover(rover);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const fetchPhotos = useCallback(async (selectedDate?: Date, selectedRover?: string) => {
        // Éviter les appels en double
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            setLoading(true);
            setError(null);
            const currentRover = selectedRover || rover;
            const currentDate = selectedDate || date;

            // Ensure the date is within the rover's active period
            const minDate = getMinDateForRover(currentRover);
            const maxDate = getMaxDateForRover(currentRover);

            let dateToUse = currentDate;
            if (currentDate < minDate) {
                dateToUse = minDate;
                setDate(minDate);
            } else if (currentDate > maxDate) {
                dateToUse = maxDate;
                setDate(maxDate);
            }

            console.log(`[Mars] Fetching photos for ${currentRover} on ${formatDate(dateToUse)}`);

            const data = await getMarsPhotos(
                currentRover,
                formatDate(dateToUse)
            );

            if (data.length === 0) {
                // Si pas de photos, afficher un message plus informatif
                const roverConfig = getRoverConfig(currentRover);
                setError({
                    type: "empty",
                    message: roverConfig.endDate
                        ? `Aucune photo du rover ${roverConfig.label} pour cette date. Ce rover a terminé sa mission le ${new Date(roverConfig.endDate).toLocaleDateString("fr-FR")}.`
                        : `Aucune photo du rover ${roverConfig.label} pour cette date. Essayez une autre date.`,
                    canRetry: true,
                });
                setPhotos([]);
                return;
            }

            console.log(`[Mars] Received ${data.length} photos`);

            // Add photos to history (limit to first 10 to avoid spam)
            data.slice(0, 10).forEach((photo) => {
                const savedImage: SavedImage = {
                    id: `mars-${photo.id}`,
                    source: "mars",
                    title: photo.camera.full_name,
                    imageUrl: photo.img_src,
                    date: photo.earth_date,
                    description: `Rover: ${photo.rover.name} | Camera: ${photo.camera.full_name}`,
                    savedAt: new Date().toISOString(),
                };
                addToHistory(savedImage);
            });

            setPhotos(data);
        } catch (e) {
            console.log("[Mars] Error:", e);
            setError(createApiError(e, "mars"));
            setPhotos([]);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [rover, date, addToHistory]);

    useEffect(() => {
        // Éviter le double fetch au montage (React StrictMode)
        if (hasInitialFetch.current) return;
        hasInitialFetch.current = true;
        fetchPhotos();
    }, [fetchPhotos]);

    const onRoverChange = (selectedRover: RoverOption) => {
        setRover(selectedRover.value);
        // Utiliser la date par défaut du rover sélectionné
        const newDate = new Date(selectedRover.defaultDate);
        setDate(newDate);
        // Fetch immédiatement avec le nouveau rover et sa date par défaut
        fetchPhotos(newDate, selectedRover.value);
    };

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(false); // Hide picker on selection for better UX
        if (!selectedDate) return;

        const minDate = getMinDateForRover(rover);
        const maxDate = getMaxDateForRover(rover);
        const roverConfig = getRoverConfig(rover);

        if (selectedDate < minDate || selectedDate > maxDate) {
            const maxDateStr = roverConfig.endDate
                ? `le ${new Date(roverConfig.endDate).toLocaleDateString("fr-FR")} (fin de mission)`
                : "aujourd'hui";
            setError({
                type: "empty",
                message: `Veuillez choisir une date entre le ${minDate.toLocaleDateString("fr-FR")} et ${maxDateStr}.`,
                canRetry: false,
            });
            return;
        }

        setDate(selectedDate);
        fetchPhotos(selectedDate, rover);
    };

    const handleRetry = useCallback(() => {
        fetchPhotos(date, rover);
    }, [date, rover, fetchPhotos]);

    const formatDisplayDate = (d: Date) => {
        return d.toLocaleDateString("fr-FR", {
            weekday: "short",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Title size="lg" style={styles.title}>
                    Mars Rover Photos
                </Title>

                {/* Sélection du rover */}
                <Text style={styles.sectionLabel}>Rover</Text>
                <View style={styles.roverContainer}>
                    {ROVERS.map((r) => {
                        const isSelected = r.value === rover;
                        return (
                            <TouchableOpacity
                                key={r.value}
                                onPress={() => !loading && onRoverChange(r)}
                                disabled={loading}
                                activeOpacity={0.7}
                                style={[
                                    styles.roverButton,
                                    isSelected && styles.roverButtonSelected,
                                    loading && styles.roverButtonDisabled,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.roverButtonText,
                                        isSelected && styles.roverButtonTextSelected,
                                    ]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {r.label}
                                </Text>
                                {r.endDate && (
                                    <Text style={styles.roverStatus}>Terminé</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Affichage de la date sélectionnée */}
                <Card style={styles.dateCard}>
                    <View style={styles.dateHeader}>
                        <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                        <Text style={styles.dateLabel}>Date sélectionnée</Text>
                    </View>
                    <Text style={styles.dateValue}>{formatDisplayDate(date)}</Text>
                    <PrimaryButton
                        title="Modifier la date"
                        onPress={() => setShowPicker(true)}
                        disabled={loading}
                        style={styles.dateButton}
                    />
                </Card>

                {showPicker && (
                    <Card style={styles.pickerCard}>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={MIN_DATE}
                            maximumDate={MAX_DATE}
                            onChange={onChangeDate}
                            style={{ width: "100%" }}
                        />
                        {Platform.OS === 'ios' && (
                            <PrimaryButton
                                title="Fermer"
                                onPress={() => setShowPicker(false)}
                                style={{ marginTop: 10 }}
                            />
                        )}
                    </Card>
                )}

                {/* Affichage des photos */}
                {loading ? (
                    <Loader />
                ) : error ? (
                    <ErrorDisplay error={error} onRetry={handleRetry} />
                ) : (
                    photos.map((photo) => (
                        <Card key={photo.id} style={{ marginTop: 15 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <Title size="md" style={{ flex: 1, textAlign: "center" }}>
                                    {photo.camera.full_name}
                                </Title>
                                <FavoriteButton
                                    isFavorite={isFavorite(`mars-${photo.id}`)}
                                    onPress={() => {
                                        const savedImage: SavedImage = {
                                            id: `mars-${photo.id}`,
                                            source: "mars",
                                            title: photo.camera.full_name,
                                            imageUrl: photo.img_src,
                                            date: photo.earth_date,
                                            description: `Rover: ${photo.rover.name} | Camera: ${photo.camera.full_name}`,
                                            savedAt: new Date().toISOString(),
                                        };
                                        toggleFavorite(savedImage);
                                    }}
                                    size={28}
                                />
                            </View>
                            <OptimizedImage
                                uri={photo.img_src}
                                style={{ width: "100%", height: 250, borderRadius: theme.radius.md }}
                                resizeMode="cover"
                            />
                            <Text style={{ color: theme.colors.textPrimary, marginTop: theme.spacing.sm, fontSize: 14, lineHeight: 20 }}>
                                Rover: {photo.rover.name} | Date: {photo.earth_date} | Status: {photo.rover.status}
                            </Text>
                        </Card>
                    ))
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: theme.spacing.md,
        paddingBottom: 40,
    },
    title: {
        textAlign: "center",
        marginBottom: theme.spacing.lg,
    },
    sectionLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
    },
    roverContainer: {
        flexDirection: "row",
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    roverButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "transparent",
        minHeight: 60,
    },
    roverButtonSelected: {
        backgroundColor: theme.colors.primary + "20",
        borderColor: theme.colors.primary,
    },
    roverButtonDisabled: {
        opacity: 0.6,
    },
    roverButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
    roverButtonTextSelected: {
        color: theme.colors.primary,
        fontWeight: "bold",
    },
    roverStatus: {
        color: theme.colors.textSecondary,
        fontSize: 10,
        marginTop: 2,
        opacity: 0.7,
    },
    dateCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        alignItems: "center",
    },
    dateHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.xs,
    },
    dateLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginLeft: theme.spacing.xs,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    dateValue: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: theme.spacing.md,
        textAlign: "center",
    },
    dateButton: {
        paddingHorizontal: theme.spacing.lg,
    },
    pickerCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.backgroundSecondary,
    },
});


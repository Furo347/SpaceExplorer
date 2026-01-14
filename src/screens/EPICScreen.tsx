import React, { useState, useEffect } from "react";
import { Image, Text, Platform, ScrollView, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import FavoriteButton from "../ui/components/FavoriteButton";

import { getEPICImages, getEPICImageUrl, EPICImage } from "../services/nasa";
import { theme } from "../ui/theme";
import { useFavorites } from "../hooks/useFavorites";
import { useHistory } from "../hooks/useHistory";
import { SavedImage } from "../types/storage";

export default function EPICScreen() {
    const [images, setImages] = useState<EPICImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const { isFavorite, toggleFavorite } = useFavorites();
    const { addToHistory } = useHistory();

    // EPIC data is available from 2015-06-13
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

    const fetchEPICData = async (selectedDate?: Date) => {
        try {
            setLoading(true);
            setError(null);

            const dateToFetch = selectedDate || date;
            const data = await getEPICImages(formatDate(dateToFetch));

            if (data.length === 0) {
                setError("Aucune image disponible pour cette date. Essayez une date antérieure.");
            }

            // Add images to history
            data.forEach((image) => {
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
            setError("Impossible de charger les images EPIC pour cette date.");
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Load images for yesterday by default (today's images may not be available yet)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);
        setDate(yesterday);
        fetchEPICData(yesterday);
    }, []);

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate) return;
        if (selectedDate < MIN_DATE || selectedDate > MAX_DATE) {
            setError("Veuillez choisir une date entre le 13/06/2015 et aujourd'hui.");
            return;
        }
        setDate(selectedDate);
    };

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

                <PrimaryButton title="Choisir une date" onPress={() => setShowPicker(true)} />

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
                                fetchEPICData(date);
                                setShowPicker(false);
                            }}
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
                    <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 20 }}>
                        {error}
                    </Text>
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

                                <Image
                                    source={{ uri: getEPICImageUrl(formatDate(date), image.image) }}
                                    style={{
                                        width: "100%",
                                        height: 300,
                                        borderRadius: 10,
                                        marginBottom: 10,
                                    }}
                                    resizeMode="cover"
                                />

                                <Text
                                    style={{
                                        color: theme.colors.textPrimary,
                                        fontSize: 14,
                                        marginBottom: 5,
                                    }}
                                >
                                    📅 {formatDisplayDate(image.date)}
                                </Text>

                                <Text
                                    style={{
                                        color: theme.colors.textSecondary,
                                        fontSize: 12,
                                        marginBottom: 5,
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
                                            marginTop: 5,
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


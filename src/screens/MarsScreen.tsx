import React, { useState, useEffect } from "react";
import { View, Text, Image, Platform, ScrollView } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import FavoriteButton from "../ui/components/FavoriteButton";

import { getMarsPhotos, MarsPhoto } from "../services/nasa";
import { theme } from "../ui/theme";
import { useFavorites } from "../hooks/useFavorites";
import { useHistory } from "../hooks/useHistory";
import { SavedImage } from "../types/storage";

type RoverOption = {
    label: string;
    value: "curiosity" | "opportunity" | "spirit";
};

const ROVERS: RoverOption[] = [
    { label: "Curiosity", value: "curiosity" },
    { label: "Opportunity", value: "opportunity" },
    { label: "Spirit", value: "spirit" },
];
export default function MarsRoverScreen() {
    const [rover, setRover] = useState<string>(ROVERS[0].value);
    const [photos, setPhotos] = useState<MarsPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState(new Date("2015-09-27"));
    const [showPicker, setShowPicker] = useState(false);

    const { isFavorite, toggleFavorite } = useFavorites();
    const { addToHistory } = useHistory();

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

    const MIN_DATE = getMinDateForRover(rover);
    const MAX_DATE = new Date();

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const fetchPhotos = async (selectedDate?: Date, selectedRover?: string) => {
        try {
            setLoading(true);
            setError(null);
            const currentRover = selectedRover || rover;
            const currentDate = selectedDate || date;

            // Ensure the date is not before the rover's landing date
            const minDate = getMinDateForRover(currentRover);
            if (currentDate < minDate) {
                setDate(minDate);
            }

            const data = await getMarsPhotos(
                currentRover,
                formatDate(currentDate)
            );

            if (data.length === 0) {
                setError("Aucune photo trouvée pour ce rover autour de cette date.");
            }

            // Add photos to history
            data.forEach((photo) => {
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
            console.log("Mars API error:", e);
            setError("Impossible de charger les photos du rover.");
            setPhotos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const onRoverChange = (selectedRover: RoverOption) => {
        const newMinDate = getMinDateForRover(selectedRover.value);
        setRover(selectedRover.value);
        if (date < newMinDate) {
            setDate(newMinDate);
        }
    };

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(false); // Hide picker on selection for better UX
        if (!selectedDate) return;

        const minDate = getMinDateForRover(rover);
        if (selectedDate < minDate || selectedDate > MAX_DATE) {
            setError(`Veuillez choisir une date entre ${formatDate(minDate)} et aujourd'hui.`);
            return;
        }

        setDate(selectedDate);
        fetchPhotos(selectedDate, rover);
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                <Title size="lg" style={{ textAlign: "center", marginBottom: 20 }}>
                    Mars Rover Photos
                </Title>

                {/* Choix du rover */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
                    {ROVERS.map((r) => (
                        <PrimaryButton
                            key={r.value}
                            title={r.label}
                            onPress={() => onRoverChange(r)}
                            style={{
                                flex: 1,
                                marginHorizontal: 5,
                                backgroundColor: r.value === rover ? theme.colors.primary : theme.colors.background,
                            }}
                        />
                    ))}
                </View>

                {/* Choix de la date */}
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
                        {Platform.OS === 'ios' && <PrimaryButton
                            title="Fermer"
                            onPress={() => setShowPicker(false)}
                            style={{ marginTop: 10 }}
                        />}
                    </Card>
                )}

                {/* Affichage des photos */}
                {loading ? (
                    <Loader />
                ) : error ? (
                    <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 20 }}>{error}</Text>
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
                            <Image
                                source={{ uri: photo.img_src }}
                                style={{ width: "100%", height: 250, borderRadius: 10 }}
                                resizeMode="cover"
                            />
                            <Text style={{ color: theme.colors.textPrimary, marginTop: 10, fontSize: 14 }}>
                                Rover: {photo.rover.name} | Date: {photo.earth_date} | Status: {photo.rover.status}
                            </Text>
                        </Card>
                    ))
                )}
            </ScrollView>
        </Screen>
    );
}

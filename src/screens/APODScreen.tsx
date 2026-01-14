import React, { useState, useEffect } from "react";
import { View, Text, Image, Button, ActivityIndicator, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getAPOD } from "../services/nasa";

export default function APODScreen() {
    const [loading, setLoading] = useState(true);
    const [apod, setApod] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const MIN_DATE = new Date("1995-06-16"); // Première image APOD
    const MAX_DATE = new Date(); // Aujourd’hui

    const formatDate = (d: Date) => d.toISOString().split('T')[0];


    const fetchAPODData = async (selectedDate?: Date) => {
        try {
            setLoading(true);
            setError(null);

            const data = selectedDate
                ? await getAPOD(formatDate(selectedDate))
                : await getAPOD();

            setApod(data);
        } catch (e: any) {
            setError("Impossible de charger l'image APOD pour cette date.");
            setApod(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAPODData();
    }, []);

    const onChangeDate = (_event: any, selectedDate?: Date) => {
        setShowPicker(false);

        if (!selectedDate) return;

        if (selectedDate < MIN_DATE || selectedDate > MAX_DATE) {
            setError("Veuillez choisir une date entre le 16/06/1995 et aujourd’hui.");
            return;
        }

        setDate(selectedDate);
        fetchAPODData(selectedDate);
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
                NASA APOD
            </Text>

            <Button title="Choisir une date" onPress={() => setShowPicker(true)} />

            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={MIN_DATE}
                    maximumDate={MAX_DATE}
                    onChange={onChangeDate}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 30 }} />
            ) : error ? (
                <Text style={{ marginTop: 20, color: "red", textAlign: "center" }}>
                    {error}
                </Text>
            ) : (
                apod && (
                    <>
                        <Text
                            style={{
                                marginVertical: 15,
                                fontSize: 20,
                                fontWeight: "bold",
                                textAlign: "center",
                            }}
                        >
                            {apod.title}
                        </Text>

                        {apod.media_type === "image" ? (
                            <Image
                                source={{ uri: apod.url }}
                                style={{
                                    width: "100%",
                                    height: 300,
                                    borderRadius: 10,
                                    marginBottom: 10,
                                }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ textAlign: "center", marginTop: 10 }}>
                                Contenu non-image (ex : vidéo YouTube) non affichable.
                            </Text>
                        )}

                        <Text style={{ marginTop: 10, fontSize: 16 }}>
                            {apod.explanation}
                        </Text>
                    </>
                )
            )}
        </View>
    );
}

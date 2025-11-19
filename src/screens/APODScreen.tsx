import React, { useState, useEffect } from "react";
import { View, Text, Image, Button, ActivityIndicator, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { NASA_API_KEY, NASA_BASE } from "../config";

export default function APODScreen() {
    const [loading, setLoading] = useState(true);
    const [apod, setApod] = useState<any>(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const fetchAPOD = async (selectedDate?: Date) => {
        try {
            setLoading(true);

            const formatted = selectedDate
                ? selectedDate.toISOString().split("T")[0]
                : undefined;

            const url = `${NASA_BASE}/planetary/apod?api_key=${NASA_API_KEY}${
                formatted ? `&date=${formatted}` : ""
            }`;

            const response = await axios.get(url);
            setApod(response.data);
        } catch (error) {
            console.error("Erreur APOD : ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAPOD();
    }, []);

    const onChangeDate = (_event: any, selectedDate?: Date) => {
        setShowPicker(false);

        if (selectedDate) {
            setDate(selectedDate);
            fetchAPOD(selectedDate);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text
                style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 10,
                    textAlign: "center",
                }}
            >
                NASA APOD
            </Text>

            <Button
                title="Choisir une date"
                onPress={() => setShowPicker(true)}
            />

            {showPicker && (
                <DateTimePicker
                    value={date}
                    maximumDate={new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onChangeDate}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
            ) : (
                apod && (
                    <>
                        <Text style={{ marginVertical: 10, fontSize: 18 }}>{apod.title}</Text>

                        {apod.media_type === "image" ? (
                            <Image
                                source={{ uri: apod.url }}
                                style={{ width: "100%", height: 300, borderRadius: 10 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text>Ce contenu n’est pas une image (vidéo YouTube, etc.)</Text>
                        )}

                        <Text style={{ marginTop: 10 }}>{apod.explanation}</Text>
                    </>
                )
            )}
        </View>
    );
}

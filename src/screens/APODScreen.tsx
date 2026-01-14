import React, { useState, useEffect } from "react";
import { Image, Text, Platform, ScrollView, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";

import { getAPOD } from "../services/nasa";
import { theme } from "../ui/theme";

export default function APODScreen() {
    const [apod, setApod] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const MIN_DATE = new Date("1995-06-16");
    const MAX_DATE = new Date();

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const fetchAPODData = async (selectedDate?: Date) => {
        try {
            setLoading(true);
            setError(null);

            const data = selectedDate
                ? await getAPOD(formatDate(selectedDate))
                : await getAPOD();

            setApod(data);
        } catch (e) {
            setError("Impossible de charger l'image APOD pour cette date.");
            setApod(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAPODData();
    }, []);

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate) return;
        if (selectedDate < MIN_DATE || selectedDate > MAX_DATE) {
            setError("Veuillez choisir une date entre le 16/06/1995 et aujourd’hui.");
            return;
        }
        setDate(selectedDate);
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <Title size="lg" style={{ textAlign: "center", marginBottom: 20 }}>
                    NASA APOD
                </Title>

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
                                fetchAPODData(date);
                                setShowPicker(false);
                            }}
                            style={{ marginTop: 10 }}
                        />
                    </Card>
                )}

                {loading ? (
                    <Loader />
                ) : error ? (
                    <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 20 }}>
                        {error}
                    </Text>
                ) : (
                    apod && (
                        <Card style={{ marginTop: 15 }}>
                            <Title size="md" style={{ textAlign: "center", marginBottom: 10 }}>
                                {apod.title}
                            </Title>

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
                                <Text
                                    style={{
                                        color: theme.colors.textPrimary,
                                        textAlign: "center",
                                        marginBottom: 10,
                                    }}
                                >
                                    Contenu non-image (ex : vidéo YouTube) non affichable.
                                </Text>
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

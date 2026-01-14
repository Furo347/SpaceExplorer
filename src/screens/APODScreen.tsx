import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    ActivityIndicator,
    Pressable,
    ScrollView,
    Platform,
    StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getAPOD, APODResponse } from "../services/nasa";

const MIN_DATE = new Date("1995-06-16");
const MAX_DATE = new Date();

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export default function APODScreen() {
    const [apod, setApod] = useState<APODResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState<boolean>(false);

    async function loadAPOD(selectedDate?: Date) {
        try {
            setLoading(true);
            setError(null);

            const data = await getAPOD(
                selectedDate ? formatDate(selectedDate) : undefined
            );

            setApod(data);
        } catch {
            setError("Impossible de charger l'image astronomique du jour.");
            setApod(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAPOD();
    }, []);

    function onDateChange(_: unknown, selected?: Date) {
        setShowPicker(false);

        if (!selected) return;

        if (selected < MIN_DATE || selected > MAX_DATE) {
            setError(
                "La date doit être comprise entre le 16 juin 1995 et aujourd’hui."
            );
            return;
        }

        setDate(selected);
        loadAPOD(selected);
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>NASA · Image du jour</Text>

            <Pressable
                style={styles.dateButton}
                onPress={() => setShowPicker(true)}
            >
                <Text style={styles.dateButtonText}>
                    Choisir une date
                </Text>
            </Pressable>

            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={MIN_DATE}
                    maximumDate={MAX_DATE}
                    onChange={onDateChange}
                />
            )}

            {loading && <ActivityIndicator size="large" style={{ marginTop: 40 }} />}

            {error && <Text style={styles.error}>{error}</Text>}

            {!loading && apod && (
                <View style={styles.card}>
                    <Text style={styles.title}>{apod.title}</Text>
                    <Text style={styles.date}>{apod.date}</Text>

                    {apod.media_type === "image" ? (
                        <Image
                            source={{ uri: apod.url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.videoPlaceholder}>
                            <Text style={styles.videoText}>
                                Ce contenu est une vidéo 🎬
                            </Text>
                        </View>
                    )}

                    <Text style={styles.explanation}>
                        {apod.explanation}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
    },
    dateButton: {
        backgroundColor: "#1e293b",
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    dateButtonText: {
        color: "white",
        textAlign: "center",
        fontWeight: "600",
        fontSize: 16,
    },
    card: {
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: "#475569",
        marginBottom: 12,
    },
    image: {
        width: "100%",
        height: 280,
        borderRadius: 12,
        marginBottom: 12,
    },
    videoPlaceholder: {
        height: 200,
        borderRadius: 12,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    videoText: {
        color: "white",
        fontWeight: "600",
    },
    explanation: {
        fontSize: 16,
        lineHeight: 22,
        color: "#020617",
    },
    error: {
        color: "#dc2626",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,
    },
});

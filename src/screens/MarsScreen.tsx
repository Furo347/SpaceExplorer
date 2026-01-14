import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getMarsPhotos, MarsPhoto } from "../services/nasa";

const ROVERS = ["curiosity", "opportunity", "spirit"] as const;
type Rover = typeof ROVERS[number];

export default function MarsScreen() {
    const [rover, setRover] = useState<Rover>("curiosity");
    const [date, setDate] = useState(new Date("2015-06-03"));
    const [photos, setPhotos] = useState<MarsPhoto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getMarsPhotos(rover, formatDate(date));
            setPhotos(result);
        } catch {
            setError("Impossible de charger les photos pour cette date.");
            setPhotos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [rover]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mars Rover Photos</Text>

            {/* Rover selector */}
            <View style={styles.roverContainer}>
                {ROVERS.map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[
                            styles.roverButton,
                            rover === r && styles.roverButtonActive,
                        ]}
                        onPress={() => setRover(r)}
                    >
                        <Text
                            style={[
                                styles.roverText,
                                rover === r && styles.roverTextActive,
                            ]}
                        >
                            {r.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPicker(true)}
            >
                <Text style={styles.dateText}>
                    Date : {formatDate(date)}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    maximumDate={new Date()}
                    onChange={(_, selectedDate) => {
                        setShowPicker(false);
                        if (selectedDate) {
                            setDate(selectedDate);
                            fetchPhotos();
                        }
                    }}
                />
            )}

            {loading ? (
                <ActivityIndicator size="large" style={{ marginTop: 30 }} />
            ) : error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <FlatList
                    data={photos}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <Image
                            source={{ uri: item.img_src }}
                            style={styles.image}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={styles.empty}>
                            Aucune photo disponible pour cette date.
                        </Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
    },
    roverContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 12,
    },
    roverButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#eee",
    },
    roverButtonActive: {
        backgroundColor: "#000",
    },
    roverText: {
        fontWeight: "600",
        color: "#000",
    },
    roverTextActive: {
        color: "#fff",
    },
    dateButton: {
        alignSelf: "center",
        marginBottom: 12,
    },
    dateText: {
        fontSize: 16,
        textDecorationLine: "underline",
    },
    image: {
        width: "48%",
        height: 150,
        margin: "1%",
        borderRadius: 8,
    },
    error: {
        marginTop: 20,
        textAlign: "center",
        color: "red",
    },
    empty: {
        marginTop: 30,
        textAlign: "center",
        fontStyle: "italic",
    },
});

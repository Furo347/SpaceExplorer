import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";

import { getNearEarthObjects, NeoWsAsteroid } from "../services/nasa";
import { theme } from "../ui/theme";
import { ApiError, createApiError, createEmptyDataError } from "../types/errors";

const MIN_DATE = new Date("1995-01-01");
const MAX_DATE = new Date();

type CloseApproachData = NeoWsAsteroid["close_approach_data"][number];

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatNumeric(value?: string, suffix?: string): string {
    if (!value) return "N/A";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "N/A";
    const formatted = parsed.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
    return suffix ? `${formatted} ${suffix}` : formatted;
}

function getRelevantApproachData(asteroid: NeoWsAsteroid, selectedDate: string): CloseApproachData | null {
    const closeApproachData = asteroid.close_approach_data;
    if (!Array.isArray(closeApproachData) || closeApproachData.length === 0) {
        return null;
    }

    return closeApproachData.find((item) => item.close_approach_date === selectedDate) ?? closeApproachData[0];
}

export default function NeoWsScreen() {
    const [date, setDate] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const [objects, setObjects] = useState<NeoWsAsteroid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);

    const isFetching = useRef(false);
    const hasInitialFetch = useRef(false);

    const fetchNeoWsData = useCallback(async (selectedDate?: Date) => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            setLoading(true);
            setError(null);

            const dateToFetch = selectedDate ?? date;
            const data = await getNearEarthObjects(formatDate(dateToFetch));

            if (!data || data.length === 0) {
                setObjects([]);
                setError(createEmptyDataError("neows"));
                return;
            }

            setObjects(data);
        } catch (e) {
            setObjects([]);
            setError(createApiError(e, "neows"));
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [date]);

    useEffect(() => {
        if (hasInitialFetch.current) return;
        hasInitialFetch.current = true;
        fetchNeoWsData(date);
    }, [date, fetchNeoWsData]);

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate) return;

        if (selectedDate < MIN_DATE || selectedDate > MAX_DATE) {
            setError({
                type: "empty",
                message: "Veuillez choisir une date valide.",
                canRetry: false,
            });
            return;
        }

        setDate(selectedDate);
    };

    const handleValidateDate = () => {
        setShowPicker(false);
        fetchNeoWsData(date);
    };

    const handleRetry = () => {
        fetchNeoWsData(date);
    };

    const renderContent = () => {
        if (loading) {
            return <Loader />;
        }

        if (error) {
            return (
                <Card style={styles.errorCard}>
                    <Text style={styles.errorText}>{error.message}</Text>
                    {error.canRetry && (
                        <PrimaryButton
                            title="Reessayer"
                            onPress={handleRetry}
                            style={styles.retryButton}
                        />
                    )}
                </Card>
            );
        }

        const plural = objects.length > 1;
        const objectLabel = plural ? "objets" : "objet";
        const detectedLabel = plural ? "detectes" : "detecte";

        return (
            <View style={styles.listContainer}>
                <Text style={styles.countText}>
                    {objects.length} {objectLabel} {detectedLabel}
                </Text>

                {objects.map((item) => {
                    const approachData = getRelevantApproachData(item, formatDate(date));
                    const speed = formatNumeric(approachData?.relative_velocity.kilometers_per_hour, "km/h");
                    const missDistance = formatNumeric(approachData?.miss_distance.kilometers, "km");
                    const approachDate = approachData?.close_approach_date ?? "N/A";
                    const isHazardous = item.is_potentially_hazardous_asteroid;
                    const hazardStyle = isHazardous ? styles.hazardBadgeDanger : styles.hazardBadgeSafe;
                    const hazardText = isHazardous ? "Potentiellement dangereux" : "Risque faible";

                    return (
                        <Card key={item.id} style={styles.objectCard}>
                            <View style={styles.headerRow}>
                                <Title size="md" style={styles.objectName}>
                                    {item.name}
                                </Title>
                                <View
                                    style={[
                                        styles.hazardBadge,
                                        hazardStyle,
                                    ]}
                                >
                                    <Text style={styles.hazardBadgeText}>{hazardText}</Text>
                                </View>
                            </View>

                            <Text style={styles.detailText}>Date d'approche: {approachDate}</Text>
                            <Text style={styles.detailText}>Vitesse estimee: {speed}</Text>
                            <Text style={styles.detailText}>Distance de passage: {missDistance}</Text>
                        </Card>
                    );
                })}
            </View>
        );
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container}>
                <Title size="lg" style={styles.title}>
                    Near Earth Objects
                </Title>

                <Text style={styles.subtitle}>
                    Objets proches de la Terre identifies par la NASA
                </Text>

                <Card style={styles.dateCard}>
                    <Text style={styles.dateLabel}>Date selectionnee</Text>
                    <Text style={styles.dateValue}>{formatDisplayDate(date)}</Text>
                </Card>

                <PrimaryButton
                    title="Choisir une date"
                    onPress={() => setShowPicker(true)}
                    disabled={loading}
                />

                {showPicker && (
                    <Card style={styles.pickerCard}>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            minimumDate={MIN_DATE}
                            maximumDate={MAX_DATE}
                            onChange={onChangeDate}
                            style={styles.picker}
                            textColor={theme.colors.textPrimary}
                            themeVariant="dark"
                        />

                        <PrimaryButton
                            title="Valider la date"
                            onPress={handleValidateDate}
                            loading={loading}
                            style={styles.validateButton}
                        />
                    </Card>
                )}

                {renderContent()}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    title: {
        textAlign: "center",
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginBottom: theme.spacing.md,
        fontSize: 14,
        lineHeight: 20,
    },
    dateCard: {
        marginBottom: theme.spacing.md,
        alignItems: "center",
    },
    dateLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    dateValue: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    pickerCard: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
    },
    picker: {
        width: "100%",
    },
    validateButton: {
        marginTop: theme.spacing.sm,
    },
    errorCard: {
        marginTop: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.error + "30",
        backgroundColor: theme.colors.error + "15",
        alignItems: "center",
    },
    errorText: {
        color: theme.colors.error,
        textAlign: "center",
        lineHeight: 20,
    },
    retryButton: {
        marginTop: theme.spacing.md,
    },
    listContainer: {
        marginTop: theme.spacing.md,
    },
    countText: {
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginBottom: theme.spacing.sm,
    },
    objectCard: {
        marginTop: theme.spacing.sm,
    },
    headerRow: {
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    objectName: {
        textAlign: "left",
    },
    hazardBadge: {
        alignSelf: "flex-start",
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    hazardBadgeDanger: {
        backgroundColor: theme.colors.error + "25",
    },
    hazardBadgeSafe: {
        backgroundColor: theme.colors.primary + "25",
    },
    hazardBadgeText: {
        color: theme.colors.textPrimary,
        fontSize: 12,
        fontWeight: "600",
    },
    detailText: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: theme.spacing.xs,
    },
});


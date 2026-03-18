import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import ErrorDisplay from "../ui/components/ErrorDisplay";

import { DonkiUiEvent, getDonkiEvents } from "../services/nasa";
import { ApiError, createApiError, createEmptyDataError } from "../types/errors";
import { theme } from "../ui/theme";

const MAX_RANGE_DAYS = 7;
type PickerTarget = "start" | "end" | null;

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

function formatIssueDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getRangeError(startDate: Date, endDate: Date): string | null {
    if (startDate > endDate) {
        return "La date de debut doit etre anterieure ou egale a la date de fin.";
    }

    const millisPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / millisPerDay);

    if (diffDays > MAX_RANGE_DAYS) {
        return "La plage de dates est trop grande. Limite: 7 jours.";
    }

    return null;
}

function getShortSourceLabel(url?: string): string {
    if (!url) return "";

    try {
        const parsed = new URL(url);
        return parsed.hostname.replace("www.", "");
    } catch {
        return url;
    }
}

export default function DONKIScreen() {
    const [startDate, setStartDate] = useState<Date>(() => {
        const initialDate = new Date();
        initialDate.setDate(initialDate.getDate() - 3);
        return initialDate;
    });
    const [endDate, setEndDate] = useState<Date>(() => new Date());
    const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

    const [events, setEvents] = useState<DonkiUiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);

    const isFetching = useRef(false);
    const hasInitialFetch = useRef(false);

    const fetchDonkiData = useCallback(async (selectedStartDate?: Date, selectedEndDate?: Date) => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            const start = selectedStartDate ?? startDate;
            const end = selectedEndDate ?? endDate;
            const rangeError = getRangeError(start, end);

            if (rangeError) {
                setError({ type: "empty", message: rangeError, canRetry: false });
                setEvents([]);
                return;
            }

            setLoading(true);
            setError(null);

            const data = await getDonkiEvents(formatDate(start), formatDate(end));

            if (!data || data.length === 0) {
                setEvents([]);
                setError(createEmptyDataError("donki"));
                return;
            }

            setEvents(data);
        } catch (e) {
            setEvents([]);
            setError(createApiError(e, "donki"));
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (hasInitialFetch.current) return;
        hasInitialFetch.current = true;
        fetchDonkiData();
    }, [fetchDonkiData]);

    const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate || !pickerTarget) return;

        if (pickerTarget === "start") {
            setStartDate(selectedDate);
            return;
        }

        setEndDate(selectedDate);
    };

    const handleApplyRange = () => {
        fetchDonkiData(startDate, endDate);
    };

    const handleRetry = () => {
        fetchDonkiData(startDate, endDate);
    };

    const handleOpenLink = async (url: string) => {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            }
        } catch (openError) {
            console.log("Impossible d'ouvrir le lien DONKI:", openError);
        }
    };

    const renderContent = () => {
        if (loading) {
            return <Loader />;
        }

        if (error) {
            return <ErrorDisplay error={error} onRetry={error.canRetry ? handleRetry : undefined} />;
        }

        return (
            <View style={styles.eventsContainer}>
                <Text style={styles.countText}>
                    {events.length} evenement(s)
                </Text>

                {events.map((event) => {
                    const sourceLabel = event.source ?? getShortSourceLabel(event.link);

                    return (
                        <Card key={event.id} style={styles.eventCard}>
                            <View style={styles.eventHeaderRow}>
                                <View style={styles.eventTypeBadge}>
                                    <Text style={styles.eventTypeBadgeText}>{event.type}</Text>
                                </View>
                                <Text style={styles.eventDate}>Le {formatIssueDate(event.date)}</Text>
                            </View>

                            <Title size="md" style={styles.eventTitle}>
                                {event.title}
                            </Title>

                            <Text style={styles.sectionLabel}>En bref</Text>
                            <Text style={styles.eventBrief}>{event.summary}</Text>

                            {sourceLabel ? (
                                <View style={styles.sourceRow}>
                                    <Text style={styles.sectionLabel}>Source</Text>
                                    <Text style={styles.eventSource}>{sourceLabel}</Text>
                                </View>
                            ) : null}

                            {event.link ? (
                                <PrimaryButton
                                    title="Voir plus"
                                    onPress={() => handleOpenLink(event.link as string)}
                                    style={styles.moreButton}
                                />
                            ) : null}
                        </Card>
                    );
                })}
            </View>
        );
    };

    const pickerValue = pickerTarget === "start" ? startDate : endDate;
    const pickerMinimumDate = pickerTarget === "end" ? startDate : undefined;
    const pickerMaximumDate = pickerTarget === "start" ? endDate : new Date();

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.container}>
                <Title size="lg" style={styles.title}>
                    NASA DONKI
                </Title>

                <Text style={styles.subtitle}>
                    Evenements recents de meteo spatiale
                </Text>

                <Card style={styles.rangeCard}>
                    <Text style={styles.rangeLabel}>Plage selectionnee</Text>
                    <Text style={styles.rangeValue}>Du {formatDisplayDate(startDate)}</Text>
                    <Text style={styles.rangeValue}>Au {formatDisplayDate(endDate)}</Text>
                    <Text style={styles.rangeHint}>Plage maximale: 7 jours</Text>
                </Card>

                <View style={styles.buttonsRow}>
                    <PrimaryButton
                        title="Date debut"
                        onPress={() => setPickerTarget("start")}
                        disabled={loading}
                        style={styles.halfButton}
                    />
                    <PrimaryButton
                        title="Date fin"
                        onPress={() => setPickerTarget("end")}
                        disabled={loading}
                        style={styles.halfButton}
                    />
                </View>

                {pickerTarget && (
                    <Card style={styles.pickerCard}>
                        <DateTimePicker
                            value={pickerValue}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={onChangeDate}
                            minimumDate={pickerMinimumDate}
                            maximumDate={pickerMaximumDate}
                            style={styles.picker}
                            textColor={theme.colors.textPrimary}
                            themeVariant="dark"
                        />

                        <PrimaryButton
                            title="Valider la date"
                            onPress={() => setPickerTarget(null)}
                            style={styles.validateButton}
                        />
                    </Card>
                )}

                <PrimaryButton
                    title="Charger les evenements"
                    onPress={handleApplyRange}
                    loading={loading}
                    disabled={pickerTarget !== null}
                    style={styles.loadButton}
                />

                {renderContent()}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.md,
        paddingBottom: 40,
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
    },
    rangeCard: {
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    rangeLabel: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    rangeValue: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        lineHeight: 22,
    },
    rangeHint: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: theme.spacing.xs,
    },
    buttonsRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    halfButton: {
        flex: 1,
    },
    pickerCard: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.sm,
    },
    picker: {
        width: "100%",
    },
    validateButton: {
        marginTop: theme.spacing.sm,
    },
    loadButton: {
        marginTop: theme.spacing.sm,
    },
    eventsContainer: {
        marginTop: theme.spacing.md,
    },
    countText: {
        color: theme.colors.textSecondary,
        textAlign: "center",
        marginBottom: theme.spacing.sm,
    },
    eventCard: {
        marginTop: theme.spacing.sm,
    },
    eventHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    eventTypeBadge: {
        backgroundColor: theme.colors.primary + "25",
        borderRadius: theme.radius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    eventTypeBadgeText: {
        color: theme.colors.textPrimary,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
    eventTitle: {
        textAlign: "left",
        marginBottom: theme.spacing.xs,
    },
    eventDate: {
        color: theme.colors.primary,
        fontSize: 12,
    },
    sectionLabel: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: theme.spacing.xs,
    },
    eventBrief: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        lineHeight: 21,
        fontWeight: "600",
        marginBottom: theme.spacing.sm,
    },
    sourceRow: {
        marginTop: theme.spacing.xs,
    },
    eventSource: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        fontWeight: "600",
        marginBottom: theme.spacing.xs,
    },
    moreButton: {
        marginTop: theme.spacing.sm,
    },
});


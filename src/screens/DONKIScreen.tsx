import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import ErrorDisplay from "../ui/components/ErrorDisplay";

import { DonkiEvent, getDonkiEvents } from "../services/nasa";
import { ApiError, createApiError, createEmptyDataError } from "../types/errors";
import { theme } from "../ui/theme";

const MAX_RANGE_DAYS = 7;
type PickerTarget = "start" | "end" | null;

const EVENT_TYPE_LABELS: Record<string, string> = {
    FLR: "Eruption solaire (FLR)",
    SEP: "Particules energetiques (SEP)",
    CME: "Ejection de masse coronale (CME)",
    IPS: "Choc interplanetaire (IPS)",
    MPC: "Passage magnetopause (MPC)",
    GST: "Tempete geomagnetique (GST)",
    RBE: "Ceinture de radiation (RBE)",
};

const EVENT_TYPE_HINTS: Record<string, string> = {
    FLR: "Emission de rayonnement solaire intense.",
    SEP: "Particules energetiques pouvant impacter les satellites.",
    CME: "Nuage plasma/magnetique ejecte par le Soleil.",
    IPS: "Onde de choc dans le milieu interplanetaire.",
    MPC: "Variation de la magnetopause terrestre.",
    GST: "Activite geomagnetique accrue autour de la Terre.",
    RBE: "Evolution de la ceinture de radiation terrestre.",
};

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

function getEventTypeLabel(type?: string): string {
    if (!type) return "Type inconnu";
    return EVENT_TYPE_LABELS[type] ?? type;
}

function getEventTypeHint(type?: string): string {
    if (!type) return "Classification non fournie par la NASA.";
    return EVENT_TYPE_HINTS[type] ?? "Evenement de meteo spatiale signale par la NASA.";
}

function getNormalizedSummary(value?: string): string {
    const fallback = "Aucun resume disponible pour cet evenement.";
    if (!value) return fallback;

    const normalized = value.trim().split(/\s+/).join(" ");
    if (!normalized) return fallback;

    const maxLength = 260;
    if (normalized.length <= maxLength) return normalized;

    return `${normalized.slice(0, maxLength)}...`;
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

    const [events, setEvents] = useState<DonkiEvent[]>([]);
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
                    const eventType = (event.messageType || "").toUpperCase();
                    const eventLabel = getEventTypeLabel(eventType);
                    const eventHint = getEventTypeHint(eventType);
                    const summary = getNormalizedSummary(event.messageBody);
                    const sourceLabel = getShortSourceLabel(event.messageURL);

                    return (
                        <Card key={`${event.messageID}-${event.messageIssueTime}`} style={styles.eventCard}>
                            <View style={styles.eventHeaderRow}>
                                <View style={styles.eventTypeBadge}>
                                    <Text style={styles.eventTypeBadgeText}>{eventType || "N/A"}</Text>
                                </View>
                                <Text style={styles.eventDate}>Le {formatIssueDate(event.messageIssueTime)}</Text>
                            </View>

                            <Title size="md" style={styles.eventTitle}>
                                {eventLabel}
                            </Title>

                            <Text style={styles.eventHint}>{eventHint}</Text>

                            <Text style={styles.sectionLabel}>Resume</Text>
                            <Text style={styles.eventDescription}>{summary}</Text>

                            {event.messageURL ? (
                                <View style={styles.sourceRow}>
                                    <Text style={styles.sectionLabel}>Source</Text>
                                    <Text style={styles.eventSource}>{sourceLabel}</Text>
                                    <Text style={styles.eventSourceUrl}>{event.messageURL}</Text>
                                </View>
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
    eventHint: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        marginBottom: theme.spacing.sm,
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
    eventDescription: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        lineHeight: 20,
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
    eventSourceUrl: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
});


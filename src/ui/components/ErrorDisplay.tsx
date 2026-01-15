import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Card from "./Card";
import PrimaryButton from "./PrimaryButton";
import { theme } from "../theme";
import { ApiError, ApiErrorType } from "../../types/errors";

type ErrorDisplayProps = {
    error: ApiError | string;
    onRetry?: () => void;
    style?: ViewStyle;
};

const ERROR_ICONS: Record<ApiErrorType, keyof typeof Ionicons.glyphMap> = {
    network: "cloud-offline",
    api: "server",
    empty: "search",
    unknown: "alert-circle",
};

const ERROR_COLORS: Record<ApiErrorType, string> = {
    network: theme.colors.error,
    api: theme.colors.error,
    empty: theme.colors.primary,
    unknown: theme.colors.error,
};

export default function ErrorDisplay({ error, onRetry, style }: ErrorDisplayProps) {
    // Support pour les erreurs simples (string) pour la rétrocompatibilité
    const apiError: ApiError = typeof error === "string"
        ? { type: "unknown", message: error, canRetry: true }
        : error;

    const iconName = ERROR_ICONS[apiError.type];
    const iconColor = ERROR_COLORS[apiError.type];
    const isEmptyState = apiError.type === "empty";

    const cardStyle: ViewStyle = {
        ...styles.container,
        backgroundColor: isEmptyState
            ? theme.colors.primary + "15"
            : theme.colors.error + "15",
        borderColor: isEmptyState
            ? theme.colors.primary + "30"
            : theme.colors.error + "30",
        ...(style || {}),
    };

    return (
        <Card style={cardStyle}>
            <View style={styles.content}>
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: iconColor + "20" }
                    ]}
                >
                    <Ionicons name={iconName} size={32} color={iconColor} />
                </View>

                <Text style={[styles.message, { color: isEmptyState ? theme.colors.textPrimary : theme.colors.error }]}>
                    {apiError.message}
                </Text>

                {apiError.canRetry && onRetry && (
                    <PrimaryButton
                        title="Réessayer"
                        onPress={onRetry}
                        style={styles.retryButton}
                    />
                )}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: theme.spacing.md,
        borderWidth: 1,
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        paddingVertical: theme.spacing.sm,
    },
    iconContainer: {
        borderRadius: 50,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    message: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: theme.spacing.sm,
    },
    retryButton: {
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
    },
});


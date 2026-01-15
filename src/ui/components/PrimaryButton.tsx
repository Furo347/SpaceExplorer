import React from "react";
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator, View } from "react-native";
import { theme } from "../theme";

type PrimaryButtonProps = TouchableOpacityProps & {
    title: string;
    loading?: boolean;
};

export default function PrimaryButton({ title, style, loading = false, disabled, ...props }: PrimaryButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isDisabled && styles.buttonDisabled,
                style
            ]}
            activeOpacity={0.7}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                    <Text style={[styles.text, styles.loadingText]}>{title}</Text>
                </View>
            ) : (
                <Text style={[styles.text, isDisabled && styles.textDisabled]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    text: {
        color: theme.colors.textPrimary,
        fontWeight: "bold",
        fontSize: 16,
    },
    textDisabled: {
        opacity: 0.8,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        marginLeft: theme.spacing.sm,
    },
});

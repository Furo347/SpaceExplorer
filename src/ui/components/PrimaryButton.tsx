import React from "react";
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from "react-native";
import { theme } from "../theme";

type PrimaryButtonProps = TouchableOpacityProps & {
    title: string;
};

export default function PrimaryButton({ title, style, ...props }: PrimaryButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.button, style]}
            activeOpacity={0.7}
            {...props}
        >
            <Text style={styles.text}>{title}</Text>
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
    },
    text: {
        color: theme.colors.textPrimary,
        fontWeight: "bold",
        fontSize: 16,
    },
});

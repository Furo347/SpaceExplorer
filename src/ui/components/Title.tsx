import React from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { theme } from "../theme";

type TitleProps = {
    children: React.ReactNode;
    size?: "sm" | "md" | "lg";
    style?: TextStyle;
};

export default function Title({ children, size = "md", style }: TitleProps) {
    return <Text style={[styles.base, styles[size], style]}>{children}</Text>;
}

const styles = StyleSheet.create({
    base: {
        color: theme.colors.textPrimary,
        fontWeight: "bold",
    },
    sm: {
        fontSize: 18,
    },
    md: {
        fontSize: 24,
    },
    lg: {
        fontSize: 32,
    },
});

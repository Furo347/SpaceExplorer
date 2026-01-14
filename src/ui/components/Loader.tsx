import React from "react";
import { View, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme";

type LoaderProps = {
    size?: number;
    color?: string;
    style?: ViewStyle;
};

export default function Loader({ size = 50, color = theme.colors.primary, style }: LoaderProps) {
    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        marginVertical: theme.spacing.lg,
    },
});

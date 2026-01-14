import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

type FavoriteButtonProps = {
    isFavorite: boolean;
    onPress: () => void;
    size?: number;
    style?: ViewStyle;
};

export default function FavoriteButton({
    isFavorite,
    onPress,
    size = 28,
    style,
}: FavoriteButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.button, style]}
            activeOpacity={0.7}
        >
            <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={size}
                color={isFavorite ? "#FF6B6B" : theme.colors.textSecondary}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
});


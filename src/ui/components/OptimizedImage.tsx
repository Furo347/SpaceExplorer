import React, { useState, useCallback } from "react";
import { Image, View, StyleSheet, ImageStyle, ActivityIndicator, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

type OptimizedImageProps = {
    uri: string;
    style?: ImageStyle;
    resizeMode?: "cover" | "contain" | "stretch" | "center";
};

export default function OptimizedImage({ uri, style, resizeMode = "cover" }: OptimizedImageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoadStart = useCallback(() => setLoading(true), []);
    const handleLoadEnd = useCallback(() => setLoading(false), []);
    const handleError = useCallback(() => {
        setLoading(false);
        setError(true);
    }, []);

    return (
        <View style={[styles.container, style]}>
            {loading && !error && (
                <View style={[styles.placeholder, style]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}

            {error ? (
                <View style={[styles.errorPlaceholder, style]}>
                    <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
                    <Text style={styles.errorText}>Image non disponible</Text>
                </View>
            ) : (
                <Image
                    source={{ uri }}
                    style={[styles.image, style, loading && styles.hidden]}
                    resizeMode={resizeMode}
                    onLoadStart={handleLoadStart}
                    onLoadEnd={handleLoadEnd}
                    onError={handleError}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    hidden: {
        opacity: 0,
    },
    placeholder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: theme.radius.md,
    },
    errorPlaceholder: {
        backgroundColor: theme.colors.surface,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
    },
    errorText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: theme.spacing.sm,
    },
});


import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export default function SplashScreenView() {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [fadeAnim, rotateAnim, pulseAnim]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["-10deg", "10deg"],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Icône de fusée animée */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        { transform: [{ rotate }] },
                    ]}
                >
                    <Ionicons name="rocket" size={80} color={theme.colors.primary} />
                </Animated.View>

                {/* Titre de l'application */}
                <Text style={styles.title}>SpaceExplorer</Text>
                <Text style={styles.subtitle}>Explorez l'univers</Text>

                {/* Indicateur de chargement */}
                <Animated.Text style={[styles.loading, { opacity: pulseAnim }]}>
                    Chargement...
                </Animated.Text>
            </Animated.View>

            {/* Étoiles décoratives */}
            <View style={styles.stars}>
                {[...Array(20)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.star,
                            {
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                width: Math.random() * 3 + 1,
                                height: Math.random() * 3 + 1,
                                opacity: Math.random() * 0.5 + 0.3,
                            },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        zIndex: 1,
    },
    iconContainer: {
        backgroundColor: theme.colors.primary + "20",
        borderRadius: 50,
        padding: 30,
        marginBottom: 24,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 8,
    },
    subtitle: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        marginBottom: 40,
    },
    loading: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    stars: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    star: {
        position: "absolute",
        backgroundColor: "#FFFFFF",
        borderRadius: 50,
    },
});


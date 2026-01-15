import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import { theme } from "../ui/theme";

const FEATURES = [
    {
        icon: "image" as const,
        title: "APOD",
        description: "Découvrez l'image astronomique du jour sélectionnée par la NASA.",
    },
    {
        icon: "planet" as const,
        title: "Mars Rover",
        description: "Explorez les photos prises par les rovers Curiosity, Opportunity et Spirit.",
    },
    {
        icon: "earth" as const,
        title: "EPIC",
        description: "Admirez la Terre depuis l'espace grâce au satellite DSCOVR.",
    },
    {
        icon: "star" as const,
        title: "Favoris",
        description: "Sauvegardez vos images préférées pour les retrouver facilement.",
    },
    {
        icon: "time" as const,
        title: "Historique",
        description: "Consultez l'historique de toutes les images que vous avez vues.",
    },
];

const TEAM = [
    { name: "Florentin Portets", role: "Développeur Full Stack" },
    { name: "NASA API", role: "Fournisseur de données" },
];

export default function AboutScreen() {
    return (
        <Screen>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Header */}
                <View style={{ alignItems: "center", marginBottom: 30 }}>
                    <Ionicons name="rocket" size={60} color={theme.colors.primary} />
                    <Title size="lg" style={{ textAlign: "center", marginTop: 15 }}>
                        SpaceExplorer
                    </Title>
                    <Text
                        style={{
                            color: theme.colors.textSecondary,
                            fontSize: 14,
                            textAlign: "center",
                            marginTop: 10,
                        }}
                    >
                        Version 1.0.0
                    </Text>
                </View>

                {/* Description */}
                <Card style={{ marginBottom: 20 }}>
                    <Title size="md" style={{ marginBottom: 10 }}>
                        À propos de l'application
                    </Title>
                    <Text
                        style={{
                            color: theme.colors.textPrimary,
                            fontSize: 15,
                            lineHeight: 22,
                        }}
                    >
                        SpaceExplorer est une application React Native / Expo qui vous permet
                        d'explorer l'univers grâce aux données publiques de la NASA. Découvrez
                        des images époustouflantes de l'espace, de Mars et de notre planète Terre.
                    </Text>
                </Card>

                {/* Fonctionnalités */}
                <Title size="md" style={{ marginBottom: 15 }}>
                    Fonctionnalités
                </Title>
                {FEATURES.map((feature, index) => (
                    <Card key={index} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View
                                style={{
                                    backgroundColor: theme.colors.primary + "20",
                                    borderRadius: theme.radius.md,
                                    padding: 12,
                                    marginRight: 15,
                                }}
                            >
                                <Ionicons name={feature.icon} size={24} color={theme.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: theme.colors.textPrimary,
                                        fontSize: 16,
                                        fontWeight: "bold",
                                        marginBottom: 4,
                                    }}
                                >
                                    {feature.title}
                                </Text>
                                <Text
                                    style={{
                                        color: theme.colors.textSecondary,
                                        fontSize: 13,
                                        lineHeight: 18,
                                    }}
                                >
                                    {feature.description}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))}

                {/* Équipe */}
                <Title size="md" style={{ marginTop: 20, marginBottom: 15 }}>
                    L'équipe
                </Title>
                <Card>
                    {TEAM.map((member, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 10,
                                borderBottomWidth: index < TEAM.length - 1 ? 1 : 0,
                                borderBottomColor: theme.colors.background,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    borderRadius: 20,
                                    width: 40,
                                    height: 40,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                                    {member.name.charAt(0)}
                                </Text>
                            </View>
                            <View>
                                <Text
                                    style={{
                                        color: theme.colors.textPrimary,
                                        fontSize: 15,
                                        fontWeight: "600",
                                    }}
                                >
                                    {member.name}
                                </Text>
                                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                                    {member.role}
                                </Text>
                            </View>
                        </View>
                    ))}
                </Card>

                {/* Credits */}
                <Text
                    style={{
                        color: theme.colors.textSecondary,
                        fontSize: 12,
                        textAlign: "center",
                        marginTop: theme.spacing.lg,
                    }}
                >
                    Données fournies par l'API NASA Open APIs
                </Text>
                <Text
                    style={{
                        color: theme.colors.textSecondary,
                        fontSize: 11,
                        textAlign: "center",
                        marginTop: theme.spacing.xs,
                    }}
                >
                    © 2024 SpaceExplorer - Tous droits réservés
                </Text>
            </ScrollView>
        </Screen>
    );
}


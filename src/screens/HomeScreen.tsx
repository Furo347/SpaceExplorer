import React from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import { theme } from "../ui/theme";
import { RootTabParamList } from "../navigation/AppNavigation";

type HomeNavigationProp = BottomTabNavigationProp<RootTabParamList>;

type FeatureRoute = "APOD" | "NeoWs" | "DONKI";
type QuickLinkRoute = "Favorites" | "History" | "About";

type FeatureItem = {
    screen: FeatureRoute;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    description: string;
    color: string;
};

type QuickLinkItem = {
    screen: QuickLinkRoute;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
};

const FEATURES: FeatureItem[] = [
    {
        screen: "APOD" as const,
        icon: "image" as const,
        title: "Image du Jour",
        subtitle: "APOD",
        description: "Découvrez chaque jour une nouvelle image astronomique sélectionnée par la NASA.",
        color: "#FF6B6B",
    },
    {
        screen: "NeoWs" as const,
        icon: "planet" as const,
        title: "Objets Proches",
        subtitle: "NeoWs",
        description: "Consultez les objets proches de la Terre detectes sur la date de votre choix.",
        color: "#FF9F43",
    },
    {
        screen: "DONKI" as const,
        icon: "flash" as const,
        title: "Météo spatiale",
        subtitle: "DONKI",
        description: "Suivez les notifications recentes de meteo spatiale diffusees par la NASA.",
        color: "#54A0FF",
    },
];

const QUICK_LINKS: QuickLinkItem[] = [
    { screen: "Favorites" as const, icon: "star" as const, label: "Favoris" },
    { screen: "History" as const, icon: "time" as const, label: "Historique" },
    { screen: "About" as const, icon: "information-circle" as const, label: "À propos" },
];

export default function HomeScreen() {
    const navigation = useNavigation<HomeNavigationProp>();

    return (
        <Screen>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                {/* Header */}
                <View style={{ alignItems: "center", marginBottom: 30, marginTop: 10 }}>
                    <View
                        style={{
                            backgroundColor: theme.colors.primary + "20",
                            borderRadius: 50,
                            padding: 20,
                            marginBottom: 15,
                        }}
                    >
                        <Ionicons name="rocket" size={50} color={theme.colors.primary} />
                    </View>
                    <Title size="lg" style={{ textAlign: "center" }}>
                        Bienvenue sur SpaceExplorer
                    </Title>
                    <Text
                        style={{
                            color: theme.colors.textSecondary,
                            fontSize: 15,
                            textAlign: "center",
                            marginTop: 10,
                            lineHeight: 22,
                        }}
                    >
                        Explorez l'univers avec les données officielles de la NASA
                    </Text>
                </View>

                {/* Feature Cards */}
                <Title size="md" style={{ marginBottom: 15 }}>
                    Explorer
                </Title>
                {FEATURES.map((feature) => (
                    <TouchableOpacity
                        key={feature.screen}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(feature.screen as never)}
                    >
                        <Card style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                    style={{
                                        backgroundColor: feature.color + "20",
                                        borderRadius: theme.radius.md,
                                        padding: 15,
                                        marginRight: 15,
                                    }}
                                >
                                    <Ionicons name={feature.icon} size={30} color={feature.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                                        <Text
                                            style={{
                                                color: theme.colors.textPrimary,
                                                fontSize: 18,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {feature.title}
                                        </Text>
                                        <View
                                            style={{
                                                backgroundColor: feature.color + "30",
                                                borderRadius: 6,
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                marginLeft: 10,
                                            }}
                                        >
                                            <Text style={{ color: feature.color, fontSize: 11, fontWeight: "600" }}>
                                                {feature.subtitle}
                                            </Text>
                                        </View>
                                    </View>
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
                                <Ionicons
                                    name="chevron-forward"
                                    size={24}
                                    color={theme.colors.textSecondary}
                                    style={{ marginLeft: 10 }}
                                />
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}

                {/* Quick Links */}
                <Title size="md" style={{ marginTop: 10, marginBottom: 15 }}>
                    Accès rapide
                </Title>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {QUICK_LINKS.map((link) => (
                        <TouchableOpacity
                            key={link.screen}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(link.screen as never)}
                            style={{ flex: 1, marginHorizontal: 5 }}
                        >
                            <Card style={{ alignItems: "center", paddingVertical: 20 }}>
                                <Ionicons name={link.icon} size={28} color={theme.colors.primary} />
                                <Text
                                    style={{
                                        color: theme.colors.textPrimary,
                                        fontSize: 12,
                                        fontWeight: "600",
                                        marginTop: 8,
                                    }}
                                >
                                    {link.label}
                                </Text>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Box */}
                <Card
                    style={{
                        marginTop: theme.spacing.lg,
                        backgroundColor: theme.colors.primary + "15",
                        borderWidth: 1,
                        borderColor: theme.colors.primary + "30",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 13,
                                marginLeft: theme.spacing.sm,
                                flex: 1,
                                lineHeight: 18,
                            }}
                        >
                            Toutes les images et données proviennent de l'API officielle de la NASA.
                        </Text>
                    </View>
                </Card>
            </ScrollView>
        </Screen>
    );
}


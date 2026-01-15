import React, { useCallback } from "react";
import { View, Text, Image, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../ui/components/Screen";
import Title from "../ui/components/Title";
import Card from "../ui/components/Card";
import PrimaryButton from "../ui/components/PrimaryButton";
import Loader from "../ui/components/Loader";
import FavoriteButton from "../ui/components/FavoriteButton";

import { useHistory } from "../hooks/useHistory";
import { useFavorites } from "../hooks/useFavorites";
import { theme } from "../ui/theme";
import { HistoryItem } from "../types/storage";

const SOURCE_LABELS: Record<string, string> = {
    apod: "APOD",
    mars: "Mars Rover",
    epic: "EPIC",
};

export default function HistoryScreen() {
    const { history, loading, clearHistory, refreshHistory } = useHistory();
    const { isFavorite, toggleFavorite, refreshFavorites } = useFavorites();

    // Refresh data when screen is focused
    useFocusEffect(
        useCallback(() => {
            refreshHistory();
            refreshFavorites();
        }, [refreshHistory, refreshFavorites])
    );

    const handleClearAll = () => {
        Alert.alert(
            "Effacer l'historique",
            "Êtes-vous sûr de vouloir effacer tout l'historique ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Effacer",
                    style: "destructive",
                    onPress: clearHistory,
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderHistoryCard = (item: HistoryItem) => (
        <Card key={item.id} style={{ marginTop: 15 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                    <Title size="md" style={{ marginBottom: 5 }}>
                        {item.title}
                    </Title>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                        {SOURCE_LABELS[item.source]} • {formatDate(item.date)}
                    </Text>
                </View>
                <FavoriteButton
                    isFavorite={isFavorite(item.id)}
                    onPress={() => toggleFavorite(item)}
                    size={24}
                />
            </View>

            <Image
                source={{ uri: item.imageUrl }}
                style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 10,
                    marginBottom: 10,
                }}
                resizeMode="cover"
            />

            {item.description && (
                <Text
                    style={{
                        color: theme.colors.textPrimary,
                        fontSize: 14,
                        lineHeight: 20,
                    }}
                    numberOfLines={3}
                >
                    {item.description}
                </Text>
            )}

            <Text
                style={{
                    color: theme.colors.textSecondary,
                    fontSize: 11,
                    marginTop: 8,
                }}
            >
                Consulté le {formatDate(item.viewedAt)} à {formatTime(item.viewedAt)}
            </Text>
        </Card>
    );

    if (loading) {
        return (
            <Screen>
                <Loader />
            </Screen>
        );
    }

    return (
        <Screen style={{ padding: 0 }}>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
                <Title size="lg" style={{ textAlign: "center", marginBottom: theme.spacing.md }}>
                    Historique
                </Title>

                {history.length > 0 && (
                    <PrimaryButton
                        title="Effacer l'historique"
                        onPress={handleClearAll}
                        style={{
                            backgroundColor: theme.colors.error,
                            marginBottom: theme.spacing.sm,
                        }}
                    />
                )}

                {history.length === 0 ? (
                    <Card style={{ marginTop: theme.spacing.lg, alignItems: "center", paddingVertical: theme.spacing.xl }}>
                        <View style={{
                            backgroundColor: theme.colors.primary + "20",
                            borderRadius: 50,
                            padding: theme.spacing.md,
                            marginBottom: theme.spacing.md
                        }}>
                            <Ionicons name="time-outline" size={48} color={theme.colors.primary} />
                        </View>
                        <Title size="md" style={{ marginBottom: theme.spacing.sm, textAlign: "center" }}>
                            Aucun historique
                        </Title>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 14,
                                textAlign: "center",
                                lineHeight: 20,
                            }}
                        >
                            Les images que vous consultez{"\n"}apparaîtront ici.
                        </Text>
                    </Card>
                ) : (
                    <>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                textAlign: "center",
                                marginBottom: theme.spacing.sm,
                            }}
                        >
                            {history.length} image{history.length > 1 ? "s" : ""} consultée{history.length > 1 ? "s" : ""}
                        </Text>
                        {history.map(renderHistoryCard)}
                    </>
                )}
            </ScrollView>
        </Screen>
    );
}


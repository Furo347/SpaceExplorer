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

import { useFavorites } from "../hooks/useFavorites";
import { theme } from "../ui/theme";
import { FavoriteItem } from "../types/storage";

const SOURCE_LABELS: Record<string, string> = {
    apod: "APOD",
    mars: "Mars Rover",
    epic: "EPIC",
};

export default function FavoritesScreen() {
    const { favorites, loading, removeFavorite, clearFavorites, refreshFavorites } = useFavorites();

    // Refresh favorites when screen is focused
    useFocusEffect(
        useCallback(() => {
            refreshFavorites();
        }, [refreshFavorites])
    );

    const handleClearAll = () => {
        Alert.alert(
            "Supprimer tous les favoris",
            "Êtes-vous sûr de vouloir supprimer tous vos favoris ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: clearFavorites,
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

    const renderFavoriteCard = (item: FavoriteItem) => (
        <Card key={item.id} style={{ marginTop: theme.spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                    <Title size="md" style={{ marginBottom: theme.spacing.xs }}>
                        {item.title}
                    </Title>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                        {SOURCE_LABELS[item.source]} • {formatDate(item.date)}
                    </Text>
                </View>
                <FavoriteButton
                    isFavorite={true}
                    onPress={() => removeFavorite(item.id)}
                    size={24}
                />
            </View>

            <Image
                source={{ uri: item.imageUrl }}
                style={{
                    width: "100%",
                    height: 200,
                    borderRadius: theme.radius.md,
                    marginBottom: theme.spacing.sm,
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
                    marginTop: theme.spacing.sm,
                }}
            >
                Ajouté le {formatDate(item.addedAt)}
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
                    Mes Favoris
                </Title>

                {favorites.length > 0 && (
                    <PrimaryButton
                        title="Tout supprimer"
                        onPress={handleClearAll}
                        style={{
                            backgroundColor: theme.colors.error,
                            marginBottom: theme.spacing.sm,
                        }}
                    />
                )}

                {favorites.length === 0 ? (
                    <Card style={{ marginTop: theme.spacing.lg, alignItems: "center", paddingVertical: theme.spacing.xl }}>
                        <View style={{
                            backgroundColor: theme.colors.primary + "20",
                            borderRadius: 50,
                            padding: theme.spacing.md,
                            marginBottom: theme.spacing.md
                        }}>
                            <Ionicons name="heart-outline" size={48} color={theme.colors.primary} />
                        </View>
                        <Title size="md" style={{ marginBottom: theme.spacing.sm, textAlign: "center" }}>
                            Aucun favori
                        </Title>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 14,
                                textAlign: "center",
                                lineHeight: 20,
                            }}
                        >
                            Appuyez sur le cœur ❤️ sur une image{"\n"}pour l'ajouter à vos favoris.
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
                            {favorites.length} favori{favorites.length > 1 ? "s" : ""}
                        </Text>
                        {favorites.map(renderFavoriteCard)}
                    </>
                )}
            </ScrollView>
        </Screen>
    );
}


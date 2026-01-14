import React, { useCallback } from "react";
import { View, Text, Image, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

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
        <Screen>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <Title size="lg" style={{ textAlign: "center", marginBottom: 20 }}>
                    Mes Favoris
                </Title>

                {favorites.length > 0 && (
                    <PrimaryButton
                        title="Tout supprimer"
                        onPress={handleClearAll}
                        style={{
                            backgroundColor: theme.colors.error,
                            marginBottom: 10,
                        }}
                    />
                )}

                {favorites.length === 0 ? (
                    <View style={{ alignItems: "center", marginTop: 50 }}>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 16,
                                textAlign: "center",
                            }}
                        >
                            Aucun favori pour le moment.
                        </Text>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                fontSize: 14,
                                textAlign: "center",
                                marginTop: 10,
                            }}
                        >
                            Appuyez sur le cœur ❤️ sur une image pour l'ajouter à vos favoris.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                textAlign: "center",
                                marginBottom: 10,
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


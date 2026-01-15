import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import AppNavigation from "./src/navigation/AppNavigation";
import { FavoritesProvider } from "./src/hooks/useFavorites";
import SplashScreenView from "./src/ui/components/SplashScreenView";

// Empêcher le splash screen natif de se cacher automatiquement
// On le cachera manuellement une fois l'app prête
SplashScreen.preventAutoHideAsync();

export default function App() {
    // État pour suivre si l'application est prête
    const [appIsReady, setAppIsReady] = useState(false);
    // État pour contrôler l'affichage du splash animé
    const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

    useEffect(() => {
        async function prepare() {
            try {
                // Cacher le splash natif immédiatement pour montrer notre splash animé
                await SplashScreen.hideAsync();

                // Simuler le chargement des ressources (fonts, données initiales, etc.)
                // Dans une vraie app, on chargerait ici :
                // - Les fonts avec Font.loadAsync()
                // - Les données du stockage local
                // - Toute autre initialisation nécessaire

                // Délai pour montrer le splash animé (minimum pour une bonne UX)
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (e) {
                console.warn("Erreur lors de l'initialisation:", e);
            } finally {
                // Marquer l'app comme prête
                setAppIsReady(true);
                // Petit délai avant de cacher le splash animé pour une transition fluide
                setTimeout(() => setShowAnimatedSplash(false), 300);
            }
        }

        prepare();
    }, []);

    // Afficher le splash animé pendant le chargement
    if (showAnimatedSplash) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <SplashScreenView />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* StatusBar en mode clair pour le thème sombre */}
            <StatusBar style="light" />
            <FavoritesProvider>
                <AppNavigation />
            </FavoritesProvider>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Couleur de fond identique au splash pour transition fluide
        backgroundColor: "#0B0D17",
    },
});



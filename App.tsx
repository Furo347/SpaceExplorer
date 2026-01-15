import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import AppNavigation from "./src/navigation/AppNavigation";
import { FavoritesProvider } from "./src/hooks/useFavorites";
import SplashScreenView from "./src/ui/components/SplashScreenView";

SplashScreen.preventAutoHideAsync();

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

    useEffect(() => {
        async function prepare() {
            try {
                await SplashScreen.hideAsync();

                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (e) {
                console.warn("Erreur lors de l'initialisation:", e);
            } finally {
                setAppIsReady(true);
                setTimeout(() => setShowAnimatedSplash(false), 300);
            }
        }

        prepare();
    }, []);

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
        backgroundColor: "#0B0D17",
    },
});



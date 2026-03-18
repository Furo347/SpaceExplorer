import React from "react";
import { NavigationContainer, DefaultTheme, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import APODScreen from "../screens/APODScreen";
import NeoWsScreen from "../screens/NeoWsScreen";
import DONKIScreen from "../screens/DONKIScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AboutScreen from "../screens/AboutScreen";
import { theme } from "../ui/theme";

const SpaceExplorerTheme: Theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.surface,
        notification: theme.colors.primary,
    },
};

export type RootTabParamList = {
    Home: undefined;
    APOD: undefined;
    NeoWs: undefined;
    DONKI: undefined;
    Favorites: undefined;
    History: undefined;
    About: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
    Home: "home",
    APOD: "image",
    NeoWs: "planet",
    DONKI: "flash",
    Favorites: "star",
    History: "time",
    About: "information-circle",
};

export default function AppNavigation() {
    return (
        <NavigationContainer theme={SpaceExplorerTheme}>
            <Tab.Navigator
                id="main-tabs"
                screenOptions={({ route }) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerTintColor: theme.colors.textPrimary,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textSecondary,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        backgroundColor: theme.colors.surface,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.background,
                        height: Platform.OS === "ios" ? 85 : 60,
                        paddingTop: theme.spacing.sm,
                        paddingBottom: Platform.OS === "ios" ? 25 : theme.spacing.sm,
                    },
                    tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size + 2} color={color} />,
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Accueil" }} />
                <Tab.Screen name="APOD" component={APODScreen} options={{ title: "Image du jour" }} />
                <Tab.Screen name="NeoWs" component={NeoWsScreen} options={{ title: "NeoWs" }} />
                <Tab.Screen name="DONKI" component={DONKIScreen} options={{ title: "DONKI" }} />
                <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favoris" }} />
                <Tab.Screen name="History" component={HistoryScreen} options={{ title: "Historique" }} />
                <Tab.Screen name="About" component={AboutScreen} options={{ title: "À propos" }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

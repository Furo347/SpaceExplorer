import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import APODScreen from "../screens/APODScreen";
import MarsRoverScreen from "../screens/MarsScreen";
import EPICScreen from "../screens/EPICScreen";
import AboutScreen from "../screens/AboutScreen";
import { theme } from "../ui/theme";

export type RootTabParamList = {
    APOD: undefined;
    MarsRover: undefined;
    EPIC: undefined;
    About: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigation() {
    return (
        <NavigationContainer theme={DefaultTheme}>
            <Tab.Navigator
                id="main-tabs"
                screenOptions={({ route }) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerTintColor: theme.colors.textPrimary,
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textSecondary,
                    tabBarStyle: {
                        backgroundColor: theme.colors.background,
                        borderTopWidth: 0,
                        height: Platform.OS === "ios" ? 90 : 60,
                        paddingBottom: 10,
                    },
                    tabBarIcon: ({ color, size }) => {
                        let iconName: keyof typeof Ionicons.glyphMap = "home";

                        if (route.name === "APOD") iconName = "image";
                        else if (route.name === "MarsRover") iconName = "planet";
                        else if (route.name === "EPIC") iconName = "earth";
                        else if (route.name === "About") iconName = "information-circle";

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="APOD" component={APODScreen} options={{ title: "Image du jour" }} />
                <Tab.Screen name="MarsRover" component={MarsRoverScreen} options={{ title: "Rover Mars" }} />
                <Tab.Screen name="EPIC" component={EPICScreen} options={{ title: "EPIC Terre" }} />
                <Tab.Screen name="About" component={AboutScreen} options={{ title: "À propos" }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

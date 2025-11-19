import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import APODScreen from "../screens/APODScreen";
import AboutScreen from "../screens/AboutScreen";

export type RootTabParamList = {
    APOD: undefined;
    About: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigation() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                id="main-tabs"
                screenOptions={{
                    headerShown: true,
                    tabBarActiveTintColor: "#4f8cff",
                    tabBarStyle: { backgroundColor: "#111" },
                    headerStyle: { backgroundColor: "#000" },
                    headerTintColor: "#fff",
                }}
            >
                <Tab.Screen name="APOD" component={APODScreen} options={{ title: "Image du jour" }} />
                <Tab.Screen name="About" component={AboutScreen} options={{ title: "À propos" }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

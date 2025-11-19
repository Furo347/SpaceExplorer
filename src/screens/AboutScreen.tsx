import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>SpaceExplorer</Text>
            <Text>Application React Native (Expo) utilisant l'API publique de la NASA.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});

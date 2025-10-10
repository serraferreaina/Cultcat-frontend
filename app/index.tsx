// app/welcome.tsx
import { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Welcome() {
  const router = useRouter();

  const goNext = () => {
    // Canvia això si vols passar primer pel login:
    // router.replace("/(auth)/login");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.brandTop}>CultCat.  </Text>
        <Text style={styles.tagline}>Culturitza’t.</Text>

        <Image source={require("../assets/cultcat-logo.png")} style={styles.logo} resizeMode="contain"/>
       
        <Pressable onPress={goNext} accessibilityRole="button" accessibilityLabel="Comença">
          <Ionicons name="arrow-forward-circle" size={80} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const BG = "#F7F0E2";     // beige suau del mockup
const TEXT = "#311C0C";   // marró fosc suau
const ACCENT = "#C86A2E"; // taronja marca

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  brandTop: { fontSize: 50, fontWeight: "900", color: ACCENT, textAlign: "left", marginTop: 6, paddingTop: 20 },
  tagline: { fontSize: 30, color: TEXT, textAlign: "right"},
  logoWrap: { width: "90%", aspectRatio: 1, alignSelf: "center", justifyContent: "center" },
  logo: { width: "70%", height: "70%" },
  color: { color: ACCENT},
});

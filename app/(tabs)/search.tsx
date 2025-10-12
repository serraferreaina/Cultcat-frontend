// app/(tabs)/cerca.tsx  (exemple)
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ScrollView } from 'react-native';
import SearchBar from '../../components/SearchBar';

export default function CercaScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView style={styles.content}>
        <SearchBar />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E2',
  },
  content: {
    paddingTop: 8,
  },
});

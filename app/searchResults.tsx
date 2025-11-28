import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EventCard } from '../components/EventCard2';
import { useEventStatus } from '../context/EventStatus';
import { LightColors, DarkColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { UserCard } from '../components/UserCard';

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string }>();
  const initialQuery = typeof params.query === 'string' ? params.query : '';
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'events' | 'users'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/events?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const textData = await res.text();
      const data = textData ? JSON.parse(textData) : [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'There was a problem fetching events.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/users/?username=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'There was a problem fetching users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchEvents(query);
    fetchUsers(query);
  };

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery);
  }, [initialQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8, marginRight: 16 }}>
          <TextInput
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            placeholder={t('Search')}
            style={[styles.searchInput, { borderColor: Colors.accent, color: Colors.text }]}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Tab selector */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: searchType === 'events' ? Colors.accent : Colors.card },
          ]}
          onPress={() => setSearchType('events')}
        >
          <Text
            style={{
              color: searchType === 'events' ? Colors.card : Colors.text,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {t('Events')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            { backgroundColor: searchType === 'users' ? Colors.accent : Colors.card },
          ]}
          onPress={() => setSearchType('users')}
        >
          <Text
            style={{
              color: searchType === 'users' ? Colors.card : Colors.text,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {t('Users')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : searchType === 'events' ? (
        events.length === 0 ? (
          <Text style={styles.noResultsText}>{t('No events to display')}</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <EventCard
                item={item}
                toggleGoing={toggleGoing}
                toggleSaved={toggleSaved}
                goingEvents={goingEvents}
                savedEvents={savedEvents}
                router={router}
                Colors={Colors}
              />
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )
      ) : users.length === 0 ? (
        <Text style={styles.noResultsText}>{t('No users to display')}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <UserCard user={item} onPress={() => router.push(`/user/${item.username}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: { paddingRight: 10, justifyContent: 'center' },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  tabsContainer: { flexDirection: 'row', marginVertical: 8 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  noResultsText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});

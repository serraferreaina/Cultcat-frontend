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
  const [loadingMore, setLoadingMore] = useState(false);

  const BATCH_SIZE = 25;
  const [eventOffset, setEventOffset] = useState(0);
  const [userOffset, setUserOffset] = useState(0);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  const shouldHideEvent = (event: any): boolean => {
    // Hide test/dummy events with year 2924
    if (event.data_fi) {
      const endDate = new Date(event.data_fi);
      const targetDate = new Date('2924-06-30');

      if (
        endDate.getFullYear() === targetDate.getFullYear() &&
        endDate.getMonth() === targetDate.getMonth() &&
        endDate.getDate() === targetDate.getDate()
      ) {
        return true;
      }
    }

    // Hide events with years beyond 2030
    if (event.data_inici) {
      const startDate = new Date(event.data_inici);
      if (startDate.getFullYear() > 2030) {
        return true;
      }
    }

    if (event.data_fi) {
      const endDate = new Date(event.data_fi);
      if (endDate.getFullYear() > 2030) {
        return true;
      }
    }

    return false;
  };

  const fetchEvents = async (query: string, isLoadingMore = false) => {
    if (!query.trim()) return;

    if (!isLoadingMore) {
      setLoading(true);
      setEventOffset(0);
      setHasMoreEvents(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const offset = isLoadingMore ? eventOffset : 0;
      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/events?q=${encodeURIComponent(query)}&from_date=${today}&order_by_date=asc&batch_size=${BATCH_SIZE}&offset=${offset}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const textData = await res.text();
      const responseData = textData ? JSON.parse(textData) : {};

      // Handle both array and object with results property
      let data = responseData.results || responseData || [];

      const filteredData = Array.isArray(data)
        ? data.filter((event: any) => !shouldHideEvent(event))
        : [];

      if (isLoadingMore) {
        setEvents((prev) => {
          const map = new Map<number, any>();
          prev.forEach((evt: any) => map.set(evt.id, evt));
          filteredData.forEach((evt: any) => map.set(evt.id, evt));
          return Array.from(map.values());
        });
      } else {
        setEvents(filteredData);
      }

      // Use API's pagination metadata
      if (responseData.next_offset !== undefined) {
        setEventOffset(responseData.next_offset);
      } else {
        setEventOffset(offset + BATCH_SIZE);
      }

      if (responseData.has_more !== undefined) {
        setHasMoreEvents(responseData.has_more);
      } else {
        setHasMoreEvents(filteredData.length >= BATCH_SIZE);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), t('There was a problem fetching events'));
      if (!isLoadingMore) {
        setEvents([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchUsers = async (query: string, isLoadingMore = false) => {
    if (!query.trim()) return;

    if (!isLoadingMore) {
      setLoading(true);
      setUserOffset(0);
      setHasMoreUsers(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = isLoadingMore ? userOffset : 0;
      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/users?username=${encodeURIComponent(query)}&batch_size=${BATCH_SIZE}&offset=${offset}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const textData = await res.text();
      const responseData = textData ? JSON.parse(textData) : {};

      // Handle both array and object with results property
      let data = responseData.results || responseData || [];

      const userData = Array.isArray(data) ? data : [];

      if (isLoadingMore) {
        setUsers((prev) => {
          const map = new Map<string, any>();
          prev.forEach((user: any) => map.set(user.id || user.username, user));
          userData.forEach((user: any) => map.set(user.id || user.username, user));
          return Array.from(map.values());
        });
      } else {
        setUsers(userData);
      }

      // Use API's pagination metadata
      if (responseData.next_offset !== undefined) {
        setUserOffset(responseData.next_offset);
      } else {
        setUserOffset(offset + BATCH_SIZE);
      }

      if (responseData.has_more !== undefined) {
        setHasMoreUsers(responseData.has_more);
      } else {
        setHasMoreUsers(userData.length >= BATCH_SIZE);
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), t('There was a problem fetching users'));
      if (!isLoadingMore) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchEvents(query);
    fetchUsers(query);
  };

  const handleLoadMoreEvents = () => {
    if (!loadingMore && hasMoreEvents && searchQuery) {
      fetchEvents(searchQuery, true);
    }
  };

  const handleLoadMoreUsers = () => {
    if (!loadingMore && hasMoreUsers && searchQuery) {
      fetchUsers(searchQuery, true);
    }
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
            placeholderTextColor={Colors.textSecondary}
            style={[
              styles.searchInput,
              {
                borderColor: Colors.accent,
                color: Colors.text,
                backgroundColor: Colors.card,
              },
            ]}
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
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
      ) : searchType === 'events' ? (
        events.length === 0 ? (
          <Text style={[styles.noResultsText, { color: Colors.textSecondary }]}>
            {t('No events to display')}
          </Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <EventCard item={item} router={router} Colors={Colors} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            onEndReached={handleLoadMoreEvents}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore && searchType === 'events' ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.accent}
                  style={{ marginVertical: 10 }}
                />
              ) : null
            }
          />
        )
      ) : users.length === 0 ? (
        <Text style={[styles.noResultsText, { color: Colors.textSecondary }]}>
          {t('No users to display')}
        </Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <UserCard user={item} onPress={() => router.push(`/user/${item.id}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={handleLoadMoreUsers}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore && searchType === 'users' ? (
              <ActivityIndicator
                size="small"
                color={Colors.accent}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
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

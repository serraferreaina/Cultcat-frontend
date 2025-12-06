// app/xat/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import ChatListItem from '../../components/ChatListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function ChatList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: substituir per crida real: GET /chats
    setTimeout(() => {
      setChats([
        { id: 1, username: 'maria', lastMessage: 'Hola! Com va?', profile: null },
        { id: 2, username: 'joan23', lastMessage: 'Quedem avui?', profile: null },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.card} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text }}>Xats</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: `/xat/${item.id}`,
                params: {
                  username: item.username,
                  profilePicture: item.profile,
                },
              })
            }
          >
            <ChatListItem chat={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
      />
    </SafeAreaView>
  );
}

// app/xat/group/members/[id].tsx
import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Member {
  id: number;
  username: string;
  avatar: string | null;
}

export default function GroupMembersScreen() {
  const { groupName } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const name = Array.isArray(groupName) ? groupName[0] : groupName || 'Membres del grup';

  // TODO: substituir per GET /groups/:id/members
  const members: Member[] = [
    { id: 1, username: 'Anna', avatar: null },
    { id: 2, username: 'Pau', avatar: null },
    { id: 3, username: 'Júlia', avatar: null },
  ];

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: {
      marginLeft: 12,
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: '#ccc',
    },
    name: {
      fontSize: 16,
      color: Colors.text,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image
              source={
                item.avatar ? { uri: item.avatar } : require('../../../../assets/foto_perfil1.jpg')
              }
              style={styles.avatar}
            />
            <Text style={styles.name}>{item.username}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

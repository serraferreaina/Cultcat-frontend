import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [selectedValue, setSelectedValue] = useState('paraTi');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const options = [
    { label: 'Para ti', value: 'paraTi' },
    { label: 'Siguiendo', value: 'siguiendo' },
  ];

  const handleBellPress = () => setUnreadCount(0);

  const toggleDropdown = () => {
    if (selectedValue == 'siguiendo') {
      setSelectedValue('paraTi');
    } else {
      setDropdownVisible(!dropdownVisible);
    }
  };

  const dropdownOptions = options.filter((o) => o.value !== selectedValue);

  const displayLabel =
    selectedValue === 'siguiendo'
      ? `< ${options.find((o) => o.value === selectedValue)?.label}`
      : options.find((o) => o.value === selectedValue)?.label;

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    setDropdownVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
          <Text style={[styles.title, { color: Colors.text }]}>{displayLabel}</Text>
          {selectedValue !== 'siguiendo' && (
            <Ionicons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.text}
            />
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleBellPress} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: Colors.accentHover }]}>
                <Text style={[styles.badgeText, { color: Colors.text }]}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {dropdownVisible && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: Colors.background, borderColor: Colors.text },
          ]}
        >
          {dropdownOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropdownItem}
              onPress={() => handleSelect(option.value)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {option.value === 'siguiendo' && (
                  <Ionicons name="people-outline" size={18} color={Colors.text} />
                )}
                <Text style={{ color: Colors.text }}>{option.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: { fontSize: 20, fontWeight: '700' },
  iconButton: { padding: 6 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  dropdown: {
    position: 'absolute',
    top: 100,
    left: 20,
    width: 120,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 999,
  },
  dropdownItem: {
    padding: 10,
  },
});

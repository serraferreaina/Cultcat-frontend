import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface WeatherStation {
  id: number;
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  reading_date: string;
  temperature: number;
  temperature_unit: string;
  relative_humidity: number;
  relative_humidity_unit: string;
  wind_speed: number;
  wind_speed_unit: string;
  wind_direction: number;
  wind_direction_unit: string;
  precipitation: number;
  precipitation_unit: string;
  min_temperature: number;
  min_temp_data: string;
  max_temperature: number;
  max_temp_data: string;
}

interface WeatherIconProps {
  latitude: number;
  longitude: number;
  compact?: boolean;
}

// Funció per calcular la distància entre dues coordenades (fórmula de Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radi de la Terra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Funció per obtenir la icona segons les condicions meteorològiques
const getWeatherIcon = (
  temp: number,
  precipitation: number,
  humidity: number,
): 'rainy' | 'cloudy' | 'sunny' | 'snow' | 'partly-sunny' => {
  if (precipitation > 0) {
    return 'rainy';
  } else if (humidity > 80) {
    return 'cloudy';
  } else if (temp > 25) {
    return 'sunny';
  } else if (temp < 10) {
    return 'snow';
  } else {
    return 'partly-sunny';
  }
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ latitude, longitude, compact = false }) => {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [weather, setWeather] = useState<WeatherStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('http://nattech.fib.upc.edu:40450/api/weather_map/');
        if (!res.ok) throw new Error('Error fetching weather');

        const stations: WeatherStation[] = await res.json();

        // Trobar l'estació més propera
        let closestStation: WeatherStation | null = null;
        let minDistance = Infinity;

        stations.forEach((station) => {
          const distance = calculateDistance(
            latitude,
            longitude,
            station.latitude,
            station.longitude,
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestStation = station;
          }
        });

        if (closestStation) {
          setWeather(closestStation);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchWeather();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [latitude, longitude]);

  if (loading) {
    return compact ? (
      <View style={styles.compactContainer}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    ) : (
      <View style={[styles.weatherContainer, { backgroundColor: Colors.card }]}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  if (error || !weather) {
    return null;
  }

  const iconName = getWeatherIcon(
    weather.temperature,
    weather.precipitation,
    weather.relative_humidity,
  );

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: Colors.card }]}>
        <Ionicons name={iconName} size={12} color={Colors.accent} />
        <Text style={[styles.compactTemp, { color: Colors.text }]}>
          {Math.round(weather.temperature)}°
        </Text>
      </View>
    );
  }

  // Vista expandible
  return (
    <TouchableOpacity
      style={[styles.weatherContainer, { backgroundColor: Colors.card }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      {/* Vista compacta - siempre visible */}
      <View style={styles.weatherHeader}>
        <Ionicons name={iconName} size={24} color={Colors.accent} />
        <Text style={[styles.temperature, { color: Colors.text }]}>
          {Math.round(weather.temperature)}°
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textSecondary}
          style={{ marginLeft: 'auto' }}
        />
      </View>

      {/* Detalles expandidos */}
      {expanded && (
        <View style={styles.weatherDetails}>
          <View style={styles.weatherRow}>
            <Ionicons name="water-outline" size={14} color={Colors.textSecondary} />
            <Text style={[styles.detailText, { color: Colors.textSecondary }]}>
              Humitat: {Math.round(weather.relative_humidity)}%
            </Text>
          </View>

          {weather.precipitation > 0 && (
            <View style={styles.weatherRow}>
              <Ionicons name="rainy-outline" size={14} color={Colors.textSecondary} />
              <Text style={[styles.detailText, { color: Colors.textSecondary }]}>
                Precipitació: {weather.precipitation} {weather.precipitation_unit}
              </Text>
            </View>
          )}

          <View style={styles.weatherRow}>
            <Ionicons name="navigate-outline" size={14} color={Colors.textSecondary} />
            <Text style={[styles.detailText, { color: Colors.textSecondary }]}>
              Vent: {Math.round(weather.wind_speed)} {weather.wind_speed_unit}
            </Text>
          </View>

          <View style={styles.weatherRow}>
            <Ionicons name="thermometer-outline" size={14} color={Colors.textSecondary} />
            <Text style={[styles.detailText, { color: Colors.textSecondary }]}>
              Min: {Math.round(weather.min_temperature)}° / Max:{' '}
              {Math.round(weather.max_temperature)}°
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  compactTemp: {
    fontSize: 10,
    fontWeight: '600',
  },
  weatherContainer: {
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temperature: {
    fontSize: 20,
    fontWeight: '700',
  },
  weatherDetails: {
    marginTop: 12,
    gap: 8,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
  },
});

export default WeatherIcon;

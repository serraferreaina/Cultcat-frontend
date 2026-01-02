import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://nattech.fib.upc.edu:40490';

interface UserPreferences {
  language: string;
  allow_notifications: boolean;
  dark_mode: boolean;
  favorite_categories: number[];
}

/**
 * Sincronitza preferències del backend AL INICIAR SESSIÓ
 */
export const syncPreferencesFromBackend = async (
  token: string,
  i18n: any,
  setTheme?: (theme: 'light' | 'dark') => void,
): Promise<boolean> => {
  try {
    console.log('🔄 Syncing preferences from backend...');

    const response = await fetch(`${API_BASE_URL}/preferences/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.log('⚠️ Failed to load preferences from backend');
      return false;
    }

    const prefs: UserPreferences = await response.json();
    console.log('✅ Preferences loaded:', prefs);

    // Guardar preferències ORIGINALS del backend
    await AsyncStorage.multiSet([
      ['favoriteCategories_backend', JSON.stringify(prefs.favorite_categories || [])],
      ['darkMode_backend', JSON.stringify(prefs.dark_mode)],
      ['language_backend', prefs.language || 'ca'],
      ['allowNotifications_backend', JSON.stringify(prefs.allow_notifications)],
      // Preferències ACTIVES
      ['favoriteCategories', JSON.stringify(prefs.favorite_categories || [])],
      ['darkMode', JSON.stringify(prefs.dark_mode)],
      ['appLanguage', prefs.language || 'ca'],
      ['preferredLanguage', prefs.language || 'ca'],
      ['allowNotifications', JSON.stringify(prefs.allow_notifications)],
    ]);

    // 🗑️ Eliminar tema temporal al carregar del backend
    await AsyncStorage.removeItem('sessionTheme');

    // Aplicar idioma
    if (i18n.language !== prefs.language) {
      await i18n.changeLanguage(prefs.language);
    }

    // Aplicar tema
    if (setTheme) {
      setTheme(prefs.dark_mode ? 'dark' : 'light');
    }

    console.log('✅ Preferences synced successfully');
    return true;
  } catch (error) {
    console.error('❌ Error syncing preferences:', error);
    return false;
  }
};

/**
 * Restaura les preferències originals del backend
 */
export const restoreBackendPreferences = async (
  i18n: any,
  setTheme?: (theme: 'light' | 'dark') => void,
): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;

    console.log('🔄 Restoring backend preferences...');

    // 🗑️ Eliminar tema temporal
    await AsyncStorage.removeItem('sessionTheme');

    const [languageBackend, darkModeBackend, favCategoriesBackend, notificationsBackend] =
      await AsyncStorage.multiGet([
        'language_backend',
        'darkMode_backend',
        'favoriteCategories_backend',
        'allowNotifications_backend',
      ]);

    const updates: [string, string][] = [];

    if (languageBackend[1]) {
      updates.push(['appLanguage', languageBackend[1]]);
      updates.push(['preferredLanguage', languageBackend[1]]);
      if (i18n.language !== languageBackend[1]) {
        await i18n.changeLanguage(languageBackend[1]);
      }
    }

    if (darkModeBackend[1] !== null) {
      updates.push(['darkMode', darkModeBackend[1]]);
      if (setTheme) {
        setTheme(JSON.parse(darkModeBackend[1]) ? 'dark' : 'light');
      }
    }

    if (favCategoriesBackend[1]) {
      updates.push(['favoriteCategories', favCategoriesBackend[1]]);
    }

    if (notificationsBackend[1]) {
      updates.push(['allowNotifications', notificationsBackend[1]]);
    }

    if (updates.length > 0) {
      await AsyncStorage.multiSet(updates);
    }

    console.log('✅ Backend preferences restored');
  } catch (error) {
    console.error('❌ Error restoring backend preferences:', error);
  }
};

/**
 * Neteja preferències temporals al tancar sessió
 */
export const clearSessionPreferences = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      'appLanguage',
      'darkMode',
      'favoriteCategories',
      'allowNotifications',
      'sessionTheme',
      'preferredLanguage',
      'favoriteCategories_backend',
      'darkMode_backend',
      'language_backend',
      'allowNotifications_backend',
    ]);

    console.log('✅ Session preferences cleared');
  } catch (error) {
    console.error('❌ Error clearing session preferences:', error);
  }
};

/**
 * Guarda preferències al backend (canvis PERMANENTS)
 * ⚠️ Només usar des de SetupScreen/PreferencesScreen
 */
export const savePreferencesToBackend = async (preferences: {
  language?: string;
  dark_mode?: boolean;
  favorite_categories?: number[];
  allow_notifications?: boolean;
}): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.log('❌ No token found, skipping backend save');
      return false;
    }

    console.log('🔑 Token found:', token.substring(0, 20) + '...');
    console.log('📤 Preferences to save:', preferences);

    // Carregar preferències actuals
    console.log('📥 Fetching current preferences...');
    const currentRes = await fetch(`${API_BASE_URL}/preferences/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    let currentPrefs: UserPreferences = {
      language: 'ca',
      allow_notifications: true,
      dark_mode: false,
      favorite_categories: [],
    };

    if (currentRes.ok) {
      currentPrefs = await currentRes.json();
      console.log('✅ Current preferences loaded:', currentPrefs);
    } else {
      console.log('⚠️ Could not load current preferences, using defaults');
    }

    // Merge amb noves preferències
    const updatedPrefs: UserPreferences = {
      ...currentPrefs,
      ...preferences,
    };

    console.log('💾 Saving preferences to backend:', updatedPrefs);
    console.log('🌐 Request URL:', `${API_BASE_URL}/preferences/`);

    // Guardar al backend
    const response = await fetch(`${API_BASE_URL}/preferences/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPrefs),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } else {
          errorText = await response.text();
        }
      } catch (e) {
        errorText = `Status: ${response.status} ${response.statusText}`;
      }
      console.error('❌ Backend error:', errorText);
      throw new Error(`Failed to save preferences: ${response.status}`);
    }

    // Actualitzar preferències locals (_backend i actives)
    const updates: [string, string][] = [];

    if (preferences.language !== undefined) {
      updates.push(['language_backend', preferences.language]);
      updates.push(['appLanguage', preferences.language]);
      updates.push(['preferredLanguage', preferences.language]);
    }

    if (preferences.dark_mode !== undefined) {
      const darkModeStr = JSON.stringify(preferences.dark_mode);
      updates.push(['darkMode_backend', darkModeStr]);
      updates.push(['darkMode', darkModeStr]);
    }

    if (preferences.favorite_categories !== undefined) {
      const categoriesStr = JSON.stringify(preferences.favorite_categories);
      updates.push(['favoriteCategories_backend', categoriesStr]);
      updates.push(['favoriteCategories', categoriesStr]);
    }

    if (preferences.allow_notifications !== undefined) {
      const notifStr = JSON.stringify(preferences.allow_notifications);
      updates.push(['allowNotifications_backend', notifStr]);
      updates.push(['allowNotifications', notifStr]);
    }

    if (updates.length > 0) {
      await AsyncStorage.multiSet(updates);
    }

    // 🗑️ Eliminar tema temporal quan es guarda permanentment
    await AsyncStorage.removeItem('sessionTheme');

    console.log('✅ Preferences saved to backend successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving preferences to backend:', error);
    return false;
  }
};

import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
export default function Profile() {
  const { t } = useTranslation()

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F0E2',
      }}
    >
      <Text>{t('profile')}</Text>
    </View>
  )
}

import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';

export const capitalize = (str: string) =>
  str
    .split(' ')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');

export const requestAndroidPermissions = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    const permissions: PermissionsAndroid.Permission[] = [
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];

    const results = await PermissionsAndroid.requestMultiple(permissions);

    console.log('📋 İzin sonuçları:', results);

    const deniedPermanently = Object.entries(results).filter(
      ([, result]) => result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    );

    if (deniedPermanently.length > 0) {
      console.log('❌ Kalıcı olarak reddedilen izinler:', deniedPermanently);
      Alert.alert(
        'İzin Gerekli',
        'Bazı izinler kalıcı olarak reddedilmiş. Devam edebilmek için ayarlardan izinleri manuel olarak vermelisin.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    const allGranted = Object.values(results).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED
    );

    if (!allGranted) {
      console.log('⚠️ Bazı izinler reddedildi:', results);
      Alert.alert(
        'İzin Gerekli',
        'Tüm izinler verilmediği için bazı özellikler çalışmayabilir.'
      );
    }

    return allGranted;
  } catch (err) {
    console.error('⚠️ İzin kontrol hatası:', err);
    return false;
  }
};

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView } from 'expo-camera';
import { saveUrl } from '@/store/url-store';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';

export default function Scan() {
  const router = useRouter();
  const [theme] = useTheme();
  const c = GrassColors[theme];

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned(async (result) => {
      const raw = result.data;
      const wsUrl = raw
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
      await CameraView.dismissScanner();
      await saveUrl(wsUrl);
      router.replace('/home');
    });
    return () => subscription.remove();
  }, [router]);

  async function startScan() {
    try {
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    } catch (err) {
      Alert.alert('Scanner Error', String(err));
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: c.text }]}>Add Server</Text>
        <Text style={[styles.subtitle, { color: c.badgeText }]}>
          Scan the QR code displayed by your GRASS server to add it.
        </Text>
        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: c.accent }]}
          onPress={startScan}
          activeOpacity={0.8}
        >
          <Text style={styles.scanBtnText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  scanBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView } from 'expo-camera';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { getUrls, removeUrl, saveUrl } from '@/store/url-store';

export default function Home() {
  const router = useRouter();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [urls, setUrls] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getUrls().then(setUrls);
    }, [])
  );

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned(async (result) => {
      const raw = result.data;
      const wsUrl = raw
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
      await CameraView.dismissScanner();
      await saveUrl(wsUrl);
      setUrls(await getUrls());
    });
    return () => subscription.remove();
  }, []);

  async function handleScan() {
    try {
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    } catch (err) {
      Alert.alert('Scanner Error', String(err));
    }
  }

  function handleSelect(url: string) {
    router.push({ pathname: '/sessions', params: { wsUrl: url } });
  }

  function handleDelete(url: string) {
    Alert.alert('Remove Server', url, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeUrl(url);
          setUrls(prev => prev.filter(u => u !== url));
        },
      },
    ]);
  }

  function displayUrl(url: string) {
    return url.replace(/^wss?:\/\//, '');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.inner}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: c.text }]}>GRASS</Text>

        {urls.length > 0 ? (
          <FlatList
            data={urls}
            keyExtractor={item => item}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.serverItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
                onPress={() => handleSelect(item)}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: c.accent }]} />
                <Text style={[styles.serverUrl, { color: c.text }]} numberOfLines={1}>
                  {displayUrl(item)}
                </Text>
                <Text style={[styles.chevron, { color: c.badgeText }]}>›</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: c.badgeText }]}>
              No servers saved yet.{'\n'}Scan a QR code to connect.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: c.accent }]}
          onPress={handleScan}
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  logo: {
    width: 220,
    height: 90,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 32,
  },
  list: {
    width: '100%',
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  serverUrl: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'ui-monospace',
  },
  chevron: {
    fontSize: 20,
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  scanBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    marginTop: 24,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

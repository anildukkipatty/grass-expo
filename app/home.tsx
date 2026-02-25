import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Image, Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView } from 'expo-camera';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { getUrls, removeUrl, saveUrl } from '@/store/url-store';

function ServerItem({ item, onPress, onLongPress, c }: {
  item: string;
  onPress: () => void;
  onLongPress: () => void;
  c: typeof GrassColors['light'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  }

  function displayUrl(url: string) {
    return url.replace(/^wss?:\/\//, '');
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.serverItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.dot, { backgroundColor: c.accent }]} />
        <Text style={[styles.serverUrl, { color: c.text }]} numberOfLines={1}>
          {displayUrl(item)}
        </Text>
        <Text style={[styles.chevron, { color: c.badgeText }]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Home() {
  const router = useRouter();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [urls, setUrls] = useState<string[]>([]);
  const scanScale = useRef(new Animated.Value(1)).current;

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
              <ServerItem
                item={item}
                c={c}
                onPress={() => handleSelect(item)}
                onLongPress={() => handleDelete(item)}
              />
            )}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: c.badgeText }]}>
              No servers saved yet.{'\n'}Scan a QR code to connect.
            </Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: scanScale }] }}>
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: c.accent }]}
            onPress={handleScan}
            onPressIn={() =>
              Animated.spring(scanScale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
            }
            onPressOut={() =>
              Animated.spring(scanScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
            }
            activeOpacity={1}
          >
            <Text style={styles.scanBtnText}>Scan QR Code</Text>
          </TouchableOpacity>
        </Animated.View>
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
    paddingBottom: 32,
  },
  logo: {
    width: 220,
    height: 90,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: 36,
    fontFamily: 'ui-rounded',
  },
  list: {
    width: '100%',
    flexGrow: 0,
  },
  listContent: {
    gap: 10,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
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
    fontSize: 14,
    fontFamily: 'ui-monospace',
    letterSpacing: -0.2,
  },
  chevron: {
    fontSize: 22,
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
    lineHeight: 26,
  },
  scanBtn: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
    marginTop: 24,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

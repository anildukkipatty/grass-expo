import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView } from 'expo-camera';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { getUrls, removeUrl, saveUrl } from '@/store/url-store';
import { openConnection, closeConnection, reconnectNow, useConnectionStatuses, getEntry, type ConnectionStatus } from '@/store/connection-store';

const DELETE_WIDTH = 72;

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  connected: '#22c55e',
  reconnecting: '#f59e0b',
  disconnected: '#ef4444',
};

function folderName(cwd: string | null | undefined): string | null {
  if (!cwd) return null;
  const parts = cwd.replace(/\/+$/, '').split('/');
  return parts[parts.length - 1] || null;
}

function ServerItem({ item, onPress, onDelete, c, status, cwd }: {
  item: string;
  onPress: () => void;
  onDelete: () => void;
  c: typeof GrassColors['light'];
  status: ConnectionStatus;
  cwd: string | null | undefined;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isOpen = useRef(false);
  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, -1, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const x = isOpen.current ? g.dx - DELETE_WIDTH : g.dx;
        translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, x)));
      },
      onPanResponderRelease: (_, g) => {
        const x = isOpen.current ? g.dx - DELETE_WIDTH : g.dx;
        if (x < -DELETE_WIDTH / 2) {
          Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  function close() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
    isOpen.current = false;
  }

  function displayUrl(url: string) {
    return url.replace(/^wss?:\/\//, '');
  }

  return (
    <View style={{ overflow: 'hidden', borderRadius: 14 }}>
      <Animated.View style={[styles.deleteBtn, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.deleteBtnInner} onPress={onDelete} activeOpacity={0.8}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }, { scale }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.serverItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
          onPress={() => { if (isOpen.current) { close(); } else { onPress(); } }}
          onPressIn={() =>
            Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
          }
          activeOpacity={1}
        >
          <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} />
          <View style={styles.serverTextGroup}>
            {folderName(cwd) ? (
              <>
                <Text style={[styles.serverFolder, { color: c.text }]} numberOfLines={1}>
                  {folderName(cwd)}
                </Text>
                <Text style={[styles.serverUrl, { color: c.badgeText }]} numberOfLines={1}>
                  {displayUrl(item)}
                </Text>
              </>
            ) : (
              <Text style={[styles.serverFolder, { color: c.text }]} numberOfLines={1}>
                {displayUrl(item)}
              </Text>
            )}
          </View>
          <Text style={[styles.chevron, { color: c.badgeText }]}>›</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [urls, setUrls] = useState<string[]>([]);
  const scanScale = useRef(new Animated.Value(1)).current;
  const statuses = useConnectionStatuses();

  useFocusEffect(
    useCallback(() => {
      getUrls().then(loadedUrls => {
        setUrls(loadedUrls);
        loadedUrls.forEach(openConnection);
      });
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
      openConnection(wsUrl);
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
    reconnectNow(url);
    router.push({ pathname: '/sessions', params: { wsUrl: url } });
  }

  async function handleDelete(url: string) {
    closeConnection(url);
    await removeUrl(url);
    setUrls(prev => prev.filter(u => u !== url));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.inner}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        {urls.length > 0 ? (
          <View style={styles.list}>
            {urls.map(item => (
              <ServerItem
                key={item}
                item={item}
                c={c}
                status={statuses.get(item) ?? 'disconnected'}
                cwd={getEntry(item)?.cwd}
                onPress={() => handleSelect(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </View>
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
    width: 320,
    height: 138,
    marginBottom: 36,
  },
  list: {
    width: '100%',
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
  serverTextGroup: {
    flex: 1,
    gap: 2,
  },
  serverFolder: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  serverUrl: {
    fontSize: 12,
    fontFamily: 'ui-monospace',
    letterSpacing: -0.2,
    opacity: 0.55,
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
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
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

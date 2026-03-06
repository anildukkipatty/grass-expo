import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { getUrls, removeUrl, saveUrl } from '@/store/url-store';
import { openConnection, closeConnection, subscribeToAll, getEntry } from '@/store/connection-store';

const DELETE_WIDTH = 72;


function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function ServerItem({ item, onPress, onDelete, c, cwd, health }: {
  item: string;
  onPress: () => void;
  onDelete: () => void;
  c: typeof GrassColors['light'];
  cwd: string | null | undefined;
  health: 'healthy' | 'unreachable' | undefined;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const itemHeight = useRef(new Animated.Value(1)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const isOpen = useRef(false);
  const didHaptic = useRef(false);
  const deleteOpacity = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, -1, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => { didHaptic.current = false; },
      onPanResponderMove: (_, g) => {
        const x = isOpen.current ? g.dx - DELETE_WIDTH : g.dx;
        translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, x)));
        if (x < -DELETE_WIDTH / 2 && !didHaptic.current) {
          didHaptic.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
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

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(itemOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(itemHeight, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDelete());
  }

  return (
    <Animated.View style={{ overflow: 'hidden', borderRadius: 14, opacity: itemOpacity, transform: [{ scaleY: itemHeight }] }}>
      <Animated.View style={[styles.deleteBtn, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.deleteBtnInner} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginBottom: 2 }} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }, { scale }] }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.serverItem, { backgroundColor: c.assistantBubble, borderColor: c.border }]}
          onPress={() => {
            if (isOpen.current) { close(); } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress();
            }
          }}
          onPressIn={() =>
            Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
          }
          activeOpacity={1}
        >
          <View style={[styles.dot, {
            backgroundColor: health === 'healthy' ? '#22c55e' : health === 'unreachable' ? '#ef4444' : '#9ca3af',
          }]} />
          <View style={styles.serverTextGroup}>
            <Text style={[styles.serverFolder, { color: c.text }]} numberOfLines={1}>
              {cwd ? cwd.split('/').pop() || hostFromUrl(item) : hostFromUrl(item)}
            </Text>
            {cwd ? (
              <Text style={[styles.serverSubtitle, { color: c.badgeText }]} numberOfLines={1}>
                {hostFromUrl(item)}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.chevron, { color: c.badgeText }]}>›</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

/* ── Pulsing QR empty-state icon ── */
function PulsingQRIcon({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Ionicons name="qr-code-outline" size={56} color={color} />
    </Animated.View>
  );
}

/* ── Bouncing arrow ── */
function BouncingArrow({ color }: { color: string }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 8, duration: 600, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [translateY]);

  return (
    <Animated.View style={{ transform: [{ translateY }], marginTop: 10 }}>
      <Ionicons name="arrow-down" size={22} color={color} />
    </Animated.View>
  );
}

const HEALTH_POLL_MS = 10_000;

export default function Home() {
  const router = useRouter();
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [urls, setUrls] = useState<string[]>([]);
  const [, forceUpdate] = useState(0);
  const [healthMap, setHealthMap] = useState<Map<string, 'healthy' | 'unreachable'>>(new Map());
  const scanScale = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const unsub = subscribeToAll(() => forceUpdate(n => n + 1));
    return unsub;
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Kill any previously running interval before starting a new one.
      // This handles the rapid-navigation race where cleanup from the last
      // focus cycle hasn't fired yet when the new focus cycle starts.
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Increment generation so any in-flight fetches from prior cycles
      // will discard their results when they resolve.
      const gen = ++generationRef.current;

      let currentUrls: string[] = [];

      async function pollHealth(urlsToCheck: string[]) {
        if (gen !== generationRef.current) return;
        const results = await Promise.allSettled(
          urlsToCheck.map(async (url) => {
            try {
              const res = await fetch(`${url}/health`);
              return { url, ok: res.ok };
            } catch {
              return { url, ok: false };
            }
          })
        );
        if (gen !== generationRef.current) return;
        setHealthMap(prev => {
          const next = new Map(prev);
          for (const r of results) {
            if (r.status === 'fulfilled') {
              next.set(r.value.url, r.value.ok ? 'healthy' : 'unreachable');
            }
          }
          return next;
        });
      }

      getUrls().then(loadedUrls => {
        if (gen !== generationRef.current) return;
        currentUrls = loadedUrls;
        setUrls(loadedUrls);
        loadedUrls.forEach(openConnection);
        pollHealth(loadedUrls);
        intervalRef.current = setInterval(() => pollHealth(currentUrls), HEALTH_POLL_MS);
      });

      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        generationRef.current++;
      };
    }, [])
  );

  useEffect(() => {
    const subscription = CameraView.onModernBarcodeScanned(async (result) => {
      const raw = result.data;
      // QR codes now emit http:// directly — just use raw URL
      const serverUrl = raw;
      await CameraView.dismissScanner();
      await saveUrl(serverUrl);
      openConnection(serverUrl);
      setUrls(await getUrls());
    });
    return () => subscription.remove();
  }, []);

  async function handleScan() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await CameraView.launchScanner({ barcodeTypes: ['qr'] });
    } catch (err) {
      Alert.alert('Scanner Error', String(err));
    }
  }

  function handleSelect(serverUrl: string) {
    router.push({ pathname: '/folders', params: { serverUrl } });
  }

  async function handleDelete(serverUrl: string) {
    closeConnection(serverUrl);
    await removeUrl(serverUrl);
    setUrls(prev => prev.filter(u => u !== serverUrl));
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
                cwd={getEntry(item)?.serverCwd}
                health={healthMap.get(item)}
                onPress={() => handleSelect(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <PulsingQRIcon color={c.badgeText} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              No servers saved yet
            </Text>
            <Text style={[styles.emptyText, { color: c.badgeText }]}>
              Scan a QR code to get started
            </Text>
            <BouncingArrow color={c.badgeText} />
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
  serverSubtitle: {
    fontSize: 12,
    letterSpacing: -0.1,
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: -0.3,
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
    gap: 2,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 11,
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

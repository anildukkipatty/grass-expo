import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GrassColors, Fonts } from '@/constants/theme';
import { fenceColors } from '@/constants/markdownStyles';
import { GlobalPermissionItem } from '@/store/connection-store';
import { SyntaxBlock } from '@/components/SyntaxBlock';

interface Props {
  item: GlobalPermissionItem;
  onAllow: () => void;
  onDeny: () => void;
  theme: 'light' | 'dark';
}

interface Section { label: string; code: string; language: string }

function formatSections(toolName: string, input: Record<string, unknown>): Section[] {
  switch (toolName) {
    case 'Write': {
      const content = (input.content as string) || '';
      const preview = content.slice(0, 500) + (content.length > 500 ? '\n...' : '');
      return [{ label: `File: ${input.file_path}`, code: preview, language: 'tsx' }];
    }
    case 'Edit':
      return [
        { label: `File: ${input.file_path}  —  Replace`, code: (input.old_string as string || '').slice(0, 300), language: 'tsx' },
        { label: 'With', code: (input.new_string as string || '').slice(0, 300), language: 'tsx' },
      ];
    case 'Bash':
      return [{ label: 'Command', code: String(input.command ?? ''), language: 'bash' }];
    default:
      return [{ label: '', code: JSON.stringify(input, null, 2), language: 'json' }];
  }
}

export function PermissionCard({ item, onAllow, onDeny, theme }: Props) {
  const c = GrassColors[theme];
  const mono = Fonts?.mono ?? 'monospace';
  const fence = fenceColors(theme);
  const sections = formatSections(item.toolName, item.input);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const denyScale = useRef(new Animated.Value(1)).current;
  const allowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
    ]).start();
  }, []);

  function handleAllow() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAllow();
  }

  function handleDeny() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDeny();
  }

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: c.assistantBubble, borderColor: c.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={[styles.toolBadge, { backgroundColor: c.accentSoft }]}>
          <Text style={[styles.toolBadgeText, { color: c.accent }]}>{item.toolName}</Text>
        </View>
        <Text style={[styles.title, { color: c.text }]}>Permission Request</Text>
      </View>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {sections.map((sec, idx) => (
          <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
            {sec.label ? (
              <Text style={[styles.sectionLabel, { color: fence.text, backgroundColor: fence.bg, borderColor: fence.border, fontFamily: mono }]}>
                {sec.label}
              </Text>
            ) : null}
            <SyntaxBlock code={sec.code} language={sec.language} theme={theme} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: denyScale }] }}>
          <TouchableOpacity
            style={[styles.denyBtn, { borderColor: c.border, backgroundColor: c.bg }]}
            onPress={handleDeny}
            onPressIn={() =>
              Animated.spring(denyScale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
            }
            onPressOut={() =>
              Animated.spring(denyScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
            }
            activeOpacity={1}
          >
            <Text style={[styles.denyText, { color: c.text }]}>Deny</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: allowScale }] }}>
          <TouchableOpacity
            style={styles.allowBtn}
            onPress={handleAllow}
            onPressIn={() =>
              Animated.spring(allowScale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 2 }).start()
            }
            onPressOut={() =>
              Animated.spring(allowScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
            }
            activeOpacity={1}
          >
            <Text style={styles.allowText}>Allow</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toolBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  body: {
    maxHeight: 260,
  },
  sectionLabel: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  denyBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  denyText: {
    fontSize: 15,
    fontWeight: '500',
  },
  allowBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#22c55e',
  },
  allowText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});

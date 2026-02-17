import React from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView, View } from 'react-native';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';

export default function Diffs() {
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const text = diffTextRef.current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {!text ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.badgeText }]}>No changes detected</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={[styles.diffText, { color: c.text }]}>{text}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Module-level ref set by chat screen before navigating
export const diffTextRef = { current: '' };

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  diffText: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});

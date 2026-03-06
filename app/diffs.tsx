import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { DiffViewer } from '@/components/DiffViewer';

export default function Diffs() {
  const { serverUrl, repoPath } = useLocalSearchParams<{ serverUrl: string; repoPath?: string }>();
  const [theme] = useTheme();
  const c = GrassColors[theme];

  if (!serverUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.badgeText }]}>No server URL provided</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <DiffViewer serverUrl={serverUrl} repoPath={repoPath ?? ''} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});

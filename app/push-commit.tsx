import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const REPO = {
  name: 'Grass/CommunityWebsite',
  linesAdded: 243,
  linesChanged: 322,
};

export default function PushCommitScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#FFFFFF', '#CCFFD9']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.inner}>

          {/* Header */}
          <Text style={styles.heading}>
            Make your first{'\n'}commit with Grass.
          </Text>
          <Text style={styles.subheading}>
            We've loaded a few repos below. Ask the agent to make any change, it'll commit & push your code soon.
          </Text>

          {/* Repo card */}
          <View style={styles.card}>
            {/* SVG card background */}
            <Image
              source={require('@/assets/images/push-commit/card-background.svg')}
              style={StyleSheet.absoluteFill}
              contentFit="fill"
            />

            {/* Repo header row */}
            <View style={styles.repoRow}>
              <View style={styles.repoInfo}>
                <Text style={styles.repoName}>{REPO.name}</Text>
              </View>
              <Image
                source={require('@/assets/images/push-commit/repo-image.png')}
                style={styles.repoThumb}
                contentFit="cover"
              />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>⊕ {REPO.linesAdded}</Text>
                <Text style={styles.statLabel}>Lines</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>+ {REPO.linesChanged}</Text>
                <Text style={styles.statLabel}>Lines</Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Heads-up note */}
          <Text style={styles.note}>
            Heads up, we're running this on Open Code live. Connect your own Claude in 'Open Code' for the optimal experience.
          </Text>

          {/* Action buttons */}
          <TouchableOpacity
            style={styles.commitButton}
            activeOpacity={0.88}
            onPress={() => router.push('/navbar')}
          >
            <Text style={styles.commitButtonText}>Push your first commit  →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.6}
            onPress={() => router.push('/navbar')}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },

  // Header
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D2600',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 14,
    color: '#4B6B30',
    lineHeight: 21,
    marginBottom: 28,
  },

  // Card
  card: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    aspectRatio: 1.55,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  repoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  repoInfo: {
    flex: 1,
    paddingRight: 12,
  },
  repoName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D2600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  repoThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D6A00',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B8F4A',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(13,38,0,0.12)',
  },

  // Note
  note: {
    fontSize: 12,
    color: '#6B8F4A',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // Buttons
  commitButton: {
    backgroundColor: '#7FE63A',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  commitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0a1a00',
    letterSpacing: 0.2,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B6B30',
  },
});

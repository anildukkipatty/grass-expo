import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GetMoreSheet } from '@/components/GetMoreSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 28;

type NavTab = 'home' | 'perms' | 'repos';

const CHALLENGES = [
  { id: '1', title: 'Challenges', count: '0/3', sub: 'Try the 3 core features · Earn +3h VM' },
  { id: '2', title: 'Connect Agent', count: '0/1', sub: 'Connect your first AI agent · Earn +1h VM' },
  { id: '3', title: 'Add Repository', count: '0/1', sub: 'Add your first repository · Earn +1h VM' },
];

const THREADS = [
  { id: '1', badge: 'CCBA', title: 'Add yourself as a contributor', repo: 'grass-welcome', tool: 'Open Code', time: '12m ago' },
  { id: '2', badge: 'CCBA', title: 'Improve login security', repo: 'main-project', tool: 'Claude', time: '12m ago' },
  { id: '3', badge: 'CCBA', title: 'Implement user roles', repo: 'alpha-build', tool: 'Opencode', time: '12m ago' },
  { id: '4', badge: 'CCBA', title: 'Enhance API endpoints', repo: 'backend-api', tool: 'Claude', time: '12m ago' },
  { id: '5', badge: 'CCBA', title: 'Fix authentication bug', repo: 'auth-service', tool: 'Open Code', time: '15m ago' },
];

type CodeLine = { num: number; prefix: '+' | '-' | ' '; text: string };

interface PermissionCardData {
  id: string;
  toolName: string;
  toolType: 'Write' | 'Edit' | 'Bash' | 'Read' | string;
  time: string;
  path: string;
  origin: string;
  initials: string;
  codeLines: CodeLine[];
}

const PERMISSIONS: PermissionCardData[] = [
  {
    id: '1',
    toolName: 'WRITE FILE',
    toolType: 'Write',
    time: '2m ago',
    path: 'src/utils/auth.ts',
    origin: 'You via Opencode',
    initials: 'Y',
    codeLines: [
      { num: 1, prefix: '+', text: "import jwt from 'jsonwebtoken';" },
      { num: 2, prefix: '+', text: 'interface TokenPayload {' },
      { num: 3, prefix: '+', text: '  userId: string;' },
    ],
  },
  {
    id: '2',
    toolName: 'BASH',
    toolType: 'Bash',
    time: '2m ago',
    path: 'npm run test -- --coverage',
    origin: 'Sahil via Claude Mythos',
    initials: 'S',
    codeLines: [],
  },
  {
    id: '3',
    toolName: 'EDIT FILE',
    toolType: 'Edit',
    time: '2m ago',
    path: 'src/routes/api.ts',
    origin: 'Sahil via Claude Mythos',
    initials: 'S',
    codeLines: [
      { num: 1, prefix: '-', text: 'const router = express.Router();' },
      { num: 2, prefix: '+', text: 'const router = Router();' },
    ],
  },
  {
    id: '4',
    toolName: 'READ FILE',
    toolType: 'Read',
    time: '8m ago',
    path: 'src/middleware/auth.ts',
    origin: 'You via Opencode',
    initials: 'Y',
    codeLines: [],
  },
];

interface RepoItem {
  id: string;
  name: string;
  branch: string;
  action: string;
  badge: string;
  badgeType: 'green' | 'gray';
}

const INITIAL_REPOS: RepoItem[] = [
  { id: '1', name: 'grass-welcome', branch: 'main', action: 'Open Code', badge: 'Demo', badgeType: 'green' },
  { id: '2', name: 'api-server', branch: 'dev', action: 'Claude Code', badge: 'Python', badgeType: 'gray' },
];

const BADGE_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  Write: { bg: '#FFF5E6', border: '#FF9500', text: '#B05A00' },
  Bash:  { bg: '#EEF2FF', border: '#4F6BFF', text: '#1E3799' },
  Edit:  { bg: '#F3EEFF', border: '#8B5CF6', text: '#5B21B6' },
  Read:  { bg: '#E6F7FF', border: '#0EA5E9', text: '#0C4A6E' },
  default: { bg: '#F0F0F0', border: '#999999', text: '#555555' },
};

// ─── Permission Card ───────────────────────────────────────────────────────────

function PermissionCard({ item, onApprove, onDeny }: {
  item: PermissionCardData;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const badge = BADGE_CONFIG[item.toolType] ?? BADGE_CONFIG.default;
  const isBash = item.toolType === 'Bash';

  return (
    <View style={perm.card}>
      {/* Top row: tool badge + time */}
      <View style={perm.cardHeader}>
        <View style={[perm.toolBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[perm.toolBadgeText, { color: badge.text }]}>{item.toolName}</Text>
        </View>
        <Text style={perm.cardTime}>{item.time}</Text>
      </View>

      {/* Path row */}
      <View style={perm.pathRow}>
        <View style={perm.pathIconWrap}>
          <Text style={perm.pathIconText}>{isBash ? '</>' : '⬡'}</Text>
        </View>
        <Text style={perm.pathText} numberOfLines={1}>{item.path}</Text>
      </View>

      {/* Origin row */}
      <View style={perm.originRow}>
        <Text style={perm.originLabel}>Origin</Text>
        <View style={perm.originAvatar}>
          <Text style={perm.originInitials}>{item.initials}</Text>
        </View>
        <Text style={perm.originText}>{item.origin}</Text>
      </View>

      {/* Code preview */}
      {item.codeLines.length > 0 && (
        <View style={perm.codeBlock}>
          {/* Unified left gutter — one background for all lines */}
          <View style={perm.codeGutterCol}>
            {item.codeLines.map((line, idx) => (
              <View key={idx} style={perm.gutterRow}>
                <Text style={perm.codeLineNum}>{line.num}</Text>
                <Text style={[
                  perm.codePrefix,
                  line.prefix === '+' ? perm.codeAdd : line.prefix === '-' ? perm.codeDel : perm.codeNeutral,
                ]}>
                  {line.prefix}
                </Text>
              </View>
            ))}
          </View>
          {/* Code text column */}
          <View style={perm.codeTextCol}>
            {item.codeLines.map((line, idx) => (
              <Text
                key={idx}
                style={[
                  perm.codeText,
                  line.prefix === '+' ? perm.codeAdd : line.prefix === '-' ? perm.codeDel : null,
                ]}
                numberOfLines={1}
              >
                {line.text}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={perm.buttonRow}>
        {/* Deny */}
        <TouchableOpacity style={perm.denyOuter} onPress={onDeny} activeOpacity={0.85}>
          <LinearGradient
            colors={['#FF3D3D', '#FFA047']}
            start={{ x: 0.72, y: 1 }}
            end={{ x: 0.28, y: 0 }}
            style={perm.btnGradient}
          >
            <Text style={perm.denyText}>✕  Deny</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Approve */}
        <TouchableOpacity style={perm.approveOuter} onPress={onApprove} activeOpacity={0.85}>
          <LinearGradient
            colors={['#00FF40', '#E0FF47']}
            start={{ x: 0.72, y: 1 }}
            end={{ x: 0.28, y: 0 }}
            style={perm.btnGradient}
          >
            <Text style={perm.approveText}>✓  Approve</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── VM Tab Bar ────────────────────────────────────────────────────────────────
// Placed inside the ImageBackground so banner image shows through +Add

function VmTabBar({ activeVmTab, onTabPress }: {
  activeVmTab: number;
  onTabPress: (idx: number) => void;
}) {
  return (
    <View style={styles.tabsBar}>
      {/* GrassVM + My Macbook — white pill group */}
      <View style={styles.tabPillsGroup}>
        {/* GrassVM */}
        <TouchableOpacity
          style={[styles.tabPill, activeVmTab === 0 && styles.tabPillActive]}
          onPress={() => onTabPress(0)}
          activeOpacity={0.75}
        >
          {/* Active dot indicator */}
          <View style={[
            styles.vmDot,
            activeVmTab === 0 ? styles.vmDotActive : styles.vmDotInactive,
          ]} />
          <Text style={[styles.tabPillText, activeVmTab === 0 && styles.tabPillTextActive]}>
            GrassVM
          </Text>
        </TouchableOpacity>

        {/* My Macbook */}
        <TouchableOpacity
          style={[styles.tabPill, activeVmTab === 1 && styles.tabPillActive]}
          onPress={() => onTabPress(1)}
          activeOpacity={0.75}
        >
          <View style={[
            styles.vmDot,
            activeVmTab === 1 ? styles.vmDotActive : styles.vmDotInactive,
          ]} />
          <Text style={[styles.tabPillText, activeVmTab === 1 && styles.tabPillTextActive]}>
            My Macbook
          </Text>
        </TouchableOpacity>
      </View>

      {/* +Add — no background, banner image shows through */}
      <TouchableOpacity onPress={() => onTabPress(2)} activeOpacity={0.7}>
        <Text style={styles.tabAddText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Swipeable Repo Card ───────────────────────────────────────────────────

const SWIPE_THRESHOLD = -110;

function SwipeableRepoCard({ item, onDelete }: { item: RepoItem; onDelete: () => void }) {
  const translateX = useSharedValue(0);
  const containerHeight = useSharedValue(76);
  const [deletePhase, setDeletePhase] = useState<'idle' | 'deleted'>('idle');

  const wrapStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
    overflow: 'hidden' as const,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SCREEN_W, -8, 0],
      [1, 0.75, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const doSpringBack = () => {
    translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
  };

  const doDelete = () => {
    translateX.value = withTiming(-SCREEN_W, { duration: 220 });
    setTimeout(() => {
      setDeletePhase('deleted');
      setTimeout(() => {
        containerHeight.value = withTiming(0, { duration: 250 });
        setTimeout(onDelete, 250);
      }, 1000);
    }, 220);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-15, 15])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        runOnJS(doDelete)();
      } else {
        runOnJS(doSpringBack)();
      }
    });

  const badge =
    item.badgeType === 'green'
      ? { bg: '#E8FFF0', border: '#34C759', text: '#1A7A35' }
      : { bg: '#F0F0F0', border: '#C7C7CC', text: '#6C6C70' };

  return (
    <Animated.View style={wrapStyle}>
      {/* Red background revealed on swipe */}
      <Animated.View style={[repoStyles.deleteBg, bgStyle]}>
        <Text style={repoStyles.deletedText}>
          {deletePhase === 'deleted' ? 'Deleted' : 'Deleting...'}
        </Text>
      </Animated.View>

      {/* Sliding card */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[repoStyles.card, cardStyle]}>
          <View style={repoStyles.cardLeft}>
            <Text style={repoStyles.repoName}>{item.name}</Text>
            <Text style={repoStyles.repoBranch}>
              {'↑ '}
              {item.branch}
              {'  ·  '}
              {item.action}
            </Text>
          </View>
          <View style={[repoStyles.repoBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[repoStyles.repoBadgeText, { color: badge.text }]}>{item.badge}</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function NavbarScreen() {
  const [activeVmTab, setActiveVmTab] = useState(0);
  const [activeNav, setActiveNav] = useState<NavTab>('home');
  const [permissions, setPermissions] = useState<PermissionCardData[]>(PERMISSIONS);
  const [repos, setRepos] = useState<RepoItem[]>(INITIAL_REPOS);
  const [getMoreVisible, setGetMoreVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const challengeIdxRef = useRef(0);

  const onViewableChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        challengeIdxRef.current = viewableItems[0].index;
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  function handleApprove(id: string) {
    setPermissions(prev => prev.filter(p => p.id !== id));
  }

  function handleDeny(id: string) {
    setPermissions(prev => prev.filter(p => p.id !== id));
  }

  const isPerms = activeNav === 'perms';
  const isRepos = activeNav === 'repos';
  // Banner height: perms/repos have no GetMore card so they're shorter
  const bannerHeight = (isPerms || isRepos) ? 160 : 270;

  return (
    <View style={styles.root}>
      {/* ─────────────────── BANNER + VM TABS (inside image) ─────────────────── */}
      <View style={{ paddingTop: insets.top }}>
        <ImageBackground
          source={require('@/assets/images/navbar-screens/banner-image.png')}
          style={[styles.bannerImg, { height: bannerHeight }]}
          resizeMode="cover"
        >
          {/* Bottom-to-top dark gradient */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
            locations={[0, 0.55]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar */}
          {isPerms ? (
            <View style={styles.topBar}>
              <Text style={styles.permissionsTitle}>Permissions</Text>
            </View>
          ) : isRepos ? (
            <View style={styles.topBar}>
              <Text style={styles.reposTitle}>Repos</Text>
            </View>
          ) : (
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <Text style={styles.grassTitle}>Grass</Text>
                <View style={styles.betaBadge}>
                  <Text style={styles.betaText}>BETA</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.avatarWrap}>
                <ExpoImage
                  source={require('@/assets/images/navbar-screens/user-icon.svg')}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Get More card — home tab only */}
          {!isPerms && !isRepos && (
            <TouchableOpacity
              style={styles.getMoreCard}
              onPress={() => setGetMoreVisible(true)}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={10}
                tint="light"
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.80)', 'rgba(223,255,229,0.80)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <View style={styles.getMoreInner}>
                <View style={styles.getMoreIconWrap}>
                  <Image
                    source={require('@/assets/images/navbar-screens/get-more-card.png')}
                    style={styles.getMoreIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.getMoreTextWrap}>
                  <Text style={styles.getMoreTitle}>Get more from Grass</Text>
                  <Text style={styles.getMoreSub}>
                    Connect your own agent, add repos, link your laptop
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Spacer pushes tabs to banner bottom */}
          <View style={{ flex: 1 }} />

          {/* VM Tabs sit inside banner so image shows behind +Add */}
          <VmTabBar activeVmTab={activeVmTab} onTabPress={setActiveVmTab} />
        </ImageBackground>
      </View>

      {/* ─────────────────── CHALLENGE CAROUSEL (fixed, home only) ─────────────── */}
      {activeNav === 'home' && (
        <View style={styles.challengeSection}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={CHALLENGES}
            keyExtractor={item => item.id}
            style={styles.carouselList}
            snapToInterval={CARD_W}
            decelerationRate="fast"
            onViewableItemsChanged={onViewableChanged}
            viewabilityConfig={viewConfig}
            renderItem={({ item }) => (
              <View style={styles.challengeCard}>
                <LinearGradient
                  colors={['#97FFAC', '#FFFFFF']}
                  start={{ x: 0.35, y: 0 }}
                  end={{ x: 0.65, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <View style={styles.challengeInsetShadow} />
                <View style={styles.challengeIconCircle}>
                  <Image
                    source={require('@/assets/images/navbar-screens/challenge.png')}
                    style={styles.challengeIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.challengeBody}>
                  <View style={styles.challengeHeaderRow}>
                    <Text style={styles.challengeTitle}>{item.title}</Text>
                    <Text style={styles.challengeCount}>{item.count}</Text>
                  </View>
                  <Text style={styles.challengeSub}>{item.sub}</Text>
                  <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* ─────────────────── SCROLLABLE CONTENT ─────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── RECENT THREADS (home) ── */}
        {activeNav === 'home' && (
          <>
            <Text style={styles.sectionHeader}>RECENT THREADS</Text>
            {THREADS.map(thread => (
              <TouchableOpacity key={thread.id} style={styles.threadCard} activeOpacity={0.72}>
                <View style={styles.threadTopRow}>
                  <View style={styles.ccbaBadge}>
                    <Text style={styles.ccbaText}>{thread.badge}</Text>
                  </View>
                  <Text style={styles.threadTime}>{thread.time}</Text>
                </View>
                <Text style={styles.threadTitle}>{thread.title}</Text>
                <Text style={styles.threadMeta}>{thread.repo} · {thread.tool}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── PERMISSIONS ── */}
        {activeNav === 'perms' && (
          <>
            {permissions.length === 0 ? (
              <View style={perm.emptyState}>
                <Text style={perm.emptyText}>No pending permissions</Text>
              </View>
            ) : (
              permissions.map(item => (
                <PermissionCard
                  key={item.id}
                  item={item}
                  onApprove={() => handleApprove(item.id)}
                  onDeny={() => handleDeny(item.id)}
                />
              ))
            )}
          </>
        )}

        {/* ── REPOS ── */}
        {activeNav === 'repos' && (
          <>
            {/* Action buttons */}
            <View style={repoStyles.actionRow}>
              <TouchableOpacity style={repoStyles.actionBtn} activeOpacity={0.72}>
                <Text style={repoStyles.actionBtnText}>+ Add new repo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={repoStyles.actionBtn} activeOpacity={0.72}>
                <Ionicons name="logo-github" size={14} color="#1C1C1E" />
                <Text style={repoStyles.actionBtnText}>Clone from Github</Text>
              </TouchableOpacity>
            </View>

            {/* Repo cards */}
            {repos.map(item => (
              <SwipeableRepoCard
                key={item.id}
                item={item}
                onDelete={() => setRepos(prev => prev.filter(r => r.id !== item.id))}
              />
            ))}

            {/* Swipe hint */}
            {repos.length > 0 && (
              <Text style={repoStyles.swipeHint}>Swipe left of a repo to delete</Text>
            )}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─────────────────── BOTTOM NAV ─────────────────── */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.bottomNavPill}>
          {/* HOME */}
          <TouchableOpacity
            style={[styles.navItem, activeNav === 'home' && styles.navItemActive]}
            onPress={() => setActiveNav('home')}
          >
            <View style={[styles.navIconWrap, activeNav === 'home' && styles.navIconWrapActive]}>
              <ExpoImage
                source={require('@/assets/images/navbar-screens/home-icon.svg')}
                style={styles.navImg}
                tintColor={activeNav === 'home' ? '#088120' : '#8E8E93'}
              />
            </View>
            <Text style={[styles.navLabel, activeNav === 'home' && styles.navLabelActive]}>
              HOME
            </Text>
          </TouchableOpacity>

          {/* PERMS — badge shows pending count */}
          <TouchableOpacity
            style={[styles.navItem, activeNav === 'perms' && styles.navItemActive]}
            onPress={() => setActiveNav('perms')}
          >
            <View style={[styles.navIconWrap, activeNav === 'perms' && styles.navIconWrapActive]}>
              <Image
                source={require('@/assets/images/navbar-screens/permission-icon.png')}
                style={[styles.navImg, { tintColor: activeNav === 'perms' ? '#088120' : '#8E8E93' }]}
                resizeMode="contain"
              />
              {permissions.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifCount}>{permissions.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, activeNav === 'perms' && styles.navLabelActive]}>
              PERMS
            </Text>
          </TouchableOpacity>

          {/* REPOS */}
          <TouchableOpacity
            style={[styles.navItem, activeNav === 'repos' && styles.navItemActive]}
            onPress={() => setActiveNav('repos')}
          >
            <View style={[styles.navIconWrap, activeNav === 'repos' && styles.navIconWrapActive]}>
              <Image
                source={require('@/assets/images/navbar-screens/repos-icon.png')}
                style={[styles.navImg, { tintColor: activeNav === 'repos' ? '#088120' : '#8E8E93' }]}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.navLabel, activeNav === 'repos' && styles.navLabelActive]}>
              REPOS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─────────────────── GET MORE SHEET ─────────────────── */}
      <GetMoreSheet
        visible={getMoreVisible}
        onClose={() => setGetMoreVisible(false)}
      />
    </View>
  );
}

// ─── Permission Card Styles ────────────────────────────────────────────────────

const perm = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  toolBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
    gap: 10,
    paddingRight: 10,
  },
  pathIconWrap: {
    alignSelf: 'stretch',
    backgroundColor: '#E4E3E3',
    borderRightWidth: 1,
    borderRightColor: '#E1E1E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathIconText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  pathText: {
    flex: 1,
    fontSize: 13,
    color: '#1C1C1E',
    fontFamily: 'monospace',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 2,
  },
  originAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4F6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  originText: {
    fontSize: 12,
    color: '#3C3C43',
    fontWeight: '500',
  },
  // Code block — two-column layout: gutter | text
  codeBlock: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    overflow: 'hidden',
  },
  codeGutterCol: {
    backgroundColor: '#E4E3E3',
    borderRightWidth: 1,
    borderRightColor: '#E1E1E1',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 5,
  },
  gutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeTextCol: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 5,
  },
  codeLineNum: {
    fontSize: 11,
    color: '#8E8E93',
    width: 14,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  codePrefix: {
    fontSize: 12,
    fontWeight: '700',
    width: 10,
    fontFamily: 'monospace',
  },
  codeAdd: {
    color: '#16A34A',
  },
  codeDel: {
    color: '#DC2626',
  },
  codeNeutral: {
    color: '#8E8E93',
  },
  codeText: {
    flex: 1,
    fontSize: 11,
    color: '#1C1C1E',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  denyOuter: {
    flex: 1,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: '#CC0000',
    overflow: 'hidden',
  },
  approveOuter: {
    flex: 1,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: '#00CC33',
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  approveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C4A00',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});

// ─── Main Layout Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // ── Banner (height set dynamically in JSX) ──
  bannerImg: {
    width: '100%',
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  permissionsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#004410',
    letterSpacing: -0.5,
  },
  reposTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#004410',
    letterSpacing: -0.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grassTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#004410',
    letterSpacing: -0.3,
  },
  betaBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.22)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  betaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#006420',
    letterSpacing: 0.5,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E8C9A0',
  },
  avatarImg: {
    width: 36,
    height: 36,
  },

  // ── Get More card ──
  getMoreCard: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ACDFB6',
    overflow: 'hidden',
  },
  getMoreInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'relative',
    zIndex: 1,
  },
  getMoreIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(230, 255, 235, 0.6)',
  },
  getMoreIcon: {
    width: 52,
    height: 52,
  },
  getMoreTextWrap: {
    flex: 1,
  },
  getMoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  getMoreSub: {
    fontSize: 12,
    color: '#3C3C43',
    lineHeight: 17,
  },

  // ── VM Tabs (inside banner) ──
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  tabPillsGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 22,
    padding: 3,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 19,
    gap: 5,
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  // Active/inactive dot for VM tabs
  vmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  vmDotActive: {
    backgroundColor: '#00FF33',   // fill: #0F3
    borderColor: '#004D13',        // stroke: #004D13
  },
  vmDotInactive: {
    backgroundColor: '#C7C7CC',
    borderColor: '#AEAEB2',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6C6C70',
  },
  tabPillTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  // +Add: no background — banner image visible behind it
  tabAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Challenge section (fixed, outside ScrollView) ──
  challengeSection: {
    paddingVertical: 10,
  },
  carouselList: {
    height: 118,
    marginHorizontal: 14,
  },
  challengeCard: {
    width: CARD_W,
    height: 110,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7D7B3',
    padding: 14,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  challengeInsetShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  challengeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  challengeIcon: {
    width: 34,
    height: 34,
  },
  challengeBody: {
    flex: 1,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  challengeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  challengeSub: {
    fontSize: 12,
    color: '#3C5A40',
    marginBottom: 8,
    lineHeight: 16,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    width: '4%',
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },

  // ── Scroll (threads / perms / repos) ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },

  // ── Recent Threads ──
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    marginBottom: 8,
    marginTop: 2,
  },
  threadCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  ccbaBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#39CE5E',
    backgroundColor: '#DFFFE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ccbaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A7A35',
    letterSpacing: 0.3,
  },
  threadTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  threadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  threadMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },

  // ── Bottom Nav ──
  bottomNav: {
    alignItems: 'center',
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  bottomNavPill: {
    flexDirection: 'row',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 3,
    borderRadius: 70,
  },
  navItemActive: {
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.10)',
  },
  navIconWrap: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navImg: {
    width: 24,
    height: 24,
  },
  // Notification badge — shows pending permission count
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifCount: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
});

// ─── Repo Screen Styles ────────────────────────────────────────────────────────

const repoStyles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  // Red background revealed when swiping left
  deleteBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    marginHorizontal: 14,
    marginBottom: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 22,
  },
  deletedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  // White card that slides left
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
  },
  repoName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  repoBranch: {
    fontSize: 12,
    color: '#8E8E93',
  },
  repoBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  repoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 10,
  },
});

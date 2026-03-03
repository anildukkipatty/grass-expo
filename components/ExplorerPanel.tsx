import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import { fenceColors } from '@/constants/markdownStyles';
import { GrassColors } from '@/constants/theme';
import { useWebSocket, DirEntry } from '@/hooks/use-websocket';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);

// --- file-type helpers ---
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
  '.mjs': 'javascript', '.cjs': 'javascript', '.d.ts': 'typescript',
  '.json': 'json', '.py': 'python', '.pyi': 'python',
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash',
};

function getExt(path: string): string {
  const m = path.match(/(\.[^./]+)$/);
  return m ? m[1].toLowerCase() : '';
}
function isImage(path: string): boolean { return IMAGE_EXTS.has(getExt(path)); }
function getLang(path: string): string | undefined { return EXT_TO_LANG[getExt(path)]; }

// --- syntax renderer helpers ---
function resolveTokenStyles(classNames: string[], stylesheet: Record<string, any>): any[] {
  const classes = classNames.flatMap((c: string) => c.split(' '));
  return classes.map((cls: string) => stylesheet[cls]).filter(Boolean);
}

function renderNodes(nodes: any[], stylesheet: Record<string, any>, baseStyle: any): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'text') return node.value as string;
    if (node.children) {
      const tokenStyles = resolveTokenStyles(node.properties?.className ?? [], stylesheet);
      return (
        <Text key={i} style={[baseStyle, ...tokenStyles]}>
          {renderNodes(node.children, stylesheet, baseStyle)}
        </Text>
      );
    }
    return null;
  });
}

// --- misc helpers ---
function lastSegment(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

const SKELETON_WIDTHS = [120, 90, 140, 75, 110, 95, 130, 85, 105, 70];

function SkeletonRows({ c }: { c: typeof GrassColors['light'] }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={styles.listContent}>
      {SKELETON_WIDTHS.map((w, i) => (
        <Animated.View key={i} style={[styles.skeletonRow, { opacity }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: c.badgeText }]} />
          <View style={[styles.skeletonLabel, { backgroundColor: c.badgeText, width: w }]} />
        </Animated.View>
      ))}
    </View>
  );
}

export function ExplorerPanel({
  wsUrl,
  repoPath,
  theme,
}: {
  wsUrl: string;
  repoPath: string;
  theme: 'light' | 'dark';
}) {
  const c = GrassColors[theme];
  const ws = useWebSocket(wsUrl);
  const [currentPath, setCurrentPath] = useState(repoPath);

  useEffect(() => {
    if (!ws.connected) return;
    ws.listDir(currentPath, repoPath);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, ws.connected]);

  function handleEntryTap(entry: DirEntry) {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path);
    } else {
      ws.readFile(entry.path, repoPath);
    }
  }

  function goUp() {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length === 0) return;
    const parent = '/' + parts.slice(0, -1).join('/');
    if (currentPath === repoPath) return;
    if (parent.length < repoPath.length) return;
    setCurrentPath(parent || '/');
  }

  const atRoot = currentPath === repoPath;

  // --- right panel content ---
  function renderFileContent() {
    if (!ws.fileContent) {
      return (
        <View style={styles.placeholder}>
          <Ionicons name="document-text-outline" size={40} color={c.badgeText} style={{ opacity: 0.4 }} />
          <Text style={[styles.placeholderText, { color: c.badgeText }]}>Select a file to view</Text>
        </View>
      );
    }

    const { path, content, size } = ws.fileContent;

    if (isImage(path)) {
      const ext = getExt(path).toUpperCase().slice(1);
      return (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={48} color={c.badgeText} style={{ opacity: 0.5 }} />
          <Text style={[styles.imagePlaceholderLabel, { color: c.badgeText }]}>{ext} image</Text>
          <Text style={[styles.imagePlaceholderSize, { color: c.badgeText }]}>{formatSize(size)}</Text>
        </View>
      );
    }

    const lang = getLang(path);
    const colors = fenceColors(theme);
    const prismStyle = theme === 'light' ? oneLight : oneDark;
    const baseBg = (prismStyle['pre[class*="language-"]']?.background ?? colors.bg) as string;
    const baseColor = (prismStyle['code[class*="language-"]']?.color ?? undefined) as string | undefined;

    if (lang) {
      const renderer = ({ rows, stylesheet }: { rows: any[]; stylesheet: Record<string, any> }) => (
        <View style={[styles.codeContainer, { backgroundColor: baseBg }]}>
          {rows.map((row, lineIndex) => (
            <View key={lineIndex} style={styles.lineRow}>
              <Text style={[styles.lineNum, { color: c.badgeText }]}>
                {lineIndex + 1}
              </Text>
              <Text style={[styles.lineText, baseColor ? { color: baseColor } : undefined]}>
                {renderNodes(row.children ?? [], stylesheet, styles.lineText)}
              </Text>
            </View>
          ))}
        </View>
      );

      return (
        <ScrollView
          style={[styles.codeScroll, { backgroundColor: baseBg }]}
          horizontal
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <ScrollView
            nestedScrollEnabled
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <SyntaxHighlighter
              language={lang}
              style={prismStyle}
              renderer={renderer}
              CodeTag={View}
              PreTag={View}
            >
              {content}
            </SyntaxHighlighter>
          </ScrollView>
        </ScrollView>
      );
    }

    // Plain text fallback
    return (
      <ScrollView style={[styles.codeScroll, { backgroundColor: colors.bg }]} contentContainerStyle={styles.plainCodeContent}>
        <Text style={[styles.codeText, { color: colors.text }]}>
          {content}
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left panel — file tree */}
      <View style={[styles.leftPanel, { borderRightColor: c.border }]}>
        <View style={[styles.treeHeader, { borderBottomColor: c.border, backgroundColor: c.barBg }]}>
          <TouchableOpacity
            disabled={atRoot}
            onPress={goUp}
            style={[styles.backBtn, atRoot && styles.backBtnDisabled]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={18} color={atRoot ? c.badgeText + '44' : c.badgeText} />
          </TouchableOpacity>
          <Text style={[styles.treeHeaderTitle, { color: c.text }]} numberOfLines={1}>
            {lastSegment(currentPath) || '/'}
          </Text>
        </View>

        {ws.dirListing === null ? (
          <SkeletonRows c={c} />
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {ws.dirListing.length === 0 ? (
              <Text style={[styles.emptyMsg, { color: c.badgeText }]}>Empty folder</Text>
            ) : (
              ws.dirListing.map(entry => (
                <TouchableOpacity
                  key={entry.path}
                  style={styles.entryRow}
                  onPress={() => handleEntryTap(entry)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={entry.type === 'directory' ? 'folder-outline' : 'document-outline'}
                    size={16}
                    color={entry.type === 'directory' ? c.accent : c.badgeText}
                    style={styles.entryIcon}
                  />
                  <Text style={[styles.entryName, { color: c.text }]} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  {entry.type === 'file' && entry.size != null && (
                    <Text style={[styles.entrySize, { color: c.badgeText }]}>
                      {formatSize(entry.size)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Right panel — file content */}
      <View style={[styles.rightPanel, { backgroundColor: c.bg }]}>
        {ws.fileContent && (
          <View style={[styles.fileHeaderBar, { backgroundColor: c.barBg, borderBottomColor: c.border }]}>
            <Ionicons
              name={isImage(ws.fileContent.path) ? 'image-outline' : 'document-text-outline'}
              size={14}
              color={c.badgeText}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.fileHeaderName, { color: c.text }]} numberOfLines={1}>
              {lastSegment(ws.fileContent.path)}
            </Text>
            <Text style={[styles.fileHeaderSize, { color: c.badgeText }]}>
              {formatSize(ws.fileContent.size)}
            </Text>
          </View>
        )}
        {renderFileContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: 260,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  backBtn: {
    padding: 4,
  },
  backBtnDisabled: {
    opacity: 0.3,
  },
  treeHeaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: 'ui-monospace',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  skeletonIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    opacity: 0.4,
    flexShrink: 0,
  },
  skeletonLabel: {
    height: 11,
    borderRadius: 4,
    opacity: 0.35,
  },
  listContent: {
    paddingVertical: 4,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  entryIcon: {
    flexShrink: 0,
  },
  entryName: {
    flex: 1,
    fontSize: 13,
    letterSpacing: -0.1,
    fontFamily: 'ui-monospace',
  },
  entrySize: {
    fontSize: 11,
    fontFamily: 'ui-monospace',
    flexShrink: 0,
  },
  emptyMsg: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 16,
    textAlign: 'center',
  },
  rightPanel: {
    flex: 1,
  },
  fileHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileHeaderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'ui-monospace',
    letterSpacing: -0.2,
  },
  fileHeaderSize: {
    fontSize: 11,
    fontFamily: 'ui-monospace',
    marginLeft: 8,
  },
  codeScroll: {
    flex: 1,
  },
  // Syntax-highlighted code
  codeContainer: {
    paddingVertical: 6,
    paddingLeft: 4,
    paddingRight: 12,
    minWidth: '100%',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: -5,
  },
  lineNum: {
    width: 36,
    textAlign: 'right',
    paddingRight: 10,
    fontFamily: 'ui-monospace',
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.5,
    flexShrink: 0,
  },
  lineText: {
    flex: 1,
    fontFamily: 'ui-monospace',
    fontSize: 12,
    lineHeight: 17,
  },
  // Plain text fallback
  plainCodeContent: {
    padding: 12,
  },
  codeText: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  // No-file placeholder
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
  },
  // Image placeholder
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderLabel: {
    fontSize: 14,
    fontFamily: 'ui-monospace',
  },
  imagePlaceholderSize: {
    fontSize: 12,
    fontFamily: 'ui-monospace',
  },
});

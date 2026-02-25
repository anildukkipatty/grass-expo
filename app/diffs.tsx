import React, { useMemo, useSyncExternalStore } from 'react';
import { ScrollView, Text, StyleSheet, SafeAreaView, View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';

// Simple reactive store so the diffs page re-renders when data arrives
let _diffText = '';
let _listeners = new Set<() => void>();
export const diffStore = {
  get: () => _diffText,
  set: (v: string) => { _diffText = v; _listeners.forEach(l => l()); },
  subscribe: (l: () => void) => { _listeners.add(l); return () => { _listeners.delete(l); }; },
};

type FileDiff = {
  filename: string;
  lines: string[];
  status: 'modified' | 'new' | 'deleted' | 'renamed';
  renamedFrom?: string;
  additions: number;
  deletions: number;
};

function parseFileDiffs(text: string): FileDiff[] {
  const lines = text.split('\n');
  const files: FileDiff[] = [];
  let current: FileDiff | null = null;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/^diff --git a\/.+ b\/(.+)$/);
      current = { filename: match?.[1] ?? 'unknown', lines: [], status: 'modified', additions: 0, deletions: 0 };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith('new file mode')) { current.status = 'new'; continue; }
    if (line.startsWith('deleted file mode')) { current.status = 'deleted'; continue; }
    if (line.startsWith('rename from ')) { current.status = 'renamed'; current.renamedFrom = line.slice(12); continue; }
    if (line.startsWith('rename to ')) continue;
    if (line.startsWith('--- ') || line.startsWith('+++ ')) continue;
    if (line.startsWith('index ') || line.startsWith('similarity index')) continue;
    if (line.startsWith('+')) current.additions++;
    else if (line.startsWith('-')) current.deletions++;
    current.lines.push(line);
  }

  if (files.length === 0 && text.trim()) {
    files.push({ filename: 'diff', lines, status: 'modified', additions: 0, deletions: 0 });
  }

  return files;
}

type LineInfo = { text: string; oldNum: string; newNum: string; kind: 'add' | 'del' | 'hunk' | 'ctx' };

function buildLines(rawLines: string[]): LineInfo[] {
  const result: LineInfo[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of rawLines) {
    if (line.startsWith('@@')) {
      // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldLine = parseInt(m[1], 10);
        newLine = parseInt(m[2], 10);
      }
      result.push({ text: line, oldNum: '', newNum: '', kind: 'hunk' });
    } else if (line.startsWith('+')) {
      result.push({ text: line, oldNum: '', newNum: String(newLine), kind: 'add' });
      newLine++;
    } else if (line.startsWith('-')) {
      result.push({ text: line, oldNum: String(oldLine), newNum: '', kind: 'del' });
      oldLine++;
    } else {
      result.push({ text: line, oldNum: String(oldLine), newNum: String(newLine), kind: 'ctx' });
      oldLine++;
      newLine++;
    }
  }
  return result;
}

function DiffLineView({ info, colors }: { info: LineInfo; colors: typeof GrassColors.dark }) {
  let lineColor = colors.text;
  let bgColor = 'transparent';
  if (info.kind === 'add') {
    lineColor = '#2dd4a8';
    bgColor = 'rgba(45, 212, 168, 0.08)';
  } else if (info.kind === 'del') {
    lineColor = '#ff5f57';
    bgColor = 'rgba(255, 95, 87, 0.08)';
  } else if (info.kind === 'hunk') {
    lineColor = colors.badgeText;
  }

  return (
    <View style={[styles.lineRow, { backgroundColor: bgColor }]}>
      <Text style={[styles.lineNum, { color: colors.badgeText }]}>{info.oldNum.padStart(4)}</Text>
      <Text style={[styles.lineNum, { color: colors.badgeText }]}>{info.newNum.padStart(4)}</Text>
      <Text style={[styles.lineText, { color: lineColor }]}>{info.text}</Text>
    </View>
  );
}

const statusLabels: Record<FileDiff['status'], string> = {
  modified: 'M',
  new: 'N',
  deleted: 'D',
  renamed: 'R',
};
const statusColors: Record<FileDiff['status'], string> = {
  modified: '#e8a317',
  new: '#2dd4a8',
  deleted: '#ff5f57',
  renamed: '#7c6eff',
};

function FileBox({ file, colors }: { file: FileDiff; colors: typeof GrassColors.dark }) {
  const lines = useMemo(() => buildLines(file.lines), [file.lines]);
  return (
    <View style={[styles.fileBox, { borderColor: colors.border }]}>
      <View style={[styles.fileHeader, { backgroundColor: colors.barBg, borderBottomColor: colors.border }]}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[file.status] + '22' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors[file.status] }]}>
            {statusLabels[file.status]}
          </Text>
        </View>
        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
          {file.renamedFrom ? `${file.renamedFrom} → ${file.filename}` : file.filename}
        </Text>
        <View style={{ flex: 1 }} />
        {file.additions > 0 && (
          <Text style={styles.statAdd}>+{file.additions}</Text>
        )}
        {file.deletions > 0 && (
          <Text style={styles.statDel}>-{file.deletions}</Text>
        )}
      </View>
      <View style={styles.fileBody}>
        {lines.map((info, i) => (
          <DiffLineView key={i} info={info} colors={colors} />
        ))}
      </View>
    </View>
  );
}

export default function Diffs() {
  const [theme] = useTheme();
  const c = GrassColors[theme];
  const text = useSyncExternalStore(diffStore.subscribe, diffStore.get);
  const files = useMemo(() => parseFileDiffs(text), [text]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {!text ? (
        <View style={styles.empty}>
          <ActivityIndicator color={c.badgeText} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: c.badgeText }]}>Loading diffs…</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {files.map((file, i) => (
            <FileBox key={i} file={file} colors={c} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 12, gap: 16 },
  fileBox: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: 'ui-monospace',
    fontSize: 11,
    fontWeight: '700',
  },
  fileName: {
    fontFamily: 'ui-monospace',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  statAdd: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
    fontWeight: '600',
    color: '#2dd4a8',
  },
  statDel: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
    fontWeight: '600',
    color: '#ff5f57',
  },
  fileBody: {
    paddingVertical: 4,
  },
  lineRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  lineNum: {
    fontFamily: 'ui-monospace',
    fontSize: 11,
    lineHeight: 18,
    width: 36,
    textAlign: 'right',
    marginRight: 8,
    opacity: 0.6,
  },
  lineText: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
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

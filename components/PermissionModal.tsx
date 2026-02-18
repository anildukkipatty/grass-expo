import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GrassColors } from '@/constants/theme';
import { Fonts } from '@/constants/theme';
import { fenceColors } from '@/constants/markdownStyles';
import { PermissionItem } from '@/hooks/use-websocket';

interface Props {
  item: PermissionItem;
  onAllow: () => void;
  onDeny: () => void;
  theme: 'light' | 'dark';
}

interface Section { label: string; code: string }

function formatSections(toolName: string, input: Record<string, unknown>): Section[] {
  switch (toolName) {
    case 'Write': {
      const content = (input.content as string) || '';
      const preview = content.slice(0, 500) + (content.length > 500 ? '\n...' : '');
      return [{ label: `File: ${input.file_path}`, code: preview }];
    }
    case 'Edit':
      return [
        { label: `File: ${input.file_path}  —  Replace`, code: (input.old_string as string || '').slice(0, 300) },
        { label: 'With', code: (input.new_string as string || '').slice(0, 300) },
      ];
    case 'Bash':
      return [{ label: 'Command', code: String(input.command ?? '') }];
    default:
      return [{ label: '', code: JSON.stringify(input, null, 2) }];
  }
}

export function PermissionModal({ item, onAllow, onDeny, theme }: Props) {
  const c = GrassColors[theme];
  const mono = Fonts?.mono ?? 'monospace';
  const fence = fenceColors(theme);
  const sections = formatSections(item.toolName, item.input);

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Permission Request</Text>
          <Text style={[styles.toolName, { color: c.badgeText }]}>{item.toolName}</Text>
          <ScrollView style={styles.body}>
            {sections.map((sec, idx) => (
              <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
                {sec.label ? (
                  <Text style={[styles.sectionLabel, { color: fence.text, backgroundColor: fence.bg, borderColor: fence.border, fontFamily: mono }]}>
                    {sec.label}
                  </Text>
                ) : null}
                <View style={[styles.codeBlock, { backgroundColor: fence.bg, borderColor: fence.border }, sec.label ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={{ fontFamily: mono, fontSize: 12, lineHeight: 18, color: fence.text }}>{sec.code}</Text>
                  </ScrollView>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.denyBtn, { borderColor: c.border }]} onPress={onDeny}>
              <Text style={[styles.denyText, { color: c.text }]}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.allowBtn} onPress={onAllow}>
              <Text style={styles.allowText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    gap: 12,
    maxHeight: '80%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  toolName: {
    fontSize: 13,
  },
  body: {
    maxHeight: 300,
  },
  sectionLabel: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  codeBlock: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  denyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  denyText: {
    fontSize: 14,
  },
  allowBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2ecc71',
  },
  allowText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GrassColors } from '@/constants/theme';
import { PermissionItem } from '@/hooks/use-websocket';

interface Props {
  item: PermissionItem;
  onAllow: () => void;
  onDeny: () => void;
  theme: 'light' | 'dark';
}

function formatInput(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case 'Write': {
      const content = (input.content as string) || '';
      const preview = content.slice(0, 500) + (content.length > 500 ? '\n...' : '');
      return `File: ${input.file_path}\n\nContent (${content.length} chars):\n\n${preview}`;
    }
    case 'Edit':
      return `File: ${input.file_path}\n\nReplace:\n${(input.old_string as string || '').slice(0, 300)}\n\nWith:\n${(input.new_string as string || '').slice(0, 300)}`;
    case 'Bash':
      return `Command:\n${input.command}`;
    default:
      return JSON.stringify(input, null, 2);
  }
}

export function PermissionModal({ item, onAllow, onDeny, theme }: Props) {
  const c = GrassColors[theme];

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Permission Request</Text>
          <Text style={[styles.toolName, { color: c.badgeText }]}>{item.toolName}</Text>
          <ScrollView style={styles.body}>
            <Text style={[styles.inputText, { color: c.text }]}>
              {formatInput(item.toolName, item.input)}
            </Text>
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
    maxHeight: 250,
  },
  inputText: {
    fontSize: 13,
    fontFamily: 'ui-monospace',
    lineHeight: 18,
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

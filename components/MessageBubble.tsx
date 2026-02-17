import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GrassColors } from '@/constants/theme';

interface Props {
  role: 'user' | 'assistant' | 'error';
  content: string;
  badge?: string;
  theme: 'light' | 'dark';
}

export function MessageBubble({ role, content, badge, theme }: Props) {
  const c = GrassColors[theme];

  const bubbleStyle = role === 'user'
    ? { backgroundColor: c.userBubble, alignSelf: 'flex-end' as const, borderBottomRightRadius: 4 }
    : role === 'assistant'
    ? { backgroundColor: c.assistantBubble, alignSelf: 'flex-start' as const, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.border }
    : { backgroundColor: c.errorBubble, alignSelf: 'center' as const, borderWidth: 1, borderColor: c.errorText };

  const textColor = role === 'user'
    ? c.userBubbleText
    : role === 'assistant'
    ? c.assistantBubbleText
    : c.errorText;

  return (
    <View style={[styles.bubble, bubbleStyle]}>
      <Text style={[styles.text, { color: textColor }]}>{content}</Text>
      {badge ? <Text style={[styles.badge, { color: c.badgeText }]}>{badge}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '90%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginVertical: 5,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  badge: {
    fontSize: 11,
    marginTop: 4,
  },
});

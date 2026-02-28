import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { GrassColors } from '@/constants/theme';
import { markdownStyles } from '@/constants/markdownStyles';
import { SyntaxBlock } from '@/components/SyntaxBlock';

interface Props {
  role: 'user' | 'assistant' | 'error';
  content: string;
  badge?: string;
  theme: 'light' | 'dark';
}

function makeFenceRules(theme: 'light' | 'dark') {
  return {
    fence: (node: any) => {
      let content = node.content as string;
      if (content.endsWith('\n')) content = content.slice(0, -1);
      const language = (node.sourceInfo as string | undefined)?.trim() || 'tsx';
      return (
        <SyntaxBlock key={node.key} code={content} language={language} theme={theme} />
      );
    },
  };
}

export function MessageBubble({ role, content, badge, theme }: Props) {
  const c = GrassColors[theme];
  const fenceRules = React.useMemo(() => makeFenceRules(theme), [theme]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const didAnimate = useRef(false);

  useEffect(() => {
    if (didAnimate.current) return;
    didAnimate.current = true;
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const bubbleStyle = role === 'user'
    ? { backgroundColor: c.userBubble, alignSelf: 'flex-end' as const, borderBottomRightRadius: 5 }
    : role === 'assistant'
    ? { backgroundColor: c.assistantBubble, alignSelf: 'flex-start' as const, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: c.border }
    : { backgroundColor: c.errorBubble, alignSelf: 'center' as const, borderWidth: 1, borderColor: c.errorText };

  const textColor = role === 'user'
    ? c.userBubbleText
    : role === 'assistant'
    ? c.assistantBubbleText
    : c.errorText;

  return (
    <Animated.View
      style={[
        styles.bubble,
        bubbleStyle,
        role === 'assistant' && styles.assistantBubbleLayout,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {role === 'assistant' ? (
        <View style={styles.markdownWrapper}>
          <Markdown style={markdownStyles(theme)} rules={fenceRules}>
            {content}
          </Markdown>
        </View>
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{content}</Text>
      )}
      {badge ? <Text style={[styles.badge, { color: c.badgeText }]}>{badge}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 4,
  },
  assistantBubbleLayout: {
    width: '88%',
  },
  markdownWrapper: {
    width: '100%',
  },
  text: {
    fontSize: 16,
    lineHeight: 23,
  },
  badge: {
    fontSize: 11,
    marginTop: 5,
    letterSpacing: 0.1,
  },
});

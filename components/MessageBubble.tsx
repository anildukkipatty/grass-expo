import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { GrassColors } from '@/constants/theme';
import { markdownStyles } from '@/constants/markdownStyles';
import { SyntaxBlock } from '@/components/SyntaxBlock';

interface Props {
  role: 'user' | 'assistant' | 'error' | 'tool';
  content: string;
  badge?: string;
  theme: 'light' | 'dark';
}

// Normalize tool name: lowercase, strip underscores/spaces (handles both PascalCase and snake_case)
function toolIcon(toolName: string): string {
  const key = toolName.toLowerCase().replace(/[_\s]/g, '');
  switch (key) {
    // File read
    case 'read':
    case 'readfile':
    case 'notebookread':
      return '📖';
    // File write / create
    case 'write':
    case 'writefile':
      return '✏️';
    // File edit / patch
    case 'edit':
    case 'editfile':
    case 'multiedit':
    case 'patch':
      return '📝';
    // Shell / terminal
    case 'bash':
    case 'shell':
    case 'terminal':
    case 'execute':
      return '⚡';
    // Content search
    case 'grep':
    case 'search':
      return '🔍';
    // File/path search
    case 'glob':
    case 'ls':
    case 'listdir':
    case 'listfiles':
      return '🗂️';
    // Web fetch
    case 'webfetch':
    case 'fetch':
    case 'http':
      return '🌐';
    // Web search
    case 'websearch':
      return '🔎';
    // Notebook
    case 'notebookedit':
      return '📒';
    // Task / subagent
    case 'task':
    case 'agent':
    case 'subagent':
      return '🤖';
    // Todo
    case 'todoread':
    case 'todowrite':
      return '📋';
    // Git / diff
    case 'diff':
    case 'gitdiff':
      return '🔀';
    // MCP / plugin tools
    case 'mcptool':
    case 'mcp':
      return '🔌';
    default:
      return '🔧';
  }
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

  // Tool call row
  if (role === 'tool') {
    const toolName = content.split(': ')[0];
    const icon = toolIcon(toolName);
    return (
      <Animated.View
        style={[styles.toolRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <Text style={[styles.toolIcon, { color: c.badgeText }]}>{icon}</Text>
        <Text style={[styles.toolLabel, { color: c.badgeText }]} numberOfLines={1}>{content}</Text>
      </Animated.View>
    );
  }

  // User bubble (right-aligned, colored)
  if (role === 'user') {
    return (
      <Animated.View
        style={[
          styles.bubble,
          styles.userBubble,
          { backgroundColor: c.userBubble, borderColor: c.userBubbleBorder, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={[styles.text, { color: c.userBubbleText }]}>{content}</Text>
        {badge ? <Text style={[styles.badge, { color: c.badgeText }]}>{badge}</Text> : null}
      </Animated.View>
    );
  }

  // Error bubble (centered)
  if (role === 'error') {
    return (
      <Animated.View
        style={[
          styles.bubble,
          styles.errorBubble,
          { backgroundColor: c.errorBubble, borderColor: c.errorText, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={[styles.text, { color: c.errorText }]}>{content}</Text>
      </Animated.View>
    );
  }

  // Assistant — full width, no bubble
  return (
    <Animated.View
      style={[styles.assistantRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <Markdown style={markdownStyles(theme)} rules={fenceRules}>
        {content}
      </Markdown>
      {badge ? <Text style={[styles.badge, { color: c.badgeText }]}>{badge}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 20,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    marginRight: 12,
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 20,
  },
  errorBubble: {
    alignSelf: 'center',
    borderWidth: 1,
  },
  assistantRow: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginVertical: 4,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  toolIcon: {
    fontSize: 14,
    fontFamily: 'ui-monospace',
  },
  toolLabel: {
    fontSize: 13,
    fontFamily: 'ui-monospace',
    flex: 1,
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

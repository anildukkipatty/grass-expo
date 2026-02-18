import React from 'react';
import { View, Text, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Highlight, themes } from 'prism-react-renderer';
import { GrassColors } from '@/constants/theme';
import { markdownStyles } from '@/constants/markdownStyles';

interface Props {
  role: 'user' | 'assistant' | 'error';
  content: string;
  badge?: string;
  theme: 'light' | 'dark';
}

function makeFenceRules(theme: 'light' | 'dark') {
  const hlTheme = theme === 'dark' ? themes.vsDark : themes.github;
  return {
    fence: (node: any, _ch: any, _p: any, styleObj: any) => {
      let content = node.content as string;
      if (content.endsWith('\n')) content = content.slice(0, -1);
      const language = (node.sourceInfo as string | undefined)?.trim() || 'text';
      return (
        <View key={node.key} style={[styleObj.fence, { backgroundColor: hlTheme.plain.backgroundColor as string }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Highlight theme={hlTheme} code={content} language={language as any}>
              {({ tokens, getTokenProps }) => (
                <RNText style={[styleObj.fence, { margin: 0, backgroundColor: 'transparent' }]}>
                  {tokens.map((line, i) => (
                    <RNText key={i}>
                      {line.map((token, j) => {
                        const tokenProps = getTokenProps({ token });
                        return (
                          <RNText
                            key={j}
                            style={{ color: (tokenProps.style as any)?.color ?? (hlTheme.plain.color as string) }}
                          >
                            {token.content}
                          </RNText>
                        );
                      })}
                      {'\n'}
                    </RNText>
                  ))}
                </RNText>
              )}
            </Highlight>
          </ScrollView>
        </View>
      );
    },
  };
}

export function MessageBubble({ role, content, badge, theme }: Props) {
  const c = GrassColors[theme];
  const fenceRules = React.useMemo(() => makeFenceRules(theme), [theme]);

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
      {role === 'assistant' ? (
        <Markdown style={markdownStyles(theme)} rules={fenceRules}>
          {content}
        </Markdown>
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{content}</Text>
      )}
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

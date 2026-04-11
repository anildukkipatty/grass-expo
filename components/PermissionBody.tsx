import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { fenceColors, markdownStyles } from '@/constants/markdownStyles';
import { Fonts } from '@/constants/theme';
import { SyntaxBlock } from '@/components/SyntaxBlock';

interface Section { label: string; code: string; language: string }

function makeFenceRules(theme: 'light' | 'dark') {
  return {
    fence: (node: any) => {
      let content = node.content as string;
      if (content.endsWith('\n')) content = content.slice(0, -1);
      const language = (node.sourceInfo as string | undefined)?.trim() || 'tsx';
      return <SyntaxBlock key={node.key} code={content} language={language} theme={theme} />;
    },
  };
}

function formatSections(toolName: string, input: Record<string, unknown>): Section[] {
  switch (toolName) {
    case 'Write': {
      const content = (input.content as string) || '';
      const preview = content.slice(0, 500) + (content.length > 500 ? '\n...' : '');
      return [{ label: `File: ${input.file_path}`, code: preview, language: 'tsx' }];
    }
    case 'Edit':
      return [
        { label: `File: ${input.file_path}  —  Replace`, code: (input.old_string as string || '').slice(0, 300), language: 'tsx' },
        { label: 'With', code: (input.new_string as string || '').slice(0, 300), language: 'tsx' },
      ];
    case 'Bash':
      return [{ label: 'Command', code: String(input.command ?? ''), language: 'bash' }];
    default:
      return [{ label: '', code: JSON.stringify(input, null, 2), language: 'json' }];
  }
}

interface Props {
  toolName: string;
  input: Record<string, unknown>;
  theme: 'light' | 'dark';
}

export function PermissionBody({ toolName, input, theme }: Props) {
  const fence = fenceColors(theme);
  const mono = Fonts?.mono ?? 'monospace';
  const fenceRules = React.useMemo(() => makeFenceRules(theme), [theme]);

  if (toolName === 'ExitPlanMode') {
    const planText = (input.plan as string) || '';
    return (
      <Markdown style={markdownStyles(theme)} rules={fenceRules}>
        {planText}
      </Markdown>
    );
  }

  const sections = formatSections(toolName, input);
  return (
    <>
      {sections.map((sec, idx) => (
        <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
          {sec.label ? (
            <Text style={[styles.sectionLabel, { color: fence.text, backgroundColor: fence.bg, borderColor: fence.border, fontFamily: mono }]}>
              {sec.label}
            </Text>
          ) : null}
          <SyntaxBlock code={sec.code} language={sec.language} theme={theme} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
});

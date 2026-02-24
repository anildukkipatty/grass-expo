import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

function resolveTokenStyles(classNames: string[], stylesheet: Record<string, any>): any[] {
  const classes = classNames.flatMap((c: string) => c.split(' '));
  return classes.map((cls: string) => stylesheet[cls]).filter(Boolean);
}

function renderNodes(nodes: any[], stylesheet: Record<string, any>, baseStyle: any): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'text') {
      return node.value as string;
    }
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

interface Props {
  code: string;
  language?: string;
  theme: 'light' | 'dark';
}

export function SyntaxBlock({ code, language, theme }: Props) {
  const colors = fenceColors(theme);
  const prismStyle = theme === 'light' ? oneLight : oneDark;
  const baseBg = (prismStyle['pre[class*="language-"]']?.background ?? colors.bg) as string;
  const baseColor = (prismStyle['code[class*="language-"]']?.color ?? undefined) as string | undefined;

  const renderer = ({ rows, stylesheet }: { rows: any[]; stylesheet: Record<string, any> }) => (
    <View style={[styles.container, { backgroundColor: baseBg, borderColor: colors.border }]}>
      <Text style={[styles.text, baseColor ? { color: baseColor } : undefined]}>
        {renderNodes(rows, stylesheet, styles.text)}
      </Text>
    </View>
  );

  return (
    <SyntaxHighlighter
      language={language || 'tsx'}
      style={prismStyle}
      renderer={renderer}
      CodeTag={View}
      PreTag={View}
    >
      {code}
    </SyntaxHighlighter>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 6,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
});

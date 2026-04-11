import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { fenceColors, markdownStyles } from '@/constants/markdownStyles';
import { Fonts, GrassColors } from '@/constants/theme';
import { SyntaxBlock } from '@/components/SyntaxBlock';

interface Section { label: string; code: string; language: string }

type AskQuestion = {
  question: string;
  header: string;
  multiSelect: boolean;
  options: Array<{ label: string; description?: string }>;
};

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
  answers?: Record<number, number[]>;
  onAnswersChange?: (next: Record<number, number[]>) => void;
}

export function PermissionBody({ toolName, input, theme, answers, onAnswersChange }: Props) {
  const fence = fenceColors(theme);
  const mono = Fonts?.mono ?? 'monospace';
  const fenceRules = React.useMemo(() => makeFenceRules(theme), [theme]);
  const c = GrassColors[theme];

  if (toolName === 'ExitPlanMode') {
    const planText = (input.plan as string) || '';
    return (
      <Markdown style={markdownStyles(theme)} rules={fenceRules}>
        {planText}
      </Markdown>
    );
  }

  if (toolName === 'AskUserQuestion') {
    const rawQuestions = input.questions;
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      // Fall through to default JSON render
      const sections = formatSections(toolName, input);
      return (
        <>
          {sections.map((sec, idx) => (
            <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
              <SyntaxBlock code={sec.code} language={sec.language} theme={theme} />
            </View>
          ))}
        </>
      );
    }

    const questions = rawQuestions as AskQuestion[];

    function handleToggle(qIdx: number, optIdx: number, multiSelect: boolean) {
      if (!onAnswersChange) return;
      const current = answers?.[qIdx] ?? [];
      let next: number[];
      if (multiSelect) {
        next = current.includes(optIdx)
          ? current.filter(i => i !== optIdx)
          : [...current, optIdx];
      } else {
        next = [optIdx];
      }
      onAnswersChange({ ...(answers ?? {}), [qIdx]: next });
    }

    return (
      <View style={ask.container}>
        {questions.map((q, qIdx) => {
          const selected = answers?.[qIdx] ?? [];
          return (
            <View key={qIdx} style={qIdx > 0 ? [ask.questionBlock, { marginTop: 14 }] : ask.questionBlock}>
              <View style={ask.headerRow}>
                <View style={ask.headerChip}>
                  <Text style={ask.headerChipText} numberOfLines={1}>{q.header}</Text>
                </View>
                {q.multiSelect && (
                  <Text style={[ask.multiHint, { color: c.badgeText ?? '#8E8E93' }]}>Select all that apply</Text>
                )}
              </View>
              <Text style={[ask.questionText, { color: c.text }]}>{q.question}</Text>
              <View style={ask.optionsList}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected.includes(optIdx);
                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[
                        ask.optionRow,
                        { borderColor: isSelected ? '#22c55e' : c.border, backgroundColor: isSelected ? '#E6FFF0' : 'transparent' },
                      ]}
                      onPress={() => handleToggle(qIdx, optIdx, q.multiSelect)}
                      activeOpacity={onAnswersChange ? 0.7 : 1}
                    >
                      <View style={[
                        q.multiSelect ? ask.checkbox : ask.radio,
                        isSelected && ask.indicatorSelected,
                      ]}>
                        {isSelected && (
                          q.multiSelect
                            ? <Text style={ask.checkmark}>✓</Text>
                            : <View style={ask.radioDot} />
                        )}
                      </View>
                      <View style={ask.optionTextBlock}>
                        <Text style={[ask.optionLabel, { color: c.text }]}>{opt.label}</Text>
                        {opt.description ? (
                          <Text style={[ask.optionDescription, { color: c.badgeText ?? '#8E8E93' }]}>{opt.description}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
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

const ask = StyleSheet.create({
  container: {
    gap: 0,
  },
  questionBlock: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerChip: {
    backgroundColor: '#E6FFF0',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    maxWidth: 120,
  },
  headerChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14532d',
    letterSpacing: 0.4,
  },
  multiHint: {
    fontSize: 11,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  optionsList: {
    gap: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  checkmark: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 14,
  },
  optionTextBlock: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});

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

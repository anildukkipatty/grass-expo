import { GrassColors, Fonts } from '@/constants/theme';

type Theme = 'light' | 'dark';

export function markdownStyles(theme: Theme) {
  const c = GrassColors[theme];
  const mono = Fonts?.mono ?? 'monospace';
  return {
    body:                 { color: c.assistantBubbleText, fontSize: 15, lineHeight: 22, backgroundColor: 'transparent' },
    paragraph:            { marginTop: 4, marginBottom: 4, color: c.assistantBubbleText },
    heading1:             { fontWeight: '700' as const, fontSize: 20, marginTop: 8, marginBottom: 4, color: c.assistantBubbleText },
    heading2:             { fontWeight: '700' as const, fontSize: 18, marginTop: 8, marginBottom: 4, color: c.assistantBubbleText },
    heading3:             { fontWeight: '600' as const, fontSize: 16, marginTop: 6, marginBottom: 2, color: c.assistantBubbleText },
    strong:               { fontWeight: '700' as const, color: c.assistantBubbleText },
    em:                   { fontStyle: 'italic' as const, color: c.assistantBubbleText },
    code_inline:          { fontFamily: mono, fontSize: 13, backgroundColor: theme === 'light' ? '#f0f0f0' : '#0d1117', color: theme === 'light' ? '#c7254e' : '#e06c75', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
    fence:                { fontFamily: mono, fontSize: 13, lineHeight: 20, backgroundColor: theme === 'light' ? '#f6f8fa' : '#0d1117', color: theme === 'light' ? '#24292e' : '#c9d1d9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, marginVertical: 6, borderWidth: 1, borderColor: theme === 'light' ? '#e1e4e8' : '#30363d' },
    code_block:           { fontFamily: mono, fontSize: 13, lineHeight: 20, backgroundColor: theme === 'light' ? '#f6f8fa' : '#0d1117', color: theme === 'light' ? '#24292e' : '#c9d1d9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, marginVertical: 6, borderWidth: 1, borderColor: theme === 'light' ? '#e1e4e8' : '#30363d' },
    blockquote:           { borderLeftWidth: 3, borderLeftColor: c.border, paddingLeft: 10, marginLeft: 0, fontStyle: 'italic' as const, opacity: 0.8 },
    bullet_list:          { marginBottom: 4 },
    ordered_list:         { marginBottom: 4 },
    list_item:            { marginBottom: 2 },
    bullet_list_icon:     { color: c.assistantBubbleText },
    ordered_list_icon:    { color: c.assistantBubbleText },
    bullet_list_content:  { flex: 1 },
    ordered_list_content: { flex: 1 },
    link:                 { color: c.accent, textDecorationLine: 'none' as const },
    table:                { borderWidth: 1, borderColor: c.border, borderRadius: 4, marginVertical: 6 },
    tr:                   { flexDirection: 'row' as const },
    th:                   { backgroundColor: theme === 'light' ? '#f6f8fa' : '#21262d', fontWeight: '600' as const, paddingHorizontal: 8, paddingVertical: 4, borderRightWidth: 1, borderBottomWidth: 1, borderColor: c.border },
    td:                   { paddingHorizontal: 8, paddingVertical: 4, borderRightWidth: 1, borderBottomWidth: 1, borderColor: c.border },
    hr:                   { backgroundColor: c.border, height: 1, marginVertical: 8 },
  };
}

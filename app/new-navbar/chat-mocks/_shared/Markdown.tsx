import { SyntaxBlock } from "@/components/SyntaxBlock";
import React from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";

export type MarkdownTheme = {
  body: TextStyle;
  bold: TextStyle;
  italic: TextStyle;
  inlineCode: TextStyle;
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  bullet: TextStyle;
  number: TextStyle;
  hr: ViewStyle;
  table: ViewStyle;
  tableRow: ViewStyle;
  tableHeaderRow: ViewStyle;
  tableCell: TextStyle;
  tableHeaderCell: TextStyle;
  block: ViewStyle;
  listItem: ViewStyle;
  codeTheme: "light" | "dark";
  codeWrapper?: StyleProp<ViewStyle>;
};

function inline(text: string, base: TextStyle, theme: MarkdownTheme): React.ReactNode[] {
  const RE = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|~~[^~]+~~)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push(
        <Text key={k++} style={base}>
          {text.slice(last, m.index)}
        </Text>,
      );
    }
    const tk = m[1];
    if (tk.startsWith("***")) {
      out.push(
        <Text key={k++} style={[base, theme.bold, theme.italic]}>
          {tk.slice(3, -3)}
        </Text>,
      );
    } else if (tk.startsWith("**")) {
      out.push(
        <Text key={k++} style={[base, theme.bold]}>
          {tk.slice(2, -2)}
        </Text>,
      );
    } else if (tk.startsWith("*")) {
      out.push(
        <Text key={k++} style={[base, theme.italic]}>
          {tk.slice(1, -1)}
        </Text>,
      );
    } else if (tk.startsWith("`")) {
      out.push(
        <Text key={k++} style={theme.inlineCode}>
          {tk.slice(1, -1)}
        </Text>,
      );
    } else if (tk.startsWith("~~")) {
      out.push(
        <Text key={k++} style={[base, { textDecorationLine: "line-through" }]}>
          {tk.slice(2, -2)}
        </Text>,
      );
    }
    last = m.index + tk.length;
  }
  if (last < text.length) {
    out.push(
      <Text key={k++} style={base}>
        {text.slice(last)}
      </Text>,
    );
  }
  return out.length
    ? out
    : [
        <Text key={0} style={base}>
          {text}
        </Text>,
      ];
}

export function Markdown({ content, theme }: { content: string; theme: MarkdownTheme }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      const language = line.slice(3).trim().split(/\s+/)[0] || "tsx";
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        <View key={key++} style={theme.codeWrapper}>
          <SyntaxBlock
            code={codeLines.join("\n")}
            language={language}
            theme={theme.codeTheme}
          />
        </View>,
      );
      i++;
      continue;
    }

    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1 || h2 || h3) {
      const hStyle = h1 ? theme.h1 : h2 ? theme.h2 : theme.h3;
      const hText = (h1 ?? h2 ?? h3)![1];
      blocks.push(
        <Text key={key++} style={hStyle}>
          {inline(hText, hStyle, theme)}
        </Text>,
      );
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const isSep = (l: string) => /^\|[\s\-|:]+\|$/.test(l);
      const hasHeader = tableLines.length > 1 && isSep(tableLines[1]);
      const dataRows = tableLines.filter((l) => !isSep(l));
      blocks.push(
        <View key={key++} style={theme.table}>
          {dataRows.map((row, ri) => {
            const cells = row.split("|").slice(1, -1);
            const isHeader = hasHeader && ri === 0;
            return (
              <View
                key={ri}
                style={[theme.tableRow, isHeader && theme.tableHeaderRow]}
              >
                {cells.map((cell, ci) => {
                  const cellStyle = isHeader ? theme.tableHeaderCell : theme.tableCell;
                  return (
                    <Text key={ci} style={cellStyle}>
                      {inline(cell.trim(), cellStyle, theme)}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>,
      );
      continue;
    }

    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      blocks.push(
        <View key={key++} style={{ gap: 6 }}>
          {items.map((item, li) => (
            <View key={li} style={theme.listItem}>
              <Text style={theme.bullet}>{"•"}</Text>
              <Text style={[theme.body, { flex: 1 }]}>
                {inline(item, theme.body, theme)}
              </Text>
            </View>
          ))}
        </View>,
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: { n: string; t: string }[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const mm = lines[i].match(/^(\d+)\. (.*)/);
        if (mm) items.push({ n: mm[1], t: mm[2] });
        i++;
      }
      blocks.push(
        <View key={key++} style={{ gap: 6 }}>
          {items.map((item, li) => (
            <View key={li} style={theme.listItem}>
              <Text style={theme.number}>
                {item.n}
                {"."}
              </Text>
              <Text style={[theme.body, { flex: 1 }]}>
                {inline(item.t, theme.body, theme)}
              </Text>
            </View>
          ))}
        </View>,
      );
      continue;
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push(<View key={key++} style={theme.hr} />);
      i++;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    blocks.push(
      <Text key={key++} style={theme.body}>
        {inline(line, theme.body, theme)}
      </Text>,
    );
    i++;
  }

  return <View style={theme.block}>{blocks}</View>;
}

# FlatList Message Scroll Bug — Code Block Height Measurement

## Symptom

Messages below code blocks would not appear on screen. Scrolling down past
them and holding revealed the messages, but releasing snapped back to the
wrong position (spring-back). Only affected messages containing fenced code
blocks.

## Root Cause

A horizontal `ScrollView` was nested inside the custom `fence` rule renderer,
which itself rendered inside a `FlatList` cell. React Native cannot correctly
measure the intrinsic height of a cell that contains a nested `ScrollView`,
so FlatList's internal offset table became stale. The list "knew" the content
was shorter than it actually was, causing the spring-back when releasing scroll.

A secondary issue: the `markdownStyles` object defined a `fence` key with
identical styles to the custom rule. Since the custom rule completely replaces
fence rendering, this entry was dead but added confusion.

## Fix

**`components/MessageBubble.tsx`** — replaced `<ScrollView horizontal>` with
a plain `<View>` inside the fence rule. Code blocks now wrap instead of
scroll horizontally, but FlatList measures heights correctly.

**`constants/markdownStyles.ts`** — removed the duplicate `fence` style entry
(only `code_block` remains as a fallback for non-fenced code).

## Lesson

Never put a `ScrollView` inside a `FlatList` cell if you need correct height
measurement. If horizontal scroll is required for code blocks, use `onLayout`
on the cell to trigger a FlatList re-measure after the ScrollView settles.

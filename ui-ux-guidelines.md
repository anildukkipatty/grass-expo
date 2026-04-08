# UI/UX Guidelines — Grass Expo

Sourced from the UI/UX Pro Max skill. Apply these across all screens.

---

## Priority Matrix

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Accessibility | CRITICAL |
| 2 | Touch & Interaction | CRITICAL |
| 3 | Performance | HIGH |
| 4 | Layout & Responsive | HIGH |
| 5 | Typography & Color | MEDIUM |
| 6 | Animation | MEDIUM |

---

## 1. Accessibility (CRITICAL)

- **Color contrast** — Minimum 4.5:1 ratio for normal text (WCAG AA). Use `#767676` or darker on white backgrounds. `#bebebe` (~2.1:1) and `#c1c1c1` (~2.5:1) fail.
- **Accessibility labels** — All `TouchableOpacity`/pressable elements must have `accessibilityLabel` and `accessibilityRole`.
- **Focus states** — Visible focus indicators for keyboard/switch navigation.
- **Alt text** — Descriptive alt text for all meaningful images.
- **Color not the only indicator** — Never rely on color alone to convey state.

---

## 2. Touch & Interaction (CRITICAL)

- **Touch target size** — Minimum 44×44pt for all interactive elements.
- **Touch spacing** — Minimum 8pt gap between adjacent touch targets.
- **Press feedback** — All tappable cards should animate on press (scale 0.97 spring, `useNativeDriver: true`). `activeOpacity` alone is not enough.
- **Haptic feedback** — Use for confirmations and destructive actions; don't overuse.
- **No pull-to-refresh where not needed** — Disable default overscroll on non-refreshable lists.

---

## 3. Performance (HIGH)

- **FlatList over .map()** — Always use `FlatList` (or `SectionList`) for variable-length lists. `.map()` inside a ScrollView is not virtualized and degrades with scale.
- **Memoize list items** — Wrap list item components in `React.memo`. Memoize `renderItem` and `keyExtractor` with `useCallback`.
- **keyExtractor with stable ID** — Never use array index as key. Use `item.id` or another stable unique field.
- **Image optimization** — Use WebP format, `resizeMode`, and lazy loading where applicable.
- **Reduce motion** — Respect `AccessibilityInfo.isReduceMotionEnabled()` before running animations.

---

## 4. Layout & Responsive (HIGH)

- **Loading states** — Show `ActivityIndicator` or skeleton while async data loads. Never show an empty state before data has had a chance to arrive.
- **Empty states** — Include an icon/illustration + helpful message. A plain text label alone feels broken.
- **No magic numbers** — Document hardcoded layout values (e.g. tab bar height) with a comment or named constant.
- **Safe area insets** — Always account for safe area via `useSafeAreaInsets`. Never hardcode device-specific offsets.
- **No content hidden behind fixed elements** — Ensure `paddingBottom` accounts for tab bar and other fixed overlays.

---

## 5. Typography & Color (MEDIUM)

- **Minimum body font size** — 14pt minimum for secondary/meta text, 16pt preferred for body.
- **Section headers** — Use at least `#767676` on white for label/caption text (4.5:1 WCAG AA).
- **Muted/meta text** — Use `#767676` minimum. `#c1c1c1` and `#bebebe` fail contrast requirements.
- **Line height** — Use 1.5–1.75 for body text.
- **Consistent font family** — Stick to the project font system (`NationalPark.*`); don't mix with system fonts.

---

## 6. Animation (MEDIUM)

- **Duration** — Use 150–300ms for micro-interactions (press, hover, toggle).
- **Spring for press** — `Animated.spring` with `useNativeDriver: true` for card press scale. `bounciness: 0` for subtle, professional feel.
- **Transform only** — Animate `transform` and `opacity`. Never animate `width`, `height`, or `margin` (forces layout).
- **Loading animations** — Use `ActivityIndicator` or skeleton screens, not spinning icons on content.
- **Continuous animation** — Only use for loading indicators; never for decorative/idle elements.

---

## 7. Icons (MEDIUM)

- **No emoji as icons** — Use SVG icon sets (`@expo/vector-icons`: Ionicons, Feather, MaterialIcons).
- **Consistent icon set** — Pick one icon family per context and stick to it.
- **Consistent sizing** — Use fixed sizes (e.g. 20, 24, 28) and don't mix random sizes.

---

## 8. Shadows & Elevation (LOW)

- **Cross-platform shadows** — `shadowColor/shadowOffset/shadowOpacity/shadowRadius` are iOS-only. Always pair with `elevation` for Android. Be aware the visual output differs between platforms.
- **Subtle shadows** — `shadowOpacity: 0.1`, `shadowRadius: 5`, `elevation: 2` is the standard card shadow.

---

## Pre-Delivery Checklist

Before shipping any screen:

### Visual Quality
- [ ] No emojis used as icons (use `@expo/vector-icons`)
- [ ] All icon sizes consistent within a component
- [ ] Text contrast ≥ 4.5:1 on its background

### Interaction
- [ ] All `TouchableOpacity` / pressable elements have `accessibilityLabel` + `accessibilityRole`
- [ ] Tappable cards have press animation (scale spring)
- [ ] Touch targets ≥ 44×44pt

### Performance
- [ ] Variable-length lists use `FlatList`, not `.map()`
- [ ] `renderItem` and `keyExtractor` memoized with `useCallback`
- [ ] `keyExtractor` uses stable ID, not array index

### States
- [ ] Loading state shown while async data loads
- [ ] Empty state has icon + message (not plain text only)
- [ ] Error state handled and surfaced to the user

### Layout
- [ ] No hardcoded magic numbers without a named constant + comment
- [ ] Safe area insets applied correctly
- [ ] Content not hidden behind tab bar or fixed headers

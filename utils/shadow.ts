import { Platform, ViewStyle } from 'react-native';

type IOSShadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius'
>;

// Returns the right style block per platform so iOS gets its layered shadow
// and Android gets a material elevation. Pass the same iOS shadow shape you'd
// write inline today; pick an elevation that matches the visual weight.
export function withShadow(ios: IOSShadow, androidElevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios,
    default: { elevation: androidElevation },
  })!;
}

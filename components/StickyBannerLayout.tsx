import React, { ReactNode, useRef } from "react";
import { Animated, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  bannerHeight: number; // height of the image area (excluding insets.top)
  children: ReactNode;
  contentContainerStyle?: object;
}

/**
 * Renders children inside a sheet that sits below the banner and scrolls
 * upward over the sticky background image. The sheet stops translating when
 * its top edge reaches 20% from the top of the screen (80% mark), after which
 * only the internal list scrolls.
 *
 * The banner image itself is rendered separately (position:absolute) by
 * NavBanner so it stays fixed behind this sheet.
 */
export function StickyBannerLayout({
  bannerHeight,
  children,
  contentContainerStyle,
}: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Sheet starts 40px above the bottom of the banner so the rounded corners
  // (borderRadius: 40) stay fully within the image area with no background bleed
  const sheetStartY = bannerHeight + insets.top - 40;

  // The highest the sheet can travel — top edge stops at 20% of screen
  const sheetMinY = screenHeight * 0.2;

  // Maximum upward travel distance — clamped to ≥1 to keep inputRange
  // monotonically increasing (bannerHeight=0 on first render would make this negative)
  const maxTravel = Math.max(1, sheetStartY - sheetMinY);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Sheet translateY: as scroll increases from 0→maxTravel, translateY goes 0→-maxTravel
  // After maxTravel the sheet is clamped and only internal content scrolls
  const translateY = scrollY.interpolate({
    inputRange: [0, maxTravel],
    outputRange: [0, -maxTravel],
    extrapolate: "clamp",
  });

  // Sheet corner radius softens as it slides up
  const borderRadius = scrollY.interpolate({
    inputRange: [0, maxTravel * 0.4],
    outputRange: [40, 24],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          top: sheetStartY,
          // Sheet height fills from startY to bottom of screen, plus maxTravel
          // so content is never clipped when the sheet slides up
          height: screenHeight - sheetMinY,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Drag handle */}
      {/* <View style={styles.handle} /> */}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        // Extra top inset so the first item clears the handle
        contentContainerStyle={[{ paddingTop: 8 }, contentContainerStyle]}
      >
        {children}
      </Animated.ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#F5F5F7",
    borderWidth: 1,
    borderColor: "#B1B1B1",
    shadowColor: "#146A3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  // handle: {
  //   width: 36,
  //   height: 4,
  //   borderRadius: 2,
  //   backgroundColor: "rgba(0,0,0,0.18)",
  //   alignSelf: "center",
  //   marginTop: 8,
  //   marginBottom: 4,
  // },
});

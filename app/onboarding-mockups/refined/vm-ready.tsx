import { Image } from "expo-image";
import { SFPro } from "@/constants/theme";
import { useRouter } from "expo-router";
import { Dimensions, SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  ExitButton,
  GREEN,
  HAIRLINE,
  PrimaryButton,
  TEXT,
  TEXT_DIM,
} from "./_shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RefinedVmReady() {
  const router = useRouter();
  return (
    <SafeAreaView style={s.safe}>
      <ExitButton />

      <View style={s.imageWrap}>
        <Image
          source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
          style={s.image}
          contentFit="contain"
        />
      </View>

      <View style={s.card}>
        <View style={s.cardInner}>
          <View style={s.statusBadge}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Ready to set up</Text>
          </View>
          <Text style={s.title}>Your computer{"\n"}is provisioned.</Text>
          <Text style={s.subtitle}>
            Pre-configured with the agents you'll use. Naming it takes a
            second — let's go.
          </Text>

          <View style={s.specs}>
            <Spec label="Compute" value="8 vCPU" />
            <Spec label="Memory" value="16 GB" />
            <Spec label="Storage" value="200 GB SSD" />
          </View>
        </View>

        <View style={s.cta}>
          <PrimaryButton
            label="Continue"
            onPress={() => router.push("/onboarding-mockups/refined/vm-name" as any)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.spec}>
      <Text style={s.specLabel}>{label}</Text>
      <Text style={s.specValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F7F9",
  },
  imageWrap: {
    height: 280,
    width: SCREEN_WIDTH,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#EAF5E2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  statusText: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: GREEN,
  },
  title: {
    fontFamily: SFPro.displayBold,
    fontSize: 30,
    color: TEXT,
    letterSpacing: -0.9,
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: TEXT_DIM,
    lineHeight: 22,
    marginBottom: 24,
  },
  specs: {
    flexDirection: "row",
    gap: 10,
  },
  spec: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  specLabel: {
    fontFamily: SFPro.regular,
    fontSize: 12,
    color: TEXT_DIM,
    marginBottom: 2,
  },
  specValue: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: TEXT,
  },
  cta: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
});

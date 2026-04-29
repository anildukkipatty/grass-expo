import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackButton from "@/assets/images/new-design/chat/back-button.svg";
import RightArrow from "@/assets/images/new-design/onboarding/right-arrow-head.svg";
import ContactIcon from "@/assets/images/new-design/support/calender.svg";
import Arrow from "@/assets/images/new-design/support/down-arrow.svg";
import EmailIcon from "@/assets/images/new-design/support/email.svg";
import ExternalLinkIcon from "@/assets/images/new-design/support/share.svg";
import { ConnectMoreSlider } from "@/components/new-navbar/ConnectMoreSlider";
import { SFPro } from "@/constants/theme";

type ActionButton = {
  label: string;
  icon?: "email" | "external" | "contact";
  onPress: () => void;
};

type FAQItem = {
  question: string;
  answer: string;
  actionButton?: ActionButton;
};

const SUPPORT_MAILTO =
  "mailto:support@codeongrass.com?subject=Support%3A%20%5BDescribe%20your%20issue%5D&body=What's%20happening%3F%0A%0A%0ASteps%20to%20reproduce%20(if%20applicable)%3A%0A%0A%0AGrass%20version%20(bottom%20of%20your%20Profile%20page)%3A%0A%0ADevice%20%26%20iOS%20version%3A%0A";

function ActionBtn({ btn }: { btn: ActionButton }) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      activeOpacity={0.8}
      onPress={btn.onPress}
    >
      {btn.icon === "email" && (
        <EmailIcon width={13} height={15} fill="#3D841E" />
      )}
      {btn.icon === "contact" && (
        <ContactIcon width={13} height={15} fill="#3D841E" />
      )}
      <Text style={styles.actionBtnText}>{btn.label}</Text>
      {btn.icon === "external" && (
        <ExternalLinkIcon width={15} height={15} fill="#3D841E" />
      )}
    </TouchableOpacity>
  );
}

function AccordionItem({
  question,
  answer,
  actionButton,
  isLast,
  isOpen,
  onToggle,
}: FAQItem & { isLast?: boolean; isOpen: boolean; onToggle: () => void }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [isOpen]);

  const arrowRotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[styles.accordionItem, !isLast && styles.accordionBorder]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        activeOpacity={0.7}
        onPress={onToggle}
      >
        <Text style={styles.accordionQuestion}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
          <Arrow />
        </Animated.View>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.accordionBody}>
          <Text style={styles.accordionAnswer}>{answer}</Text>
          {actionButton && <ActionBtn btn={actionButton} />}
        </View>
      )}
    </View>
  );
}

export default function SupportScreen() {
  const { top } = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [connectMoreVisible, setConnectMoreVisible] = useState(false);

  const FAQS: FAQItem[] = [
    {
      question: "Why is my session slow?",
      answer:
        "Usually one of three things: a slow internet connection, a repo with a lot of files for the agent to index, or peak-time load on our side. Check your connection first, then try starting a fresh session. If it keeps happening, email us with the session ID and we'll dig in.",
      actionButton: {
        label: "Email support",
        onPress: () => Linking.openURL(SUPPORT_MAILTO),
      },
    },
    {
      question: "My agent stopped mid-task",
      answer:
        "Agents pause when they hit a question or run into an error. Tap the session to see what state it's in. If it's waiting on you, there'll be a prompt to answer. If it crashed, you can resume from the last checkpoint.",
      actionButton: {
        label: "Email support",
        onPress: () => Linking.openURL(SUPPORT_MAILTO),
      },
    },
    {
      question: "How do I connect a new machine?",
      answer:
        "Open Grass on your Mac and run the pair command in terminal. A QR code will appear. Scan it with your phone and give the machine a name. It'll show up in your machine list within seconds. You can connect as many machines as you want.",
      actionButton: {
        label: "Add a machine",
        onPress: () => setConnectMoreVisible(true),
      },
    },
    {
      question: "Can I run multiple agents at once?",
      answer:
        "Yes. Run as many as you want in parallel. Each agent gets its own VM so they don't slow each other down. Switch between them from the session list.",
    },
    {
      question: "What happens if I close the app?",
      answer:
        "Nothing. Agents keep running on our servers whether the app is open or not. You'll get a push notification when they need input or finish a task. When you reopen the app, everything picks up exactly where it was.",
    },
    {
      question: "How does billing work?",
      answer:
        "Grass is free while we're in early access. No caps on agents, no caps on runtime, no credit card required. We'll give you plenty of notice before we introduce paid plans, and your feedback now will help shape what those plans look like.",
      actionButton: {
        label: "Share feedback",
        icon: "external",
        onPress: () =>
          Linking.openURL(
            "mailto:support@codeongrass.com?subject=Feature%20Request%3A%20%5BYour%20idea%20in%20one%20line%5D&body=What's%20the%20feature%3F%0A%0A%0AWhy%20do%20you%20need%20it%3F%20What%20problem%20does%20it%20solve%3F%0A%0A%0AHow%20are%20you%20currently%20working%20around%20it%3F%0A"
          ),
      },
    },
    {
      question: "Is my code private?",
      answer:
        "Yes. Your code runs in an isolated VM that gets destroyed when the session ends. We don't train on your code, we don't share it, and nobody at Grass can read it without your permission. Repos pulled from GitHub use read-only access tokens scoped to the repos you pick.",
      actionButton: {
        label: "Read our privacy policy",
        icon: "external",
        onPress: () => Linking.openURL("https://codeongrass.com/privacypolicy"),
      },
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <BackButton />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap} pointerEvents="none">
          <Text style={styles.headerTitle}>Support</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionHeader}>FAQs</Text>
        <View style={styles.card}>
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.question}
              {...faq}
              isLast={i === FAQS.length - 1}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </View>

        <Text style={styles.sectionHeader}>Still stuck?</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.contactRow, styles.contactBorder]}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(SUPPORT_MAILTO)}
          >
            <View style={styles.contactIconWrap}>
              <EmailIcon width={15} height={18} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Email the team</Text>
              <Text style={styles.contactSub}>
                We usually reply within a {"\n"}few hours.
              </Text>
            </View>
            <RightArrow width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactRow}
            activeOpacity={0.7}
            onPress={() => Linking.openURL("https://calendly.com/sahil-revise/30min-meeting")}
          >
            <View style={styles.contactIconWrap}>
              <ContactIcon width={15} height={18} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Book a call with us</Text>
              <Text style={styles.contactSub}>Seriously, just book one.</Text>
            </View>
            <RightArrow width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConnectMoreSlider
        visible={connectMoreVisible}
        onClose={() => setConnectMoreVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 50,
    zIndex: 1,
  },
  headerTitleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionHeader: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: 0.5,
    marginBottom: 15,
    marginTop: 35,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  // Accordion
  accordionItem: {
    paddingHorizontal: 14,
  },
  accordionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  accordionQuestion: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    flex: 1,
    paddingRight: 8,
  },
  accordionBody: {
    paddingBottom: 16,
    gap: 14,
  },
  accordionAnswer: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#606060",
    lineHeight: 20,
  },
  actionBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#3D841E",
    backgroundColor: "#FFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  actionBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#3D841E",
  },

  // Contact rows
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  contactBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#E3FDD7",
    justifyContent: "center",
    alignItems: "center",
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    marginBottom: 2,
  },
  contactSub: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#606060",
  },
});

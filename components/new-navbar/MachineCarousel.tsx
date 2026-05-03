import React, { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AddNewIcon from "@/assets/images/new-design/navbar/add-new-icon.svg";
import SelectedIcon from "@/assets/images/new-design/navbar/selected-icon.svg";
import { SFPro } from "@/constants/theme";
import type { VmIconComponent } from "@/constants/vm-icons";

export type Machine = {
  id: string;
  name: string;
  /** PNG image source — used for Grass managed VM */
  image?: ReturnType<typeof require>;
  /** SVG icon component — used for custom user-added VMs */
  SvgIcon?: VmIconComponent;
  borderColor: string;
  backgroundColor: string;
};

type MachineStatusValue = "online" | "offline" | "checking";

function StatusDot({ status }: { status: MachineStatusValue }) {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "checking") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.15, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [status, blinkAnim]);

  const color =
    status === "online" ? "#4CAF50" : status === "offline" ? "#EF4444" : "#F5A623";

  return (
    <Animated.View style={[styles.statusDot, { backgroundColor: color, opacity: blinkAnim }]} />
  );
}

type Props = {
  machines: Machine[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onAddNew?: () => void;
  paddingHorizontal?: number;
  vmUrlStatuses?: Map<string, boolean>;
  vmRunning?: boolean;
  primaryVmUrl?: string;
};

export function MachineCarousel({
  machines,
  selectedId,
  onSelect,
  onAddNew,
  paddingHorizontal = 16,
  vmUrlStatuses,
  vmRunning,
  primaryVmUrl,
}: Props) {
  function getMachineStatus(url: string): MachineStatusValue {
    const health = vmUrlStatuses?.get(url);
    if (primaryVmUrl && url === primaryVmUrl) {
      // Hard offline: heartbeat confirmed container is down
      if (vmRunning === false) return "offline";
      // Health poll confirmed down (works even when user is on a different tab)
      if (health === false) return "offline";
      // Health poll confirmed up
      if (health === true) return "online";
      // No poll result yet — vmRunning starts as true, trust it during startup
      return vmRunning === true ? "online" : "checking";
    }
    if (health === undefined) return "checking";
    return health ? "online" : "offline";
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={[styles.wrapper, { paddingHorizontal }]}
    >
      <View style={styles.item}>
        <TouchableOpacity style={styles.addNewCircle} activeOpacity={0.75} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAddNew?.(); }}>
          <AddNewIcon width={28} height={28} />
        </TouchableOpacity>
        <Text style={styles.addNewLabel}>Add new</Text>
      </View>

      {machines.map((machine) => {
        const isSelected = selectedId === machine.id;
        const status = getMachineStatus(machine.id);
        return (
          <TouchableOpacity
            key={machine.id}
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onSelect?.(machine.id); }}
          >
            <View
              style={[
                styles.ring,
                {
                  backgroundColor: machine.backgroundColor,
                  borderColor: machine.borderColor,
                },
              ]}
            >
              <View style={styles.ringInner}>
                {machine.SvgIcon ? (
                  <machine.SvgIcon width={62} height={62} />
                ) : machine.image ? (
                  <Image source={machine.image} style={styles.image} />
                ) : null}
                {isSelected && (
                  <View style={styles.selectedOverlay}>
                    <SelectedIcon width={26} height={19} />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.nameRow}>
              <StatusDot status={status} />
              <Text
                style={[
                  styles.name,
                  isSelected && styles.nameSelected,
                  { color: machine.borderColor },
                ]}
                numberOfLines={1}
              >
                {machine.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 0,
  },
  content: {
    paddingVertical: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  item: {
    alignItems: "center",
    gap: 6,
    width: 80,
  },
  addNewCircle: {
    width: 80,
    height: 80,
    borderRadius: 70,
    backgroundColor: "#E3FDD7",
    borderWidth: 2,
    borderColor: "#72C44E",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addNewLabel: {
    fontFamily: SFPro.medium,
    fontSize: 12,
    color: "#3D841E",
    textAlign: "center",
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ringSelected: {
    borderWidth: 2,
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.50)",
    borderRadius: "50%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  image: {
    width: 62,
    height: 62,
    resizeMode: "contain",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 80,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  name: {
    fontFamily: SFPro.bold,
    fontSize: 13,
    color: "#808080",
    textAlign: "center",
    flexShrink: 1,
    maxWidth: 70,
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  nameSelected: {
    fontFamily: SFPro.semiBold,
    color: "#1A1A1A",
  },
});

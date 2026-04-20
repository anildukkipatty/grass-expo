import React from "react";
import {
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

export type Machine = {
  id: string;
  name: string;
  image: ReturnType<typeof require>;
  borderColor: string;
  backgroundColor: string;
};

type Props = {
  machines: Machine[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onAddNew?: () => void;
  paddingHorizontal?: number;
};

export function MachineCarousel({
  machines,
  selectedId,
  onSelect,
  onAddNew,
  paddingHorizontal = 16,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={[styles.wrapper, { paddingHorizontal }]}
    >
      <View style={styles.item}>
        <TouchableOpacity style={styles.addNewCircle} activeOpacity={0.75} onPress={onAddNew}>
          <AddNewIcon width={28} height={28} />
        </TouchableOpacity>
        <Text style={styles.addNewLabel}>Add new</Text>
      </View>

      {machines.map((machine) => {
        const isSelected = selectedId === machine.id;
        return (
          <TouchableOpacity
            key={machine.id}
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => onSelect?.(machine.id)}
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
                <Image source={machine.image} style={styles.image} />
                {isSelected && (
                  <View style={styles.selectedOverlay}>
                    <SelectedIcon width={26} height={19} />
                  </View>
                )}
              </View>
            </View>
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
    ...StyleSheet.absoluteFillObject,
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
  name: {
    fontFamily: SFPro.bold,
    fontSize: 13,
    color: "#808080",
    textAlign: "center",
    maxWidth: 80,
    lineHeight: 18,
    letterSpacing: -0.3,
  },
  nameSelected: {
    fontFamily: SFPro.semiBold,
    color: "#1A1A1A",
  },
});

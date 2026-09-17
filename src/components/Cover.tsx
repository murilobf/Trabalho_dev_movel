import { Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../constants/theme";

type Props = {
  colorsGradient: [string, string];
  title?: string;
  style?: StyleProp<ViewStyle>;
};

export function Cover({ colorsGradient, title, style }: Props) {
  return (
    <LinearGradient
      colors={colorsGradient}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.cover, style]}
    >
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    aspectRatio: 2 / 3,
    borderRadius: 6,
    justifyContent: "flex-end",
    padding: 10,
    overflow: "hidden",
  },
  title: {
    fontFamily: fonts.serifSemibold,
    fontSize: 13,
    lineHeight: 16,
    color: "rgba(255,255,255,0.95)",
  },
});

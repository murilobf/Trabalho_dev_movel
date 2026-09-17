import { View, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

type Props = {
  percent: number;
  height?: number;
  color?: string;
  trackColor?: string;
};

export function ProgressBar({ percent, height = 3, color = colors.oxblood, trackColor = "rgba(35,29,22,0.12)" }: Props) {
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: 2, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
});

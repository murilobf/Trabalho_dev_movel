import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../constants/theme";

type Props = { name: string; percent: number; color?: string };

export function GenreRow({ name, percent, color = colors.oxblood }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.pct}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  name: { width: 90, fontFamily: fonts.sans, fontSize: 11, color: colors.ink },
  track: { flex: 1, height: 7, backgroundColor: "rgba(35,29,22,0.1)", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  pct: { width: 32, textAlign: "right", fontFamily: fonts.sans, fontSize: 10, color: colors.inkSoft },
});

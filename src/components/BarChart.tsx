import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../constants/theme";
import { MonthlyBooks } from "../constants/mock-data";

type Props = { data: MonthlyBooks[]; maxBarHeight?: number };

export function BarChart({ data, maxBarHeight = 68 }: Props) {
  return (
    <View style={styles.chart}>
      {data.map((b) => (
        <View key={b.month} style={styles.col}>
          <View
            style={[
              styles.bar,
              {
                height: Math.max(4, (b.heightPercent / 100) * maxBarHeight),
                backgroundColor: b.highlight ? colors.oxblood : colors.forest,
              },
            ]}
          />
          <Text style={styles.month}>{b.month}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 7, marginTop: 14 },
  col: { flex: 1, alignItems: "center", gap: 6 },
  bar: { width: "100%", borderRadius: 3 },
  month: { fontFamily: fonts.sans, fontSize: 9, color: colors.inkSoft },
});

import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../constants/theme";

export function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flexBasis: "50%", backgroundColor: colors.paper, padding: 14, borderWidth: 0.5, borderColor: colors.line },
  value: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  label: { fontFamily: fonts.sans, fontSize: 10, color: colors.inkSoft, marginTop: 4 },
});

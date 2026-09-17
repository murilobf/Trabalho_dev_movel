import { Text, StyleSheet } from "react-native";
import { colors, fonts } from "../constants/theme";

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.serifSemibold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 22,
    marginBottom: 10,
  },
});

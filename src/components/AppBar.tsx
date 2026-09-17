import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Avatar } from "./Avatar";
import { colors, fonts } from "../constants/theme";

type Props = {
  userInitials?: string;
  left?: ReactNode;
};

export function AppBar({ userInitials = "JS", left }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.leftGroup}>
        {left}
        <Text style={styles.logo}>
          book<Text style={styles.logoEm}>xd</Text>
        </Text>
      </View>
      <Avatar initials={userInitials} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  leftGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  logoEm: { fontFamily: fonts.serifItalic, color: colors.oxblood },
});

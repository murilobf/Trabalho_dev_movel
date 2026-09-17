import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../constants/theme";

type Props = {
  initials: string;
  size?: number;
  background?: string;
};

export function Avatar({ initials, size = 30, background = colors.forest }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.28 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", justifyContent: "center" },
  text: { fontFamily: fonts.serifSemibold, color: colors.paper },
});

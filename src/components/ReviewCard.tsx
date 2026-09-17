import { View, Text, StyleSheet } from "react-native";
import { Avatar } from "./Avatar";
import { StarRating } from "./StarRating";
import { colors, fonts } from "../constants/theme";

type Props = {
  initials: string;
  name: string;
  rating: number;
  text: string;
  first?: boolean;
};

export function ReviewCard({ initials, name, rating, text, first }: Props) {
  return (
    <View style={[styles.wrap, !first && styles.divider]}>
      <View style={styles.head}>
        <Avatar initials={initials} size={22} background={colors.oxblood} />
        <Text style={styles.name}>{name}</Text>
        <StarRating rating={rating} size={12} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 13 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  name: { fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.ink },
  text: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.ink },
});

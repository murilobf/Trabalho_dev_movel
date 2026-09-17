import { View, Text, StyleSheet } from "react-native";
import { StarRating } from "./StarRating";
import { colors, fonts } from "../constants/theme";
import { ActivityEntry } from "../constants/mock-data";

export function ActivityItem({ name, action, book, extra, rating, time, color }: ActivityEntry) {
  return (
    <View style={styles.row}>
      <View style={[styles.cover, { backgroundColor: color }]} />
      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.text}>
          {actionLabel(action)} <Text style={styles.book}>{book}</Text>
          {extra ? `: "${extra}"` : ""}
        </Text>
        {rating ? <StarRating rating={rating} size={11} /> : null}
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

function actionLabel(action: ActivityEntry["action"]) {
  switch (action) {
    case "avaliou":
      return "avaliou";
    case "comentou":
      return "comentou em";
    case "terminou":
      return "terminou";
    case "começou":
      return "começou a ler";
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  cover: { width: 34, height: 48, borderRadius: 3 },
  body: { flex: 1 },
  name: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.ink },
  text: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft, marginTop: 1, lineHeight: 16 },
  book: { fontFamily: fonts.sans, fontStyle: "italic", color: colors.ink },
  time: { fontFamily: fonts.sans, fontSize: 10, color: colors.inkSoft, opacity: 0.7, marginTop: 4 },
});

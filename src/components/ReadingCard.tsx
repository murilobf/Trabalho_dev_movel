import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Cover } from "./Cover";
import { ProgressBar } from "./ProgressBar";
import { colors, fonts } from "../constants/theme";

type Props = {
  id: string;
  title: string;
  gradient: [string, string];
  page: number;
  percent: number;
};

export function ReadingCard({ id, title, gradient, page, percent }: Props) {
  const router = useRouter();

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/livro/${id}`)}>
      <Cover colorsGradient={gradient} title={title} />
      <View style={styles.progressWrap}>
        <ProgressBar percent={percent} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>pág. {page}</Text>
        <Text style={styles.metaText}>{percent}%</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 118 },
  progressWrap: { marginTop: 8 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  metaText: { fontFamily: fonts.sans, fontSize: 10, color: colors.inkSoft },
});

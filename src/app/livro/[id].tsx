import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AppBar } from "../../components/AppBar";
import { SectionTitle } from "../../components/SectionTitle";
import { Cover } from "../../components/Cover";
import { StarRating } from "../../components/StarRating";
import { ProgressBar } from "../../components/ProgressBar";
import { ReviewCard } from "../../components/ReviewCard";
import { colors, fonts } from "../../constants/theme";
import { readingNow, bookReviews } from "../../constants/mock-data";

export default function LivroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const book = readingNow.find((b) => b.id === id) ?? readingNow[0];
  const reviews = bookReviews[book.id] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppBar
          left={
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Feather name="arrow-left" size={20} color={colors.ink} />
            </Pressable>
          }
        />

        <View style={styles.hero}>
          <Cover colorsGradient={book.gradient} title={book.title} style={styles.heroCover} />
          <View style={styles.info}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            <View style={styles.rateRow}>
              <StarRating rating={book.rating} size={16} />
              <Text style={styles.rateLabel}>sua nota</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressPanel}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Progresso</Text>
            <Text style={styles.progressValue}>
              {book.page} / {book.totalPages} pág.
            </Text>
          </View>
          <ProgressBar percent={book.percent} height={6} />
        </View>

        <SectionTitle>Resenhas da comunidade</SectionTitle>
        {reviews.map((r, i) => (
          <ReviewCard key={r.id} initials={r.initials} name={r.name} rating={r.rating} text={r.text} first={i === 0} />
        ))}

        <View style={styles.commentInput}>
          <Text style={styles.commentPlaceholder}>comentar sobre {book.title}...</Text>
          <View style={styles.sendButton}>
            <Feather name="arrow-up" size={14} color={colors.paper} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  hero: { flexDirection: "row", gap: 14, marginTop: 16 },
  heroCover: { width: 92 },
  info: { flex: 1, justifyContent: "center" },
  title: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink, marginBottom: 2 },
  author: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft, marginBottom: 8 },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  rateLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkSoft },
  progressPanel: { backgroundColor: colors.paper2, borderRadius: 10, padding: 14, marginTop: 18 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink },
  progressValue: { fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.ink },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper2,
    borderRadius: 20,
    paddingVertical: 9,
    paddingLeft: 16,
    paddingRight: 8,
    marginTop: 16,
  },
  commentPlaceholder: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.oxblood,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBar } from "../../components/AppBar";
import { SectionTitle } from "../../components/SectionTitle";
import { ReadingCard } from "../../components/ReadingCard";
import { ActivityItem } from "../../components/ActivityItem";
import { colors } from "../../constants/theme";
import { readingNow, activity } from "../../constants/mock-data";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppBar />

        <SectionTitle>Lendo agora</SectionTitle>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroller}
        >
          {readingNow.map((b) => (
            <ReadingCard key={b.id} id={b.id} title={b.title} gradient={b.gradient} page={b.page} percent={b.percent} />
          ))}
        </ScrollView>

        <SectionTitle>Atividade</SectionTitle>
        <View>
          {activity.map((a) => (
            <ActivityItem key={a.id} {...a} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  scroller: { gap: 12, paddingBottom: 4 },
});

import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBar } from "../../components/AppBar";
import { SectionTitle } from "../../components/SectionTitle";
import { Avatar } from "../../components/Avatar";
import { StatCell } from "../../components/StatCell";
import { BarChart } from "../../components/BarChart";
import { GenreRow } from "../../components/GenreRow";
import { Cover } from "../../components/Cover";
import { colors, fonts } from "../../constants/theme";
import { profile } from "../../constants/mock-data";

export default function PerfilScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppBar userInitials={profile.initials} />

        <View style={styles.profileRow}>
          <Avatar initials={profile.initials} size={48} />
          <View>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.since}>{profile.since}</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          {profile.stats.map((s) => (
            <StatCell key={s.label} value={s.value} label={s.label} />
          ))}
        </View>

        <SectionTitle>Livros por mês</SectionTitle>
        <BarChart data={profile.monthlyBooks} />

        <SectionTitle>Gêneros favoritos</SectionTitle>
        {profile.genres.map((g) => (
          <GenreRow key={g.name} name={g.name} percent={g.percent} color={g.color} />
        ))}

        <SectionTitle>Favoritos do ano</SectionTitle>
        <View style={styles.favGrid}>
          {profile.favorites.map((g, i) => (
            <Cover key={i} colorsGradient={g} style={styles.favCover} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  name: { fontFamily: fonts.serif, fontSize: 16, color: colors.ink },
  since: { fontFamily: fonts.sans, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: colors.line,
    marginTop: 16,
  },
  favGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  favCover: { width: "23%" },
});

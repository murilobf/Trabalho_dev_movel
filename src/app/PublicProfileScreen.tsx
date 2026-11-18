// PublicProfileScreen.tsx
// Layout base da tela de perfil público do bookxd: exibe atividades, avaliações
// e progresso de leitura de outro usuário da plataforma.
//
// Este arquivo cobre apenas a camada visual (layout + tipos), com dados mockados.
// Ligue os mocks a chamadas reais (ex: React Query / seu client de API) quando integrar.

import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, radii, spacing } from './theme';

// ---------- Tipos ----------

interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  readingSince: string;
  isFollowedByViewer: boolean;
  stats: {
    booksThisYear: number;
    pagesRead: number;
    dayStreak: number;
    avgRating: number;
  };
  monthlyBooks: { month: string; count: number }[]; // 12 posições, jan..dez
  genres: { name: string; percent: number; color: string }[];
  favoriteCovers: { id: string; coverUrl: string }[];
}

type ActivityKind = 'rated' | 'commented' | 'finished' | 'started';

interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  bookTitle: string;
  bookCoverUrl: string;
  rating?: number; // 1-5, quando kind === 'rated' | 'finished'
  commentSnippet?: string; // quando kind === 'commented'
  timeAgo: string;
}

interface PublicProfileScreenProps {
  profile: UserProfile;
  activity: ActivityEntry[];
  onFollowPress?: () => void;
  onActivityPress?: (entry: ActivityEntry) => void;
}

// ---------- Dados mockados (substituir pela integração real) ----------

const MOCK_PROFILE: UserProfile = {
  id: 'u_marina',
  name: 'Marina Costa',
  handle: '@marinac',
  avatarUrl: 'https://i.pravatar.cc/120?img=47',
  readingSince: 'lendo desde 2019',
  isFollowedByViewer: false,
  stats: { booksThisYear: 27, pagesRead: 8140, dayStreak: 12, avgRating: 4.3 },
  monthlyBooks: [
    { month: 'jan', count: 3 },
    { month: 'fev', count: 4 },
    { month: 'mar', count: 2 },
    { month: 'abr', count: 6 },
    { month: 'mai', count: 5 },
    { month: 'jun', count: 7 },
    { month: 'jul', count: 4 },
  ],
  genres: [
    { name: 'Ficção', percent: 42, color: colors.oxblood },
    { name: 'Clássicos', percent: 27, color: colors.forest },
    { name: 'Ficção científica', percent: 19, color: colors.gold },
  ],
  favoriteCovers: [
    { id: 'b1', coverUrl: 'https://picsum.photos/seed/duna/200/300' },
    { id: 'b2', coverUrl: 'https://picsum.photos/seed/metamorfose/200/300' },
    { id: 'b3', coverUrl: 'https://picsum.photos/seed/tortoarado/200/300' },
    { id: 'b4', coverUrl: 'https://picsum.photos/seed/vidassecas/200/300' },
  ],
};

const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: 'a1',
    kind: 'rated',
    bookTitle: 'A Hora da Estrela',
    bookCoverUrl: 'https://picsum.photos/seed/horadaestrela/100/150',
    rating: 4,
    timeAgo: 'há 2 h',
  },
  {
    id: 'a2',
    kind: 'commented',
    bookTitle: 'Duna',
    bookCoverUrl: 'https://picsum.photos/seed/duna2/100/150',
    commentSnippet: 'a construção política do segundo ato é impressionante',
    timeAgo: 'há 5 h',
  },
  {
    id: 'a3',
    kind: 'finished',
    bookTitle: 'Torto Arado',
    bookCoverUrl: 'https://picsum.photos/seed/tortoarado2/100/150',
    rating: 5,
    timeAgo: 'ontem',
  },
  {
    id: 'a4',
    kind: 'started',
    bookTitle: 'Vidas Secas',
    bookCoverUrl: 'https://picsum.photos/seed/vidassecas2/100/150',
    timeAgo: 'ontem',
  },
];

// ---------- Componentes auxiliares ----------

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <Text style={styles.stars}>
      {'★'.repeat(full)}
      <Text style={styles.starsOff}>{'★'.repeat(5 - full)}</Text>
    </Text>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MonthlyBarChart({ data }: { data: UserProfile['monthlyBooks'] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={styles.barChart}>
      {data.map((d, i) => (
        <View key={d.month} style={styles.barCol}>
          <View
            style={[
              styles.bar,
              {
                height: Math.max((d.count / max) * 72, 4),
                backgroundColor: i >= data.length - 2 ? colors.oxblood : colors.forest,
              },
            ]}
          />
          <Text style={styles.barMonth}>{d.month}</Text>
        </View>
      ))}
    </View>
  );
}

function GenreRow({ name, percent, color }: UserProfile['genres'][number]) {
  return (
    <View style={styles.genreRow}>
      <Text style={styles.genreName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.genreTrack}>
        <View style={[styles.genreFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.genrePct}>{percent}%</Text>
    </View>
  );
}

function activityVerb(kind: ActivityKind): string {
  switch (kind) {
    case 'rated':
      return 'avaliou';
    case 'commented':
      return 'comentou em';
    case 'finished':
      return 'terminou';
    case 'started':
      return 'começou a ler';
  }
}

function ActivityRow({
  entry,
  onPress,
}: {
  entry: ActivityEntry;
  onPress?: (entry: ActivityEntry) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.activityItem}
      activeOpacity={0.7}
      onPress={() => onPress?.(entry)}
    >
      <Image source={{ uri: entry.bookCoverUrl }} style={styles.activityCover} />
      <View style={styles.activityBody}>
        <Text style={styles.activityText}>
          {activityVerb(entry.kind)} <Text style={styles.activityBook}>{entry.bookTitle}</Text>
        </Text>
        {entry.rating != null && <Stars rating={entry.rating} />}
        {entry.commentSnippet && (
          <Text style={styles.activitySnippet} numberOfLines={2}>
            "{entry.commentSnippet}"
          </Text>
        )}
        <Text style={styles.activityTime}>{entry.timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------- Tela principal ----------

export default function PublicProfileScreen({
  profile,
  activity,
  onFollowPress,
  onActivityPress,
}: PublicProfileScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.handle}>{profile.readingSince}</Text>
        </View>
        <TouchableOpacity
          style={[styles.followBtn, profile.isFollowedByViewer && styles.followBtnActive]}
          onPress={onFollowPress}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.followBtnText,
              profile.isFollowedByViewer && styles.followBtnTextActive,
            ]}
          >
            {profile.isFollowedByViewer ? 'Seguindo' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Estatísticas */}
      <View style={styles.statGrid}>
        <StatCell value={String(profile.stats.booksThisYear)} label="livros em 2026" />
        <StatCell value={profile.stats.pagesRead.toLocaleString('pt-BR')} label="páginas lidas" />
        <StatCell value={String(profile.stats.dayStreak)} label="dias seguidos lendo" />
        <StatCell value={profile.stats.avgRating.toFixed(1).replace('.', ',')} label="nota média dada" />
      </View>

      {/* Livros por mês */}
      <Text style={styles.sectionTitle}>Livros por mês</Text>
      <MonthlyBarChart data={profile.monthlyBooks} />

      {/* Gêneros favoritos */}
      <Text style={styles.sectionTitle}>Gêneros favoritos</Text>
      {profile.genres.map((g) => (
        <GenreRow key={g.name} {...g} />
      ))}

      {/* Favoritos do ano */}
      <Text style={styles.sectionTitle}>Favoritos do ano</Text>
      <View style={styles.shelfGrid}>
        {profile.favoriteCovers.map((c) => (
          <Image key={c.id} source={{ uri: c.coverUrl }} style={styles.shelfCover} />
        ))}
      </View>

      {/* Atividade */}
      <Text style={styles.sectionTitle}>Atividade</Text>
      <View style={styles.activityList}>
        {activity.map((entry, i) => (
          <View key={entry.id} style={i > 0 ? styles.activityDivider : undefined}>
            <ActivityRow entry={entry} onPress={onActivityPress} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------- Exemplo de uso com dados mockados ----------
// Substitua por dados vindos da navegação (ex: route.params.userId + fetch)

export function PublicProfileScreenPreview() {
  return <PublicProfileScreen profile={MOCK_PROFILE} activity={MOCK_ACTIVITY} />;
}

// ---------- Estilos ----------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 48,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.forest,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  handle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.oxblood,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
  },
  followBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.paper,
  },
  followBtnTextActive: {
    color: colors.ink,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  statCell: {
    width: '50%',
    padding: spacing.md,
    borderColor: colors.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statNum: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 4,
  },

  sectionTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barMonth: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 6,
  },

  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  genreName: {
    width: 90,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
  },
  genreTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(35,29,22,0.1)',
    overflow: 'hidden',
  },
  genreFill: {
    height: '100%',
    borderRadius: 4,
  },
  genrePct: {
    width: 32,
    textAlign: 'right',
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
  },

  shelfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shelfCover: {
    width: '23.5%',
    aspectRatio: 2 / 3,
    borderRadius: radii.sm,
    backgroundColor: colors.paperAlt,
  },

  activityList: {
    marginTop: spacing.xs,
  },
  activityDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: spacing.md,
  },
  activityCover: {
    width: 34,
    height: 48,
    borderRadius: 3,
    backgroundColor: colors.paperAlt,
  },
  activityBody: {
    flex: 1,
  },
  activityText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  activityBook: {
    fontFamily: fonts.displayItalic,
  },
  activitySnippet: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 3,
    lineHeight: 17,
  },
  activityTime: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
    opacity: 0.7,
    marginTop: 4,
  },
  stars: {
    color: colors.gold,
    fontSize: 12,
    marginTop: 2,
  },
  starsOff: {
    color: 'rgba(35,29,22,0.22)',
  },
});

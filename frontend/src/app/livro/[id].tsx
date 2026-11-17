// Salvar como: src/app/livro/[id].tsx
import { useCallback, useState } from "react";
import { Text, Pressable, View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import {
  typography,
  colors,
  fonts,
  spacing,
  radius,
  formStyles,
  catalogStyles,
} from "../../constants/theme";
import { api } from "../../api/api";

interface Genero {
  id: number;
  nome: string;
}

interface Livro {
  id: number;
  nome: string;
  autor: string;
  descricao?: string | null;
  generos?: Genero[];
}

interface Avaliacao {
  id: number;
  usuario_nome: string;
  nota: number;
  texto: string;
  contem_spoilers: boolean;
  criado_em: string | null;
}

const formatarNota = (n: number) => n.toFixed(1).replace(".", ",");

// "2026-05-03T12:00:00" -> "03/05/2026" (sem depender de Intl no Android)
const formatarData = (iso: string | null) =>
  iso ? iso.slice(0, 10).split("-").reverse().join("/") : "";

function ItemAvaliacao({ avaliacao }: { avaliacao: Avaliacao }) {
  const [revelado, setRevelado] = useState(false);
  const escondido = avaliacao.contem_spoilers && !revelado && avaliacao.texto.length > 0;

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{avaliacao.usuario_nome}</Text>
        <Text style={styles.reviewRating}>★ {formatarNota(avaliacao.nota)}</Text>
      </View>
      <Text style={typography.caption}>{formatarData(avaliacao.criado_em)}</Text>

      {avaliacao.texto.length > 0 &&
        (escondido ? (
          <Pressable onPress={() => setRevelado(true)} style={styles.spoilerBox}>
            <Text style={styles.spoilerText}>Contém spoilers. Toque para ler a resenha.</Text>
          </Pressable>
        ) : (
          <Text style={styles.reviewText}>{avaliacao.texto}</Text>
        ))}
    </View>
  );
}

export default function LivroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [livro, setLivro] = useState<Livro | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Roda ao abrir e também ao voltar para esta tela (por exemplo, depois de salvar uma avaliação).
  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      setErro(null);

      Promise.all([
        api.get(`/livros/${id}`),
        api.get(`/livros/${id}/avaliacoes?limite=100`),
      ])
        .then(([l, a]) => {
          if (cancelado) return;
          if (!l?.id) throw new Error("livro não encontrado");
          setLivro(l);
          setAvaliacoes(a?.avaliacoes ?? []);
          setTotal(a?.total ?? 0);
        })
        .catch(() => {
          if (!cancelado) setErro("Não foi possível carregar este livro.");
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });

      return () => {
        cancelado = true;
      };
    }, [id])
  );

  // Média calculada sobre as avaliações carregadas (até 100). Um endpoint de estatísticas
  // no backend (relatório do livro) deve substituir isso depois.
  const media =
    avaliacoes.length > 0
      ? avaliacoes.reduce((soma, a) => soma + a.nota, 0) / avaliacoes.length
      : null;

  return (
    <ScreenContainer>
      <AppBar
        left={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={20} color={colors.ink} />
          </Pressable>
        }
      />

      {carregando && !livro ? (
        <Text style={catalogStyles.statusText}>Carregando...</Text>
      ) : erro || !livro ? (
        <Text style={catalogStyles.statusText}>{erro ?? "Livro não encontrado."}</Text>
      ) : (
        <View style={formStyles.content}>
          {/* Dados do livro */}
          <View style={[formStyles.card, catalogStyles.bookCard]}>
            <Text style={catalogStyles.bookTitle}>{livro.nome}</Text>
            <Text style={catalogStyles.author}>{livro.autor}</Text>

            {livro.generos && livro.generos.length > 0 ? (
              <View style={styles.badges}>
                {livro.generos.map((g) => (
                  <Text key={g.id} style={catalogStyles.badge}>
                    {g.nome}
                  </Text>
                ))}
              </View>
            ) : null}

            {livro.descricao ? (
              <Text style={catalogStyles.description}>{livro.descricao}</Text>
            ) : null}

            <View style={styles.summary}>
              <Text style={styles.summaryValue}>
                {media !== null ? formatarNota(media) : "–"}
              </Text>
              <Text style={typography.bodySoft}>
                {total === 0
                  ? "Ainda sem avaliações"
                  : `${total} ${total === 1 ? "avaliação" : "avaliações"}`}
              </Text>
            </View>
          </View>

          {/* TODO: se não houver usuário logado, leve para o login em vez de abrir a avaliação. */}
          <Pressable
            onPress={() => router.push(`/avaliar/${livro.id}`)}
            style={({ pressed }) => [formStyles.button, pressed && formStyles.buttonPressed]}
            accessibilityRole="button"
          >
            <Text style={formStyles.buttonText}>Avaliar este livro</Text>
          </Pressable>

          {/* Avaliações */}
          <Text style={typography.sectionTitle}>Avaliações</Text>
          {avaliacoes.length === 0 ? (
            <Text style={typography.bodySoft}>
              Ninguém avaliou este livro ainda. Seja o primeiro!
            </Text>
          ) : (
            avaliacoes.map((a) => <ItemAvaliacao key={a.id} avaliacao={a} />)
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryValue: { fontFamily: fonts.serif, fontSize: 30, color: colors.gold },

  reviewItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewUser: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.ink },
  reviewRating: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.gold },
  reviewText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  spoilerBox: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.paper2,
  },
  spoilerText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSoft },
});

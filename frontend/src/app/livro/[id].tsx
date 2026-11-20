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
  detailStyles,
} from "../../constants/theme";
import { api } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import ProgressoLeituraCard from "../../components/ProgressoLeituraCard";

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
  usuario_id: number;
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
  const router = useRouter();
  const [revelado, setRevelado] = useState(false);
  const escondido = avaliacao.contem_spoilers && !revelado && avaliacao.texto.length > 0;

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Pressable
          onPress={() => router.push(`/usuario/${avaliacao.usuario_id}`)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${avaliacao.usuario_nome}`}
        >
          <Text style={styles.reviewUser}>{avaliacao.usuario_nome}</Text>
        </Pressable>
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
  const { usuario } = useAuth();

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

  // Média calculada sobre as avaliações carregadas (até 100).
  const media =
    avaliacoes.length > 0
      ? avaliacoes.reduce((soma, a) => soma + a.nota, 0) / avaliacoes.length
      : null;

  return (
    <ScreenContainer
      scrollProps={{
        contentContainerStyle: [formStyles.container, detailStyles.container],
      }}
    >
      <View style={detailStyles.content}>
        <AppBar
          left={
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => [
                detailStyles.backLink,
                pressed && formStyles.buttonPressed,
              ]}
            >
              <Feather name="arrow-left" size={18} color={colors.inkSoft} />
              <Text style={catalogStyles.author}>Voltar</Text>
            </Pressable>
          }
        />

        {carregando && !livro ? (
          <Text style={catalogStyles.statusText}>carregando...</Text>
        ) : erro || !livro ? (
          <Text style={catalogStyles.statusText}>{erro ?? "Livro não encontrado."}</Text>
        ) : (
          <>
            <View style={detailStyles.hero}>
              <Text accessibilityRole="header" style={[formStyles.title, detailStyles.title]}>
                {livro.nome}
              </Text>

              <Text style={[catalogStyles.author, detailStyles.author]}>
                por <Text style={detailStyles.authorName}>{livro.autor}</Text>
              </Text>

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

              <Pressable
                onPress={() => router.push(`/relatorio/${livro.id}` as never)}
                style={[catalogStyles.secondaryButton, { marginTop: spacing.md }]}
                accessibilityRole="button"
              >
                <Text style={catalogStyles.secondaryButtonText}>
                  Ver relatório e gráficos do livro
                </Text>
              </Pressable>
            </View>

            <View style={detailStyles.columns}>
              <View style={detailStyles.mainColumn}>
                <Text
                  accessibilityRole="header"
                  style={[formStyles.eyebrow, detailStyles.sectionLabel]}
                >
                  SINOPSE
                </Text>
                <Text style={[catalogStyles.description, detailStyles.description]}>
                  {livro.descricao || "Sem sinopse cadastrada."}
                </Text>
              </View>

              <View style={detailStyles.sideColumn}>
                <Text
                  accessibilityRole="header"
                  style={[formStyles.eyebrow, detailStyles.sectionLabel]}
                >
                  GÊNEROS
                </Text>
                <View style={formStyles.chips}>
                  {(livro.generos ?? []).map((genero) => (
                    <Text key={genero.id} style={[catalogStyles.badge, detailStyles.genre]}>
                      {genero.nome}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Progresso de leitura (apenas para usuário logado) */}
            {usuario ? (
              <>
                <View style={{ marginTop: spacing.xl }}>
                  <ProgressoLeituraCard livroId={livro.id} usuarioId={usuario.id} />
                </View>

                <Pressable
                  onPress={() => router.push(`/avaliar/${livro.id}`)}
                  style={({ pressed }) => [
                    formStyles.button,
                    { marginTop: spacing.lg },
                    pressed && formStyles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={formStyles.buttonText}>Avaliar este livro</Text>
                </Pressable>
              </>
            ) : (
              <View style={{ marginTop: spacing.xl, gap: spacing.xs }}>
                <Text style={typography.sectionTitle}>Seu progresso de leitura</Text>
                <Text style={typography.bodySoft}>
                  Entre na sua conta para registrar seu progresso ou avaliar este livro.
                </Text>

                <Pressable
                  onPress={() => router.push("/telas/login")}
                  style={({ pressed }) => [
                    formStyles.button,
                    { marginTop: spacing.md },
                    pressed && formStyles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={formStyles.buttonText}>
                    Fazer login para registrar ou avaliar
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Avaliações */}
            <Text style={typography.sectionTitle}>Avaliações</Text>
            {avaliacoes.length === 0 ? (
              <Text style={typography.bodySoft}>
                Ninguém avaliou este livro ainda. Seja o primeiro!
              </Text>
            ) : (
              avaliacoes.map((a) => <ItemAvaliacao key={a.id} avaliacao={a} />)
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
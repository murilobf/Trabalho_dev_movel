// Salvar como: src/app/telas/relatorio_pessoal.tsx
import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ScreenContainer";
import { AppBar } from "@/components/AppBar";
import {
  colors,
  fonts,
  spacing,
  radius,
  typography,
  catalogStyles,
  detailStyles,
  formStyles,
} from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { relatoriosApi, type RelatorioPessoalResponse } from "@/api/relatorios";

const formatarNota = (n: number) => n.toFixed(1).replace(".", ",");
const formatarMes = (periodo: string) =>
  periodo.includes("-") ? periodo.split("-").reverse().join("/") : periodo;

const CORES_GENERO = [colors.oxblood, colors.forest, colors.gold, "#4A6B82", "#7A5C43"];

export default function RelatorioPessoalScreen() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [dados, setDados] = useState<RelatorioPessoalResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!usuario) {
        setCarregando(false);
        return;
      }
      let cancelado = false;
      setErro(null);

      relatoriosApi
        .pessoal(usuario.id)
        .then((res) => {
          if (!cancelado) setDados(res);
        })
        .catch((e) => {
          if (!cancelado) setErro(e instanceof Error ? e.message : "Erro ao carregar relatório.");
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });

      return () => {
        cancelado = true;
      };
    }, [usuario])
  );

  if (!usuario) {
    return (
      <ScreenContainer>
        <AppBar />
        <Text style={typography.sectionTitle}>Relatório Pessoal</Text>
        <Text style={typography.bodySoft}>
          Entre na sua conta para visualizar suas estatísticas de leitura.
        </Text>
        <Pressable
          onPress={() => router.push("/telas/login")}
          style={[formStyles.button, { marginTop: spacing.lg }]}
        >
          <Text style={formStyles.buttonText}>Fazer Login</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const maiorQtdGenero = dados?.ranking_generos.length
    ? Math.max(...dados.ranking_generos.map((g) => g.quantidade), 1)
    : 1;

  const maiorAtividadeMes = dados?.evolucao.length
    ? Math.max(...dados.evolucao.map((e) => e.total), 1)
    : 1;

  return (
    <ScreenContainer scrollProps={{ contentContainerStyle: detailStyles.container }}>
      <View style={detailStyles.content}>
        <AppBar
          left={
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [detailStyles.backLink, pressed && formStyles.buttonPressed]}
            >
              <Feather name="arrow-left" size={18} color={colors.inkSoft} />
              <Text style={catalogStyles.author}>Voltar ao perfil</Text>
            </Pressable>
          }
        />

        {carregando && !dados ? (
          <Text style={catalogStyles.statusText}>Carregando suas estatísticas...</Text>
        ) : erro || !dados ? (
          <Text style={catalogStyles.statusText}>{erro ?? "Relatório indisponível."}</Text>
        ) : (
          <View style={styles.root}>
            <Text style={formStyles.eyebrow}>MEU RELATÓRIO DE LEITURA</Text>
            <Text style={styles.title}>{dados.usuario.nome}</Text>

            {/* Cards de Resumo */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{dados.resumo.livros_avaliados}</Text>
                <Text style={typography.caption}>Livros avaliados</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>
                  {dados.resumo.nota_media !== null
                    ? `★ ${formatarNota(dados.resumo.nota_media)}`
                    : "–"}
                </Text>
                <Text style={typography.caption}>Sua nota média</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{dados.resumo.livros_lidos}</Text>
                <Text style={typography.caption}>Concluídos</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{dados.resumo.livros_lendo}</Text>
                <Text style={typography.caption}>Lendo agora</Text>
              </View>
            </View>

            {/* Gráfico 1: Ranking por gênero */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Ranking por gênero</Text>
              {dados.ranking_generos.length === 0 ? (
                <Text style={typography.bodySoft}>
                  Avalie ou conclua livros para montar seu ranking de gêneros.
                </Text>
              ) : (
                <View style={styles.genreList}>
                  {dados.ranking_generos.map((g, idx) => {
                    const largura = (g.quantidade / maiorQtdGenero) * 100;
                    const cor = CORES_GENERO[idx % CORES_GENERO.length];
                    return (
                      <View key={g.genero_id} style={styles.genreRow}>
                        <Text style={styles.genreRank}>{idx + 1}º</Text>
                        <Text style={styles.genreName} numberOfLines={1}>
                          {g.nome}
                        </Text>
                        <View style={styles.genreTrack}>
                          <View
                            style={[
                              styles.genreFill,
                              { width: `${largura}%`, backgroundColor: cor },
                            ]}
                          />
                        </View>
                        <Text style={styles.genreCount}>
                          {g.quantidade} ({g.percentual}%)
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Gráfico 2: Evolução temporal da atividade */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Atividade ao longo do tempo</Text>
              {dados.evolucao.length === 0 ? (
                <Text style={typography.bodySoft}>Nenhuma atividade registrada ainda.</Text>
              ) : (
                <>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.oxblood }]} />
                      <Text style={typography.caption}>Avaliações</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.forest }]} />
                      <Text style={typography.caption}>Leituras atualizadas</Text>
                    </View>
                  </View>

                  <View style={styles.timelineChart}>
                    {dados.evolucao.map((item) => {
                      const altAval = (item.avaliacoes / maiorAtividadeMes) * 100;
                      const altLeit = (item.leituras / maiorAtividadeMes) * 100;
                      return (
                        <View key={item.periodo} style={styles.timelineCol}>
                          <Text style={styles.timelineTopValue}>{item.total}</Text>
                          <View style={styles.stackedBarWrap}>
                            {item.avaliacoes > 0 && (
                              <View
                                style={[
                                  styles.stackedSegment,
                                  {
                                    height: Math.max(altAval, 6),
                                    backgroundColor: colors.oxblood,
                                  },
                                ]}
                              />
                            )}
                            {item.leituras > 0 && (
                              <View
                                style={[
                                  styles.stackedSegment,
                                  {
                                    height: Math.max(altLeit, 6),
                                    backgroundColor: colors.forest,
                                  },
                                ]}
                              />
                            )}
                          </View>
                          <Text style={styles.timelineLabel}>{formatarMes(item.periodo)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md, paddingTop: spacing.md },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpiCard: {
    width: "48%",
    backgroundColor: "#FFFCF6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  kpiValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.gold },
  sectionCard: {
    backgroundColor: "#FFFCF6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.serifSemibold, fontSize: 17, color: colors.ink },
  genreList: { gap: 10, marginTop: spacing.xs },
  genreRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  genreRank: { width: 22, fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.oxblood },
  genreName: { width: 92, fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
  genreTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.paper2,
    overflow: "hidden",
  },
  genreFill: { height: "100%", borderRadius: 5 },
  genreCount: {
    width: 64,
    textAlign: "right",
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.inkSoft,
  },
  legendRow: { flexDirection: "row", gap: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  timelineChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  timelineCol: { flex: 1, alignItems: "center", gap: 4 },
  timelineTopValue: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.ink },
  stackedBarWrap: {
    height: 110,
    width: "70%",
    maxWidth: 34,
    justifyContent: "flex-end",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: "hidden",
  },
  stackedSegment: { width: "100%" },
  timelineLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink },
});
// Salvar como: src/app/relatorio/[id].tsx
import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import {
  colors,
  fonts,
  spacing,
  radius,
  typography,
  catalogStyles,
  detailStyles,
  formStyles,
} from "../../constants/theme";
import { relatoriosApi, type RelatorioLivroResponse } from "../../api/relatorios";

const formatarNota = (n: number) => n.toFixed(1).replace(".", ",");
const formatarMes = (periodo: string) =>
  periodo.includes("-") ? periodo.split("-").reverse().join("/") : periodo;

export default function RelatorioLivroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [dados, setDados] = useState<RelatorioLivroResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      setErro(null);

      relatoriosApi
        .doLivro(Number(id))
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
    }, [id])
  );

  const maiorQtdFaixa = dados
    ? Math.max(...dados.distribuicao.map((d) => d.quantidade), 1)
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
              <Text style={catalogStyles.author}>Voltar ao livro</Text>
            </Pressable>
          }
        />

        {carregando && !dados ? (
          <Text style={catalogStyles.statusText}>Carregando relatório...</Text>
        ) : erro || !dados ? (
          <Text style={catalogStyles.statusText}>{erro ?? "Relatório indisponível."}</Text>
        ) : (
          <View style={styles.root}>
            <Text style={formStyles.eyebrow}>RELATÓRIO DO LIVRO</Text>
            <Text style={styles.title}>{dados.livro.nome}</Text>
            <Text style={typography.bodySoft}>por {dados.livro.autor}</Text>

            {/* Cards de Resumo */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>
                  {dados.resumo.nota_media !== null
                    ? `★ ${formatarNota(dados.resumo.nota_media)}`
                    : "–"}
                </Text>
                <Text style={typography.caption}>Nota média geral</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{dados.resumo.total_avaliacoes}</Text>
                <Text style={typography.caption}>Total de avaliações</Text>
              </View>
            </View>

            {/* Gráfico 1: Distribuição por faixa de nota */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Distribuição por faixa de nota</Text>
              {dados.resumo.total_avaliacoes === 0 ? (
                <Text style={typography.bodySoft}>Ainda não há avaliações para este livro.</Text>
              ) : (
                <View style={styles.barsGroup}>
                  {[...dados.distribuicao].reverse().map((faixa) => {
                    const largura = (faixa.quantidade / maiorQtdFaixa) * 100;
                    return (
                      <View key={faixa.nota} style={styles.distRow}>
                        <Text style={styles.distLabel}>★ {formatarNota(faixa.nota)}</Text>
                        <View style={styles.distTrack}>
                          <View
                            style={[
                              styles.distFill,
                              {
                                width: `${largura}%`,
                                backgroundColor:
                                  faixa.nota >= 4
                                    ? colors.forest
                                    : faixa.nota >= 2.5
                                      ? colors.gold
                                      : colors.oxblood,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.distCount}>
                          {faixa.quantidade} ({faixa.percentual}%)
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Gráfico 2: Evolução temporal */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Evolução ao longo do tempo</Text>
              {dados.evolucao.length === 0 ? (
                <Text style={typography.bodySoft}>Sem histórico temporal ainda.</Text>
              ) : (
                <>
                  <Text style={typography.caption}>
                    Barras: média do mês (0 a 5) · Abaixo: volume e média acumulada
                  </Text>
                  <View style={styles.timelineChart}>
                    {dados.evolucao.map((item) => {
                      const altura = Math.max((item.media_periodo / 5) * 110, 8);
                      return (
                        <View key={item.periodo} style={styles.timelineCol}>
                          <Text style={styles.timelineTopValue}>
                            {formatarNota(item.media_periodo)}
                          </Text>
                          <View style={styles.timelineBarWrap}>
                            <View style={[styles.timelineBar, { height: altura }]} />
                          </View>
                          <Text style={styles.timelineLabel}>{formatarMes(item.periodo)}</Text>
                          <Text style={typography.caption}>{item.quantidade} av.</Text>
                          <Text style={styles.timelineAcc}>
                            acum. {formatarNota(item.media_acumulada)}
                          </Text>
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
  kpiRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFFCF6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  kpiValue: { fontFamily: fonts.serif, fontSize: 26, color: colors.gold },
  sectionCard: {
    backgroundColor: "#FFFCF6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.serifSemibold, fontSize: 17, color: colors.ink },
  barsGroup: { gap: 8, marginTop: spacing.xs },
  distRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  distLabel: { width: 46, fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.ink },
  distTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.paper2,
    overflow: "hidden",
  },
  distFill: { height: "100%", borderRadius: 5 },
  distCount: {
    width: 68,
    textAlign: "right",
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.inkSoft,
  },
  timelineChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  timelineCol: { flex: 1, alignItems: "center", gap: 2 },
  timelineTopValue: { fontFamily: fonts.sansSemibold, fontSize: 11, color: colors.oxblood },
  timelineBarWrap: { height: 116, justifyContent: "flex-end", width: "100%", alignItems: "center" },
  timelineBar: {
    width: "70%",
    maxWidth: 34,
    backgroundColor: colors.oxblood,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  timelineLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.ink, marginTop: 4 },
  timelineAcc: { fontFamily: fonts.sans, fontSize: 10, color: colors.forest },
});
// Perfil público de um usuário: estatísticas, atividades, avaliações e progresso de leitura.
import { useCallback, useState } from "react";
import { Text, Pressable, View, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  typography,
  colors,
  fonts,
  spacing,
  radius,
  catalogStyles,
} from "../constants/theme";
import { api } from "../api/api";

/* ------------------------------- tipos da API ------------------------------- */

type StatusLeitura = "quero_ler" | "lendo" | "lido" | "abandonado";

interface AvaliacaoPerfil {
  id: number;
  livro_id: number;
  livro_nome: string;
  livro_autor: string;
  nota: number;
  texto: string;
  contem_spoilers: boolean;
  criado_em: string | null;
}

interface ProgressoPerfil {
  id: number;
  livro_id: number;
  livro_nome: string;
  livro_autor: string;
  status: StatusLeitura;
  formato: "fisico" | "digital";
  pagina_atual: number;
  total_paginas: number | null;
  percentual: number | null;
  atualizado_em: string | null;
}

interface Atividade {
  tipo: "avaliacao" | "progresso";
  livro_id: number;
  livro_nome: string;
  data: string | null;
  nota?: number;
  status?: StatusLeitura;
  percentual?: number | null;
}

interface PerfilApi {
  usuario: { id: number; nome: string; membro_desde: string | null };
  estatisticas: {
    total_avaliacoes: number;
    nota_media: number | null;
    lendo: number;
    lidos: number;
    quero_ler: number;
  };
  avaliacoes: AvaliacaoPerfil[];
  progresso: ProgressoPerfil[];
  atividades: Atividade[];
}

/* -------------------------------- utilidades -------------------------------- */

const STATUS_ROTULO: Record<StatusLeitura, string> = {
  quero_ler: "Quero ler",
  lendo: "Lendo",
  lido: "Lido",
  abandonado: "Abandonado",
};

const formatarNota = (n: number) => n.toFixed(1).replace(".", ",");

// "2026-05-03T12:00:00" -> "03/05/2026" (sem depender de Intl no Android)
const formatarData = (iso: string | null) =>
  iso ? iso.slice(0, 10).split("-").reverse().join("/") : "";

// "2026-05-03T..." -> "05/2026"
const formatarMesAno = (iso: string | null) =>
  iso ? iso.slice(0, 7).split("-").reverse().join("/") : "";

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

function descreverAtividade(a: Atividade): string {
  if (a.tipo === "avaliacao") return `Avaliou com ★ ${formatarNota(a.nota ?? 0)}`;
  switch (a.status) {
    case "lendo":
      return a.percentual != null ? `Está lendo (${a.percentual}%)` : "Está lendo";
    case "lido":
      return "Terminou de ler";
    case "quero_ler":
      return "Quer ler";
    case "abandonado":
      return "Abandonou a leitura";
    default:
      return "Atualizou o progresso";
  }
}

/* -------------------------------- subcomponentes ----------------------------- */

function ItemAtividade({ atividade, onAbrir }: { atividade: Atividade; onAbrir: () => void }) {
  return (
    <Pressable onPress={onAbrir} style={styles.activityRow} accessibilityRole="button">
      <View
        style={[
          styles.activityDot,
          { backgroundColor: atividade.tipo === "avaliacao" ? colors.gold : colors.forest },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text style={typography.bodySoft}>{descreverAtividade(atividade)}</Text>
        <Text style={styles.bookName}>{atividade.livro_nome}</Text>
      </View>
      <Text style={typography.caption}>{formatarData(atividade.data)}</Text>
    </Pressable>
  );
}

function ItemAvaliacao({ avaliacao, onAbrir }: { avaliacao: AvaliacaoPerfil; onAbrir: () => void }) {
  const [revelado, setRevelado] = useState(false);
  const escondido = avaliacao.contem_spoilers && !revelado && avaliacao.texto.length > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable onPress={onAbrir} style={{ flex: 1 }} accessibilityRole="button">
          <Text style={styles.bookName}>{avaliacao.livro_nome}</Text>
          <Text style={typography.bodySoft}>{avaliacao.livro_autor}</Text>
        </Pressable>
        <Text style={styles.rating}>★ {formatarNota(avaliacao.nota)}</Text>
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

function ItemProgresso({ progresso, onAbrir }: { progresso: ProgressoPerfil; onAbrir: () => void }) {
  const pct = progresso.percentual;
  // No formato digital, pagina_atual guarda a porcentagem: a barra e o "%" já bastam.
  const detalhe =
    progresso.formato === "digital"
      ? null
      : progresso.total_paginas != null
        ? `página ${progresso.pagina_atual} de ${progresso.total_paginas}`
        : progresso.status === "lendo" && progresso.pagina_atual > 0
          ? `página ${progresso.pagina_atual}`
          : null;

  return (
    <Pressable onPress={onAbrir} style={styles.card} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookName}>{progresso.livro_nome}</Text>
          <Text style={typography.bodySoft}>{progresso.livro_autor}</Text>
        </View>
        <Text style={[catalogStyles.badge, styles.statusBadge]}>{STATUS_ROTULO[progresso.status]}</Text>
      </View>

      {pct !== null && (
        <View
          style={styles.barTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: pct }}
        >
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      )}
      {(pct !== null || detalhe) && (
        <Text style={typography.caption}>
          {[pct !== null ? `${pct}%` : null, detalhe].filter(Boolean).join(" · ")}
        </Text>
      )}
    </Pressable>
  );
}

/* ----------------------------------- tela ----------------------------------- */

type Aba = "atividade" | "avaliacoes" | "progresso";

const FILTROS_LEITURA: { chave: "todos" | StatusLeitura; rotulo: string }[] = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "quero_ler", rotulo: "Quero ler" },
  { chave: "lendo", rotulo: "Lendo" },
  { chave: "lido", rotulo: "Lido" },
];

interface Props {
  usuarioId: number;
  ehMeuPerfil?: boolean;
}

export default function PerfilPublico({ usuarioId, ehMeuPerfil = false }: Props) {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("atividade");
  const [filtroLeitura, setFiltroLeitura] = useState<"todos" | StatusLeitura>("todos");

  // Roda ao abrir e ao voltar para a tela, para refletir avaliações e progresso novos.
  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      setErro(null);

      api
        .get(`/usuarios/${usuarioId}/perfil`)
        .then((res: PerfilApi) => {
          if (cancelado) return;
          if (!res?.usuario) throw new Error("perfil inválido");
          setPerfil(res);
        })
        .catch(() => {
          if (!cancelado) setErro("Não foi possível carregar este perfil.");
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });

      return () => {
        cancelado = true;
      };
    }, [usuarioId])
  );

  const abrirLivro = (livroId: number) => router.push(`/livro/${livroId}`);

  if (carregando && !perfil) {
    return <Text style={catalogStyles.statusText}>Carregando...</Text>;
  }
  if (erro || !perfil) {
    return <Text style={catalogStyles.statusText}>{erro ?? "Perfil não encontrado."}</Text>;
  }

  const { usuario, estatisticas } = perfil;
  const quem = ehMeuPerfil ? "Você ainda não" : "Este usuário ainda não";
  const progressoFiltrado =
    filtroLeitura === "todos"
      ? perfil.progresso
      : perfil.progresso.filter((p) => p.status === filtroLeitura);

  const abas: { chave: Aba; rotulo: string }[] = [
    { chave: "atividade", rotulo: "Atividade" },
    { chave: "avaliacoes", rotulo: "Avaliações" },
    { chave: "progresso", rotulo: "Leituras" },
  ];

  return (
    <View style={styles.root}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais(usuario.nome) || "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{usuario.nome}</Text>
          {usuario.membro_desde ? (
            <Text style={typography.bodySoft}>Membro desde {formatarMesAno(usuario.membro_desde)}</Text>
          ) : null}
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{estatisticas.total_avaliacoes}</Text>
          <Text style={typography.caption}>Avaliações</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {estatisticas.nota_media !== null ? formatarNota(estatisticas.nota_media) : "–"}
          </Text>
          <Text style={typography.caption}>Nota média</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{estatisticas.lendo}</Text>
          <Text style={typography.caption}>Lendo</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{estatisticas.lidos}</Text>
          <Text style={typography.caption}>Lidos</Text>
        </View>
      </View>

      {/* Abas */}
      <View style={styles.tabs}>
        {abas.map(({ chave, rotulo }) => {
          const ativa = aba === chave;
          return (
            <Pressable
              key={chave}
              onPress={() => setAba(chave)}
              style={[styles.tab, ativa && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
            >
              <Text style={[styles.tabText, ativa && styles.tabTextActive]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Conteúdo da aba */}
      {aba === "atividade" &&
        (perfil.atividades.length === 0 ? (
          <Text style={typography.bodySoft}>{quem} tem atividades.</Text>
        ) : (
          perfil.atividades.map((a, i) => (
            <ItemAtividade
              key={`${a.tipo}-${a.livro_id}-${i}`}
              atividade={a}
              onAbrir={() => abrirLivro(a.livro_id)}
            />
          ))
        ))}

      {aba === "avaliacoes" &&
        (perfil.avaliacoes.length === 0 ? (
          <Text style={typography.bodySoft}>{quem} avaliou nenhum livro.</Text>
        ) : (
          perfil.avaliacoes.map((a) => (
            <ItemAvaliacao key={a.id} avaliacao={a} onAbrir={() => abrirLivro(a.livro_id)} />
          ))
        ))}

      {aba === "progresso" && (
        <>
          <View style={styles.filtros}>
            {FILTROS_LEITURA.map(({ chave, rotulo }) => {
              const ativo = filtroLeitura === chave;
              return (
                <Pressable
                  key={chave}
                  onPress={() => setFiltroLeitura(chave)}
                  style={[styles.chip, ativo && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                >
                  <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{rotulo}</Text>
                </Pressable>
              );
            })}
          </View>

          {progressoFiltrado.length === 0 ? (
            <Text style={typography.bodySoft}>
              {perfil.progresso.length === 0
                ? `${quem} registrou nenhuma leitura.`
                : "Nenhum livro nesta lista."}
            </Text>
          ) : (
            progressoFiltrado.map((p) => (
              <ItemProgresso key={p.id} progresso={p} onAbrir={() => abrirLivro(p.livro_id)} />
            ))
          )}
        </>
      )}
    </View>
  );
}

/* ---------------------------------- estilos ---------------------------------- */

const styles = StyleSheet.create({
  root: { width: "100%", gap: spacing.md },

  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.oxblood,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 24, color: colors.paper },
  name: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },

  stats: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.paper2,
    paddingVertical: spacing.md,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.gold },

  tabs: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.oxblood, borderColor: colors.oxblood },
  tabText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  tabTextActive: { color: "#FFFFFF" },

  filtros: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
  chipTextActive: { color: "#FFFFFF" },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  activityDot: { width: 10, height: 10, borderRadius: 5 },

  card: {
    backgroundColor: "#FFFCF6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  bookName: { fontFamily: fonts.serifSemibold, fontSize: 16, color: colors.ink },
  rating: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.gold },
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

  statusBadge: { alignSelf: "flex-start" },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.paper2,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.forest },
});

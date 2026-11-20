// Cartão da página do livro para o usuário registrar o progresso de leitura:
//   Quero ler -> entra na lista "Quero ler" do perfil.
//   Lendo     -> informa livro físico (total de páginas e página atual) ou digital (porcentagem);
//                pode atualizar quando quiser. Ao chegar ao fim vira "Lido" e abre a avaliação.
//   Lido      -> abre a tela de avaliação (editar a existente ou criar uma nova).
import { useCallback, useState } from "react";
import { Text, Pressable, View, TextInput, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  typography,
  colors,
  fonts,
  spacing,
  radius,
  formStyles,
  catalogStyles,
} from "../constants/theme";
import { progressoApi } from "../api/progresso";
import type { CorpoProgresso, FormatoLeitura, ProgressoLivro } from "../api/progresso";

interface Props {
  livroId: number;
  usuarioId: number;
}

const apenasDigitos = (texto: string) => /^\d+$/.test(texto.trim());

export default function ProgressoLeituraCard({ livroId, usuarioId }: Props) {
  const router = useRouter();

  const [progresso, setProgresso] = useState<ProgressoLivro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formato, setFormato] = useState<FormatoLeitura>("fisico");
  const [totalTxt, setTotalTxt] = useState("");
  const [paginaTxt, setPaginaTxt] = useState("");
  const [percTxt, setPercTxt] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const irParaAvaliacao = () => router.push(`/avaliar/${livroId}`);

  // Preenche o formulário com o progresso atual (só traz a página/porcentagem se já está lendo).
  const preencher = (p: ProgressoLivro | null) => {
    const f: FormatoLeitura = p?.formato ?? "fisico";
    const lendo = p?.status === "lendo";
    setFormato(f);
    if (f === "digital") {
      setPercTxt(lendo && p ? String(p.pagina_atual) : "");
      setTotalTxt("");
      setPaginaTxt("");
    } else {
      setTotalTxt(p?.total_paginas ? String(p.total_paginas) : "");
      setPaginaTxt(lendo && p ? String(p.pagina_atual) : "");
      setPercTxt("");
    }
  };

  // Carrega ao abrir e ao voltar para a página (por exemplo, depois de avaliar).
  useFocusEffect(
    useCallback(() => {
      let cancelado = false;

      progressoApi
        .meu(livroId, usuarioId)
        .then((p) => {
          if (cancelado) return;
          setProgresso(p);
          preencher(p);
        })
        .catch(() => {
          if (!cancelado) setErro("Não foi possível carregar o seu progresso.");
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });

      return () => {
        cancelado = true;
      };
    }, [livroId, usuarioId])
  );

  async function salvar(corpo: CorpoProgresso): Promise<ProgressoLivro | null> {
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      const res = await progressoApi.salvar(livroId, usuarioId, corpo);
      setProgresso(res);
      return res;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar o progresso.");
      return null;
    } finally {
      setSalvando(false);
    }
  }

  async function aoQueroLer() {
    const res = await salvar({ status: "quero_ler" });
    if (res) {
      setEditando(false);
      setMensagem('Livro adicionado à sua lista "Quero ler". Você a encontra no seu perfil, na aba Leituras.');
    }
  }

  async function aoLido() {
    // Já marcado como lido: vai direto para a avaliação (editar ou criar).
    if (progresso?.status === "lido") {
      irParaAvaliacao();
      return;
    }
    const res = await salvar({ status: "lido" });
    if (res) {
      setEditando(false);
      irParaAvaliacao();
    }
  }

  function aoLendo() {
    setErro(null);
    setMensagem(null);
    preencher(progresso);
    setEditando(true);
  }

  async function aoSalvarLendo() {
    let corpo: CorpoProgresso;

    if (formato === "digital") {
      if (!apenasDigitos(percTxt) || Number(percTxt) > 100) {
        setErro("Informe uma porcentagem de 0 a 100.");
        return;
      }
      corpo = { status: "lendo", formato: "digital", percentual: Number(percTxt) };
    } else {
      if (!apenasDigitos(totalTxt) || Number(totalTxt) < 1) {
        setErro("Informe o total de páginas do livro.");
        return;
      }
      const total = Number(totalTxt);
      const pagina = paginaTxt.trim() === "" ? 0 : apenasDigitos(paginaTxt) ? Number(paginaTxt) : NaN;
      if (Number.isNaN(pagina)) {
        setErro("Informe a página em que você está.");
        return;
      }
      if (pagina > total) {
        setErro("A página atual não pode ser maior que o total de páginas.");
        return;
      }
      corpo = { status: "lendo", formato: "fisico", total_paginas: total, pagina_atual: pagina };
    }

    const res = await salvar(corpo);
    if (!res) return;
    setEditando(false);

    if (res.status === "lido") {
      // Chegou ao fim: o backend já moveu o livro para a lista de lidos.
      irParaAvaliacao();
    } else {
      setMensagem("Progresso atualizado.");
    }
  }

  async function aoRemover() {
    setSalvando(true);
    setErro(null);
    setMensagem(null);
    try {
      await progressoApi.remover(livroId, usuarioId);
      setProgresso(null);
      setEditando(false);
      preencher(null);
      setMensagem("Livro removido das suas leituras.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível remover.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <Text style={typography.bodySoft}>Carregando o seu progresso...</Text>;
  }

  const opcoes = [
    { chave: "quero_ler", rotulo: "Quero ler", acao: aoQueroLer },
    { chave: "lendo", rotulo: "Lendo", acao: aoLendo },
    { chave: "lido", rotulo: "Lido", acao: aoLido },
  ] as const;
  const ativa = editando ? "lendo" : progresso?.status;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Seu progresso de leitura</Text>

      {/* Quero ler / Lendo / Lido */}
      <View style={styles.opcoes}>
        {opcoes.map(({ chave, rotulo, acao }) => {
          const selecionada = ativa === chave;
          return (
            <Pressable
              key={chave}
              onPress={acao}
              disabled={salvando}
              style={[styles.opcao, selecionada && styles.opcaoAtiva, salvando && styles.desabilitado]}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionada, disabled: salvando }}
            >
              <Text style={[styles.opcaoTexto, selecionada && styles.opcaoTextoAtivo]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Formulário de "Lendo" */}
      {editando && (
        <View style={styles.formulario}>
          <View style={styles.opcoes}>
            {(["fisico", "digital"] as const).map((f) => {
              const selecionado = formato === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    setFormato(f);
                    setErro(null);
                  }}
                  style={[styles.opcao, selecionado && styles.opcaoAtiva]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selecionado }}
                >
                  <Text style={[styles.opcaoTexto, selecionado && styles.opcaoTextoAtivo]}>
                    {f === "fisico" ? "Livro físico" : "Digital"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {formato === "fisico" ? (
            <>
              <Text style={formStyles.label}>Total de páginas do livro</Text>
              <TextInput
                style={formStyles.input}
                value={totalTxt}
                onChangeText={setTotalTxt}
                keyboardType="number-pad"
                placeholder="Ex.: 320"
                maxLength={5}
              />
              <Text style={[formStyles.label, styles.espacoLabel]}>Página em que você está</Text>
              <TextInput
                style={formStyles.input}
                value={paginaTxt}
                onChangeText={setPaginaTxt}
                keyboardType="number-pad"
                placeholder="Ex.: 120"
                maxLength={5}
              />
            </>
          ) : (
            <>
              <Text style={formStyles.label}>Porcentagem lida (0 a 100)</Text>
              <TextInput
                style={formStyles.input}
                value={percTxt}
                onChangeText={setPercTxt}
                keyboardType="number-pad"
                placeholder="Ex.: 45"
                maxLength={3}
              />
            </>
          )}

          <Text style={typography.caption}>
            Ao chegar ao fim, o livro vai para a sua lista de lidos e você será levado a avaliá-lo.
          </Text>

          <Pressable
            onPress={aoSalvarLendo}
            disabled={salvando}
            style={({ pressed }) => [formStyles.button, pressed && formStyles.buttonPressed, salvando && styles.desabilitado]}
            accessibilityRole="button"
          >
            <Text style={formStyles.buttonText}>{salvando ? "Salvando..." : "Salvar progresso"}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setEditando(false);
              setErro(null);
            }}
            style={catalogStyles.secondaryButton}
            accessibilityRole="button"
          >
            <Text style={catalogStyles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      {/* Resumo do progresso atual */}
      {!editando && progresso && (
        <View style={styles.resumo}>
          {progresso.status === "lendo" && (
            <>
              <View
                style={styles.barraFundo}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: progresso.percentual ?? 0 }}
              >
                <View style={[styles.barraPreenchida, { width: `${progresso.percentual ?? 0}%` }]} />
              </View>
              <Text style={typography.bodySoft}>
                {progresso.formato === "digital"
                  ? `${progresso.pagina_atual}% lido`
                  : `Página ${progresso.pagina_atual} de ${progresso.total_paginas} · ${progresso.percentual ?? 0}%`}
              </Text>
            </>
          )}
          {progresso.status === "quero_ler" && (
            <Text style={typography.bodySoft}>Este livro está na sua lista &quot;Quero ler&quot;.</Text>
          )}
          {progresso.status === "lido" && (
            <>
              <Text style={typography.bodySoft}>Você já leu este livro.</Text>
              <Pressable onPress={irParaAvaliacao} style={catalogStyles.secondaryButton} accessibilityRole="button">
                <Text style={catalogStyles.secondaryButtonText}>Avaliar ou editar minha avaliação</Text>
              </Pressable>
            </>
          )}
          {progresso.status === "abandonado" && (
            <Text style={typography.bodySoft}>Você marcou esta leitura como abandonada.</Text>
          )}

          <Pressable onPress={aoRemover} disabled={salvando} hitSlop={8} accessibilityRole="button">
            <Text style={styles.remover}>Remover das minhas leituras</Text>
          </Pressable>
        </View>
      )}

      {mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}
      {erro && (
        <Text style={styles.erro} accessibilityLiveRegion="polite">
          {erro}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFCF6",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.md,
  },
  titulo: { fontFamily: fonts.serifSemibold, fontSize: 18, color: colors.ink },

  opcoes: { flexDirection: "row", gap: spacing.sm },
  opcao: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFFFFF",
  },
  opcaoAtiva: { backgroundColor: colors.oxblood, borderColor: colors.oxblood },
  opcaoTexto: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  opcaoTextoAtivo: { color: "#FFFFFF" },
  desabilitado: { opacity: 0.5 },

  formulario: { gap: spacing.sm },
  espacoLabel: { marginTop: spacing.sm },

  resumo: { gap: spacing.sm },
  barraFundo: { height: 8, borderRadius: 4, backgroundColor: colors.paper2, overflow: "hidden" },
  barraPreenchida: { height: 8, borderRadius: 4, backgroundColor: colors.forest },
  remover: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSoft, textDecorationLine: "underline" },

  mensagem: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.forest },
  erro: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.oxblood },
});

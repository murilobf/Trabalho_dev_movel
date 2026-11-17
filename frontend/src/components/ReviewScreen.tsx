// ReviewScreen.tsx (caminho esperado: src/components/ReviewScreen.tsx; tema em src/constants/theme.ts)
// Tela de Avaliação de Livro (criar / editar / excluir) do bookxd.
// Depende apenas de react-native e react-native-safe-area-context (já vem no Expo).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, spacing } from '../constants/theme';

// Itens que o theme.ts do projeto não tem; ficam locais para não alterar o tema.
const OXBLOOD_DEEP = '#571E26';
const RADIUS_FULL = 999;

/* -------------------------------------------------------------------------- */
/* Tipos e camada de API                                                       */
/* -------------------------------------------------------------------------- */

export interface Book {
  id: number;
  title: string;
  author: string;
  year?: number;
  genre?: string;
}

export interface Review {
  id: number;
  bookId: number;
  rating: number; // 0.5 a 5, em passos de 0.5
  text: string;
  containsSpoilers: boolean;
}

interface ReviewPayload {
  rating: number;
  text: string;
  containsSpoilers: boolean;
}

// TODO: 10.0.2.2 funciona no emulador do Android Studio. Em celular físico use o IP do PC,
// por exemplo 'http://192.168.16.41:5000'. Se o src/api/api.js já define a URL base, reaproveite.
const API_URL = 'http://10.0.2.2:5000';

// O login guarda o usuário no AsyncStorage com a chave "dadosUsuario" (veja perfil.tsx).
// É esse id que vai no header X-Usuario-Id; sem ele a API responde 401 "é necessário estar logado".
const getUsuarioId = async (): Promise<number | null> => {
  try {
    const salvo = await AsyncStorage.getItem('dadosUsuario');
    const id = salvo ? JSON.parse(salvo)?.id : null;
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const usuarioId = await getUsuarioId();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(usuarioId ? { 'X-Usuario-Id': String(usuarioId) } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = 'Não foi possível concluir a operação.';
    try {
      const body = await res.json();
      if (typeof body?.erro === 'string') detail = body.erro;
    } catch {
      /* corpo vazio ou não-JSON */
    }
    throw new Error(detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// Formato que o backend Flask devolve (avaliacoes.py)
interface ReviewApi {
  id: number;
  livro_id: number;
  nota: number;
  texto: string;
  contem_spoilers: boolean;
}

const toReview = (r: ReviewApi): Review => ({
  id: r.id,
  bookId: r.livro_id,
  rating: r.nota,
  text: r.texto,
  containsSpoilers: r.contem_spoilers,
});

const toPayload = (d: ReviewPayload) => ({
  nota: d.rating,
  texto: d.text,
  contem_spoilers: d.containsSpoilers,
});

export const reviewsApi = {
  getBook: async (bookId: number): Promise<Book> => {
    const l = await request<{ id: number; nome: string; autor: string; generos: { nome: string }[] }>(
      `/livros/${bookId}`,
    );
    return {
      id: l.id,
      title: l.nome,
      author: l.autor,
      genre: l.generos.map((g) => g.nome).join(', ') || undefined,
    };
  },
  // Avaliação do usuário logado para o livro, ou null se ainda não avaliou.
  getMine: async (bookId: number): Promise<Review | null> => {
    const r = await request<ReviewApi | null>(`/livros/${bookId}/avaliacoes/minha`);
    return r ? toReview(r) : null;
  },
  create: async (bookId: number, data: ReviewPayload) =>
    toReview(
      await request<ReviewApi>(`/livros/${bookId}/avaliacoes`, {
        method: 'POST',
        body: JSON.stringify(toPayload(data)),
      }),
    ),
  update: async (reviewId: number, data: ReviewPayload) =>
    toReview(
      await request<ReviewApi>(`/avaliacoes/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(toPayload(data)),
      }),
    ),
  remove: (reviewId: number) => request<void>(`/avaliacoes/${reviewId}`, { method: 'DELETE' }),
};

/* -------------------------------------------------------------------------- */
/* Seletor de nota (meia estrela)                                              */
/* -------------------------------------------------------------------------- */

const STAR_SIZE = 44;
const RATING_LABELS: Record<number, string> = {
  0.5: 'Quase um desastre',
  1: 'Fraco',
  1.5: 'Abaixo do esperado',
  2: 'Regular',
  2.5: 'Meio termo',
  3: 'Bom',
  3.5: 'Muito bom',
  4: 'Ótimo',
  4.5: 'Quase perfeito',
  5: 'Obra-prima',
};

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View
      style={styles.starsRow}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Nota do livro"
      accessibilityValue={{ text: value > 0 ? `${value} de 5 estrelas` : 'Sem nota' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, value + 0.5));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, value - 0.5));
      }}
    >
      {stars.map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1))); // 0, 0.5 ou 1
        return (
          <View key={star} style={styles.starCell}>
            <Text style={[styles.starGlyph, { color: colors.line }]}>★</Text>
            <View style={[styles.starFill, { width: STAR_SIZE * fill }]}>
              <Text style={[styles.starGlyph, { color: colors.gold }]}>★</Text>
            </View>
            {/* Duas áreas de toque por estrela: metade esquerda = x.5, direita = x.0 */}
            <Pressable
              style={[styles.starHit, { left: 0 }]}
              onPress={() => onChange(star - 0.5)}
              importantForAccessibility="no"
            />
            <Pressable
              style={[styles.starHit, { right: 0 }]}
              onPress={() => onChange(star)}
              importantForAccessibility="no"
            />
          </View>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Tela                                                                        */
/* -------------------------------------------------------------------------- */

const MAX_TEXT = 2000;

interface ReviewScreenProps {
  bookId: number;
  onClose: () => void; // volta para a página do livro
  onSaved?: (review: Review) => void;
  onDeleted?: () => void;
}

export default function ReviewScreen({ bookId, onClose, onSaved, onDeleted }: ReviewScreenProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [existing, setExisting] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [spoilers, setSpoilers] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = existing !== null;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [b, mine] = await Promise.all([reviewsApi.getBook(bookId), reviewsApi.getMine(bookId)]);
      setBook(b);
      if (mine) {
        setExisting(mine);
        setRating(mine.rating);
        setText(mine.text);
        setSpoilers(mine.containsSpoilers);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro ao carregar o livro.');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!existing) return rating > 0 || text.trim().length > 0;
    return (
      rating !== existing.rating ||
      text.trim() !== existing.text.trim() ||
      spoilers !== existing.containsSpoilers
    );
  }, [existing, rating, text, spoilers]);

  const handleClose = () => {
    if (!dirty) return onClose();
    Alert.alert('Descartar alterações?', 'O que você escreveu não será salvo.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: onClose },
    ]);
  };

  const handleSave = async () => {
    if (rating === 0) {
      setFormError('Escolha uma nota de meia a cinco estrelas.');
      return;
    }
    setFormError(null);
    setSaving(true);
    const payload: ReviewPayload = { rating, text: text.trim(), containsSpoilers: spoilers };
    try {
      const saved = existing
        ? await reviewsApi.update(existing.id, payload)
        : await reviewsApi.create(bookId, payload);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível salvar a avaliação.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Excluir avaliação?', 'Sua nota e sua resenha serão removidas. Isso não pode ser desfeito.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir avaliação',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await reviewsApi.remove(existing.id);
            onDeleted?.();
            onClose();
          } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Não foi possível excluir a avaliação.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  /* ------------------------------ estados vazios ----------------------------- */

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.oxblood} />
      </SafeAreaView>
    );
  }

  if (loadError || !book) {
    return (
      <SafeAreaView style={[styles.screen, styles.center, { padding: spacing.xl }]}>
        <Text style={styles.errorTitle}>Não foi possível abrir este livro</Text>
        <Text style={styles.errorBody}>{loadError ?? 'Livro não encontrado.'}</Text>
        <Pressable style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={load}>
          <Text style={styles.primaryBtnText}>Tentar de novo</Text>
        </Pressable>
        <Pressable style={styles.textBtn} onPress={onClose}>
          <Text style={styles.textBtnLabel}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /* ---------------------------------- tela ---------------------------------- */

  const remaining = MAX_TEXT - text.length;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Text style={styles.headerAction}>Cancelar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{isEditing ? 'Editar avaliação' : 'Avaliar livro'}</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving || !dirty}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving || !dirty }}
          >
            <Text style={[styles.headerAction, styles.headerSave, (saving || !dirty) && styles.disabled]}>
              Salvar
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Livro: uma "lombada" em vinho ao lado do título */}
          <View style={styles.bookRow}>
            <View style={styles.spine}>
              <View style={styles.spineBand} />
              <Text style={styles.spineInitial}>{book.title.charAt(0).toUpperCase()}</Text>
              <View style={styles.spineBand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle} numberOfLines={3}>
                {book.title}
              </Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
              {(book.year || book.genre) && (
                <Text style={styles.bookMeta}>
                  {[book.genre, book.year].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Nota */}
          <Text style={styles.sectionTitle}>Sua nota</Text>
          <StarRating value={rating} onChange={(v) => { setRating(v); setFormError(null); }} />
          <View style={styles.ratingFooter}>
            <Text style={styles.ratingLabel}>
              {rating > 0 ? `${rating.toString().replace('.', ',')} de 5, ${RATING_LABELS[rating].toLowerCase()}` : 'Toque nas estrelas para avaliar'}
            </Text>
            {rating > 0 && (
              <Pressable onPress={() => setRating(0)} hitSlop={10}>
                <Text style={styles.textBtnLabel}>Limpar</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.divider} />

          {/* Resenha */}
          <Text style={styles.sectionTitle}>Sua resenha</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX_TEXT))}
              placeholder="O que você achou? Conte sem pressa. A resenha é opcional."
              placeholderTextColor={colors.inkSoft}
              multiline
              textAlignVertical="top"
              maxLength={MAX_TEXT}
              accessibilityLabel="Resenha"
            />
          </View>
          <Text style={[styles.counter, remaining < 100 && { color: colors.oxblood }]}>
            {remaining} caracteres restantes
          </Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.switchTitle}>Contém spoilers</Text>
              <Text style={styles.switchHint}>A resenha ficará escondida até o leitor tocar para abrir.</Text>
            </View>
            <Switch
              value={spoilers}
              onValueChange={setSpoilers}
              trackColor={{ false: colors.line, true: colors.forest }}
              thumbColor={spoilers ? colors.paper : colors.paper2}
            />
          </View>

          {formError && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorBoxText}>{formError}</Text>
            </View>
          )}

          {/* Ações */}
          <Pressable
            style={[styles.primaryBtn, (saving || !dirty) && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={saving || !dirty}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={colors.paper} />
            ) : (
              <Text style={styles.primaryBtnText}>{isEditing ? 'Salvar alterações' : 'Publicar avaliação'}</Text>
            )}
          </Pressable>

          {isEditing && (
            <Pressable style={styles.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Text style={styles.deleteBtnText}>Excluir avaliação</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Estilos                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerTitle: { fontFamily: fonts.serifSemibold, fontSize: 18, color: colors.ink },
  headerAction: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.inkSoft },
  headerSave: { color: colors.oxblood, fontFamily: fonts.sansSemibold },

  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },

  // Livro
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  spine: {
    width: 64,
    height: 92,
    backgroundColor: colors.oxblood,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderLeftWidth: 5,
    borderLeftColor: OXBLOOD_DEEP,
  },
  spineBand: { width: 36, height: 2, backgroundColor: colors.gold },
  spineInitial: { fontFamily: fonts.serif, fontSize: 30, color: colors.paper },
  bookTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.ink },
  bookAuthor: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkSoft, marginTop: spacing.xs },
  bookMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft, marginTop: spacing.xs },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.xl },

  sectionTitle: { fontFamily: fonts.serifSemibold, fontSize: 18, color: colors.ink, marginBottom: spacing.md },

  // Estrelas
  starsRow: { flexDirection: 'row', alignSelf: 'center', gap: spacing.xs },
  starCell: { width: STAR_SIZE, height: STAR_SIZE },
  starGlyph: { fontSize: STAR_SIZE, lineHeight: STAR_SIZE, width: STAR_SIZE, textAlign: 'center' },
  starFill: { position: 'absolute', left: 0, top: 0, height: STAR_SIZE, overflow: 'hidden' },
  starHit: { position: 'absolute', top: 0, width: STAR_SIZE / 2, height: STAR_SIZE },
  ratingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    minHeight: 24,
  },
  ratingLabel: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.inkSoft, flex: 1 },

  // Resenha
  inputWrap: {
    backgroundColor: colors.paper2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    minHeight: 180,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  counter: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft, textAlign: 'right', marginTop: spacing.sm },

  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  switchTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  switchHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft, marginTop: 2 },

  // Erros
  errorBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.oxblood,
    backgroundColor: colors.paper2,
  },
  errorBoxText: { fontFamily: fonts.sansMedium, fontSize: 14, color: OXBLOOD_DEEP },
  errorTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, textAlign: 'center' },
  errorBody: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkSoft, textAlign: 'center', marginTop: spacing.sm },

  // Botões
  primaryBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.oxblood,
    borderRadius: RADIUS_FULL,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnDisabled: { backgroundColor: colors.inkSoft, opacity: 0.5 },
  primaryBtnText: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.paper },
  deleteBtn: { marginTop: spacing.md, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.oxblood },
  textBtn: { marginTop: spacing.md, padding: spacing.sm },
  textBtnLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.oxblood },
});

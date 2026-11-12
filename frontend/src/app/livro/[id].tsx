import { Text, Pressable, View } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { colors, formStyles, catalogStyles } from "../../constants/theme";
import { api } from "@/api/api";

type Livro = {
  nome: string,
  descricao: string,
  autor: string,
  generos: Array<JSON>
}
export default function LivroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [livro, setLivro] = useState<Livro | null>(null)

  useEffect(() => {
    api.get(`/livros/${id}`)
    .then((livro) => setLivro(livro))
  }, [id])

  return (
    <ScreenContainer scrollProps={{ contentContainerStyle: formStyles.container }}>
      <View style={formStyles.content}>
        <AppBar
          left={
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => [
                catalogStyles.secondaryButton,
                pressed && formStyles.buttonPressed,
              ]}
            >
              <Feather name="arrow-left" size={20} color={colors.oxblood} />
            </Pressable>
          }
        />

        <View style={formStyles.header}>
          <Text style={formStyles.eyebrow}>Livro #{id}</Text>
          {livro && (
            <>
              <Text accessibilityRole="header" style={formStyles.title}>
                {livro.nome}
              </Text>
              <Text style={catalogStyles.author}>{livro.autor}</Text>
            </>
          )}
        </View>

        {livro ? (
          <View style={[formStyles.card, catalogStyles.bookCard]}>
            <View style={formStyles.chips}>
              {livro.generos.map((genero, index) => (
                <Text key={index} style={catalogStyles.badge}>
                  {genero.nome}
                </Text>
              ))}
            </View>
            <Text style={catalogStyles.description}>
              {livro.descricao}
            </Text>
          </View>
        ) : (
          <Text style={catalogStyles.statusText}>carregando...</Text>
        )}
      </View>
    </ScreenContainer>
  );
}


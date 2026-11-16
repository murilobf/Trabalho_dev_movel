import { Text, Pressable, View } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import {
  colors,
  formStyles,
  catalogStyles,
  detailStyles,
} from "../../constants/theme";
import { api } from "@/api/api";

type Livro = {
  nome: string;
  descricao: string;
  autor: string;
  generos: { id: number; nome: string }[];
};

export default function LivroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [livro, setLivro] = useState<Livro | null>(null);

  useEffect(() => {
    api.get(`/livros/${id}`).then((livro) => setLivro(livro));
  }, [id]);

  return (
    <ScreenContainer
      scrollProps={{
        contentContainerStyle: [
          formStyles.container,
          detailStyles.container,
        ],
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
              <Feather
                name="arrow-left"
                size={18}
                color={colors.inkSoft}
              />
              <Text style={catalogStyles.author}>Voltar</Text>
            </Pressable>
          }
        />

        {livro ? (
          <>
            <View style={detailStyles.hero}>

              <Text
                accessibilityRole="header"
                style={[formStyles.title, detailStyles.title]}
              >
                {livro.nome}
              </Text>

              <Text
                style={[catalogStyles.author, detailStyles.author]}
              >
                por{" "}
                <Text style={detailStyles.authorName}>
                  {livro.autor}
                </Text>
              </Text>
            </View>

            <View style={detailStyles.columns}>
              <View style={detailStyles.mainColumn}>
                <Text
                  accessibilityRole="header"
                  style={[
                    formStyles.eyebrow,
                    detailStyles.sectionLabel,
                  ]}
                >
                  SINOPSE
                </Text>

                <Text
                  style={[
                    catalogStyles.description,
                    detailStyles.description,
                  ]}
                >
                  {livro.descricao}
                </Text>
              </View>

              <View style={detailStyles.sideColumn}>
                <Text
                  accessibilityRole="header"
                  style={[
                    formStyles.eyebrow,
                    detailStyles.sectionLabel,
                  ]}
                >
                  GÊNEROS
                </Text>

                <View style={formStyles.chips}>
                  {livro.generos.map((genero) => (
                    <Text
                      key={genero.id}
                      style={[
                        catalogStyles.badge,
                        detailStyles.genre,
                      ]}
                    >
                      {genero.nome}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </>
        ) : (
          <Text style={catalogStyles.statusText}>
            carregando...
          </Text>
        )}
      </View>
    </ScreenContainer>
  );
}
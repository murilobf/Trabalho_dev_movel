import { Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { typography } from "../../constants/theme";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <AppBar userInitials="JS" />

      <Text style={typography.sectionTitle}>Início</Text>
      <Text style={typography.bodySoft}>Conteúdo da tela inicial entra aqui.</Text>

      {/* Exemplo de navegação pra rota dinâmica — apague quando não precisar mais */}
      <Pressable onPress={() => router.push("/livro/1")} style={{ marginTop: 16 }}>
        <Text style={[typography.body, { color: "#7C2A34" }]}>Ver exemplo de rota dinâmica →</Text>
      </Pressable>
    </ScreenContainer>
  );
}

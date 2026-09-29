import { Text, Pressable } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { typography } from "../../constants/theme";
import { useRouter } from "expo-router";

export default function PerfilScreen() {
  const router = useRouter()
  return (
    <ScreenContainer>
      <AppBar userInitials="JS" />

      <Text style={typography.sectionTitle}>Perfil</Text>
      <Text style={typography.bodySoft}>Conteúdo do perfil entra aqui.</Text>

      <Pressable onPress={() => router.push("/telas/login")} style={{ marginTop: 16 }}>
              <Text style={[typography.body, { color: "#7C2A34" }]}>Fazer Login →</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/telas/registro")} style={{ marginTop: 16 }}>
              <Text style={[typography.body, { color: "#7C2A34" }]}>Registrar Nova Conta</Text>
        </Pressable>
    </ScreenContainer>
  );
}

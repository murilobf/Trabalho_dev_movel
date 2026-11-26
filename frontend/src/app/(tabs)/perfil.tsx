// Salvar como: src/app/(tabs)/perfil.tsx
import { Text, Pressable, Button, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import PerfilPublico, { iniciais } from "../../components/PerfilPublico";
import { layout, typography, catalogStyles } from "../../constants/theme";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, sair } = useAuth();

  const logado = (usuario !== null)

  async function fazerLogout() {
    await sair()
  }

  return (
    <ScreenContainer>
      {usuario === null ? (
        <>
          <AppBar userInitials="JS" />

          <Text style={typography.sectionTitle}>Perfil</Text>
          <Text style={typography.bodySoft}>Entre na sua conta para ver o seu perfil de leitura.</Text>

          <Pressable onPress={() => router.push("/telas/login")} style={{ marginTop: 16 }}>
            <Text style={[typography.body, { color: "#7C2A34" }]}>Fazer Login</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/telas/registro")} style={{ marginTop: 16 }}>
            <Text style={[typography.body, { color: "#7C2A34" }]}>Registrar Nova Conta</Text>
          </Pressable>
        </>
      ) : (
        <>
          <AppBar userInitials={iniciais(usuario.nome)} />

          {/* Perfil: estatísticas, atividades, avaliações e progresso de leitura */}
          <PerfilPublico usuarioId={usuario.id} ehMeuPerfil />

          <Pressable
            onPress={() => router.push("/telas/relatorio_pessoal")}
            style={[catalogStyles.secondaryButton, { marginTop: 16 }]}
            accessibilityRole="button"
          >
            <Text style={catalogStyles.secondaryButtonText}>Ver meu relatório de leitura</Text>
          </Pressable>

          {/* Dados privados: só aparecem para o próprio usuário */}
          <Text style={typography.sectionTitle}>Minha conta</Text>
          <Text style={layout.fieldLabel}>Email cadastrado</Text>
          <Text style={layout.fieldValue}>{usuario.email ?? "Desconhecido"}</Text>
        
          <View style={{ marginTop: 24 }}>
            <Button title="Logout" onPress={fazerLogout} />
          </View>
        
        </>
      )}
    </ScreenContainer>
  );
}

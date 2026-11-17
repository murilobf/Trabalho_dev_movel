// Salvar como: src/app/(tabs)/perfil.tsx
import { Text, Pressable, Button, View } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import PerfilPublico, { iniciais } from "../../components/PerfilPublico";
import { layout, typography } from "../../constants/theme";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Formato guardado no AsyncStorage depois do login (resposta de /usuarios_email).
interface DadosUsuario {
  id: number;
  nome: string;
  email: string;
}

export default function PerfilScreen() {
  const router = useRouter();

  // Antes era useState<string | null>, mas o valor guardado é um objeto.
  const [dadosUsuario, setDadosUsuario] = useState<DadosUsuario | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        try {
          const salvo = await AsyncStorage.getItem("dadosUsuario");
          setDadosUsuario(salvo ? JSON.parse(salvo) : null);
        } catch {
          setDadosUsuario(null);
        }
      }
      carregar();
    }, [])
  );

  async function fazerLogout() {
    await AsyncStorage.removeItem("dadosUsuario");
    setDadosUsuario(null);
  }

  return (
    <ScreenContainer>
      {dadosUsuario === null ? (
        <>
          <AppBar userInitials="JS" />

          <Text style={typography.sectionTitle}>Perfil</Text>
          <Text style={typography.bodySoft}>Entre na sua conta para ver o seu perfil de leitura.</Text>

          <Pressable onPress={() => router.push("/telas/login")} style={{ marginTop: 16 }}>
            <Text style={[typography.body, { color: "#7C2A34" }]}>Fazer Login →</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/telas/registro")} style={{ marginTop: 16 }}>
            <Text style={[typography.body, { color: "#7C2A34" }]}>Registrar Nova Conta</Text>
          </Pressable>
        </>
      ) : (
        <>
          <AppBar userInitials={iniciais(dadosUsuario.nome)} />

          {/* Perfil: estatísticas, atividades, avaliações e progresso de leitura */}
          <PerfilPublico usuarioId={dadosUsuario.id} ehMeuPerfil />

          {/* Dados privados: só aparecem para o próprio usuário */}
          <Text style={typography.sectionTitle}>Minha conta</Text>
          <Text style={layout.fieldLabel}>Email cadastrado</Text>
          <Text style={layout.fieldValue}>{dadosUsuario.email ?? "Desconhecido"}</Text>

          <View style={{ marginTop: 24 }}>
            <Button title="Logout" onPress={fazerLogout} />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

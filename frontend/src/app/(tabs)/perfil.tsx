import { Text, Pressable, Button } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { layout, typography } from "../../constants/theme";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PerfilScreen() {
  const router = useRouter()

  const [dadosUsuario, setDadosUsuario] = useState<string | null>(null);
  const logado = (dadosUsuario !== null)

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
      {!logado? 
        <>
        <AppBar userInitials="JS" />

        <Text style={typography.sectionTitle}>Perfil</Text>
        <Text style={typography.bodySoft}>Conteúdo do perfil entra aqui.</Text>

        <Pressable onPress={() => router.push("/telas/login")} style={{ marginTop: 16 }}>
                <Text style={[typography.body, { color: "#7C2A34" }]}>Fazer Login →</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/telas/registro")} style={{ marginTop: 16 }}>
              <Text style={[typography.body, { color: "#7C2A34" }]}>Registrar Nova Conta</Text>
        </Pressable>
        </>
      :
      <>
        <Text style={layout.title}>Dados do Usuário</Text>
        <Text style={layout.subtitle}>Confira dados sobre seu perfil</Text>

        <Text style={layout.fieldLabel}>Nome de usuário</Text>
        <Text style={layout.fieldValue}>{dadosUsuario.nome ?? 'Desconhecido'}</Text>
        <Text style={layout.fieldLabel}>Email cadastrado</Text>
        <Text style={layout.fieldValue}>{dadosUsuario.email ?? 'Desconhecido'}</Text>
        <Button title="Logout" onPress={fazerLogout} />
      </>}
    </ScreenContainer>
  );
}

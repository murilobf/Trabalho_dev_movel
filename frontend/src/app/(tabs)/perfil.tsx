import { Text, Pressable, Button } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { layout, typography } from "../../constants/theme";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilScreen() {
  const router = useRouter()

  const { usuario, sair } = useAuth();
  const logado = (usuario !== null)

  async function fazerLogout() {
    await sair()
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
        <Text style={layout.fieldValue}>{usuario.nome ?? 'Desconhecido'}</Text>
        <Text style={layout.fieldLabel}>Email cadastrado</Text>
        <Text style={layout.fieldValue}>{usuario.email ?? 'Desconhecido'}</Text>
        <Button title="Logout" onPress={fazerLogout} />
      </>}
    </ScreenContainer>
  );
}

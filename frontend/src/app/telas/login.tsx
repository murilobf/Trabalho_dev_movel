import { Text, TextInput, Button, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { layout, typography, colors } from "../../constants/theme";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

export default function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  const { usuario, entrar, autenticando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (usuario) {
      router.replace("/(tabs)/perfil");
    }
  }, [usuario, router]);

  async function fazerLogin() {
    if (autenticando) return;

    setErro(false);

    try {
      await entrar(email, senha);
    } catch {
      setErro(true);
    }
  }

  return (
    <ScreenContainer
      scrollProps={{ contentContainerStyle: [layout.center] }}
    >
      {!autenticando ? (
        <>
          <Text style={layout.title}>Login</Text>
          <Text style={layout.subtitle}>Entre na sua conta</Text>

          <TextInput
            style={layout.input}
            value={email}
            placeholder="exemplo@email.com"
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TextInput
            style={layout.input}
            value={senha}
            placeholder="Sua senha"
            onChangeText={setSenha}
            secureTextEntry
          />

          {erro && (
            <Text>
              Não foi possível entrar. Verifique suas credenciais e conexão.
            </Text>
          )}

          <Button
            title="Login"
            onPress={fazerLogin}
            disabled={autenticando || !email.trim() || !senha}
          />

          <Pressable
            onPress={() => router.push("/telas/registro")}
            style={{ marginTop: 18 }}
            accessibilityRole="button"
          >
            <Text style={[typography.body, { color: colors.oxblood }]}>
              Não tem conta? Cadastre-se →
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={layout.title}>Carregando...</Text>
          <Text style={layout.subtitle}>Aguarde um momento</Text>
        </>
      )}
    </ScreenContainer>
  );
}
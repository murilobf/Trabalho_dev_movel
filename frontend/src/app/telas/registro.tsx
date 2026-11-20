import { Text, TextInput, Button, Alert } from "react-native";
import { useState } from "react";
import { layout } from "../../constants/theme";
import { ScreenContainer } from "../../components/ScreenContainer";
import { api } from "../../api/api";
import { useRouter } from "expo-router";

export default function TelaRegistro() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function fazerRegistro() {
    if (enviando) return;
    setErro(null);
    setEnviando(true);

    const body = {
      nome: nomeUsuario.trim(),
      email: email.trim(),
      senha,
    };

    try {
      await api.post("/usuarios", body);
      Alert.alert("Conta criada!", "Agora entre com seu email e senha.");
      router.replace("/telas/login");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScreenContainer scrollProps={{ contentContainerStyle: [layout.center] }}>
      <Text style={layout.title}>Cadastro</Text>
      <Text style={layout.subtitle}>Crie sua conta no Bookd</Text>

      <TextInput
        style={layout.input}
        value={nomeUsuario}
        placeholder="Seu nome de usuário"
        onChangeText={setNomeUsuario}
      />

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

      {erro && <Text style={{ marginBottom: 12 }}>{erro}</Text>}

      <Button
        title={enviando ? "Cadastrando..." : "Registrar"}
        onPress={fazerRegistro}
        disabled={enviando || !nomeUsuario.trim() || !email.trim() || !senha}
      />
    </ScreenContainer>
  );
}
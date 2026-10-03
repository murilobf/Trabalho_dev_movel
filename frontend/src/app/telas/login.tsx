import { Text, TextInput, Button } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { layout } from "../../constants/theme";
import { ScreenContainer } from "../../components/ScreenContainer";
import { api } from "../../api/api";

export default function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const salvo = await AsyncStorage.getItem("dadosUsuario");
        setDadosUsuario(salvo);
      } catch {
        setDadosUsuario(null);
      }
    }
    carregar();
  }, []);

    async function fazerLogin() {
    setErro(false);
    try {
    const usuario = await api.get(`/usuarios_email/${email}`);
    const texto = JSON.stringify(usuario);

    await AsyncStorage.setItem("dadosUsuario", texto);
    setDadosUsuario(texto);
    } catch (e) {
    console.log("Erro no login:", e);
    setErro(true);
    }
    }

  async function fazerLogout() {
    await AsyncStorage.removeItem("dadosUsuario");
    setDadosUsuario(null);
  }

  const logado = dadosUsuario != null && dadosUsuario !== "";

  return (
    <ScreenContainer scrollProps={{ contentContainerStyle: [layout.center] }}>
      {!logado ? (
        <>
          <Text style={layout.title}>Login</Text>
          <Text style={layout.subtitle}>Entre na sua conta</Text>

          <TextInput
            style={layout.input}
            value={email}
            placeholder="exemplo@email.com"
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={layout.input}
            value={senha}
            placeholder="SenhaSecreta123"
            onChangeText={setSenha}
            secureTextEntry
          />

          {erro && <Text>Usuário não encontrado ou erro no servidor</Text>}

          <Button title="Login" onPress={fazerLogin} />
        </>
      ) : (
        <>
          <Text style={layout.title}>Dados da Conta</Text>
          <Text style={layout.subtitle}>
            Confira e altere informações da sua conta
          </Text>
          <Text>{dadosUsuario}</Text>

          <Button title="Sair" onPress={fazerLogout} />
        </>
      )}
    </ScreenContainer>
  );
}
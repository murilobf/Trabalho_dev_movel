import { Text, TextInput, Button } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { layout } from "../../constants/theme";
import { ScreenContainer } from "../../components/ScreenContainer";
import { api } from "../../api/api";
import { useRouter } from "expo-router";

export default function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false)

  const router = useRouter()

  async function fazerLogin() {
    setErro(false);
    try {
      const usuario = await api.get(`/usuarios_email?email=${email}&senha=${senha}`);
      const texto = JSON.stringify(usuario);

      await AsyncStorage.setItem("dadosUsuario", texto);

      router.replace("/(tabs)/perfil")
    } 
    catch (e) {
      console.log("Erro no login:", e);
      setErro(true);
    }
  }

  return (
    <ScreenContainer scrollProps={{ contentContainerStyle: [layout.center] }}>
      {!carregando ? (
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

          {erro && <Text>Crenciais incorretas ou erro no servidor</Text>}

          <Button title="Login" onPress={fazerLogin} />
        </>
      ) : (
        <>
          <Text style={layout.title}>Carregando...</Text>
          <Text style={layout.subtitle}>
            Aguarde um momento
          </Text>
        </>
      )}
    </ScreenContainer>
  );
}
import { Text, TextInput, Button } from "react-native";
import { useState } from "react";
import {layout} from "../../constants/theme"
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ScreenContainer} from "../../components/ScreenContainer"
import {api} from "../../api/api"
import {useRouter} from "expo-router"

export default function telaRegistro(){

    const router = useRouter()
    const [error, setErro] = useState(false)
    const [nome_usuario, setNomeUsuario] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")

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

    async function fazerRegistro(){
        setErro(false);

        const body={
            "nome":nome_usuario,
            "email":email,
            "senha":senha,
        }
        try{
            const usuario = await api.post("/usuarios",body)
            fazerLogin()
        }
        catch{
            setErro(true)
        }
    }

    return(
        <ScreenContainer scrollProps={{contentContainerStyle:[layout.center]}}>
            <Text style={layout.title}>Login</Text>
            <Text style={layout.subtitle}>Entre na sua conta</Text>
            <TextInput
            style={layout.input} 
            value={nome_usuario}
            placeholder="joaosilva123"
            onChangeText={setNomeUsuario}
            />
            <TextInput
            style={layout.input} 
            value={email}
            placeholder="exemplo@email.com"
            onChangeText={setEmail}
            />

            <TextInput 
            style={layout.input}
            value={senha}
            placeholder="SenhaSecreta123"
            onChangeText={setSenha}
            />
            <Button
            title={"Registro"}
            onPress={fazerRegistro}/>

        </ScreenContainer>
    )
}
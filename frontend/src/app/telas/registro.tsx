import { Text, TextInput, Button } from "react-native";
import { useState } from "react";
import {layout} from "../../constants/theme"
import {ScreenContainer} from "../../components/ScreenContainer"
import {api} from "../../api/api"

export default function telaRegistro(){

    const [error, setErro] = useState(false)
    const [nome_usuario, setNomeUsuario] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")

    async function fazerRegistro(){
        setErro(false);

        const body={
            "nome":nome_usuario,
            "email":email,
            "senha":senha,
        }
        try{
            const usuario = await api.post("/usuarios",body)
            console.log(usuario)
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
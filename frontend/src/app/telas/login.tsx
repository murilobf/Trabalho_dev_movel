import { Text, TextInput, Button } from "react-native";
import { useState } from "react";
import {layout} from "../../constants/theme"
import {ScreenContainer} from "../../components/ScreenContainer"
import {api} from "../../api/api"

const [erro, setErro] = useState(false)

async function fazerLogin(){
    setErro(false);

    try{
        const usuario = api.get("/usuario")
    }
    catch{
        setErro(true)
    }
}

export default function loginScreen(){
    
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    return(
        <ScreenContainer scrollProps={{contentContainerStyle:[layout.center]}}>
            <Text style={layout.title}>Login</Text>
            <Text style={layout.subtitle}>Entre na sua conta</Text>
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
            title={"Login"}
            onPress={fazerLogin}
            />
        </ScreenContainer>
    )
}
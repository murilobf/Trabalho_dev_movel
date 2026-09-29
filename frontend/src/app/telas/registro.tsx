import { Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";
import {layout} from "../../constants/theme"
import {ScreenContainer} from "../../components/ScreenContainer"


export default function loginScreen(){
    
    const [nome_usuario, setNomeUsuario] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [error, setError] = useState(false)
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
        </ScreenContainer>
    )
}
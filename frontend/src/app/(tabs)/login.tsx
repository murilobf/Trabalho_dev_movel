import { Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { useState } from "react";
import {layout} from "../../constants/theme"
import {ScreenContainer} from "../../components/ScreenContainer"


export default function loginScreen(){
    
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [error, setError] = useState(false)
    return(
        <ScreenContainer>
            <Text>Login</Text>
            <TextInput 
            value={email}
            placeholder="exemplo@email.com"
            onChangeText={setEmail}
            />
            <TextInput 
            value={senha}
            placeholder="SenhaSecreta123"
            onChangeText={setSenha}
            />
        </ScreenContainer>
    )
}
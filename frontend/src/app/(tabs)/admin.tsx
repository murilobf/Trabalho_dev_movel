import { Text, TextInput, Button, View, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { layout, typography } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/api/api";

/* A ideia dessa tela é ela ser um painel do administrador, permitindo aceitar pedidos de livros, criar novos gêneros, ver
dashboards e semelhantes. No momento ela só redireciona pra criar um novo gênero */

export default function TelaAdmin(){
    const router = useRouter()

    return(
        <ScreenContainer>
            <Pressable onPress={() => router.push("/telas/gestao_generos")} style={{ marginTop: 16 }}>
                            <Text style={[typography.body, { color: "#7C2A34" }]}>Gêneros</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/telas/gestao_pessoas")} style={{ marginTop: 16 }}>
                            <Text style={[typography.body, { color: "#7C2A34" }]}>Usuários</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/telas/gestao_livros")} style={{ marginTop: 16 }}>
                            <Text style={[typography.body, { color: "#7C2A34" }]}>Livros</Text>
            </Pressable>
        </ScreenContainer>
    )
}

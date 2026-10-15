import { Text, TextInput, Button, View, Modal } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { layout } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/api/api";

/* A ideia dessa tela é ela ser um painel do administrador, permitindo aceitar pedidos de livros, criar novos gêneros, ver
dashboards e semelhantes. No momento ela só redireciona pra criar um novo gênero */

export default function TelaAdmin(){

    const [modalVisivel, setModalVisivel] = useState(false)
    const [generos, setGeneros] = useState<{id:number, nome:string}>([]);
    const [novoGenero, setNovoGenero] = useState({"nome":""})

    useEffect(() => {
        api.get("/generos")
            .then((res) => setGeneros(res))
            .catch(() => setGeneros([]));
    }, []);

    function enviaNovoGenero(){
        api.post("/generos", novoGenero)

        setNovoGenero({"nome":""})
        setModalVisivel(false)
    }

    return(

        //Lista de gêneros.
        <View>
            <Modal visible={true}>
            <View>
                <Text style={layout.title}>Nome do Gênero</Text>
                <TextInput
                    
                    style={layout.input}
                    value={novoGenero.nome}
                    onChangeText={(nome) => setNovoGenero({"nome":nome})}
                ></TextInput>
                <Button title="Enviar" onPress={enviaNovoGenero}></Button>
            </View>
            </Modal>
            <Button title="Inserir novo" onPress={() => setModalVisivel(true)}></Button>
            {generos.length === 0 ? 
                (
                <>
                <Text>Parece que não há nenhum gênero no sistema...</Text>
                </>
                )
                :
                (
                <>
                    {generos.map((genero) => {
                        <Text>{genero.nome}</Text>
                    })}
                </>
                )
            
            }
        </View>
    )
}

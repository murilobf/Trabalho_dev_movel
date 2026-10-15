import { Text, TextInput, Button, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { layout } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/api/api";

const DADOS_INICIAIS = {
    nome: "",
    autor: "",
    descricao: "",
    genero_id: "",     // "" = todos
};

export default function FormLivro(){
    const [generos, setGeneros] = useState<{id:number, nome:string}>([]);
    const [dadosLivro, setDadosLivro] = useState(DADOS_INICIAIS);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
            api.get("/generos")
                .then((res) => {console.log(res) ;
                    setGeneros(res);})
                .catch(() => setGeneros([]));
        }, []
    );

    function atualizarDados(campo:string, valor:string){
        setDadosLivro((anterior) => ({...anterior, [campo]:valor}))
    }

    function enviarDados(){
        if(enviando)
            return;
        try{
            setEnviando(true);
            api.post('/livros', dadosLivro);
            setDadosLivro(DADOS_INICIAIS);
        }
        catch{
            setEnviando(false)
        }
        finally{
            setEnviando(false)
        }
    }

    return(
        <ScreenContainer scrollProps={{ contentContainerStyle: [layout.center] }}>
            <Text>
                Insira dados sobre o livro que deseja adicionar no sistema. 
                Um curador vai analisar seu pedido e, caso seja válido, irá adicionar no catálogo.
            </Text>
            <View>
                <Text style={layout.subtitle}>
                    Nome do Livro
                </Text>
                <TextInput
                style={layout.input}
                value={dadosLivro.nome}
                onChangeText={(v) => atualizarDados("nome", v)}
                ></TextInput>

                <Text style={layout.subtitle}>
                    Autor do Livro
                </Text>
                <TextInput
                style={layout.input}
                value={dadosLivro.autor}
                onChangeText={(v) => atualizarDados("autor", v)}
                ></TextInput>

                <Picker
                    selectedValue={dadosLivro.genero}
                    onValueChange={(v) => atualizarDados("genero_id", v)}
                >
                    <Picker.Item label="Todos os gêneros" value="" />
                    {generos.map((g) => (
                        <Picker.Item key={g.id} label={g.nome} value={g.id} />
                    ))}
                </Picker>

                <Button title="Enviar Solicitação" onPress={enviarDados}></Button>
            </View>
        </ScreenContainer>
    )
}
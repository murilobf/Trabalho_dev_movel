import { Text, TextInput, Pressable, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { colors, formStyles } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/api/api";

const DADOS_INICIAIS = {
    nome: "",
    autor: "",
    descricao: "",
    generos_ids: [],     
};

export default function FormLivro(){
    const [generos, setGeneros] = useState<{id:number, nome:string}[]>([]);
    const [dadosLivro, setDadosLivro] = useState(DADOS_INICIAIS);
    const [enviando, setEnviando] = useState(false);

    function alternarGenero(id: number) {
        setDadosLivro((anterior) => ({
            ...anterior,
            generos_ids: anterior.generos_ids.includes(id)
                ? anterior.generos_ids.filter((generoId) => generoId !== id)
                : [...anterior.generos_ids, id],
        }));
    }

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

    return (
        <ScreenContainer scrollProps={{ contentContainerStyle: formStyles.container }}>
            <View style={formStyles.content}>
                <View style={formStyles.header}>
                    <Text style={formStyles.eyebrow}>NOSSO CATÁLOGO</Text>
                    <Text accessibilityRole="header" style={formStyles.title}>Uma nova história{ "\n" }começa aqui.</Text>
                    <Text style={formStyles.intro}>
                        Indique um livro que merece um lugar na nossa estante.
                    </Text>
                </View>

                <View style={formStyles.card}>
                    <Text accessibilityRole="header" style={formStyles.cardTitle}>Indique um livro</Text>
                    <Text style={formStyles.cardDescription}>Preencha os dados da sua sugestão.</Text>

                    <View style={formStyles.field}>
                        <Text style={formStyles.label}>Nome do livro</Text>
                        <TextInput
                            accessibilityLabel="Nome do livro"
                            style={formStyles.input}
                            placeholder="Ex.: Dom Casmurro"
                            placeholderTextColor={colors.inkSoft}
                            selectionColor={colors.oxblood}
                            value={dadosLivro.nome}
                            onChangeText={(v) => atualizarDados("nome", v)}
                        />
                    </View>

                    <View style={formStyles.field}>
                        <Text style={formStyles.label}>Autor do livro</Text>
                        <TextInput
                            accessibilityLabel="Autor do livro"
                            style={formStyles.input}
                            placeholder="Ex.: Machado de Assis"
                            placeholderTextColor={colors.inkSoft}
                            selectionColor={colors.oxblood}
                            value={dadosLivro.autor}
                            onChangeText={(v) => atualizarDados("autor", v)}
                        />
                    </View>

                    <View style={formStyles.field}>
                        <Text style={formStyles.label}>Descrição do livro</Text>
                        <TextInput
                            accessibilityLabel="Descrição do livro"
                            style={[formStyles.input, formStyles.textarea]}
                            maxLength={500}
                            multiline
                            placeholder="Narrado em primeira pessoa, o protagonista Bento revela sua história de amor e o drama de sua vida ao se apaixonar por sua vizinha: Capitu."
                            placeholderTextColor={colors.inkSoft}
                            selectionColor={colors.oxblood}
                            value={dadosLivro.descricao}
                            onChangeText={(v) => atualizarDados("descricao", v)}
                        />
                    </View>

                    <View style={formStyles.field}>
                        <Text style={formStyles.label}>Gênero literário</Text>
                        <View style={formStyles.pickerContainer}>
                            <View style={formStyles.chips}>
                                {generos.map((genero) => {
                                    const selecionado = dadosLivro.generos_ids.includes(genero.id);

                                    return (
                                        <Pressable
                                            key={genero.id}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: selecionado }}
                                            onPress={() => alternarGenero(genero.id)}
                                            style={[
                                                formStyles.chip,
                                                selecionado && formStyles.chipSelecionado,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    formStyles.chipTexto,
                                                    selecionado && formStyles.chipTextoSelecionado,
                                                ]}
                                            >
                                                {selecionado ? "✓ " : ""}{genero.nome}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        onPress={enviarDados}
                        style={({ pressed }) => [formStyles.button, pressed && formStyles.buttonPressed]}
                    >
                        <Text style={formStyles.buttonText}>Enviar solicitação</Text>
                    </Pressable>
                    <Text style={formStyles.note}>
                        Nossa curadoria vai analisar sua sugestão antes de adicioná-la ao catálogo.
                    </Text>
                </View>
            </View>
        </ScreenContainer>
    );
}

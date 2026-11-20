import { Text, TextInput, Button, View, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { layout, formStyles, detailStyles, colors, catalogStyles, managementStyles } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { AppBar } from "@/components/AppBar";
import { api } from "@/api/api";

type Genero = { id: number, nome: string }
type Livro = { id: number, nome: string, autor: string, generos: Genero[], aprovado: boolean | 0 | 1 }
type DadosLivro = { nome: string, autor: string, generos_ids: number[], aprovado: boolean }

export default function TelaGestaoLivros(){
    const [livros, setLivros] = useState<Livro[]>([])
    const [generos, setGeneros] = useState<Genero[]>([])
    const [selecionado, setSelecionado] = useState<Livro | null>(null)
    const [dados, setDados] = useState<DadosLivro>({ nome: "", autor: "", generos_ids: [], aprovado: false })
    const [excluindo, setExcluindo] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [erroLista, setErroLista] = useState("")
    const [erroModal, setErroModal] = useState("")
    const router = useRouter()

    useEffect(() => {
        carregarDados()
    }, [])

    async function carregarDados(){
        setCarregando(true)
        setErroLista("")
        try{
            const [listaLivros, listaGeneros] = await Promise.all([api.get("/livros"), api.get("/generos")])
            setLivros(listaLivros)
            setGeneros(listaGeneros)
        }
        catch{
            setErroLista("Não foi possível carregar os livros e gêneros.")
        }
        finally{
            setCarregando(false)
        }
    }

    function abrirModal(livro: Livro, excluir = false){
        setSelecionado(livro)
        setDados({
            nome: livro.nome,
            autor: livro.autor,
            generos_ids: livro.generos.map((genero) => genero.id),
            aprovado: livro.aprovado === 1
        })
        setExcluindo(excluir)
        setErroModal("")
    }

    function fecharModal(){
        if(!salvando) setSelecionado(null)
    }

    function alternarGenero(id: number){
        setDados((anterior) => ({
            ...anterior,
            generos_ids: anterior.generos_ids.includes(id)
                ? anterior.generos_ids.filter((generoId) => generoId !== id)
                : [...anterior.generos_ids, id]
        }))
    }

    async function confirmar(){
        if(!selecionado || salvando) return
        setErroModal("")

        if(!excluindo && (!dados.nome.trim() || !dados.autor.trim() || !dados.generos_ids.length)){
            setErroModal("Preencha nome, autor e selecione pelo menos um gênero.")
            return
        }

        setSalvando(true)
        try{
            if(excluindo){
                await api.delete(`/livros/${selecionado.id}`)
            }
            else{
                await api.put(`/livros/${selecionado.id}`, {
                    ...dados, nome: dados.nome.trim(), autor: dados.autor.trim()
                })
            }

            setSelecionado(null)
            await carregarDados()
        }
        catch{
            setErroModal("Não foi possível concluir a operação.")
        }
        finally{
            setSalvando(false)
        }
    }

    return(
        <ScreenContainer scrollProps={{ contentContainerStyle: [formStyles.container, detailStyles.container] }}>
            <View style={detailStyles.content}>
                <AppBar left={
                    <Pressable onPress={() => router.back()} hitSlop={10}
                        accessibilityRole="button" accessibilityLabel="Voltar"
                        style={({ pressed }) => [detailStyles.backLink, pressed && formStyles.buttonPressed]}>
                        <Feather name="arrow-left" size={18} color={colors.inkSoft} />
                        <Text style={catalogStyles.author}>Voltar</Text>
                    </Pressable>
                } />

                <View style={detailStyles.hero}>
                    <Text style={formStyles.title}>Gestão de livros</Text>
                    <Text style={formStyles.intro}>Atualize os dados e revise a aprovação dos livros.</Text>
                </View>

                <View style={managementStyles.toolbar}>
                    <Text style={catalogStyles.author}>
                        {carregando ? "Carregando..." : `${livros.length} livros cadastrados`}
                    </Text>
                </View>

                {!!erroLista && (
                    <View style={formStyles.field}>
                        <Text style={managementStyles.error}>{erroLista}</Text>
                        <Button title="Tentar novamente" color={colors.oxblood} onPress={carregarDados} />
                    </View>
                )}

                {!carregando && !erroLista && livros.length === 0 && (
                    <Text style={catalogStyles.statusText}>Nenhum livro cadastrado.</Text>
                )}

                {livros.map((livro) => (
                    <View key={livro.id} style={managementStyles.row}>
                        <View style={managementStyles.genreInfo}>
                            <Text style={catalogStyles.bookTitle}>{livro.nome}</Text>
                            <Text style={catalogStyles.author}>{livro.autor}</Text>
                            <Text style={catalogStyles.description}>
                                {livro.generos.map((genero) => genero.nome).join(", ")}
                            </Text>
                            <Text style={catalogStyles.badge}>
                                {livro.aprovado ? "Aprovado" : "Pendente"}
                            </Text>
                        </View>
                        <View style={formStyles.chips}>
                            <Pressable style={managementStyles.actionButton} onPress={() => abrirModal(livro)}
                                accessibilityRole="button" accessibilityLabel={`Editar ${livro.nome}`}>
                                <Text style={catalogStyles.author}>Editar</Text>
                            </Pressable>
                            <Pressable style={managementStyles.actionButton} onPress={() => abrirModal(livro, true)}
                                accessibilityRole="button" accessibilityLabel={`Excluir ${livro.nome}`}>
                                <Text style={catalogStyles.secondaryButtonText}>Excluir</Text>
                            </Pressable>
                        </View>
                    </View>
                ))}

                <Modal visible={selecionado !== null} transparent animationType="fade" onRequestClose={fecharModal}>
                    <KeyboardAvoidingView style={managementStyles.overlay}
                        behavior={Platform.OS === "ios" ? "padding" : undefined}>
                        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={layout.center}>
                            <View style={[formStyles.card, managementStyles.dialog]}>
                                <Text style={formStyles.cardTitle}>{excluindo ? "Excluir livro" : "Editar livro"}</Text>
                                <Text style={formStyles.cardDescription}>
                                    {excluindo
                                        ? `Deseja excluir “${selecionado?.nome}”? Esta ação não pode ser desfeita.`
                                        : "Atualize os dados e defina a aprovação do livro."}
                                </Text>

                                {!excluindo && (
                                    <>
                                        <View style={formStyles.field}>
                                            <Text style={formStyles.label}>Nome do livro</Text>
                                            <TextInput style={formStyles.input} value={dados.nome} editable={!salvando}
                                                accessibilityLabel="Nome do livro"
                                                onChangeText={(nome) => setDados((anterior) => ({ ...anterior, nome }))} />
                                        </View>

                                        <View style={formStyles.field}>
                                            <Text style={formStyles.label}>Autor</Text>
                                            <TextInput style={formStyles.input} value={dados.autor} editable={!salvando}
                                                accessibilityLabel="Autor"
                                                onChangeText={(autor) => setDados((anterior) => ({ ...anterior, autor }))} />
                                        </View>

                                        <View style={formStyles.field}>
                                            <Text style={formStyles.label}>Gêneros literários</Text>
                                            <View style={formStyles.chips}>
                                                {generos.map((genero) => {
                                                    const marcado = dados.generos_ids.includes(genero.id)
                                                    return(
                                                        <Pressable key={genero.id} disabled={salvando}
                                                            accessibilityRole="checkbox" accessibilityState={{ checked: marcado, disabled: salvando }}
                                                            onPress={() => alternarGenero(genero.id)}
                                                            style={[formStyles.chip, marcado && formStyles.chipSelecionado]}>
                                                            <Text style={[formStyles.chipTexto, marcado && formStyles.chipTextoSelecionado]}>
                                                                {marcado ? "✓ " : ""}{genero.nome}
                                                            </Text>
                                                        </Pressable>
                                                    )
                                                })}
                                            </View>
                                        </View>

                                        <View style={formStyles.field}>
                                            <Pressable disabled={salvando} style={detailStyles.backLink}
                                                accessibilityRole="checkbox" accessibilityLabel="Livro aprovado"
                                                accessibilityState={{ checked: dados.aprovado, disabled: salvando }}
                                                onPress={() => setDados((anterior) => ({ ...anterior, aprovado: !anterior.aprovado }))}>
                                                <Feather name={dados.aprovado ? "check-square" : "square"}
                                                    size={24} color={colors.oxblood} />
                                                <Text style={catalogStyles.author}>Livro aprovado</Text>
                                            </Pressable>
                                        </View>
                                    </>
                                )}

                                {!!erroModal && <Text style={managementStyles.error}>{erroModal}</Text>}

                                <View style={[formStyles.chips, managementStyles.dialogActions]}>
                                    <Button title="Cancelar" color={colors.inkSoft} disabled={salvando} onPress={fecharModal} />
                                    <Button title={salvando ? "Aguarde..." : excluindo ? "Excluir" : "Salvar"}
                                        color={colors.oxblood} disabled={salvando} onPress={confirmar} />
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Modal>
            </View>
        </ScreenContainer>
    )
}
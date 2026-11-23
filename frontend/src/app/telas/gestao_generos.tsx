import { Text, TextInput, Button, View, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { layout, formStyles, detailStyles, colors, catalogStyles, managementStyles } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { AppBar } from "@/components/AppBar";
import { api } from "@/api/api";

type Genero = { id: number, nome: string }

export default function TelaGestaoGeneros(){
    const [modalVisivel, setModalVisivel] = useState(false)
    const [generos, setGeneros] = useState<Genero[]>([])
    const [generoSelecionado, setGeneroSelecionado] = useState<Genero | null>(null)
    const [nome, setNome] = useState("")
    const [excluindo, setExcluindo] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState("")
    const router = useRouter()

    useEffect(() => {
        carregarGeneros()
    }, [])

    async function carregarGeneros(){
        setCarregando(true)
        try{
            setGeneros(await api.get("/generos"))
        }
        catch{
            setErro("Não foi possível carregar os gêneros.")
        }
        finally{
            setCarregando(false)
        }
    }

    function abrirModal(genero: Genero | null = null, excluir = false){
        setGeneroSelecionado(genero)
        setNome(genero?.nome ?? "")
        setExcluindo(excluir)
        setErro("")
        setModalVisivel(true)
    }

    function fecharModal(){
        if(!salvando) setModalVisivel(false)
    }

    async function confirmar(){
        if(salvando || (!excluindo && !nome.trim())) return
        setSalvando(true)
        setErro("")

        try{
            if(excluindo && generoSelecionado){
                await api.delete(`/generos/${generoSelecionado.id}`)
            }
            else if(generoSelecionado){
                await api.put(`/generos/${generoSelecionado.id}`, { nome: nome.trim() })
            }
            else{
                await api.post("/generos", { nome: nome.trim() })
            }

            setModalVisivel(false)
            await carregarGeneros()
        }
        catch{
            setErro("Não foi possível concluir a operação.")
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
                    <Text style={formStyles.title}>Gêneros literários</Text>
                    <Text style={formStyles.intro}>Organize as categorias do catálogo.</Text>
                </View>

                <View style={managementStyles.toolbar}>
                    <Text style={catalogStyles.author}>
                        {carregando ? "Carregando..." : `${generos.length} gêneros cadastrados`}
                    </Text>
                    <Button title="Inserir novo" color={colors.oxblood} onPress={() => abrirModal()} />
                </View>

                {!!erro && !modalVisivel && <Text style={managementStyles.error}>{erro}</Text>}

                {!carregando && !erro && generos.length === 0 && (
                    <Text style={catalogStyles.statusText}>Parece que não há nenhum gênero no sistema...</Text>
                )}

                {generos.map((genero) => (
                    <View key={genero.id} style={managementStyles.row}>
                        <View style={managementStyles.genreInfo}>
                            <Text style={catalogStyles.bookTitle}>{genero.nome}</Text>
                        </View>
                        <View style={formStyles.chips}>
                            <Pressable style={managementStyles.actionButton} onPress={() => abrirModal(genero)}
                                accessibilityRole="button" accessibilityLabel={`Editar ${genero.nome}`}>
                                <Text style={catalogStyles.author}>Editar</Text>
                            </Pressable>
                            <Pressable style={managementStyles.actionButton} onPress={() => abrirModal(genero, true)}
                                accessibilityRole="button" accessibilityLabel={`Excluir ${genero.nome}`}>
                                <Text style={catalogStyles.secondaryButtonText}>Excluir</Text>
                            </Pressable>
                        </View>
                    </View>
                ))}

                <Modal visible={modalVisivel} transparent animationType="fade" onRequestClose={fecharModal}>
                    <View style={[layout.center, managementStyles.overlay]}>
                        <View style={[formStyles.card, managementStyles.dialog]}>
                            <Text style={formStyles.cardTitle}>
                                {excluindo ? "Excluir gênero" : generoSelecionado ? "Editar gênero" : "Novo gênero"}
                            </Text>
                            <Text style={formStyles.cardDescription}>
                                {excluindo ? `Deseja excluir “${generoSelecionado?.nome}”?` : "Informe o nome do gênero."}
                            </Text>

                            {!excluindo && (
                                <View style={formStyles.field}>
                                    <TextInput style={formStyles.input} value={nome} onChangeText={setNome}
                                        placeholder="Ex.: Romance" editable={!salvando} accessibilityLabel="Nome do gênero" />
                                </View>
                            )}

                            {!!erro && <Text style={managementStyles.error}>{erro}</Text>}

                            <View style={[formStyles.chips, managementStyles.dialogActions]}>
                                <Button title="Cancelar" color={colors.inkSoft} disabled={salvando} onPress={fecharModal} />
                                <Button title={salvando ? "Aguarde..." : excluindo ? "Excluir" : "Salvar"}
                                    color={colors.oxblood} disabled={salvando || (!excluindo && !nome.trim())}
                                    onPress={confirmar} />
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </ScreenContainer>
    )
}
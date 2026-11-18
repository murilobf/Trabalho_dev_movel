import { Text, TextInput, Button, View, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { formStyles, detailStyles, colors, catalogStyles, managementStyles, tableStyles } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { AppBar } from "@/components/AppBar";
import { api } from "@/api/api";

type Usuario = { id: number, nome: string, email: string, cargo: string }
type DadosUsuario = Pick<Usuario, "nome" | "email" | "cargo">

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export default function TelaGestaoUsuarios(){
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [selecionado, setSelecionado] = useState<Usuario | null>(null)
    const [dados, setDados] = useState<DadosUsuario>({ nome: "", email: "", cargo: "" })
    const [pesquisa, setPesquisa] = useState("")
    const [excluindo, setExcluindo] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [carregando, setCarregando] = useState(true)
    const [erroLista, setErroLista] = useState("")
    const [erroModal, setErroModal] = useState("")
    const router = useRouter()

    const termo = normalizar(pesquisa.trim())
    const filtrados = usuarios.filter((usuario) =>
        [usuario.nome, usuario.email, usuario.cargo].some((valor) => normalizar(valor).includes(termo))
    )

    useEffect(() => {
        carregarUsuarios()
    }, [])

    async function carregarUsuarios(){
        setCarregando(true)
        setErroLista("")
        try{
            setUsuarios(await api.get("/usuarios"))
        }
        catch{
            setErroLista("Não foi possível carregar os usuários.")
        }
        finally{
            setCarregando(false)
        }
    }

    function abrirModal(usuario: Usuario, excluir = false){
        setSelecionado(usuario)
        setDados({ nome: usuario.nome, email: usuario.email, cargo: usuario.cargo })
        setExcluindo(excluir)
        setErroModal("")
    }

    function fecharModal(){
        if(!salvando) setSelecionado(null)
    }

    function atualizarDados(campo: keyof DadosUsuario, valor: string){
        setDados((anterior) => ({ ...anterior, [campo]: valor }))
    }

    async function confirmar(){
        if(!selecionado || salvando) return
        setErroModal("")

        const alteracoes: Partial<DadosUsuario> = {}

        if(!excluindo){
            for(const campo of ["nome", "email", "cargo"] as const){
                const valor = dados[campo].trim()
                if(!valor){
                    setErroModal("Preencha nome, email e cargo.")
                    return
                }
                if(valor !== selecionado[campo]) alteracoes[campo] = valor
            }

            if(!Object.keys(alteracoes).length){
                setSelecionado(null)
                return
            }
        }

        setSalvando(true)
        try{
            if(excluindo){
                await api.delete(`/usuarios/${selecionado.id}`)
            }
            else{
                await api.put(`/usuarios/${selecionado.id}`, alteracoes)
            }

            setSelecionado(null)
            await carregarUsuarios()
        }
        catch{
            setErroModal("Não foi possível concluir a operação. Verifique os dados e tente novamente.")
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
                    <Text style={formStyles.title}>Gestão de usuários</Text>
                    <Text style={formStyles.intro}>Consulte os cadastros e atualize os dados dos usuários.</Text>
                </View>

                <View style={managementStyles.toolbar}>
                    <TextInput style={formStyles.input} value={pesquisa} onChangeText={setPesquisa}
                        placeholder="Pesquisar por nome, email ou cargo" placeholderTextColor={colors.inkSoft}
                        accessibilityLabel="Pesquisar usuários" autoCapitalize="none" autoCorrect={false} />
                    <Text style={catalogStyles.author}>
                        {carregando ? "Carregando..." : `${filtrados.length} de ${usuarios.length} usuários`}
                    </Text>
                </View>

                {!!erroLista && (
                    <View style={formStyles.field}>
                        <Text style={managementStyles.error}>{erroLista}</Text>
                        <Button title="Tentar novamente" color={colors.oxblood} onPress={carregarUsuarios} />
                    </View>
                )}

                {!carregando && !erroLista && (
                    filtrados.length === 0 ? (
                        <Text style={catalogStyles.statusText}>
                            {usuarios.length ? "Nenhum usuário corresponde à pesquisa." : "Nenhum usuário cadastrado."}
                        </Text>
                    ) : (
                        <ScrollView horizontal>
                            <View style={tableStyles.table}>
                                <View style={[tableStyles.row, tableStyles.header]}>
                                    <Text style={[formStyles.label, tableStyles.email]}>Email</Text>
                                    <Text style={[formStyles.label, tableStyles.name]}>Nome</Text>
                                    <Text style={[formStyles.label, tableStyles.role]}>Cargo</Text>
                                    <Text style={[formStyles.label, tableStyles.actions]}>Ações</Text>
                                </View>

                                {filtrados.map((usuario) => (
                                    <View key={usuario.id} style={tableStyles.row}>
                                        <Text selectable style={[catalogStyles.author, tableStyles.email]}>{usuario.email}</Text>
                                        <Text selectable style={[catalogStyles.author, tableStyles.name]}>{usuario.nome}</Text>
                                        <Text style={[catalogStyles.author, tableStyles.role]}>{usuario.cargo}</Text>
                                        <View style={[formStyles.chips, tableStyles.actions]}>
                                            <Pressable style={managementStyles.actionButton} onPress={() => abrirModal(usuario)}
                                                accessibilityRole="button" accessibilityLabel={`Editar ${usuario.nome}`}>
                                                <Feather name="edit-2" size={18} color={colors.inkSoft} />
                                            </Pressable>
                                            <Pressable style={managementStyles.actionButton} onPress={() => abrirModal(usuario, true)}
                                                accessibilityRole="button" accessibilityLabel={`Excluir ${usuario.nome}`}>
                                                <Feather name="trash-2" size={18} color={colors.oxblood} />
                                            </Pressable>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )
                )}

                <Modal visible={selecionado !== null} transparent animationType="fade" onRequestClose={fecharModal}>
                    <KeyboardAvoidingView style={tableStyles.modalBackground}
                        behavior={Platform.OS === "ios" ? "padding" : undefined}>
                        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={tableStyles.modalContent}>
                            <View style={[formStyles.card, managementStyles.dialog]}>
                                <Text style={formStyles.cardTitle}>{excluindo ? "Excluir usuário" : "Editar usuário"}</Text>
                                <Text style={formStyles.cardDescription}>
                                    {excluindo
                                        ? `Deseja excluir “${selecionado?.nome}”? Esta ação não pode ser desfeita.`
                                        : "Altere os campos desejados e salve."}
                                </Text>

                                {!excluindo && (
                                    <>
                                        <View style={formStyles.field}>
                                            <Text style={formStyles.label}>Nome</Text>
                                            <TextInput style={formStyles.input} value={dados.nome} editable={!salvando}
                                                accessibilityLabel="Nome" onChangeText={(valor) => atualizarDados("nome", valor)}
                                            />
                                        </View>
                                        <View style={formStyles.field}>
                                            <Text style={formStyles.label}>Email</Text>
                                            <TextInput style={formStyles.input} value={dados.email} editable={!salvando}
                                                accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none"
                                                autoCorrect={false} onChangeText={(valor) => atualizarDados("email", valor)} 
                                            />
                                        </View>
                                        <View style={formStyles.field}>
                                            <Text style={formStyles.label}>Cargo</Text>
                                            <Picker
                                                style={[formStyles.picker, catalogStyles.genrePicker]}
                                                selectedValue={dados.cargo}
                                                onValueChange={(valor) => atualizarDados("cargo", valor)}
                                            >
                                                <Picker.Item key="usuario" label="Usuário" value="usuario"/>
                                                <Picker.Item key="admin" label="Administrador" value="admin"/>
                                            </Picker>
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
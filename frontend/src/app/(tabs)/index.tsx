import { ActivityIndicator, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ScreenContainer";
import { AppBar } from "@/components/AppBar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/api";
import { colors, formStyles, detailStyles, catalogStyles, adminStyles, homeStyles } from "@/constants/theme";

type Genero = { id: number, nome: string }
type Livro = { id: number, nome: string, autor: string, descricao: string | null, generos: Genero[] }
type Inicio = { livros_recentes: Livro[], generos: Genero[] }

export default function HomeScreen(){
    const router = useRouter()
    const { usuario } = useAuth()
    const [pesquisa, setPesquisa] = useState("")
    const [inicio, setInicio] = useState<Inicio>({ livros_recentes: [], generos: [] })
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState("")
    const requisicaoAtual = useRef(0)
    const nomes = usuario?.nome.trim().split(/\s+/).filter(Boolean) ?? []
    const iniciais = nomes.length ? (nomes[0][0] + (nomes.length > 1 ? nomes[nomes.length - 1][0] : "")).toUpperCase() : undefined

    const carregarInicio = useCallback(async () => {
        const requisicao = ++requisicaoAtual.current
        setCarregando(true)
        setErro("")
        try{
            const [livros_recentes, generos] = await Promise.all([
            api.get("/livros?recentes=1&aprovado=1"),
            api.get("/generos")
        ])

        if(!Array.isArray(livros_recentes) || !Array.isArray(generos)){
            throw new Error("Resposta inválida")
        }

        if(requisicao === requisicaoAtual.current){
            setInicio({ livros_recentes, generos })
        }
        }
        catch{
            if(requisicao === requisicaoAtual.current) setErro("Não foi possível atualizar as novidades. Tente novamente.")
        }
        finally{
            if(requisicao === requisicaoAtual.current) setCarregando(false)
        }
    }, [])

    useFocusEffect(useCallback(() => {
        carregarInicio()
        return () => { requisicaoAtual.current += 1 }
    }, [carregarInicio]))

    function abrirCatalogo(genero_id = ""){
        router.push({ pathname: "/(tabs)/livros", params: { nome: pesquisa.trim(), genero_id } })
    }

    return(
        <ScreenContainer scrollProps={{
            contentContainerStyle: [formStyles.container, detailStyles.container], keyboardShouldPersistTaps: "handled",
            keyboardDismissMode: "on-drag",
            refreshControl: <RefreshControl refreshing={carregando} onRefresh={carregarInicio} tintColor={colors.oxblood} colors={[colors.oxblood]} />
        }}>
            
            <View style={detailStyles.content}>
                <AppBar userInitials={iniciais} />
                <View style={detailStyles.hero}>
                    <Text style={formStyles.eyebrow}>{usuario ? `OLÁ, ${nomes[0]?.toUpperCase() || "LEITOR"}` : "UM LUGAR PARA SUAS LEITURAS"}</Text>
                    <Text accessibilityRole="header" style={formStyles.title}>Qual será sua próxima história?</Text>
                    <Text style={formStyles.intro}>Descubra livros, acompanhe suas leituras e compartilhe suas impressões.</Text>
                    <View style={homeStyles.searchRow}>
                        <TextInput style={[formStyles.input, homeStyles.searchInput]} value={pesquisa} onChangeText={setPesquisa}
                            placeholder="Busque pelo nome do livro" placeholderTextColor={colors.inkSoft}
                            accessibilityLabel="Nome do livro" returnKeyType="search" onSubmitEditing={() => abrirCatalogo()} />
                        <Pressable accessibilityRole="button" onPress={() => abrirCatalogo()}
                            style={({ pressed }) => [formStyles.button, homeStyles.searchButton, pressed && formStyles.buttonPressed]}>
                            <Feather name="search" size={18} color="#FFFFFF" />
                            <Text style={formStyles.buttonText}>Buscar</Text>
                        </Pressable>
                    </View>
                </View>

                {!!erro && (
                    <View style={homeStyles.notice}>
                        <Text accessibilityRole="alert" style={catalogStyles.description}>{erro}</Text>
                        <Pressable accessibilityRole="button" onPress={carregarInicio} style={catalogStyles.secondaryButton}>
                            <Text style={catalogStyles.secondaryButtonText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                )}

                <View style={homeStyles.section}>
                    <View style={homeStyles.sectionHeader}>
                        <Text accessibilityRole="header" style={formStyles.cardTitle}>Novidades na estante</Text>
                        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/(tabs)/livros", params: { nome: "", genero_id: "" } })}
                            style={homeStyles.link}>
                            <Text style={catalogStyles.secondaryButtonText}>Ver catálogo</Text>
                            <Feather name="arrow-right" size={16} color={colors.oxblood} />
                        </Pressable>
                    </View>
                    <Text style={catalogStyles.description}>Livros adicionados recentemente ao catálogo.</Text>
                    {carregando && !inicio.livros_recentes.length ? (
                        <ActivityIndicator style={homeStyles.loading} color={colors.oxblood} accessibilityLabel="Carregando livros" />
                    ) : !erro && !inicio.livros_recentes.length ? (
                        <Text style={catalogStyles.statusText}>A estante está esperando suas primeiras histórias.</Text>
                    ) : inicio.livros_recentes.slice(0, 6).map((livro) => (
                        <Pressable key={livro.id} accessibilityRole="button" accessibilityLabel={`Abrir ${livro.nome}, de ${livro.autor}`}
                            onPress={() => router.push({ pathname: "/livro/[id]", params: { id: String(livro.id) } })}
                            style={({ pressed }) => [homeStyles.bookRow, pressed && adminStyles.itemPressed]}>
                            <View style={adminStyles.icon}><Feather name="book-open" size={23} color={colors.oxblood} /></View>
                            <View style={adminStyles.text}>
                                <Text style={catalogStyles.bookTitle}>{livro.nome}</Text>
                                <Text style={catalogStyles.author}>{livro.autor}</Text>
                                {!!livro.generos.length && <Text style={homeStyles.genreText}>{livro.generos.map((g) => g.nome).join(" · ")}</Text>}
                                {!!livro.descricao && <Text numberOfLines={2} style={catalogStyles.description}>{livro.descricao}</Text>}
                            </View>
                            <Feather name="chevron-right" size={18} color={colors.inkSoft} />
                        </Pressable>
                    ))}
                </View>

                <View style={homeStyles.section}>
                    <Text accessibilityRole="header" style={formStyles.cardTitle}>{usuario ? "Seu espaço de leitura" : "Cada leitura merece ser lembrada."}</Text>
                    <Text style={catalogStyles.description}>
                        {usuario ? "Acesse seu perfil e veja como suas leituras estão evoluindo." : "Entre na sua conta para avaliar livros e acompanhar seu progresso."}
                    </Text>
                    <View style={homeStyles.quickLinks}>
                        <Pressable accessibilityRole="button" onPress={() => router.push(usuario ? "/(tabs)/perfil" : "/telas/login")}
                            style={({ pressed }) => [catalogStyles.secondaryButton, pressed && formStyles.buttonPressed]}>
                            <Text style={catalogStyles.secondaryButtonText}>{usuario ? "Meu perfil" : "Entrar na conta"}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => router.push(usuario ? "/telas/relatorio_pessoal" : "/telas/registro")}
                            style={({ pressed }) => [catalogStyles.secondaryButton, pressed && formStyles.buttonPressed]}>
                            <Text style={catalogStyles.secondaryButtonText}>{usuario ? "Minhas leituras em números" : "Criar uma conta"}</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={homeStyles.contribute}>
                    <Text accessibilityRole="header" style={formStyles.cardTitle}>Sentiu falta de um livro?</Text>
                    <Text style={catalogStyles.description}>Indique uma história para fazer parte do catálogo. Nossa curadoria analisa cada sugestão.</Text>
                    <Pressable accessibilityRole="button" onPress={() => router.push(usuario ? "/telas/form_novo_livro" : "/telas/login")}
                        style={({ pressed }) => [formStyles.button, pressed && formStyles.buttonPressed]}>
                        <Text style={formStyles.buttonText}>{usuario ? "Sugerir um livro" : "Entrar para sugerir um livro"}</Text>
                    </Pressable>
                </View>

                {usuario?.cargo === "admin" && (
                    <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/admin")}
                        style={({ pressed }) => [adminStyles.item, pressed && adminStyles.itemPressed]}>
                        <Feather name="settings" size={20} color={colors.oxblood} />
                        <Text style={[catalogStyles.secondaryButtonText, adminStyles.text]}>Abrir administração</Text>
                        <Feather name="arrow-right" size={18} color={colors.oxblood} />
                    </Pressable>
                )}
            </View>
        </ScreenContainer>
        
    )
    
}


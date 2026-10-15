import { Text, TextInput, Pressable, View, Button } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { layout } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/api/api";
import { useRouter } from "expo-router";

const FILTROS_INICIAIS = {
    nome: "",
    autor: "",
    dataInicio: "", // AAAA-MM-DD
    dataFim: "",    // AAAA-MM-DD
    genero: "",     // "" = todos
};

// Remove filtros vazios para enviar só o que foi preenchido
// Monta "?nome=dom&genero=Romance" só com os filtros preenchidos
const montarQueryString = (filtros:Object) => {
    const partes = Object.entries(filtros)
        .filter(([, valor]) => valor !== "")
        .map(
            ([chave, valor]) =>
                `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`
        );

    return partes.length ? `?${partes.join("&")}` : "";
};

export default function TelaLivros() {
    const [livros, setLivros] = useState([]);
    const [generos, setGeneros] = useState([]);
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [carregando, setCarregando] = useState(false);

    const router = useRouter()
    

    const atualizarFiltro = (campo:string, valor:string) =>
        setFiltros((anterior) => ({ ...anterior, [campo]: valor }));

    const limparFiltros = () => setFiltros(FILTROS_INICIAIS);

    // Carrega as opções de gênero uma única vez
    useEffect(() => {
        api.get("/generos")
            .then((res) => setGeneros(res))
            .catch(() => setGeneros([]));
    }, []);

    // Busca os livros no backend sempre que os filtros mudam (com debounce)
    useEffect(() => {
        let cancelado = false;

        const timeout = setTimeout(async () => {
            setCarregando(true);
            try {
                const res = await api.get(`/livros${montarQueryString(filtros)}`);
                if (!cancelado) 
                    setLivros(res);

            } 
            catch (erro) {
                if (!cancelado) 
                    setLivros([]);
            } 
            finally {
                if (!cancelado) 
                    setCarregando(false);
            }
        }, 400);

        // Descarta respostas antigas se os filtros mudarem antes de terminar
        return () => {
            cancelado = true;
            clearTimeout(timeout);
        };
    }, [filtros]);

    return (
        <ScreenContainer scrollProps={{ contentContainerStyle: [layout.center] }}>
            {/* Filtros */}
            <View style={{ width: "100%", gap: 8, padding: 16 }}>
                <TextInput
                    style={layout.input}
                    placeholder="Nome do livro"
                    value={filtros.nome}
                    onChangeText={(v) => atualizarFiltro("nome", v)}
                />
                <TextInput
                style={layout.input}
                    placeholder="Nome do autor"
                    value={filtros.autor}
                    onChangeText={(v) => atualizarFiltro("autor", v)}
                />

                <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                        style={ [layout.input, {flex: 1}] }
                        placeholder="Publicado de (AAAA-MM-DD)"
                        value={filtros.dataInicio}
                        onChangeText={(v) => atualizarFiltro("dataInicio", v)}
                        maxLength={10}
                    />
                    <TextInput
                        style={ [layout.input, {flex: 1}]}
                        placeholder="até (AAAA-MM-DD)"
                        value={filtros.dataFim}
                        onChangeText={(v) => atualizarFiltro("dataFim", v)}
                        maxLength={10}
                    />
                </View>

                <Picker
                    selectedValue={filtros.genero}
                    onValueChange={(v) => atualizarFiltro("genero", v)}
                >
                    <Picker.Item label="Todos os gêneros" value="" />
                    {generos.map((g) => (
                        <Picker.Item key={g.id} label={g.nome} value={g.id} />
                    ))}
                </Picker>

                <Pressable onPress={limparFiltros}>
                    <Text>Limpar filtros</Text>
                </Pressable>
                <Text style={layout.subtitle}>Clique aqui para Solicitar um novo livro</Text>
                    <Button
                    title="Solicite um novo livro"
                     onPress={() => router.push("/telas/form_novo_livro")}>
                        
                    </Button>
            </View>

            {carregando ? (
                <Text style={layout.subtitle}>Carregando...</Text>
            ) : livros.length === 0 ? (
                <>
                    <Text style={layout.title}>Nenhum Livro Encontrado</Text>
                    <Text style={layout.subtitle}>
                        Tente redefinir os filtros ou seja o primeiro a cadastrar o livro que busca!
                    </Text>
                </>
            ) : (
                <>
                    {livros.map((livro) => (
                        <View style={layout.card} key={livro.id}>
                            <Text style={layout.subtitle}>{livro.nome}</Text>
                            <Text style={layout.autor}>{livro.autor}</Text>

                            {livro.genero ? (
                                <Text style={layout.genero}>{livro.genero}</Text>
                            ) : null}

                            {livro.descricao ? (
                                <Text numberOfLines={3} style={layout.descricao}>
                                    {livro.descricao}
                                </Text>
                            ) : null}
                        </View>
                    ))}
                </>
            )}
        </ScreenContainer>
    );
}
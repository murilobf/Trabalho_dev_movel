import { Text, TextInput, Pressable, View, Button } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { colors, formStyles, catalogStyles } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/api/api";
import { useRouter } from "expo-router";

interface Genero {
    id: number;
    nome: string;
}

interface Livro {
    id: number;
    nome: string;
    autor: string;
    descricao?: string | null;
    generos?: Genero[];
}

const FILTROS_INICIAIS = {
    nome: "",
    autor: "",
    dataInicio: "", // AAAA-MM-DD
    dataFim: "", // AAAA-MM-DD
    genero_id: "", // "" = todos
};

const montarQueryString = (filtros: Record<string, string>) => {
    const partes = Object.entries(filtros)
        .filter(([, valor]) => valor !== "")
        .map(([chave, valor]) =>
            `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`
        );
    return partes.length ? `?${partes.join("&")}` : "";
};

export default function TelaLivros() {
    const [livros, setLivros] = useState<Livro[]>([]);
    const [generos, setGeneros] = useState<Genero[]>([]);
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [carregando, setCarregando] = useState(false);
    const router = useRouter();

    const atualizarFiltro = (campo: string, valor: string) =>
        setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
    const limparFiltros = () => setFiltros(FILTROS_INICIAIS);

    useEffect(() => {
        api.get("/generos")
            .then((res) => setGeneros(res))
            .catch(() => setGeneros([]));
    }, []);

    useEffect(() => {
        let cancelado = false;
        const timeout = setTimeout(async () => {
            setCarregando(true);
            try {
                const res = await api.get(`/livros${montarQueryString(filtros)}`);
                if (!cancelado) setLivros(res);
            } catch (erro) {
                if (!cancelado) setLivros([]);
            } finally {
                if (!cancelado) setCarregando(false);
            }
        }, 400);
        return () => {
            cancelado = true;
            clearTimeout(timeout);
        };
    }, [filtros]);

    return (
        <ScreenContainer
            scrollProps={{
                contentContainerStyle: formStyles.container,
                // Com o teclado aberto, o primeiro toque num card não deve ser "engolido" só para fechá-lo.
                keyboardShouldPersistTaps: "handled",
            }}
        >
            <View style={[formStyles.content, formStyles.card, catalogStyles.filters]}>
                <TextInput
                    style={formStyles.input}
                    placeholder="Nome do livro"
                    value={filtros.nome}
                    onChangeText={(v) => atualizarFiltro("nome", v)}
                />
                <TextInput
                    style={formStyles.input}
                    placeholder="Nome do autor"
                    value={filtros.autor}
                    onChangeText={(v) => atualizarFiltro("autor", v)}
                />
                <View style={catalogStyles.dateRow}>
                    <TextInput
                        style={[formStyles.input, catalogStyles.dateInput]}
                        placeholder="Publicado de (AAAA-MM-DD)"
                        value={filtros.dataInicio}
                        onChangeText={(v) => atualizarFiltro("dataInicio", v)}
                        maxLength={10}
                    />
                    <TextInput
                        style={[formStyles.input, catalogStyles.dateInput]}
                        placeholder="até (AAAA-MM-DD)"
                        value={filtros.dataFim}
                        onChangeText={(v) => atualizarFiltro("dataFim", v)}
                        maxLength={10}
                    />
                </View>
                <Picker
                    style={[formStyles.picker, catalogStyles.genrePicker]}
                    // Antes era filtros.genero (campo que não existe): o seletor nunca mostrava a escolha.
                    selectedValue={filtros.genero_id}
                    onValueChange={(v) => atualizarFiltro("genero_id", String(v))}
                >
                    <Picker.Item label="Todos os gêneros" value="" />
                    {generos.map((g) => (
                        <Picker.Item key={g.id} label={g.nome} value={String(g.id)} />
                    ))}
                </Picker>
                <Pressable onPress={limparFiltros} style={catalogStyles.secondaryButton}>
                    <Text style={catalogStyles.secondaryButtonText}>Limpar filtros</Text>
                </Pressable>
                <Text style={catalogStyles.suggestionText}>Clique aqui para Solicitar um novo livro</Text>
                <Button
                    color={colors.oxblood}
                    title="Solicite um novo livro"
                    onPress={() => router.push("/telas/form_novo_livro")}
                />
            </View>

            {carregando ? (
                <Text style={catalogStyles.statusText}>Carregando...</Text>
            ) : livros.length === 0 ? (
                <>
                    <Text style={[formStyles.title, catalogStyles.emptyTitle]}>Nenhum Livro Encontrado</Text>
                    <Text style={catalogStyles.emptyDescription}>
                        Tente redefinir os filtros ou seja o primeiro a cadastrar o livro que busca!
                    </Text>
                </>
            ) : (
                <>
                    {livros.map((livro) => (
                        <Pressable
                            key={livro.id}
                            onPress={() => router.push(`/livro/${livro.id}`)}
                            style={({ pressed }) => [
                                formStyles.content,
                                formStyles.card,
                                catalogStyles.bookCard,
                                pressed && formStyles.buttonPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Abrir ${livro.nome}`}
                        >
                            <Text style={catalogStyles.bookTitle}>{livro.nome}</Text>
                            <Text style={catalogStyles.author}>{livro.autor}</Text>
                            {/* A API devolve "generos" (lista), não "genero". */}
                            {livro.generos && livro.generos.length > 0 ? (
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                                    {livro.generos.map((g) => (
                                        <Text key={g.id} style={catalogStyles.badge}>
                                            {g.nome}
                                        </Text>
                                    ))}
                                </View>
                            ) : null}
                            {livro.descricao ? (
                                <Text numberOfLines={3} style={catalogStyles.description}>
                                    {livro.descricao}
                                </Text>
                            ) : null}
                        </Pressable>
                    ))}
                </>
            )}
        </ScreenContainer>
    );
}

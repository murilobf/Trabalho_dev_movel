import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { formStyles, detailStyles, catalogStyles, adminStyles, colors } from "@/constants/theme";
import { ScreenContainer } from "@/components/ScreenContainer";

const OPCOES = [
    { titulo: "Gêneros", descricao: "Organize as categorias do catálogo.", icone: "bookmark", rota: "/telas/gestao_generos" },
    { titulo: "Usuários", descricao: "Gerencie os cadastros e cargos dos usuários.", icone: "users", rota: "/telas/gestao_pessoas" },
    { titulo: "Livros", descricao: "Revise solicitações, edite informações e aprove livros.", icone: "book-open", rota: "/telas/gestao_livros" },
] as const

export default function TelaAdmin(){
    const router = useRouter()

    return(
        <ScreenContainer scrollProps={{ contentContainerStyle: [formStyles.container, detailStyles.container] }}>
            <View style={detailStyles.content}>
                <View style={detailStyles.hero}>
                    <Text style={formStyles.eyebrow}>ADMINISTRAÇÃO</Text>
                    <Text style={formStyles.title}>Cuide da sua biblioteca.</Text>
                    <Text style={formStyles.intro}>
                        Organize o catálogo e gerencie a comunidade em um só lugar.
                    </Text>
                </View>

                <View style={adminStyles.section}>
                    <Text style={[formStyles.eyebrow, detailStyles.sectionLabel]}>ÁREAS DE GESTÃO</Text>

                    {OPCOES.map((opcao) => (
                        <Pressable key={opcao.rota} onPress={() => router.push(opcao.rota)}
                            accessibilityRole="button" accessibilityLabel={`Gerenciar ${opcao.titulo.toLowerCase()}`}
                            style={({ pressed }) => [adminStyles.item, pressed && adminStyles.itemPressed]}>
                            <View style={adminStyles.icon}>
                                <Feather name={opcao.icone} size={24} color={colors.oxblood} />
                            </View>

                            <View style={adminStyles.text}>
                                <Text style={catalogStyles.bookTitle}>{opcao.titulo}</Text>
                                <Text style={catalogStyles.description}>{opcao.descricao}</Text>
                            </View>

                            <Feather name="chevron-right" size={22} color={colors.inkSoft} />
                        </Pressable>
                    ))}
                </View>
            </View>
        </ScreenContainer>
    )
}
import { Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { typography, colors } from "../../constants/theme";

export default function LivroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <ScreenContainer>
      <AppBar
        left={
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={20} color={colors.ink} />
          </Pressable>
        }
      />

      <Text style={typography.sectionTitle}>Livro #{id}</Text>
      <Text style={typography.bodySoft}>
        Busque os dados desse livro pelo `id` (API, banco local, etc.) e monte a tela aqui.
      </Text>
    </ScreenContainer>
  );
}

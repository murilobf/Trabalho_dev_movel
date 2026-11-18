// Salvar como: src/app/usuario/[id].tsx
import { Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import PerfilPublico from "../../components/PerfilPublico";
import { colors } from "../../constants/theme";

export default function UsuarioScreen() {
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
      <PerfilPublico usuarioId={Number(id)} />
    </ScreenContainer>
  );
}

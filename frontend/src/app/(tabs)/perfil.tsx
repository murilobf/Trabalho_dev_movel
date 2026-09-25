import { Text } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { AppBar } from "../../components/AppBar";
import { typography } from "../../constants/theme";

export default function PerfilScreen() {
  return (
    <ScreenContainer>
      <AppBar userInitials="JS" />

      <Text style={typography.sectionTitle}>Perfil</Text>
      <Text style={typography.bodySoft}>Conteúdo do perfil entra aqui.</Text>
    </ScreenContainer>
  );
}

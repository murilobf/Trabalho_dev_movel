import { StyleSheet } from "react-native";

// Paleta — mesma inspiração do mockup original (papel + tons de estante),
// mas você pode ajustar livremente sem afetar nenhum componente.
export const colors = {
  paper: "#EFE6D3",
  paper2: "#E3D5B8",
  ink: "#231D16",
  inkSoft: "#6E6250",
  oxblood: "#7C2A34",
  forest: "#3F4B3A",
  gold: "#A9822F",
  line: "rgba(35,29,22,0.14)",
};

// Nomes das fontes conforme carregadas pelo useFonts() em app/_layout.tsx
export const fonts = {
  serif: "Fraunces_700Bold",
  serifSemibold: "Fraunces_600SemiBold",
  serifItalic: "Fraunces_500Medium_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemibold: "Inter_600SemiBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 20,
};

// Layout repetido entre telas (fundo + padding padrão do conteúdo).
// Uso: <SafeAreaView style={layout.safe}> / <ScrollView contentContainerStyle={layout.content}>
// Na prática você não precisa nem importar isso direto — ScreenContainer já aplica.
export const layout = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
});

// Estilos de texto reaproveitáveis, pra não recriar fontFamily/cor em cada tela.
export const typography = StyleSheet.create({
  logo: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  logoAccent: { fontFamily: fonts.serifItalic, color: colors.oxblood },
  sectionTitle: { fontFamily: fonts.serifSemibold, fontSize: 16, color: colors.ink, marginTop: 22, marginBottom: 10 },
  body: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink },
  bodySoft: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft },
  caption: { fontFamily: fonts.sans, fontSize: 10, color: colors.inkSoft },
});

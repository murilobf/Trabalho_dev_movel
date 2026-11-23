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
  safe: { 
    flex: 1, 
    backgroundColor: 
    colors.paper 
  },

  content: { 
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.xl 
  },
  
  center: { 
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 28,
  },

  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  fieldLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  card: {
        width: "100%",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        gap: 4,
        // sombra leve
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    autor: {
        color: "#555",
        fontStyle: "italic",
    },
    genero: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: "#eee",
        fontSize: 12,
        marginTop: 4,
    },
    descricao: {
        marginTop: 6,
    },
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

// Estilos compartilhados para telas de formulário.
export const formStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 40,
        backgroundColor: colors.paper,
    },
    content: { width: "100%", maxWidth: 560 },
    header: { marginBottom: 28 },
    eyebrow: {
        fontFamily: fonts.sansSemibold,
        fontSize: 11,
        letterSpacing: 2,
        color: colors.oxblood,
        marginBottom: 14,
    },
    title: {
        fontFamily: fonts.serif,
        fontSize: 34,
        lineHeight: 42,
        color: colors.ink,
        marginBottom: 12,
    },
    intro: {
        fontFamily: fonts.sans,
        fontSize: 15,
        lineHeight: 24,
        color: colors.inkSoft,
    },
    card: {
        backgroundColor: "#FFFCF6",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.line,
        padding: 22,
        shadowColor: colors.ink,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    cardTitle: { fontFamily: fonts.serifSemibold, fontSize: 23, color: colors.ink },
    cardDescription: {
        fontFamily: fonts.sans,
        fontSize: 13,
        lineHeight: 21,
        color: colors.inkSoft,
        marginTop: 6,
        marginBottom: 26,
    },
    field: { marginBottom: 20 },
    label: {
        fontFamily: fonts.sansSemibold,
        fontSize: 13,
        color: colors.ink,
        marginBottom: 9,
    },
    input: {
        width: "100%",
        minHeight: 54,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 15,
        paddingVertical: 15,
        fontFamily: fonts.sans,
        fontSize: 14,
        color: colors.ink,
    },
    textarea: { minHeight: 150, textAlignVertical: "top" },
    pickerContainer: {
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
    },
    picker: { width: "100%", color: colors.ink },
    button: {
        minHeight: 54,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.oxblood,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginTop: 6,
    },
    buttonPressed: { opacity: 0.85 },
    buttonText: {
        fontFamily: fonts.sansSemibold,
        fontSize: 15,
        textAlign: "center",
        color: "#FFFFFF",
    },
    note: {
        fontFamily: fonts.sans,
        fontSize: 12,
        lineHeight: 19,
        textAlign: "center",
        color: colors.inkSoft,
        marginTop: 18,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
        minHeight: 44, justifyContent: "center", paddingHorizontal: 16,
        paddingVertical: 10, borderRadius: 22, borderWidth: 1,
        borderColor: colors.line, backgroundColor: "#FFFFFF",
    },
    chipSelecionado: { backgroundColor: colors.oxblood, borderColor: colors.oxblood },
    chipTexto: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
    chipTextoSelecionado: { color: "#FFFFFF" },

});

// Estilos reutilizáveis para catálogos, filtros e listas de conteúdo.
export const catalogStyles = StyleSheet.create({
    filters: { gap: 14, marginBottom: 28 },
    dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    dateInput: { flexGrow: 1, flexBasis: 210, width: "auto", minWidth: 0 },
    genrePicker: { backgroundColor: "#FFFFFF", borderRadius: 12 },
    secondaryButton: {
        minHeight: 44, borderWidth: 1, borderColor: colors.line,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
        alignItems: "center", justifyContent: "center",
    },
    secondaryButtonText: { fontFamily: fonts.sansSemibold, fontSize: 13, color: colors.oxblood },
    suggestionText: {
        fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.inkSoft,
        textAlign: "center", marginTop: 8,
    },
    bookCard: { borderLeftWidth: 4, borderLeftColor: colors.oxblood, gap: 10, marginBottom: 16 },
    bookTitle: { fontFamily: fonts.serifSemibold, fontSize: 23, lineHeight: 30, color: colors.ink },
    author: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 20, color: colors.inkSoft },
    badge: {
        alignSelf: "flex-start", overflow: "hidden", borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.paper,
        fontFamily: fonts.sansMedium, fontSize: 11, color: colors.forest,
    },
    description: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 22, color: colors.inkSoft, marginTop: 4 },
    statusText: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkSoft, marginVertical: 24 },
    emptyTitle: { width: "100%", maxWidth: 560, textAlign: "center", marginTop: 12, fontSize: 26, lineHeight: 34 },
    emptyDescription: {
        width: "100%", maxWidth: 560, fontFamily: fonts.sans, fontSize: 14,
        lineHeight: 23, color: colors.inkSoft, textAlign: "center", marginTop: 8,
    },
});

// Layout compartilhado para páginas de detalhes de conteúdo.
export const detailStyles = StyleSheet.create({
    container: { paddingTop: spacing.md, paddingBottom: 56 },
    content: { width: "100%", maxWidth: 960 },
    backLink: {
        minHeight: 44, flexDirection: "row", alignItems: "center",
        alignSelf: "flex-start", gap: spacing.sm,
    },
    hero: {
        paddingTop: 36, paddingBottom: 32,
        borderBottomWidth: 1, borderBottomColor: colors.line,
    },
    title: { fontSize: 38, lineHeight: 46, marginBottom: spacing.md },
    author: { fontSize: 16, lineHeight: 25 },
    authorName: { color: colors.ink },
    columns: {
        flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start",
        columnGap: 48, rowGap: 32, paddingTop: 32,
    },
    mainColumn: { flexBasis: 460, flexGrow: 2, flexShrink: 1, minWidth: 0 },
    sideColumn: { flexBasis: 220, flexGrow: 1, flexShrink: 1, minWidth: 0 },
    sectionLabel: {
        color: colors.inkSoft, letterSpacing: 1.5, marginBottom: spacing.lg,
    },
    description: { fontSize: 16, lineHeight: 28, color: colors.ink, marginTop: 0 },
    genre: {
        backgroundColor: "transparent", borderWidth: 1,
        borderColor: colors.line, borderRadius: radius.sm,
        fontSize: 12, paddingHorizontal: 12, paddingVertical: 7,
    },
});

export const managementStyles = StyleSheet.create({
    toolbar: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: spacing.xl,
    },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
    },
    genreInfo: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 220,
        minWidth: 0,
    },
    actionButton: {
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
    },
    error: {
        fontFamily: fonts.sansMedium,
        fontSize: 13,
        lineHeight: 21,
        color: colors.oxblood,
        marginBottom: spacing.md,
    },
    overlay: {
        flex: 1,
        padding: spacing.xl,
        backgroundColor: "rgba(35,29,22,0.55)",
    },
    dialog: {
        width: "100%",
        maxWidth: 460,
    },
    dialogActions: {
        marginTop: spacing.sm,
    },
});

export const tableStyles = StyleSheet.create({
    table: { minWidth: 820 },
    row: {
        flexDirection: "row", alignItems: "center", paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.line,
    },
    header: { backgroundColor: colors.paper2 },
    email: { width: 300, paddingHorizontal: spacing.md, marginBottom: 0 },
    name: { width: 220, paddingHorizontal: spacing.md, marginBottom: 0 },
    role: { width: 160, paddingHorizontal: spacing.md, marginBottom: 0 },
    actions: { width: 140, paddingHorizontal: spacing.sm, marginBottom: 0 },
    modalBackground: { flex: 1, backgroundColor: "rgba(35,29,22,0.55)" },
    modalContent: {
        flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl,
    },
});

export const adminStyles = StyleSheet.create({
    section: { paddingTop: spacing.xl },
    item: {
        flexDirection: "row", alignItems: "center", gap: spacing.md,
        paddingVertical: spacing.xl, paddingHorizontal: spacing.sm,
        borderBottomWidth: 1, borderBottomColor: colors.line,
    },
    itemPressed: { backgroundColor: colors.paper2 },
    icon: {
        width: 48, height: 48, borderRadius: radius.md,
        backgroundColor: colors.paper2, alignItems: "center", justifyContent: "center",
    },
    text: { flex: 1, minWidth: 0 },
});

export const mobileStyles = StyleSheet.create({
    listItem: {
        gap: spacing.sm, paddingVertical: spacing.xl,
        borderBottomWidth: 1, borderBottomColor: colors.line,
    },
    email: {
        fontFamily: fonts.sans, fontSize: 14, lineHeight: 22,
        color: colors.inkSoft, flexShrink: 1,
    },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
    actionButton: {
        flexGrow: 1, flexBasis: 120, minHeight: 48, marginTop: 0,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    },
    modalContent: { padding: spacing.md },
});
// theme.ts
// Tokens visuais do bookxd, extraídos do design proposto (paleta "estante de livros"):
// papel/marfim como base, vinho como destaque principal, verde-musgo e dourado como secundários.

export const colors = {
  paper: '#EFE6D3',
  paperAlt: '#E3D5B8',
  ink: '#231D16',
  inkSoft: '#6E6250',
  line: 'rgba(35,29,22,0.14)',

  oxblood: '#7C2A34',
  oxbloodDeep: '#571E26',
  forest: '#3F4B3A',
  gold: '#A9822F',

  shelf: '#241F19',
} as const;

// Fraunces é uma serifada com opsz variável; carregue-a via expo-font ou @expo-google-fonts/fraunces.
// Até o carregamento terminar (ou em fallback), os estilos abaixo caem para a serifada do sistema.
export const fonts = {
  display: 'Fraunces_700Bold',
  displayMedium: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 20,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

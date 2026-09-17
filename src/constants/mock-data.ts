export type ReadingBook = {
  id: string;
  title: string;
  author: string;
  gradient: [string, string];
  page: number;
  totalPages: number;
  percent: number;
  rating: number;
};

export const readingNow: ReadingBook[] = [
  {
    id: "duna",
    title: "Duna",
    author: "Frank Herbert",
    gradient: ["#7C2A34", "#4A181E"],
    page: 312,
    totalPages: 488,
    percent: 64,
    rating: 4,
  },
  {
    id: "metamorfose",
    title: "A Metamorfose",
    author: "Franz Kafka",
    gradient: ["#3F4B3A", "#242E22"],
    page: 71,
    totalPages: 81,
    percent: 88,
    rating: 5,
  },
  {
    id: "torto-arado",
    title: "Torto Arado",
    author: "Itamar Vieira Junior",
    gradient: ["#A9822F", "#6E5620"],
    page: 40,
    totalPages: 180,
    percent: 22,
    rating: 5,
  },
];

export type ActivityEntry = {
  id: string;
  name: string;
  action: "avaliou" | "comentou" | "terminou" | "começou";
  book: string;
  extra?: string;
  rating?: number;
  time: string;
  color: string;
};

export const activity: ActivityEntry[] = [
  { id: "1", name: "Marina Costa", action: "avaliou", book: "A Hora da Estrela", rating: 4, time: "há 2 h", color: "#3F4B3A" },
  { id: "2", name: "Diego Alves", action: "comentou", book: "Duna", extra: "a construção política do segundo ato é impressionante", time: "há 5 h", color: "#7C2A34" },
  { id: "3", name: "Bia Ferreira", action: "terminou", book: "Torto Arado", rating: 5, time: "ontem", color: "#A9822F" },
  { id: "4", name: "Rafael Lima", action: "começou", book: "Vidas Secas", time: "ontem", color: "#4A181E" },
];

export type Review = { id: string; initials: string; name: string; rating: number; text: string };

export const bookReviews: Record<string, Review[]> = {
  duna: [
    {
      id: "r1",
      initials: "DA",
      name: "Diego Alves",
      rating: 5,
      text: "A construção política do segundo ato é impressionante — Herbert constrói um mundo que parece mais um tratado de geopolítica do que ficção científica.",
    },
    {
      id: "r2",
      initials: "MC",
      name: "Marina Costa",
      rating: 4,
      text: "Demorei pra engrenar no primeiro terço, mas a partir da chegada em Arrakis não consegui mais largar.",
    },
  ],
};

export type MonthlyBooks = { month: string; heightPercent: number; highlight?: boolean };

export const profile = {
  name: "Julia Santos",
  initials: "JS",
  since: "lendo desde 2021",
  stats: [
    { value: "27", label: "livros em 2026" },
    { value: "8.140", label: "páginas lidas" },
    { value: "12", label: "dias seguidos lendo" },
    { value: "4,3", label: "nota média dada" },
  ],
  monthlyBooks: [
    { month: "jan", heightPercent: 30 },
    { month: "fev", heightPercent: 45 },
    { month: "mar", heightPercent: 20 },
    { month: "abr", heightPercent: 70 },
    { month: "mai", heightPercent: 55, highlight: true },
    { month: "jun", heightPercent: 85, highlight: true },
    { month: "jul", heightPercent: 40 },
  ] as MonthlyBooks[],
  genres: [
    { name: "Ficção", percent: 42, color: "#7C2A34" },
    { name: "Clássicos", percent: 27, color: "#3F4B3A" },
    { name: "Ficção científica", percent: 19, color: "#A9822F" },
  ],
  favorites: [
    ["#7C2A34", "#4A181E"],
    ["#3F4B3A", "#242E22"],
    ["#A9822F", "#6E5620"],
    ["#5C1F27", "#2C0F13"],
  ] as [string, string][],
};

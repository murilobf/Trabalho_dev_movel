import { BASE_URL } from "@/api/api"

export interface FaixaNota {
  nota: number;
  quantidade: number;
  percentual: number;
}

export interface EvolucaoLivroItem {
  periodo: string; // "AAAA-MM"
  quantidade: number;
  media_periodo: number;
  media_acumulada: number;
}

export interface RelatorioLivroResponse {
  livro: { id: number; nome: string; autor: string };
  resumo: {
    total_avaliacoes: number;
    nota_media: number | null;
  };
  distribuicao: FaixaNota[];
  evolucao: EvolucaoLivroItem[];
}

export interface RankingGeneroItem {
  genero_id: number;
  nome: string;
  quantidade: number;
  percentual: number;
}

export interface EvolucaoPessoalItem {
  periodo: string; // "AAAA-MM"
  avaliacoes: number;
  leituras: number;
  total: number;
}

export interface RelatorioPessoalResponse {
  usuario: { id: number; nome: string };
  resumo: {
    livros_avaliados: number;
    nota_media: number | null;
    livros_lidos: number;
    livros_lendo: number;
  };
  ranking_generos: RankingGeneroItem[];
  evolucao: EvolucaoPessoalItem[];
}

async function buscar<T>(path: string, usuarioId?: number | null): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(usuarioId ? { "X-Usuario-Id": String(usuarioId) } : {}),
    },
  });

  if (!res.ok) {
    let mensagem = "Não foi possível carregar o relatório.";
    try {
      const corpo = await res.json();
      if (typeof corpo?.erro === "string") mensagem = corpo.erro;
    } catch {
      /* ignora */
    }
    throw new Error(mensagem);
  }

  return (await res.json()) as T;
}

export const relatoriosApi = {
  doLivro: (livroId: number) =>
    buscar<RelatorioLivroResponse>(`/livros/${livroId}/relatorio`),

  pessoal: (usuarioId: number) =>
    buscar<RelatorioPessoalResponse>("/usuarios/meu/relatorio", usuarioId),
};
// Chamadas do progresso de leitura. As rotas de escrita exigem o header X-Usuario-Id.

// TODO: 10.0.2.2 funciona no emulador do Android Studio. Em celular físico use o IP do PC
import { BASE_URL } from "./api"; // ou "@/api/api"

export type StatusLeitura = "quero_ler" | "lendo" | "lido" | "abandonado";
export type FormatoLeitura = "fisico" | "digital";

export interface ProgressoLivro {
  id: number;
  livro_id: number;
  status: StatusLeitura;
  formato: FormatoLeitura;
  // No formato digital, pagina_atual é a porcentagem e total_paginas é 100.
  pagina_atual: number;
  total_paginas: number | null;
  percentual: number | null;
  atualizado_em: string | null;
}

export interface CorpoProgresso {
  status?: StatusLeitura;
  formato?: FormatoLeitura;
  pagina_atual?: number;
  total_paginas?: number;
  percentual?: number; // só para o formato digital
}

async function chamar<T>(usuarioId: number, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Usuario-Id": String(usuarioId),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let mensagem = "Não foi possível concluir a operação.";
    try {
      const corpo = await res.json();
      if (typeof corpo?.erro === "string") mensagem = corpo.erro;
    } catch {
      /* corpo vazio ou não-JSON */
    }
    throw new Error(mensagem);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const progressoApi = {
  // Progresso do usuário neste livro, ou null se ele ainda não registrou nada.
  meu: (livroId: number, usuarioId: number) =>
    chamar<ProgressoLivro | null>(usuarioId, `/livros/${livroId}/progresso/meu`),

  // Cria ou atualiza. Se o progresso chegar ao fim, a resposta já volta com status "lido".
  salvar: (livroId: number, usuarioId: number, corpo: CorpoProgresso) =>
    chamar<ProgressoLivro>(usuarioId, `/livros/${livroId}/progresso`, {
      method: "PUT",
      body: JSON.stringify(corpo),
    }),

  remover: (livroId: number, usuarioId: number) =>
    chamar<void>(usuarioId, `/livros/${livroId}/progresso`, { method: "DELETE" }),
};

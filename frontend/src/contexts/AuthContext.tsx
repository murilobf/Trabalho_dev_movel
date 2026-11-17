import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/api/api";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
};

type AuthContextData = {
  usuario: Usuario | null;
  carregando: boolean;
  autenticando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [autenticando, setAutenticando] = useState(false);

  // Impede que uma resposta antiga restaure o usuário após sair.
  const tentativaAtual = useRef(0);

  // Não existe uma sessão persistida para restaurar nesta versão.
  const carregando = false;

  async function entrar(email: string, senha: string) {
    if (!email.trim() || !senha) {
      throw new Error("Informe email e senha.");
    }

    const tentativa = ++tentativaAtual.current;
    setAutenticando(true);
    setUsuario(null);

    try {
      const resposta = await api.post("/login", {
        email: email.trim(),
        senha,
      });

      if (tentativa !== tentativaAtual.current) {
        return;
      }

      if (
        !resposta ||
        typeof resposta.id !== "number" ||
        typeof resposta.nome !== "string" ||
        typeof resposta.email !== "string" ||
        typeof resposta.cargo !== "string"
      ) {
        throw new Error("Resposta de login inválida.");
      }

      setUsuario({
        id: resposta.id,
        nome: resposta.nome,
        email: resposta.email,
        cargo: resposta.cargo,
      });
    } finally {
      if (tentativa === tentativaAtual.current) {
        setAutenticando(false);
      }
    }
  }

  function sair() {
    tentativaAtual.current += 1;
    setUsuario(null);
    setAutenticando(false);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        autenticando,
        entrar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return contexto;
}
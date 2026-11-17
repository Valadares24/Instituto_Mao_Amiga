// Endereço único da API.
// No celular pela rede local (Expo Go), use o IP do computador na rede (não localhost).
// No navegador do próprio computador, usa http://localhost:8080 automaticamente.
const IP_REDE_LOCAL = '10.1.10.120';
const EH_NAVEGADOR = typeof window !== 'undefined' && typeof document !== 'undefined';

export const API_BASE_URL = EH_NAVEGADOR
  ? 'http://localhost:8080'
  : `http://${IP_REDE_LOCAL}:8080`;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function extrairMensagemErro(response: Response): Promise<string> {
  try {
    const texto = await response.text();
    if (!texto) {
      return `Erro HTTP ${response.status}.`;
    }
    try {
      const dados = JSON.parse(texto);
      if (typeof dados?.message === 'string' && dados.message.trim().length > 0) {
        return dados.message.trim();
      }
      if (typeof dados?.error === 'string' && dados.error.trim().length > 0) {
        return dados.error.trim();
      }
    } catch {
      return texto;
    }
    return `Erro HTTP ${response.status}.`;
  } catch {
    return `Erro HTTP ${response.status}.`;
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${caminho}`;
  const cabecalhos: Record<string, string> = {
    Accept: 'application/json',
  };

  if (opcoes.body !== undefined) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...opcoes,
      headers: {
        ...cabecalhos,
        ...(opcoes.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Verifique se o servidor está em execução e tente novamente.',
      0,
    );
  }

  if (!response.ok) {
    const mensagem = await extrairMensagemErro(response);
    throw new ApiError(mensagem, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const texto = await response.text();
  if (!texto) {
    return undefined as T;
  }

  return JSON.parse(texto) as T;
}

export function get<T>(caminho: string): Promise<T> {
  return requisitar<T>(caminho, { method: 'GET' });
}

export function post<T>(caminho: string, corpo: unknown): Promise<T> {
  return requisitar<T>(caminho, {
    method: 'POST',
    body: JSON.stringify(corpo),
  });
}

export function put<T>(caminho: string, corpo: unknown): Promise<T> {
  return requisitar<T>(caminho, {
    method: 'PUT',
    body: JSON.stringify(corpo),
  });
}

export function del(caminho: string): Promise<void> {
  return requisitar<void>(caminho, { method: 'DELETE' });
}

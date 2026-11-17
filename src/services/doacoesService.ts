import { del, get, post, put } from './api.ts';
import type { PaginaResposta } from './pontosService.ts';

export interface Doacao {
  id: string;
  tipoItem: string;
  quantidade: number;
  pontoDestino: string;
  criadoEm: string;
}

export interface DoacaoInput {
  tipoItem: string;
  quantidade: number;
  pontoDestino: string;
}

const BASE_DOACOES = '/api/v1/doacoes';

export function buscarPagina(
  filtro: string = '',
  page: number = 0,
  size: number = 10,
): Promise<PaginaResposta<Doacao>> {
  const params = new URLSearchParams();
  const termo = filtro.trim();
  if (termo.length > 0) {
    params.set('filtro', termo);
  }
  params.set('page', String(page));
  params.set('size', String(size));
  return get<PaginaResposta<Doacao>>(`${BASE_DOACOES}/filtro?${params.toString()}`);
}

export function buscarPorId(id: string): Promise<Doacao> {
  return get<Doacao>(`${BASE_DOACOES}/${encodeURIComponent(id)}`);
}

export function cadastrar(dados: DoacaoInput): Promise<Doacao> {
  return post<Doacao>(BASE_DOACOES, dados);
}

export function editar(id: string, dados: DoacaoInput): Promise<Doacao> {
  return put<Doacao>(`${BASE_DOACOES}/${encodeURIComponent(id)}`, dados);
}

export function excluir(id: string): Promise<void> {
  return del(`${BASE_DOACOES}/${encodeURIComponent(id)}`);
}

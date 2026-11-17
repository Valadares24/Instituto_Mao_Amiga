import { del, get, post, put } from './api.ts';

export interface Ponto {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  horario: string;
  tipo: string;
}

export interface PontoInput {
  nome: string;
  endereco: string;
  bairro: string;
  horario: string;
  tipo: string;
}

export interface PaginaInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PaginaResposta<T> {
  content: T[];
  page: PaginaInfo;
}

const BASE_PONTOS = '/api/v1/pontos';

export function listar(): Promise<Ponto[]> {
  return get<Ponto[]>(BASE_PONTOS);
}

export function buscarPagina(
  filtro: string = '',
  page: number = 0,
  size: number = 10,
): Promise<PaginaResposta<Ponto>> {
  const params = new URLSearchParams();
  const termo = filtro.trim();
  if (termo.length > 0) {
    params.set('filtro', termo);
  }
  params.set('page', String(page));
  params.set('size', String(size));
  return get<PaginaResposta<Ponto>>(`${BASE_PONTOS}/filtro?${params.toString()}`);
}

export function buscarPorId(id: string): Promise<Ponto> {
  return get<Ponto>(`${BASE_PONTOS}/${encodeURIComponent(id)}`);
}

export function cadastrar(dados: PontoInput): Promise<Ponto> {
  return post<Ponto>(BASE_PONTOS, dados);
}

export function editar(id: string, dados: PontoInput): Promise<Ponto> {
  return put<Ponto>(`${BASE_PONTOS}/${encodeURIComponent(id)}`, dados);
}

export function excluir(id: string): Promise<void> {
  return del(`${BASE_PONTOS}/${encodeURIComponent(id)}`);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAVE_FAVORITOS, criarRepositorioFavoritos } from '../dominio/favoritos.js';

const repositorio = criarRepositorioFavoritos(AsyncStorage);

export { CHAVE_FAVORITOS };

export function listarIdsFavoritos(): Promise<string[]> {
  return repositorio.listarIdsFavoritos();
}

export function alternarFavorito(id: string): Promise<string[]> {
  return repositorio.alternarFavorito(id);
}

export function removerFavorito(id: string): Promise<string[]> {
  return repositorio.removerFavorito(id);
}

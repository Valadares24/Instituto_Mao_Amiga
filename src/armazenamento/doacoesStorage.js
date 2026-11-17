import AsyncStorage from '@react-native-async-storage/async-storage';

import { criarRepositorioDoacoes } from './repositorioDoacoes.js';

const repositorio = criarRepositorioDoacoes(AsyncStorage);

export const {
    listarDoacoes,
    salvarDoacao,
    atualizarDoacao,
    excluirDoacao,
} = repositorio;

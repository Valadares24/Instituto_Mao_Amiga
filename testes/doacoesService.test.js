import assert from 'node:assert/strict';
import test from 'node:test';
import { API_BASE_URL } from '../src/services/api.ts';
import {
  buscarPagina,
  buscarPorId,
  cadastrar,
  editar,
  excluir,
} from '../src/services/doacoesService.ts';

test('doacoesService delega paginação, busca por id, cadastro, edição e exclusão para api.ts', async () => {
  const chamadas = [];
  const fetchOriginal = globalThis.fetch;

  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url, method: opcoes.method, body: opcoes.body });
    return {
      ok: true,
      status: opcoes.method === 'DELETE' ? 204 : 200,
      async text() {
        if (opcoes.method === 'DELETE') return '';
        return JSON.stringify({ content: [], page: { size: 10, number: 0, totalElements: 0, totalPages: 0 } });
      },
    };
  };

  try {
    await buscarPagina('roupas', 0, 10);
    await buscarPagina('', 1, 10);
    await buscarPorId('doa-123');
    await cadastrar({ tipoItem: 'Roupas', quantidade: 5, pontoDestino: 'Ponto de Coleta Setor Bueno' });
    await editar('doa-123', { tipoItem: 'Alimentos', quantidade: 8, pontoDestino: 'Ponto de Distribuição Setor Sul' });
    await excluir('doa-123');

    assert.equal(chamadas[0].url, `${API_BASE_URL}/api/v1/doacoes/filtro?filtro=roupas&page=0&size=10`);
    assert.equal(chamadas[1].url, `${API_BASE_URL}/api/v1/doacoes/filtro?page=1&size=10`);
    assert.equal(chamadas[2].url, `${API_BASE_URL}/api/v1/doacoes/doa-123`);
    assert.equal(chamadas[3].method, 'POST');
    assert.equal(chamadas[4].method, 'PUT');
    assert.equal(chamadas[5].method, 'DELETE');
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

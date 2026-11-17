import assert from 'node:assert/strict';
import test from 'node:test';
import { API_BASE_URL } from '../src/services/api.ts';
import {
  buscarPagina,
  buscarPorId,
  cadastrar,
  editar,
  excluir,
  listar,
} from '../src/services/pontosService.ts';

test('pontosService delega todas as operações CRUD e paginação para api.ts', async () => {
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
    await listar();
    await buscarPagina('Bueno', 1, 10);
    await buscarPagina('', 0, 10);
    await buscarPorId('abc-123');
    await cadastrar({ nome: 'A', endereco: 'B', bairro: 'C', horario: 'D', tipo: 'coleta' });
    await editar('abc-123', { nome: 'A2', endereco: 'B', bairro: 'C', horario: 'D', tipo: 'distribuição' });
    await excluir('abc-123');

    assert.equal(chamadas[0].url, `${API_BASE_URL}/api/v1/pontos`);
    assert.equal(chamadas[1].url, `${API_BASE_URL}/api/v1/pontos/filtro?filtro=Bueno&page=1&size=10`);
    assert.equal(chamadas[2].url, `${API_BASE_URL}/api/v1/pontos/filtro?page=0&size=10`);
    assert.equal(chamadas[3].url, `${API_BASE_URL}/api/v1/pontos/abc-123`);
    assert.equal(chamadas[4].method, 'POST');
    assert.equal(chamadas[5].method, 'PUT');
    assert.equal(chamadas[6].method, 'DELETE');
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

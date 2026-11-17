import assert from 'node:assert/strict';
import test from 'node:test';
import { API_BASE_URL, ApiError, del, get, post, put } from '../src/services/api.ts';

function criarResposta({ ok = true, status = 200, body = '' }) {
  return {
    ok,
    status,
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  };
}

test('api.ts expõe URL base única e envia GET, POST, PUT e DELETE corretamente', async () => {
  assert.match(API_BASE_URL, /^http:\/\/.+:8080$/);
  const chamadas = [];
  const fetchOriginal = globalThis.fetch;

  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url, opcoes });
    if (opcoes.method === 'DELETE') {
      return criarResposta({ ok: true, status: 204, body: '' });
    }
    return criarResposta({ ok: true, status: 200, body: { ok: true } });
  };

  try {
    assert.deepEqual(await get('/api/v1/pontos'), { ok: true });
    assert.deepEqual(await post('/api/v1/pontos', { nome: 'Teste' }), { ok: true });
    assert.deepEqual(await put('/api/v1/pontos/1', { nome: 'Editado' }), { ok: true });
    assert.equal(await del('/api/v1/pontos/1'), undefined);

    assert.equal(chamadas.length, 4);
    assert.equal(chamadas[0].url, `${API_BASE_URL}/api/v1/pontos`);
    assert.equal(chamadas[0].opcoes.method, 'GET');
    assert.equal(chamadas[1].opcoes.method, 'POST');
    assert.equal(chamadas[1].opcoes.headers['Content-Type'], 'application/json');
    assert.equal(chamadas[2].opcoes.method, 'PUT');
    assert.equal(chamadas[3].opcoes.method, 'DELETE');
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

test('api.ts lança ApiError com status para respostas 400/404 e status 0 para falha de rede', async () => {
  const fetchOriginal = globalThis.fetch;

  globalThis.fetch = async () => criarResposta({
    ok: false,
    status: 404,
    body: { status: 404, message: 'Ponto não encontrado' },
  });

  try {
    await assert.rejects(
      () => get('/api/v1/pontos/inexistente'),
      (erro) => erro instanceof ApiError && erro.status === 404 && erro.message === 'Ponto não encontrado',
    );

    globalThis.fetch = async () => criarResposta({
      ok: false,
      status: 400,
      body: { status: 400, message: 'O nome do ponto é obrigatório' },
    });

    await assert.rejects(
      () => post('/api/v1/pontos', { nome: '' }),
      (erro) => erro instanceof ApiError && erro.status === 400 && /obrigatório/.test(erro.message),
    );

    globalThis.fetch = async () => {
      throw new TypeError('fetch failed');
    };

    await assert.rejects(
      () => get('/api/v1/pontos'),
      (erro) => erro instanceof ApiError && erro.status === 0 && /conectar/.test(erro.message),
    );
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

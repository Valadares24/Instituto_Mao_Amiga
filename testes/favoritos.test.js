import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAVE_FAVORITOS, criarRepositorioFavoritos } from '../src/dominio/favoritos.js';

function criarArmazenamentoMemoria(inicial = null) {
  let texto = inicial;
  return {
    async getItem(chave) {
      assert.equal(chave, CHAVE_FAVORITOS);
      return texto;
    },
    async setItem(chave, valor) {
      assert.equal(chave, CHAVE_FAVORITOS);
      texto = valor;
    },
    obterBruto() {
      return texto;
    },
  };
}

test('favoritos salva somente array de IDs no AsyncStorage e persiste entre reinícios', async () => {
  const storage = criarArmazenamentoMemoria();
  const repo1 = criarRepositorioFavoritos(storage);

  assert.deepEqual(await repo1.listarIdsFavoritos(), []);
  assert.deepEqual(await repo1.alternarFavorito('id-1'), ['id-1']);
  assert.deepEqual(await repo1.alternarFavorito('id-2'), ['id-1', 'id-2']);
  assert.equal(storage.obterBruto(), JSON.stringify(['id-1', 'id-2']));

  // Simula reabrir o app com nova instância do repositório
  const repo2 = criarRepositorioFavoritos(storage);
  assert.deepEqual(await repo2.listarIdsFavoritos(), ['id-1', 'id-2']);

  assert.deepEqual(await repo2.removerFavorito('id-1'), ['id-2']);
  assert.deepEqual(await repo2.alternarFavorito('id-2'), []);
});

test('favoritos trata JSON inválido sem quebrar', async () => {
  const storage = criarArmazenamentoMemoria('{json-quebrado');
  const repo = criarRepositorioFavoritos(storage);
  assert.deepEqual(await repo.listarIdsFavoritos(), []);
});

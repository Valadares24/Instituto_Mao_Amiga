import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarDadosPonto, validarFormularioPonto } from '../src/dominio/pontos.js';

test('validação de ponto rejeita campos vazios e tipo fora de coleta/distribuição', () => {
  const erros = validarFormularioPonto({
    nome: '  ',
    endereco: '',
    bairro: ' ',
    horario: '',
    tipo: 'outro',
  });

  assert.deepEqual(Object.keys(erros), ['nome', 'endereco', 'bairro', 'horario', 'tipo']);
});

test('validação e normalização aceitam ponto válido de coleta e distribuição', () => {
  for (const tipo of ['coleta', 'distribuição']) {
    const entrada = {
      nome: '  Ponto Teste  ',
      endereco: '  Rua 10, nº 50  ',
      bairro: '  Setor Bueno  ',
      horario: '  Seg a Sex, 8h às 17h  ',
      tipo,
    };
    assert.deepEqual(validarFormularioPonto(entrada), {});
    assert.deepEqual(normalizarDadosPonto(entrada), {
      nome: 'Ponto Teste',
      endereco: 'Rua 10, nº 50',
      bairro: 'Setor Bueno',
      horario: 'Seg a Sex, 8h às 17h',
      tipo,
    });
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
    filtrarDoacoes,
    normalizarTipo,
    ordenarDoacoes,
    prepararDoacao,
    resumirDoacoes,
    validarFormulario,
} from '../src/dominio/doacoes.js';

function criarDoacao(id, tipo_item = 'Roupa', quantidade = 2, criado_em = '2026-10-05T12:00:00.000Z') {
    return {
        id,
        tipoItem: tipo_item,
        quantidade,
        pontoDestino: 'Ponto de Coleta Setor Bueno',
        criadoEm: criado_em,
    };
}

test('formulário válido aceita somente quantidades inteiras positivas seguras', () => {
    for (const quantidade of ['1', '0007', '120', String(Number.MAX_SAFE_INTEGER)]) {
        assert.deepEqual(
            validarFormulario({ tipoItem: 'Roupa', quantidade, pontoDestino: 'Ponto de Coleta Setor Bueno' }),
            {},
        );
    }
});

test('validação indica os campos vazios e destino vazio', () => {
    const erros = validarFormulario({ tipoItem: '   ', quantidade: '', pontoDestino: '' });

    assert.deepEqual(Object.keys(erros), ['tipoItem', 'quantidade', 'pontoDestino']);
    assert.match(erros.tipoItem, /Informe/);
    assert.match(erros.quantidade, /inteira maior que zero/);
    assert.match(erros.pontoDestino, /válido/);
    assert.equal(
        typeof validarFormulario({
            tipoItem: 'Alimento',
            quantidade: '2',
            pontoDestino: '   ',
        }).pontoDestino,
        'string',
    );
});

test('quantidade rejeita zero, negativos, decimais, notação científica e números inseguros', () => {
    const quantidades_invalidas = [
        '', ' ', '0', '000', '-2', '1.5', '1,5', '1e3', '+3', ' 2 ', 'dez',
        '9007199254740992', 3, null,
    ];

    for (const quantidade of quantidades_invalidas) {
        const erros = validarFormulario({
            tipoItem: 'Roupa',
            quantidade,
            pontoDestino: 'ponto-centro',
        });
        assert.equal(typeof erros.quantidade, 'string', 'Entrada inválida: ' + quantidade);
    }
});

test('normalização limpa espaços e compara caixa em pt-BR sem eliminar acentos', () => {
    assert.equal(normalizarTipo('   MATERIAL   Escolar  '), 'material escolar');
    assert.equal(normalizarTipo(' ÁGUA '), 'água');
});

test('busca é parcial, ignora caixa e não altera doações nem resumo global', () => {
    const doacoes = [
        criarDoacao('1', 'Roupa', 5),
        criarDoacao('2', 'Alimento', 3),
        criarDoacao('3', 'roupa infantil', 2),
    ];
    const resumo_antes = resumirDoacoes(doacoes);
    const filtradas = filtrarDoacoes(doacoes, 'ROUPA');

    assert.deepEqual(filtradas.map((doacao) => doacao.id), ['1', '3']);
    assert.equal(filtrarDoacoes(doacoes, ''), doacoes);
    assert.equal(filtrarDoacoes(doacoes, '   '), doacoes);
    assert.deepEqual(filtrarDoacoes(doacoes, 'brinquedo'), []);
    assert.equal(doacoes.length, 3);
    assert.deepEqual(resumirDoacoes(doacoes), resumo_antes);
    assert.equal(resumo_antes.totalDoacoes, 3);
    assert.equal(resumo_antes.totalUnidades, 10);
});

test('resumo agrupa tipos normalizados e preserva o primeiro rótulo', () => {
    const doacoes = [
        criarDoacao('1', 'Roupa', 4),
        criarDoacao('2', ' roupa ', 6),
        criarDoacao('3', 'Alimento', 10),
        criarDoacao('4', 'Material   Escolar', 1),
        criarDoacao('5', 'material escolar', 2),
    ];

    assert.deepEqual(resumirDoacoes(doacoes), {
        totalDoacoes: 5,
        totalUnidades: 23,
        tipos: [
            { tipoItem: 'Alimento', quantidade: 10, totalDoacoes: 1 },
            { tipoItem: 'Roupa', quantidade: 10, totalDoacoes: 2 },
            { tipoItem: 'Material Escolar', quantidade: 3, totalDoacoes: 2 },
        ],
    });
    assert.equal(doacoes[1].tipoItem, ' roupa ');
});

test('resumo vazio e totais recalculados após edição e exclusão', () => {
    assert.deepEqual(resumirDoacoes([]), { totalDoacoes: 0, totalUnidades: 0, tipos: [] });

    const doacoes = [criarDoacao('1', 'Roupa', 2), criarDoacao('2', 'Alimento', 4)];
    const editadas = [criarDoacao('1', 'Roupa', 8), doacoes[1]];

    assert.equal(resumirDoacoes(doacoes).totalUnidades, 6);
    assert.equal(resumirDoacoes(editadas).totalUnidades, 12);
    assert.equal(resumirDoacoes(editadas.slice(1)).totalUnidades, 4);
});

test('ordenação apresenta doações recentes primeiro sem modificar o array original', () => {
    const doacoes = [
        criarDoacao('antiga', 'Roupa', 1, '2026-10-03T12:00:00.000Z'),
        criarDoacao('recente', 'Roupa', 1, '2026-10-05T12:00:00.000Z'),
        criarDoacao('media', 'Roupa', 1, '2026-10-04T12:00:00.000Z'),
    ];

    assert.deepEqual(ordenarDoacoes(doacoes).map((doacao) => doacao.id), ['recente', 'media', 'antiga']);
    assert.deepEqual(doacoes.map((doacao) => doacao.id), ['antiga', 'recente', 'media']);
});

test('novo cadastro cria identidade e data ISO e preserva a caixa visual', () => {
    let chamadas_gerador = 0;
    const inicio = Date.now();
    const doacao = prepararDoacao(
        { tipoItem: '  ROUPA   Infantil ', quantidade: '007', pontoDestino: 'ponto-norte' },
        null,
        () => {
            chamadas_gerador += 1;
            return 'id-novo';
        },
    );

    assert.equal(chamadas_gerador, 1);
    assert.equal(doacao.id, 'id-novo');
    assert.equal(doacao.tipoItem, 'ROUPA Infantil');
    assert.equal(doacao.quantidade, 7);
    assert.equal(doacao.pontoDestino, 'ponto-norte');
    assert.equal(new Date(doacao.criadoEm).toISOString(), doacao.criadoEm);
    assert.ok(Date.parse(doacao.criadoEm) >= inicio && Date.parse(doacao.criadoEm) <= Date.now());
    assert.deepEqual(Object.keys(doacao), ['id', 'tipoItem', 'quantidade', 'pontoDestino', 'criadoEm']);
});

test('edição preserva identidade e data original sem gerar novo ID', () => {
    const original = criarDoacao('id-original', 'Roupa', 2, '2026-09-29T18:30:00.000Z');
    const editada = prepararDoacao(
        { tipoItem: '  Alimento ', quantidade: '5', pontoDestino: 'ponto-sul' },
        original,
        () => {
            throw new Error('O gerador não deve ser chamado em edição.');
        },
    );

    assert.deepEqual(editada, {
        id: original.id,
        tipoItem: 'Alimento',
        quantidade: 5,
        pontoDestino: 'ponto-sul',
        criadoEm: original.criadoEm,
    });
    assert.equal(original.tipoItem, 'Roupa');
    assert.equal(original.quantidade, 2);
});

test('resumo conserva precisamente total e grupo acima do limite seguro do Number', () => {
    const resumo = resumirDoacoes([
        criarDoacao('1', 'Roupa', Number.MAX_SAFE_INTEGER),
        criarDoacao('2', 'roupa', 2),
    ]);

    assert.equal(resumo.totalDoacoes, 2);
    assert.equal(resumo.totalUnidades, 9007199254740993n);
    assert.equal(resumo.totalUnidades.toLocaleString('pt-BR'), '9.007.199.254.740.993');
    assert.equal(resumo.tipos[0].quantidade, 9007199254740993n);
    assert.equal(resumo.tipos[0].quantidade.toLocaleString('pt-BR'), '9.007.199.254.740.993');
    assert.equal(resumo.tipos[0].totalDoacoes, 2);
});

test('resumo mantém Number até o limite e ordena grupos de Number e BigInt', () => {
    const resumo_no_limite = resumirDoacoes([
        criarDoacao('1', 'Roupa', Number.MAX_SAFE_INTEGER),
    ]);
    assert.equal(resumo_no_limite.totalUnidades, Number.MAX_SAFE_INTEGER);
    assert.equal(resumo_no_limite.tipos[0].quantidade, Number.MAX_SAFE_INTEGER);

    const resumo_grupos_distintos = resumirDoacoes([
        criarDoacao('1', 'Roupa', Number.MAX_SAFE_INTEGER),
        criarDoacao('2', 'Alimento', 2),
    ]);
    assert.equal(resumo_grupos_distintos.totalUnidades, 9007199254740993n);
    assert.equal(typeof resumo_grupos_distintos.tipos[0].quantidade, 'number');
    assert.equal(typeof resumo_grupos_distintos.tipos[1].quantidade, 'number');

    const resumo_misto = resumirDoacoes([
        criarDoacao('1', 'Roupa', Number.MAX_SAFE_INTEGER),
        criarDoacao('2', 'Alimento', Number.MAX_SAFE_INTEGER),
        criarDoacao('3', 'alimento', 2),
        criarDoacao('4', 'Material', 7),
    ]);
    assert.deepEqual(
        resumo_misto.tipos.map((grupo) => grupo.tipoItem),
        ['Alimento', 'Roupa', 'Material'],
    );
    assert.equal(resumo_misto.tipos[0].quantidade, 9007199254740993n);
    assert.equal(resumo_misto.tipos[1].quantidade, Number.MAX_SAFE_INTEGER);
    assert.equal(resumo_misto.tipos[2].quantidade, 7);
});

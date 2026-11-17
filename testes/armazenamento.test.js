import assert from 'node:assert/strict';
import test from 'node:test';

import {
    CHAVE_DOACOES,
    criarRepositorioDoacoes,
} from '../src/armazenamento/repositorioDoacoes.js';
import { prepararDoacao } from '../src/dominio/doacoes.js';

function criarDoacao(id, quantidade = 2) {
    return {
        id,
        tipoItem: 'Roupa',
        quantidade,
        pontoDestino: 'ponto-centro',
        criadoEm: '2026-10-05T12:00:00.000Z',
    };
}

function criarArmazenamento(texto_inicial = null) {
    let texto = texto_inicial;
    let total_escritas = 0;
    let falha_leitura = false;
    let falha_escrita = false;

    return {
        async getItem(chave) {
            assert.equal(chave, CHAVE_DOACOES);

            if (falha_leitura) {
                throw new Error('Falha simulada de leitura.');
            }

            return texto;
        },
        async setItem(chave, novo_texto) {
            assert.equal(chave, CHAVE_DOACOES);

            if (falha_escrita) {
                throw new Error('Falha simulada de escrita.');
            }

            texto = novo_texto;
            total_escritas += 1;
        },
        obterTexto() {
            return texto;
        },
        obterTotalEscritas() {
            return total_escritas;
        },
        definirFalhaLeitura(esta_falhando) {
            falha_leitura = esta_falhando;
        },
        definirFalhaEscrita(esta_falhando) {
            falha_escrita = esta_falhando;
        },
    };
}

test('ausência da chave representa histórico vazio sem escrever no aparelho', async () => {
    const armazenamento = criarArmazenamento();
    const repositorio = criarRepositorioDoacoes(armazenamento);

    assert.deepEqual(await repositorio.listarDoacoes(), []);
    assert.equal(armazenamento.obterTotalEscritas(), 0);
    assert.equal(armazenamento.obterTexto(), null);
});

test('CRUD retorna os arrays persistidos e conserva registros anteriores', async () => {
    const armazenamento = criarArmazenamento();
    const repositorio = criarRepositorioDoacoes(armazenamento);
    const primeira = criarDoacao('1');
    const segunda = criarDoacao('2', 3);

    assert.deepEqual(await repositorio.salvarDoacao(primeira), [primeira]);
    assert.deepEqual(await repositorio.salvarDoacao(segunda), [primeira, segunda]);

    const editada = { ...primeira, quantidade: 8, pontoDestino: 'ponto-sul' };
    assert.deepEqual(await repositorio.atualizarDoacao(editada), [editada, segunda]);
    assert.deepEqual(await repositorio.listarDoacoes(), [editada, segunda]);
    assert.deepEqual(await repositorio.excluirDoacao('1'), [segunda]);
    assert.deepEqual(JSON.parse(armazenamento.obterTexto()), [segunda]);
    assert.deepEqual(await repositorio.excluirDoacao('2'), []);
    assert.deepEqual(await repositorio.listarDoacoes(), []);
});

test('três ou mais doações sobrevivem à recriação do repositório', async () => {
    const armazenamento = criarArmazenamento();
    const repositorio_original = criarRepositorioDoacoes(armazenamento);
    const doacoes = [criarDoacao('1'), criarDoacao('2'), criarDoacao('3'), criarDoacao('4')];

    for (const doacao of doacoes) {
        await repositorio_original.salvarDoacao(doacao);
    }

    const repositorio_reaberto = criarRepositorioDoacoes(armazenamento);
    assert.deepEqual(await repositorio_reaberto.listarDoacoes(), doacoes);
});

test('cancelar edição ou exclusão sem chamar mutação mantém dados intactos', async () => {
    const original = criarDoacao('1');
    const armazenamento = criarArmazenamento(JSON.stringify([original]));
    const repositorio = criarRepositorioDoacoes(armazenamento);

    const [doacao] = await repositorio.listarDoacoes();
    prepararDoacao(
        { tipoItem: 'Alimento', quantidade: '10', pontoDestino: 'ponto-sul' },
        doacao,
        () => 'outro-id',
    );

    assert.deepEqual(await repositorio.listarDoacoes(), [original]);
    assert.equal(armazenamento.obterTotalEscritas(), 0);
    assert.equal(armazenamento.obterTexto(), JSON.stringify([original]));
});

test('atualização mantém data de cadastro e ID sem duplicar', async () => {
    const original = criarDoacao('1');
    const armazenamento = criarArmazenamento(JSON.stringify([original]));
    const repositorio = criarRepositorioDoacoes(armazenamento);
    const [editada] = await repositorio.atualizarDoacao({
        ...original,
        quantidade: 9,
        criadoEm: '2026-10-06T12:00:00.000Z',
    });

    assert.equal(editada.id, original.id);
    assert.equal(editada.criadoEm, original.criadoEm);
    assert.equal(editada.quantidade, 9);
    assert.equal((await repositorio.listarDoacoes()).length, 1);
});

test('ID duplicado e edição ou exclusão inexistente não gravam nada', async () => {
    const original = criarDoacao('1');
    const texto_original = JSON.stringify([original]);
    const armazenamento = criarArmazenamento(texto_original);
    const repositorio = criarRepositorioDoacoes(armazenamento);

    await assert.rejects(repositorio.salvarDoacao(original), /Já existe/);
    await assert.rejects(repositorio.atualizarDoacao(criarDoacao('inexistente')), /não foi encontrada/);
    await assert.rejects(repositorio.excluirDoacao('inexistente'), /não foi encontrada/);
    assert.equal(armazenamento.obterTexto(), texto_original);
    assert.equal(armazenamento.obterTotalEscritas(), 0);
});

test('cadastros concorrentes e leituras aguardam a fila, sem perder atualizações', async () => {
    const armazenamento = criarArmazenamento();
    const repositorio = criarRepositorioDoacoes(armazenamento);
    const doacoes = Array.from({ length: 20 }, (_, indice) => criarDoacao('id-' + indice));
    const cadastros = doacoes.map((doacao) => repositorio.salvarDoacao(doacao));
    const leitura = repositorio.listarDoacoes();

    await Promise.all(cadastros);
    assert.deepEqual(await leitura, doacoes);
    assert.deepEqual(JSON.parse(armazenamento.obterTexto()), doacoes);
});

test('repositórios com o mesmo adaptador compartilham a fila', async () => {
    const armazenamento = criarArmazenamento();
    const primeiro_repositorio = criarRepositorioDoacoes(armazenamento);
    const segundo_repositorio = criarRepositorioDoacoes(armazenamento);

    await Promise.all([
        primeiro_repositorio.salvarDoacao(criarDoacao('1')),
        segundo_repositorio.salvarDoacao(criarDoacao('2')),
        primeiro_repositorio.salvarDoacao(criarDoacao('3')),
    ]);

    assert.deepEqual(
        (await segundo_repositorio.listarDoacoes()).map((doacao) => doacao.id),
        ['1', '2', '3'],
    );
});

test('mutação só retorna depois de a escrita assíncrona terminar', async () => {
    let liberar_escrita;
    let avisar_inicio;
    let texto = null;
    let retornou = false;
    const escrita_iniciada = new Promise((resolver) => { avisar_inicio = resolver; });
    const escrita_liberada = new Promise((resolver) => { liberar_escrita = resolver; });
    const armazenamento = {
        async getItem() {
            return texto;
        },
        async setItem(chave, novo_texto) {
            assert.equal(chave, CHAVE_DOACOES);
            avisar_inicio();
            await escrita_liberada;
            texto = novo_texto;
        },
    };
    const repositorio = criarRepositorioDoacoes(armazenamento);
    const salvamento = repositorio.salvarDoacao(criarDoacao('1')).then((doacoes) => {
        retornou = true;
        return doacoes;
    });

    await escrita_iniciada;
    assert.equal(retornou, false);
    assert.equal(texto, null);
    liberar_escrita();
    assert.equal((await salvamento).length, 1);
    assert.equal(JSON.parse(texto)[0].id, '1');
});

test('JSON corrompido impede toda mutação e permanece preservado', async () => {
    const texto_corrompido = '{conteúdo inválido';
    const armazenamento = criarArmazenamento(texto_corrompido);
    const repositorio = criarRepositorioDoacoes(armazenamento);

    await assert.rejects(repositorio.listarDoacoes(), /dados salvos.*inválidos/);
    await assert.rejects(repositorio.salvarDoacao(criarDoacao('1')), /dados salvos.*inválidos/);
    await assert.rejects(repositorio.atualizarDoacao(criarDoacao('1')), /dados salvos.*inválidos/);
    await assert.rejects(repositorio.excluirDoacao('1'), /dados salvos.*inválidos/);
    assert.equal(armazenamento.obterTexto(), texto_corrompido);
    assert.equal(armazenamento.obterTotalEscritas(), 0);
});

test('JSON válido com estrutura ou valores inválidos nunca é sobrescrito', async () => {
    const original = criarDoacao('1');
    const conjuntos_invalidos = [
        {},
        null,
        [null],
        [original, original],
        [{ ...original, id: '' }],
        [{ ...original, tipoItem: ' ' }],
        [{ ...original, quantidade: '2' }],
        [{ ...original, quantidade: 0 }],
        [{ ...original, quantidade: 1.5 }],
        [{ ...original, quantidade: Number.MAX_SAFE_INTEGER + 1 }],
        [{ ...original, pontoDestino: '   ' }],
        [{ ...original, criadoEm: 'não é uma data' }],
        [{ ...original, criadoEm: '2026-02-30T12:00:00.000Z' }],
        [{ ...original, criadoEm: '2026-10-05' }],
        [{ ...original, criadoEm: '2026-10-05T12:00:00Z' }],
    ];

    for (const conjunto of conjuntos_invalidos) {
        const texto_original = JSON.stringify(conjunto);
        const armazenamento = criarArmazenamento(texto_original);
        const repositorio = criarRepositorioDoacoes(armazenamento);

        await assert.rejects(repositorio.listarDoacoes(), /inválidos/);
        await assert.rejects(repositorio.salvarDoacao(criarDoacao('novo-id')), /inválidos/);
        assert.equal(armazenamento.obterTexto(), texto_original);
        assert.equal(armazenamento.obterTotalEscritas(), 0);
    }
});

test('falha de leitura é comunicada em português e não autoriza escrita', async () => {
    const armazenamento = criarArmazenamento();
    armazenamento.definirFalhaLeitura(true);
    const repositorio = criarRepositorioDoacoes(armazenamento);

    await assert.rejects(repositorio.listarDoacoes(), /Não foi possível carregar/);
    await assert.rejects(repositorio.salvarDoacao(criarDoacao('1')), /Não foi possível carregar/);
    assert.equal(armazenamento.obterTotalEscritas(), 0);

    armazenamento.definirFalhaLeitura(false);
    assert.deepEqual(await repositorio.salvarDoacao(criarDoacao('1')), [criarDoacao('1')]);
});

test('falha de escrita mantém os registros antigos e a fila continua utilizável', async () => {
    const original = criarDoacao('1');
    const armazenamento = criarArmazenamento(JSON.stringify([original]));
    const repositorio = criarRepositorioDoacoes(armazenamento);
    armazenamento.definirFalhaEscrita(true);

    await assert.rejects(repositorio.salvarDoacao(criarDoacao('2')), /Não foi possível salvar/);
    await assert.rejects(repositorio.atualizarDoacao({ ...original, quantidade: 8 }), /Não foi possível salvar/);
    await assert.rejects(repositorio.excluirDoacao('1'), /Não foi possível salvar/);
    assert.deepEqual(await repositorio.listarDoacoes(), [original]);
    assert.equal(armazenamento.obterTotalEscritas(), 0);

    armazenamento.definirFalhaEscrita(false);
    assert.equal((await repositorio.salvarDoacao(criarDoacao('2'))).length, 2);
});

test('novo registro inválido é rejeitado antes da persistência', async () => {
    const armazenamento = criarArmazenamento();
    const repositorio = criarRepositorioDoacoes(armazenamento);

    await assert.rejects(repositorio.salvarDoacao({ ...criarDoacao('1'), quantidade: 0 }), /inválidos/);
    await assert.rejects(repositorio.salvarDoacao({ ...criarDoacao('1'), criadoEm: 'ontem' }), /inválidos/);
    assert.equal(armazenamento.obterTexto(), null);
    assert.equal(armazenamento.obterTotalEscritas(), 0);
});

test('entrada de mutação malformada gera mensagem em português sem alterar o histórico', async () => {
    const original = criarDoacao('1');
    const armazenamento = criarArmazenamento(JSON.stringify([original]));
    const repositorio = criarRepositorioDoacoes(armazenamento);

    for (const doacao of [null, {}, { ...original, tipoItem: '' }]) {
        await assert.rejects(repositorio.salvarDoacao(doacao), /dados salvos.*inválidos/);
        await assert.rejects(repositorio.atualizarDoacao(doacao), /dados salvos.*inválidos/);
    }

    assert.deepEqual(await repositorio.listarDoacoes(), [original]);
    assert.equal(armazenamento.obterTotalEscritas(), 0);
});

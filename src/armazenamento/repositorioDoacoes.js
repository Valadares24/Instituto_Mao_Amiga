export const CHAVE_DOACOES = '@instituto_mao_amiga:doacoes';

const FILAS_ARMAZENAMENTO = new WeakMap();
const MENSAGEM_DADOS_INVALIDOS = (
    'Os dados salvos das doações estão inválidos. Nenhuma alteração foi realizada.'
);

function validarDoacoes(doacoes) {
    if (!Array.isArray(doacoes)) {
        throw new Error(MENSAGEM_DADOS_INVALIDOS);
    }

    const ids = new Set();

    for (const doacao of doacoes) {
        const eh_objeto = doacao !== null && typeof doacao === 'object' && !Array.isArray(doacao);

        if (
            !eh_objeto
            || typeof doacao.id !== 'string'
            || doacao.id.trim().length === 0
            || ids.has(doacao.id)
            || typeof doacao.tipoItem !== 'string'
            || doacao.tipoItem.trim().length === 0
            || !Number.isSafeInteger(doacao.quantidade)
            || doacao.quantidade <= 0
            || typeof doacao.pontoDestino !== 'string'
            || doacao.pontoDestino.trim().length === 0
            || typeof doacao.criadoEm !== 'string'
        ) {
            throw new Error(MENSAGEM_DADOS_INVALIDOS);
        }

        const instante = Date.parse(doacao.criadoEm);
        const tem_data_iso = (
            Number.isFinite(instante)
            && new Date(instante).toISOString() === doacao.criadoEm
        );

        if (!tem_data_iso) {
            throw new Error(MENSAGEM_DADOS_INVALIDOS);
        }

        ids.add(doacao.id);
    }
}

/** Compartilha a fila entre repositórios que usam o mesmo adaptador. */
function enfileirarOperacao(armazenamento, operacao) {
    const fila_anterior = FILAS_ARMAZENAMENTO.get(armazenamento);
    const fila_operacoes = fila_anterior === undefined ? Promise.resolve() : fila_anterior;
    const resultado = fila_operacoes.then(operacao);

    FILAS_ARMAZENAMENTO.set(
        armazenamento,
        resultado.then(() => undefined, () => undefined),
    );

    return resultado;
}

/**
 * Adaptador injetável com getItem(chave) e setItem(chave, texto), ambos assíncronos.
 * Toda mutação lê os dados atuais e só retorna após a persistência terminar.
 */
export function criarRepositorioDoacoes(armazenamento) {
    async function lerDoacoes() {
        let texto;

        try {
            texto = await armazenamento.getItem(CHAVE_DOACOES);
        } catch {
            throw new Error('Não foi possível carregar suas doações. Tente novamente.');
        }

        if (texto === null) {
            return [];
        }

        let doacoes;

        try {
            doacoes = JSON.parse(texto);
        } catch {
            throw new Error(MENSAGEM_DADOS_INVALIDOS);
        }

        validarDoacoes(doacoes);
        return doacoes;
    }

    async function gravarDoacoes(doacoes) {
        validarDoacoes(doacoes);

        try {
            await armazenamento.setItem(CHAVE_DOACOES, JSON.stringify(doacoes));
        } catch {
            throw new Error('Não foi possível salvar suas doações. Tente novamente.');
        }

        return doacoes;
    }

    function listarDoacoes() {
        return enfileirarOperacao(armazenamento, lerDoacoes);
    }

    function salvarDoacao(doacao) {
        return enfileirarOperacao(armazenamento, async () => {
            const doacoes = await lerDoacoes();
            validarDoacoes([doacao]);

            if (doacoes.some((doacao_salva) => doacao_salva.id === doacao.id)) {
                throw new Error('Já existe uma doação com esse ID.');
            }

            return gravarDoacoes([...doacoes, doacao]);
        });
    }

    function atualizarDoacao(doacao) {
        return enfileirarOperacao(armazenamento, async () => {
            const doacoes = await lerDoacoes();
            validarDoacoes([doacao]);
            const indice = doacoes.findIndex((doacao_salva) => doacao_salva.id === doacao.id);

            if (indice === -1) {
                throw new Error('A doação não foi encontrada. Atualize o histórico e tente novamente.');
            }

            const doacao_original = doacoes[indice];
            doacoes[indice] = {
                ...doacao,
                id: doacao_original.id,
                criadoEm: doacao_original.criadoEm,
            };

            return gravarDoacoes(doacoes);
        });
    }

    function excluirDoacao(id) {
        return enfileirarOperacao(armazenamento, async () => {
            const doacoes = await lerDoacoes();

            if (!doacoes.some((doacao) => doacao.id === id)) {
                throw new Error('A doação não foi encontrada. Atualize o histórico e tente novamente.');
            }

            return gravarDoacoes(doacoes.filter((doacao) => doacao.id !== id));
        });
    }

    return { listarDoacoes, salvarDoacao, atualizarDoacao, excluirDoacao };
}

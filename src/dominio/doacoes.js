function limparTipo(texto) {
    return texto.trim().replace(/\s+/g, ' ');
}

/** Chave de comparação; o rótulo visual permanece como você digitou. */
export function normalizarTipo(texto) {
    return limparTipo(texto).toLocaleLowerCase('pt-BR');
}

/** Validação da borda do formulário; quantidade vem do TextInput como string. */
export function validarFormulario({ tipoItem: tipo_item, quantidade, pontoDestino: ponto_destino }) {
    const erros = {};

    if (typeof tipo_item !== 'string' || tipo_item.trim().length === 0) {
        erros.tipoItem = 'Informe o tipo de item que você quer doar.';
    }

    if (
        typeof quantidade !== 'string'
        || !/^\d+$/.test(quantidade)
        || !Number.isSafeInteger(Number(quantidade))
        || Number(quantidade) <= 0
    ) {
        erros.quantidade = 'Informe uma quantidade inteira maior que zero.';
    }

    if (typeof ponto_destino !== 'string' || ponto_destino.trim().length === 0) {
        erros.pontoDestino = 'Selecione um ponto de coleta válido.';
    }

    return erros;
}

export function filtrarDoacoes(doacoes, texto) {
    const busca = normalizarTipo(texto);

    if (busca.length === 0) {
        return doacoes;
    }

    return doacoes.filter((doacao) => normalizarTipo(doacao.tipoItem).includes(busca));
}

const MAIOR_INTEIRO_SEGURO = BigInt(Number.MAX_SAFE_INTEGER);

/** Mantém os valores cotidianos como Number sem arredondar totais maiores. */
function representarTotal(total) {
    return total <= MAIOR_INTEIRO_SEGURO ? Number(total) : total;
}

/** Totais são derivados; BigInt evita perder unidades em somas muito grandes. */
export function resumirDoacoes(doacoes) {
    const grupos = new Map();
    let total_unidades = 0n;

    for (const doacao of doacoes) {
        const chave_tipo = normalizarTipo(doacao.tipoItem);
        const quantidade = BigInt(doacao.quantidade);
        let grupo = grupos.get(chave_tipo);

        if (grupo == null) {
            grupo = {
                tipoItem: limparTipo(doacao.tipoItem),
                quantidade: 0n,
                totalDoacoes: 0,
            };
            grupos.set(chave_tipo, grupo);
        }

        grupo.quantidade += quantidade;
        grupo.totalDoacoes += 1;
        total_unidades += quantidade;
    }

    const tipos = Array.from(grupos.values(), (grupo) => {
        grupo.quantidade = representarTotal(grupo.quantidade);
        return grupo;
    }).sort((grupo_a, grupo_b) => {
        if (grupo_a.quantidade < grupo_b.quantidade) {
            return 1;
        }

        if (grupo_a.quantidade > grupo_b.quantidade) {
            return -1;
        }

        return grupo_a.tipoItem.localeCompare(grupo_b.tipoItem, 'pt-BR');
    });

    return {
        totalDoacoes: doacoes.length,
        totalUnidades: representarTotal(total_unidades),
        tipos,
    };
}

/** Ordena uma cópia; mantém o array de estado original intacto. */
export function ordenarDoacoes(doacoes) {
    return [...doacoes].sort(
        (doacao_a, doacao_b) => Date.parse(doacao_b.criadoEm) - Date.parse(doacao_a.criadoEm),
    );
}

/** Recebe valores já validados; o gerador de ID só é usado em novos cadastros. */
export function prepararDoacao(valores, doacao_original, gerar_id) {
    const esta_editando = doacao_original != null;

    return {
        id: esta_editando ? doacao_original.id : gerar_id(),
        tipoItem: limparTipo(valores.tipoItem),
        quantidade: Number(valores.quantidade),
        pontoDestino: valores.pontoDestino,
        criadoEm: esta_editando ? doacao_original.criadoEm : new Date().toISOString(),
    };
}

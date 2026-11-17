export const CHAVE_FAVORITOS = '@instituto_mao_amiga:favoritos';

function extrairIdsValidos(texto) {
  if (typeof texto !== 'string' || texto.trim().length === 0) {
    return [];
  }
  try {
    const dados = JSON.parse(texto);
    if (!Array.isArray(dados)) {
      return [];
    }
    const vistos = new Set();
    const ids = [];
    for (const item of dados) {
      if (typeof item === 'string' && item.trim().length > 0 && !vistos.has(item)) {
        vistos.add(item);
        ids.push(item);
      }
    }
    return ids;
  } catch {
    return [];
  }
}

export function criarRepositorioFavoritos(armazenamento) {
  async function listarIdsFavoritos() {
    const texto = await armazenamento.getItem(CHAVE_FAVORITOS);
    return extrairIdsValidos(texto);
  }

  async function salvarIdsFavoritos(ids) {
    const unicos = Array.from(
      new Set(ids.filter((id) => typeof id === 'string' && id.trim().length > 0)),
    );
    await armazenamento.setItem(CHAVE_FAVORITOS, JSON.stringify(unicos));
    return unicos;
  }

  async function alternarFavorito(id) {
    const atuais = await listarIdsFavoritos();
    const proximos = atuais.includes(id)
      ? atuais.filter((item) => item !== id)
      : [...atuais, id];
    return salvarIdsFavoritos(proximos);
  }

  async function removerFavorito(id) {
    const atuais = await listarIdsFavoritos();
    const proximos = atuais.filter((item) => item !== id);
    return salvarIdsFavoritos(proximos);
  }

  return {
    listarIdsFavoritos,
    salvarIdsFavoritos,
    alternarFavorito,
    removerFavorito,
  };
}

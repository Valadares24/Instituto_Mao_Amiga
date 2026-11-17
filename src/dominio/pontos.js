export const TIPOS_PONTO = ['coleta', 'distribuição'];

export function validarFormularioPonto({ nome, endereco, bairro, horario, tipo }) {
  const erros = {};

  if (typeof nome !== 'string' || nome.trim().length === 0) {
    erros.nome = 'Informe o nome do ponto.';
  }
  if (typeof endereco !== 'string' || endereco.trim().length === 0) {
    erros.endereco = 'Informe o endereço do ponto.';
  }
  if (typeof bairro !== 'string' || bairro.trim().length === 0) {
    erros.bairro = 'Informe o bairro do ponto.';
  }
  if (typeof horario !== 'string' || horario.trim().length === 0) {
    erros.horario = 'Informe o horário de funcionamento.';
  }
  if (typeof tipo !== 'string' || !TIPOS_PONTO.includes(tipo.trim())) {
    erros.tipo = 'Escolha o tipo "coleta" ou "distribuição".';
  }

  return erros;
}

export function normalizarDadosPonto({ nome, endereco, bairro, horario, tipo }) {
  return {
    nome: nome.trim(),
    endereco: endereco.trim(),
    bairro: bairro.trim(),
    horario: horario.trim(),
    tipo: tipo.trim(),
  };
}

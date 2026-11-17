import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Botao, CabecalhoSecao, MensagemEstado, Pagina, TextoErro } from '../componentes/Interface.js';
import { normalizarDadosPonto, validarFormularioPonto } from '../dominio/pontos.js';
import { buscarPorId, cadastrar, editar } from '../services/pontosService.ts';
import { CORES, ESTILOS } from '../tema.js';

const OPCOES_TIPO = [
  { valor: 'coleta', rotulo: 'Coleta', descricao: 'Recebe doações da comunidade' },
  { valor: 'distribuição', rotulo: 'Distribuição', descricao: 'Entrega doações às famílias' },
];

export default function TelaFormularioPonto({ navigation, route }) {
  const pontoId = route.params?.id;
  const ehEdicao = pontoId !== undefined;

  const [nome, definirNome] = useState(route.params?.ponto?.nome ?? '');
  const [endereco, definirEndereco] = useState(route.params?.ponto?.endereco ?? '');
  const [bairro, definirBairro] = useState(route.params?.ponto?.bairro ?? '');
  const [horario, definirHorario] = useState(route.params?.ponto?.horario ?? '');
  const [tipo, definirTipo] = useState(route.params?.ponto?.tipo ?? 'coleta');

  const [carregandoDados, definirCarregandoDados] = useState(ehEdicao && !route.params?.ponto);
  const [erroCarregamento, definirErroCarregamento] = useState('');
  const [erros, definirErros] = useState({});
  const [erroSalvamento, definirErroSalvamento] = useState('');
  const [estaSalvando, definirEstaSalvando] = useState(false);
  const [salvou, definirSalvou] = useState(false);

  const salvamentoEmAndamento = useRef(false);

  usePreventRemove(estaSalvando, () => {});

  useEffect(() => {
    navigation.setOptions({
      title: ehEdicao ? 'Editar ponto' : 'Novo ponto',
      gestureEnabled: !estaSalvando,
      headerBackVisible: false,
      headerLeft: () => (
        <Botao
          titulo="Voltar"
          variante="texto"
          aoPressionar={() => navigation.goBack()}
          desabilitado={estaSalvando}
          style={{ paddingHorizontal: 8 }}
        />
      ),
    });
  }, [navigation, ehEdicao, estaSalvando]);

  useEffect(() => {
    if (!ehEdicao) return undefined;
    let ativo = true;

    if (!route.params?.ponto) {
      definirCarregandoDados(true);
    }
    definirErroCarregamento('');

    buscarPorId(pontoId)
      .then((ponto) => {
        if (!ativo) return;
        definirNome(ponto.nome ?? '');
        definirEndereco(ponto.endereco ?? '');
        definirBairro(ponto.bairro ?? '');
        definirHorario(ponto.horario ?? '');
        definirTipo(ponto.tipo ?? 'coleta');
      })
      .catch((erro) => {
        if (!ativo) return;
        if (!route.params?.ponto) {
          definirErroCarregamento(
            erro instanceof Error && erro.message
              ? erro.message
              : 'Não foi possível carregar o ponto para edição.',
          );
        }
      })
      .finally(() => {
        if (ativo) definirCarregandoDados(false);
      });

    return () => {
      ativo = false;
    };
  }, [ehEdicao, pontoId, route.params?.ponto]);

  useEffect(() => {
    if (salvou && !estaSalvando) {
      navigation.goBack();
    }
  }, [salvou, estaSalvando, navigation]);

  async function salvarPonto() {
    if (salvamentoEmAndamento.current) return;

    const valores = { nome, endereco, bairro, horario, tipo };
    const errosValidacao = validarFormularioPonto(valores);
    definirErros(errosValidacao);
    definirErroSalvamento('');

    if (Object.keys(errosValidacao).length > 0) {
      return;
    }

    salvamentoEmAndamento.current = true;
    definirEstaSalvando(true);
    Keyboard.dismiss();

    try {
      const payload = normalizarDadosPonto(valores);
      if (ehEdicao) {
        await editar(pontoId, payload);
      } else {
        await cadastrar(payload);
      }
      definirSalvou(true);
    } catch (erro) {
      definirErroSalvamento(
        erro instanceof Error && erro.message
          ? erro.message
          : 'Não foi possível salvar o ponto. Verifique se a API está ligada.',
      );
    } finally {
      salvamentoEmAndamento.current = false;
      definirEstaSalvando(false);
    }
  }

  if (carregandoDados) {
    return (
      <Pagina>
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando dados do ponto" />
          <Text style={estilos.textoCarregando}>Carregando dados do ponto...</Text>
        </View>
      </Pagina>
    );
  }

  if (erroCarregamento.length > 0) {
    return (
      <Pagina>
        <MensagemEstado erro titulo="Não foi possível abrir a edição" descricao={erroCarregamento}>
          <Botao titulo="Voltar" aoPressionar={() => navigation.goBack()} />
        </MensagemEstado>
      </Pagina>
    );
  }

  return (
    <Pagina rolavel comTeclado>
      <CabecalhoSecao
        sobretitulo={ehEdicao ? 'ATUALIZAR PONTO' : 'NOVO PONTO NA REDE'}
        titulo={ehEdicao ? 'Editar ponto' : 'Cadastrar ponto'}
        descricao={
          ehEdicao
            ? 'Altere as informações do ponto e salve para atualizar na API.'
            : 'Preencha todos os campos para cadastrar um novo ponto de coleta ou distribuição.'
        }
      />
      <View style={[ESTILOS.cartao, estilos.formulario]}>
        <View style={estilos.campo}>
          <Text nativeID="rotulo-ponto-nome" style={ESTILOS.rotulo}>Nome</Text>
          <TextInput
            value={nome}
            onChangeText={definirNome}
            placeholder="Ex.: Ponto de Coleta Setor Bueno"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Nome do ponto"
            aria-labelledby="rotulo-ponto-nome"
            editable={!estaSalvando}
            style={[ESTILOS.entrada, erros.nome && estilos.entradaErro]}
            testID="campo-ponto-nome"
          />
          <TextoErro mensagem={erros.nome ?? ''} />
        </View>

        <View style={estilos.campo}>
          <Text nativeID="rotulo-ponto-endereco" style={ESTILOS.rotulo}>Endereço</Text>
          <TextInput
            value={endereco}
            onChangeText={definirEndereco}
            placeholder="Ex.: Rua T-30, nº 1200, Goiânia-GO"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Endereço do ponto"
            aria-labelledby="rotulo-ponto-endereco"
            editable={!estaSalvando}
            style={[ESTILOS.entrada, erros.endereco && estilos.entradaErro]}
            testID="campo-ponto-endereco"
          />
          <TextoErro mensagem={erros.endereco ?? ''} />
        </View>

        <View style={estilos.campo}>
          <Text nativeID="rotulo-ponto-bairro" style={ESTILOS.rotulo}>Bairro</Text>
          <TextInput
            value={bairro}
            onChangeText={definirBairro}
            placeholder="Ex.: Setor Bueno"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Bairro do ponto"
            aria-labelledby="rotulo-ponto-bairro"
            editable={!estaSalvando}
            style={[ESTILOS.entrada, erros.bairro && estilos.entradaErro]}
            testID="campo-ponto-bairro"
          />
          <TextoErro mensagem={erros.bairro ?? ''} />
        </View>

        <View style={estilos.campo}>
          <Text nativeID="rotulo-ponto-horario" style={ESTILOS.rotulo}>Horário</Text>
          <TextInput
            value={horario}
            onChangeText={definirHorario}
            placeholder="Ex.: Seg a Sex, 8h às 17h"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Horário de funcionamento"
            aria-labelledby="rotulo-ponto-horario"
            editable={!estaSalvando}
            style={[ESTILOS.entrada, erros.horario && estilos.entradaErro]}
            testID="campo-ponto-horario"
          />
          <TextoErro mensagem={erros.horario ?? ''} />
        </View>

        <View style={estilos.campo}>
          <Text style={ESTILOS.rotulo}>Tipo</Text>
          <View style={estilos.tipos} accessibilityRole="radiogroup" accessibilityLabel="Tipo do ponto">
            {OPCOES_TIPO.map((opcao) => {
              const selecionado = tipo === opcao.valor;
              return (
                <TouchableOpacity
                  key={opcao.valor}
                  onPress={() => definirTipo(opcao.valor)}
                  disabled={estaSalvando}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityLabel={opcao.rotulo}
                  accessibilityState={{ checked: selecionado, disabled: estaSalvando }}
                  testID={`tipo-ponto-${opcao.valor}`}
                  style={[estilos.opcaoTipo, selecionado && estilos.opcaoTipoSelecionada]}
                >
                  <Text style={[estilos.tituloTipo, selecionado && estilos.tituloTipoSelecionado]}>
                    {opcao.rotulo}
                  </Text>
                  <Text style={[estilos.descricaoTipo, selecionado && estilos.descricaoTipoSelecionada]}>
                    {opcao.descricao}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextoErro mensagem={erros.tipo ?? ''} />
        </View>
      </View>

      <TextoErro mensagem={erroSalvamento} />

      <View style={estilos.acoes}>
        <Botao
          titulo={ehEdicao ? 'Salvar alterações' : 'Cadastrar ponto'}
          aoPressionar={salvarPonto}
          carregando={estaSalvando}
          desabilitado={estaSalvando}
          style={estilos.botao}
          testID="salvar-ponto"
        />
        <Botao
          titulo="Cancelar"
          variante="secundario"
          aoPressionar={() => navigation.goBack()}
          desabilitado={estaSalvando}
          style={estilos.botao}
          testID="cancelar-ponto"
        />
      </View>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: 20 },
  campo: { gap: 8 },
  entradaErro: { borderColor: CORES.erro },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  opcaoTipo: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 68,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 14,
    padding: 14,
    backgroundColor: CORES.superficie,
    justifyContent: 'center',
    gap: 4,
  },
  opcaoTipoSelecionada: {
    backgroundColor: CORES.primaria,
    borderColor: CORES.primaria,
  },
  tituloTipo: { color: CORES.texto, fontSize: 16, fontWeight: '700' },
  tituloTipoSelecionado: { color: CORES.superficie },
  descricaoTipo: { color: CORES.secundario, fontSize: 13 },
  descricaoTipoSelecionada: { color: CORES.primariaSuave },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 190 },
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  textoCarregando: { color: CORES.secundario, fontSize: 15 },
});

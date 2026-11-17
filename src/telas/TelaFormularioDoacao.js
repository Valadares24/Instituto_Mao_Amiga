import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Botao, CabecalhoSecao, MensagemEstado, Pagina, TextoErro } from '../componentes/Interface.js';
import { validarFormulario } from '../dominio/doacoes.js';
import { ApiError } from '../services/api.ts';
import {
  buscarPorId as buscarDoacaoPorId,
  cadastrar as cadastrarDoacao,
  editar as editarDoacao,
} from '../services/doacoesService.ts';
import { listar as listarPontos } from '../services/pontosService.ts';
import { CORES, ESTILOS } from '../tema.js';

export default function TelaFormularioDoacao({ navigation, route }) {
  const doacaoId = route.params?.id;
  const ehEdicao = doacaoId !== undefined;

  const [tipoItem, definirTipoItem] = useState('');
  const [quantidade, definirQuantidade] = useState('');
  const [pontoDestino, definirPontoDestino] = useState(route.params?.pontoNome ?? '');
  const [pontos, definirPontos] = useState([]);
  const [carregandoPontos, definirCarregandoPontos] = useState(true);
  const [erroPontos, definirErroPontos] = useState('');
  const [carregandoDoacao, definirCarregandoDoacao] = useState(ehEdicao);
  const [naoEncontrada, definirNaoEncontrada] = useState(false);
  const [erroCarregamento, definirErroCarregamento] = useState('');
  const [erros, definirErros] = useState({});
  const [erroSalvamento, definirErroSalvamento] = useState('');
  const [estaSalvando, definirEstaSalvando] = useState(false);
  const [salvou, definirSalvou] = useState(false);

  const gravacaoEmAndamento = useRef(false);
  const referenciaQuantidade = useRef(null);

  usePreventRemove(estaSalvando, () => {});

  useEffect(() => {
    navigation.setOptions({
      title: ehEdicao ? 'Editar doação' : 'Nova doação',
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

  const carregarPontos = useCallback(async () => {
    definirCarregandoPontos(true);
    definirErroPontos('');
    try {
      const lista = await listarPontos();
      definirPontos(Array.isArray(lista) ? lista : []);
    } catch (erro) {
      definirErroPontos(
        erro instanceof Error && erro.message
          ? erro.message
          : 'Não foi possível carregar os pontos da API.',
      );
    } finally {
      definirCarregandoPontos(false);
    }
  }, []);

  useEffect(() => {
    carregarPontos();
  }, [carregarPontos]);

  useEffect(() => {
    if (!ehEdicao) return undefined;
    let ativo = true;

    definirCarregandoDoacao(true);
    definirNaoEncontrada(false);
    definirErroCarregamento('');

    buscarDoacaoPorId(doacaoId)
      .then((doacao) => {
        if (!ativo) return;
        definirTipoItem(doacao.tipoItem ?? '');
        definirQuantidade(String(doacao.quantidade ?? ''));
        definirPontoDestino(doacao.pontoDestino ?? '');
      })
      .catch((erro) => {
        if (!ativo) return;
        if (erro instanceof ApiError && erro.status === 404) {
          definirNaoEncontrada(true);
        } else {
          definirErroCarregamento(
            erro instanceof Error && erro.message
              ? erro.message
              : 'Não foi possível carregar os dados da doação.',
          );
        }
      })
      .finally(() => {
        if (ativo) definirCarregandoDoacao(false);
      });

    return () => {
      ativo = false;
    };
  }, [ehEdicao, doacaoId]);

  useEffect(() => {
    if (salvou && !estaSalvando) {
      if (ehEdicao) navigation.goBack();
      else navigation.replace('HistoricoDoacoes');
    }
  }, [salvou, estaSalvando, ehEdicao, navigation]);

  async function salvarDoacao() {
    if (gravacaoEmAndamento.current) return;

    const valores = { tipoItem, quantidade, pontoDestino };
    const errosFormulario = validarFormulario(valores);
    definirErros(errosFormulario);
    definirErroSalvamento('');

    if (Object.keys(errosFormulario).length > 0) return;

    gravacaoEmAndamento.current = true;
    definirEstaSalvando(true);
    Keyboard.dismiss();

    try {
      const payload = {
        tipoItem: tipoItem.trim().replace(/\s+/g, ' '),
        quantidade: Number(quantidade),
        pontoDestino: pontoDestino.trim(),
      };
      if (ehEdicao) {
        await editarDoacao(doacaoId, payload);
      } else {
        await cadastrarDoacao(payload);
      }
      definirSalvou(true);
    } catch (erro) {
      definirErroSalvamento(
        erro instanceof Error && erro.message
          ? erro.message
          : 'Não foi possível salvar a doação. Verifique se a API está ligada.',
      );
    } finally {
      gravacaoEmAndamento.current = false;
      definirEstaSalvando(false);
    }
  }

  if (carregandoDoacao) {
    return (
      <Pagina>
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando doação" />
          <Text style={estilos.ajuda}>Carregando dados da doação...</Text>
        </View>
      </Pagina>
    );
  }

  if (naoEncontrada) {
    return (
      <Pagina>
        <MensagemEstado
          titulo="Doação não encontrada"
          descricao="Este registro não está mais disponível para edição."
        >
          <Botao titulo="Ver histórico" aoPressionar={() => navigation.navigate('HistoricoDoacoes')} />
        </MensagemEstado>
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
        sobretitulo={ehEdicao ? 'ATUALIZAR REGISTRO' : 'UM GESTO QUE TRANSFORMA'}
        titulo={ehEdicao ? 'Editar doação' : 'Cadastre sua doação.'}
        descricao={
          ehEdicao
            ? 'Ajuste os dados abaixo. O ID e a data original do registro serão preservados.'
            : 'Preencha os três campos para registrar a ajuda na API e escolher seu ponto de destino.'
        }
      />
      <View style={[ESTILOS.cartao, estilos.formulario]}>
        <View style={estilos.campo}>
          <Text nativeID="rotulo-tipo-item" style={ESTILOS.rotulo}>Tipo do item</Text>
          <TextInput
            value={tipoItem}
            onChangeText={definirTipoItem}
            placeholder="Ex.: roupas, alimentos, material escolar"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Tipo do item"
            aria-labelledby="rotulo-tipo-item"
            editable={!estaSalvando}
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => referenciaQuantidade.current?.focus()}
            style={[ESTILOS.entrada, erros.tipoItem && estilos.entradaErro]}
            testID="campo-tipo-item"
          />
          <TextoErro mensagem={erros.tipoItem ?? ''} />
        </View>

        <View style={estilos.campo}>
          <Text nativeID="rotulo-quantidade" style={ESTILOS.rotulo}>Quantidade</Text>
          <TextInput
            ref={referenciaQuantidade}
            value={quantidade}
            onChangeText={definirQuantidade}
            placeholder="Ex.: 10"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Quantidade de unidades"
            aria-labelledby="rotulo-quantidade"
            editable={!estaSalvando}
            keyboardType="number-pad"
            inputMode="numeric"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            style={[ESTILOS.entrada, erros.quantidade && estilos.entradaErro]}
            testID="campo-quantidade"
          />
          <Text style={estilos.ajuda}>Informe um número inteiro maior que zero.</Text>
          <TextoErro mensagem={erros.quantidade ?? ''} />
        </View>

        <View style={estilos.campo}>
          <Text nativeID="rotulo-destino" style={ESTILOS.rotulo}>Ponto de destino</Text>
          <Text style={estilos.ajuda}>Selecione um ponto cadastrado na API para receber a doação.</Text>
          <View style={estilos.pontos} accessibilityRole="radiogroup" accessibilityLabel="Ponto de destino">
            {carregandoPontos ? (
              <View style={estilos.carregandoPontos}>
                <ActivityIndicator size="small" color={CORES.primaria} />
                <Text style={estilos.ajuda}>Carregando pontos da API...</Text>
              </View>
            ) : erroPontos.length > 0 ? (
              <View style={estilos.erroPontos}>
                <TextoErro mensagem={erroPontos} />
                <Botao titulo="Recarregar pontos" variante="secundario" aoPressionar={carregarPontos} />
              </View>
            ) : (
              pontos.map((ponto) => {
                const estaSelecionado = ponto.nome === pontoDestino;
                return (
                  <TouchableOpacity
                    key={ponto.id}
                    onPress={() => definirPontoDestino(ponto.nome)}
                    disabled={estaSalvando}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityLabel={ponto.nome}
                    accessibilityState={{ checked: estaSelecionado, disabled: estaSalvando }}
                    testID={`destino-${ponto.id}`}
                    style={[estilos.opcao, estaSelecionado && estilos.opcaoSelecionada]}
                  >
                    <View style={[estilos.radio, estaSelecionado && estilos.radioSelecionado]} aria-hidden>
                      {estaSelecionado && <View style={estilos.radioCentro} />}
                    </View>
                    <View style={estilos.textoPonto}>
                      <Text style={estilos.nomePonto}>{ponto.nome}</Text>
                      <Text style={estilos.enderecoPonto}>{ponto.bairro} · {ponto.endereco}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          <TextoErro mensagem={erros.pontoDestino ?? ''} />
        </View>
      </View>

      <TextoErro mensagem={erroSalvamento} />

      <View style={estilos.acoes}>
        <Botao
          titulo={ehEdicao ? 'Salvar alterações' : 'Salvar doação'}
          aoPressionar={salvarDoacao}
          carregando={estaSalvando}
          desabilitado={estaSalvando}
          style={estilos.botao}
          testID="salvar-doacao"
        />
        <Botao
          titulo="Cancelar"
          variante="secundario"
          aoPressionar={() => navigation.goBack()}
          desabilitado={estaSalvando}
          style={estilos.botao}
          testID="cancelar-cadastro"
        />
      </View>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: 22 },
  campo: { gap: 8 },
  entradaErro: { borderColor: CORES.erro },
  ajuda: { color: CORES.secundario, fontSize: 13, lineHeight: 20 },
  pontos: { gap: 10, marginTop: 4 },
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  carregandoPontos: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  erroPontos: { gap: 10 },
  opcao: {
    minWidth: 44,
    minHeight: 72,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: CORES.superficie,
  },
  opcaoSelecionada: { backgroundColor: CORES.primariaSuave, borderColor: CORES.primaria },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: CORES.secundario, alignItems: 'center', justifyContent: 'center' },
  radioSelecionado: { borderColor: CORES.primaria },
  radioCentro: { width: 10, height: 10, borderRadius: 5, backgroundColor: CORES.primaria },
  textoPonto: { flex: 1, gap: 3 },
  nomePonto: { color: CORES.texto, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  enderecoPonto: { color: CORES.secundario, fontSize: 13, lineHeight: 19 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 190 },
});

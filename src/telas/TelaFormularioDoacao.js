import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Botao, CabecalhoSecao, MensagemEstado, Pagina, TextoErro } from '../componentes/Interface.js';
import { listar as listarPontos } from '../services/pontosService.ts';
import { validarFormulario } from '../dominio/doacoes.js';
import { CORES, ESTILOS } from '../tema.js';

export default function TelaFormularioDoacao({ navigation, route, doacoes, aoSalvar, estaCarregando, erroCarregamento }) {
  const doacao_id = route.params?.doacaoId;
  const eh_edicao = doacao_id !== undefined;
  const doacao_original = eh_edicao ? doacoes.find((doacao) => doacao.id === doacao_id) : undefined;
  const [tipo_item, definirTipoItem] = useState(doacao_original?.tipoItem ?? '');
  const [quantidade, definirQuantidade] = useState(doacao_original !== undefined ? String(doacao_original.quantidade) : '');
  const [ponto_destino, definirPontoDestino] = useState(doacao_original?.pontoDestino ?? route.params?.pontoNome ?? '');
  const [pontos, definirPontos] = useState([]);
  const [carregando_pontos, definirCarregandoPontos] = useState(true);
  const [erro_pontos, definirErroPontos] = useState('');
  const [erros, definirErros] = useState({});
  const [erro_salvamento, definirErroSalvamento] = useState('');
  const [esta_salvando, definirEstaSalvando] = useState(false);
  const [salvou, definirSalvou] = useState(false);
  const formulario_inicializado = useRef(!eh_edicao || doacao_original !== undefined);
  const gravacao_em_andamento = useRef(false);
  const referencia_quantidade = useRef(null);

  useEffect(() => {
    let ativo = true;
    definirCarregandoPontos(true);
    definirErroPontos('');
    listarPontos()
      .then((lista) => {
        if (ativo) definirPontos(Array.isArray(lista) ? lista : []);
      })
      .catch((erro) => {
        if (ativo) definirErroPontos(erro instanceof Error ? erro.message : 'Não foi possível carregar os pontos da API.');
      })
      .finally(() => {
        if (ativo) definirCarregandoPontos(false);
      });
    return () => { ativo = false; };
  }, []);

  usePreventRemove(esta_salvando, () => {});

  useEffect(() => {
    navigation.setOptions({
      title: eh_edicao ? 'Editar doação' : 'Nova doação',
      gestureEnabled: !esta_salvando,
      headerBackVisible: false,
      headerLeft: () => <Botao titulo="Voltar" variante="texto" aoPressionar={() => navigation.goBack()} desabilitado={esta_salvando} style={{ paddingHorizontal: 8 }} />,
    });
  }, [navigation, eh_edicao, esta_salvando]);

  useEffect(() => {
    if (!formulario_inicializado.current && doacao_original !== undefined) {
      definirTipoItem(doacao_original.tipoItem);
      definirQuantidade(String(doacao_original.quantidade));
      definirPontoDestino(doacao_original.pontoDestino);
      formulario_inicializado.current = true;
    }
  }, [doacao_original]);

  useEffect(() => {
    if (salvou && !esta_salvando) {
      if (eh_edicao) navigation.goBack();
      else navigation.replace('HistoricoDoacoes');
    }
  }, [salvou, esta_salvando, eh_edicao, navigation]);

  async function salvarDoacao() {
    if (gravacao_em_andamento.current) return;
    const valores = { tipoItem: tipo_item, quantidade, pontoDestino: ponto_destino };
    const erros_formulario = validarFormulario(valores);
    definirErros(erros_formulario);
    definirErroSalvamento('');
    if (Object.keys(erros_formulario).length > 0) return;

    gravacao_em_andamento.current = true;
    definirEstaSalvando(true);
    Keyboard.dismiss();
    try {
      await aoSalvar(valores, doacao_original);
      definirSalvou(true);
    } catch (erro) {
      definirErroSalvamento(erro instanceof Error ? erro.message : 'Não foi possível salvar a doação. Tente novamente.');
    } finally {
      gravacao_em_andamento.current = false;
      definirEstaSalvando(false);
    }
  }

  if (estaCarregando) {
    return <Pagina><MensagemEstado titulo="Preparando seu cadastro" descricao="Aguarde enquanto recuperamos suas doações." /></Pagina>;
  }

  if (erroCarregamento.length > 0) {
    return <Pagina><MensagemEstado erro titulo="Não foi possível abrir o cadastro" descricao={erroCarregamento}>
      <Botao titulo="Voltar ao histórico" aoPressionar={() => navigation.navigate('HistoricoDoacoes')} />
    </MensagemEstado></Pagina>;
  }

  if (eh_edicao && doacao_original === undefined) {
    return <Pagina><MensagemEstado titulo="Doação não encontrada" descricao="Este registro não está mais disponível. Consulte seu histórico para continuar.">
      <Botao titulo="Ver histórico" aoPressionar={() => navigation.navigate('HistoricoDoacoes')} />
    </MensagemEstado></Pagina>;
  }

  return (
    <Pagina rolavel comTeclado>
      <CabecalhoSecao
        sobretitulo={eh_edicao ? 'ATUALIZAR REGISTRO' : 'UM GESTO QUE TRANSFORMA'}
        titulo={eh_edicao ? 'Editar doação' : 'Cadastre sua doação.'}
        descricao={eh_edicao ? 'Ajuste os dados abaixo. A data original do registro será preservada.' : 'Preencha os três campos para registrar a ajuda e escolher seu destino.'}
      />
      <View style={[ESTILOS.cartao, estilos.formulario]}>
        <View style={estilos.campo}>
          <Text nativeID="rotulo-tipo-item" style={ESTILOS.rotulo}>Tipo do item</Text>
          <TextInput
            value={tipo_item} onChangeText={definirTipoItem}
            placeholder="Ex.: roupas, alimentos, material escolar"
            placeholderTextColor={CORES.secundario}
            accessibilityLabel="Tipo do item" aria-labelledby="rotulo-tipo-item"
            aria-invalid={erros.tipoItem !== undefined}
            editable={!esta_salvando} autoCapitalize="sentences" returnKeyType="next"
            onSubmitEditing={() => referencia_quantidade.current.focus()}
            style={[ESTILOS.entrada, erros.tipoItem !== undefined && estilos.entradaErro]}
            testID="campo-tipo-item"
          />
          <TextoErro mensagem={erros.tipoItem ?? ''} />
        </View>
        <View style={estilos.campo}>
          <Text nativeID="rotulo-quantidade" style={ESTILOS.rotulo}>Quantidade</Text>
          <TextInput
            ref={referencia_quantidade} value={quantidade} onChangeText={definirQuantidade}
            placeholder="Ex.: 10" placeholderTextColor={CORES.secundario}
            accessibilityLabel="Quantidade de unidades" aria-labelledby="rotulo-quantidade"
            aria-invalid={erros.quantidade !== undefined}
            editable={!esta_salvando} keyboardType="number-pad" inputMode="numeric" returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            style={[ESTILOS.entrada, erros.quantidade !== undefined && estilos.entradaErro]}
            testID="campo-quantidade"
          />
          <Text style={estilos.ajuda}>Informe um número inteiro maior que zero.</Text>
          <TextoErro mensagem={erros.quantidade ?? ''} />
        </View>
        <View style={estilos.campo}>
          <Text nativeID="rotulo-destino" style={ESTILOS.rotulo}>Ponto de destino</Text>
          <Text style={estilos.ajuda}>Selecione onde sua doação será recebida.</Text>
          <View style={estilos.pontos} role="radiogroup" aria-label="Ponto de destino" accessibilityLabel="Ponto de destino">
            {carregando_pontos ? (
              <View style={estilos.carregandoPontos}>
                <ActivityIndicator size="small" color={CORES.primaria} />
                <Text style={estilos.ajuda}>Carregando pontos da API...</Text>
              </View>
            ) : erro_pontos.length > 0 ? (
              <TextoErro mensagem={erro_pontos} />
            ) : (
              pontos.map((ponto) => {
                const esta_selecionado = ponto.nome === ponto_destino;
                return (
                  <TouchableOpacity
                    key={ponto.id}
                    onPress={() => definirPontoDestino(ponto.nome)}
                    disabled={esta_salvando}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityLabel={ponto.nome}
                    accessibilityState={{ checked: esta_selecionado, disabled: esta_salvando }}
                    testID={'destino-' + ponto.id}
                    style={[estilos.opcao, esta_selecionado && estilos.opcaoSelecionada]}
                  >
                    <View style={[estilos.radio, esta_selecionado && estilos.radioSelecionado]} aria-hidden>
                      {esta_selecionado && <View style={estilos.radioCentro} />}
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
      <TextoErro mensagem={erro_salvamento} />
      <View style={estilos.acoes}>
        <Botao titulo={eh_edicao ? 'Salvar alterações' : 'Salvar doação'} aoPressionar={salvarDoacao} carregando={esta_salvando} desabilitado={esta_salvando} style={estilos.botao} testID="salvar-doacao" />
        <Botao titulo="Cancelar" variante="secundario" aoPressionar={() => navigation.goBack()} desabilitado={esta_salvando} style={estilos.botao} testID="cancelar-cadastro" />
      </View>
      <Text style={estilos.nota}>Seus registros ficam salvos neste dispositivo.</Text>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  formulario: { marginTop: 24, gap: 26 },
  campo: { gap: 8 },
  entradaErro: { borderColor: CORES.erro },
  ajuda: { color: CORES.secundario, fontSize: 13, lineHeight: 20 },
  pontos: { gap: 10, marginTop: 4 },
  carregandoPontos: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  opcao: { minWidth: 44, minHeight: 76, borderWidth: 1, borderColor: CORES.borda, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  opcaoSelecionada: { backgroundColor: CORES.primariaSuave, borderColor: CORES.primaria },
  opcaoPressionada: { opacity: 0.8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: CORES.secundario, alignItems: 'center', justifyContent: 'center' },
  radioSelecionado: { borderColor: CORES.primaria },
  radioCentro: { width: 10, height: 10, borderRadius: 5, backgroundColor: CORES.primaria },
  textoPonto: { flex: 1, gap: 3 },
  nomePonto: { color: CORES.texto, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  enderecoPonto: { color: CORES.secundario, fontSize: 13, lineHeight: 20 },
  acoes: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 190 },
  nota: { color: CORES.secundario, fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 18 },
});

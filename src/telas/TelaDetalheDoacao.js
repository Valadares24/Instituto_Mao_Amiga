import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Botao, CabecalhoSecao, CampoInformacao, Etiqueta, MensagemEstado, Pagina, TextoErro } from '../componentes/Interface.js';
import { CORES, ESTILOS } from '../tema.js';

const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function ConfirmacaoExclusao({ visivel, estaExcluindo, mensagemErro, aoCancelar, aoConfirmar }) {
  const referencia_cancelar = useRef(null);
  const referencia_excluir = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visivel) return undefined;
    const elemento_anterior = document.activeElement;
    const temporizador = setTimeout(() => referencia_cancelar.current?.focus(), 0);

    function tratarTecla(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        if (!estaExcluindo) aoCancelar();
      }
      if (evento.key === 'Tab') {
        evento.preventDefault();
        if (estaExcluindo) return;
        if (document.activeElement === referencia_cancelar.current) referencia_excluir.current.focus();
        else referencia_cancelar.current.focus();
      }
    }

    document.addEventListener('keydown', tratarTecla);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener('keydown', tratarTecla);
      if (elemento_anterior instanceof HTMLElement) elemento_anterior.focus();
    };
  }, [visivel, estaExcluindo, aoCancelar]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <View style={estilos.fundoModal}>
        <View style={estilos.modal} role="alertdialog" aria-modal="true" aria-labelledby="titulo-confirmacao" aria-describedby="descricao-confirmacao" accessibilityViewIsModal>
          <Text nativeID="titulo-confirmacao" accessibilityRole="header" style={estilos.tituloModal}>Excluir esta doação?</Text>
          <Text nativeID="descricao-confirmacao" style={estilos.descricaoModal}>O registro será removido deste dispositivo. Esta ação não pode ser desfeita.</Text>
          <TextoErro mensagem={mensagemErro} />
          <View style={estilos.acoesModal}>
            <Pressable
              ref={referencia_cancelar} onPress={aoCancelar} disabled={estaExcluindo}
              accessibilityRole="button" accessibilityState={{ disabled: estaExcluindo }}
              style={({ pressed }) => [estilos.botaoModal, estilos.cancelarModal, pressed && estilos.pressionado, estaExcluindo && estilos.desabilitado]}
              testID="cancelar-exclusao"
            ><Text style={estilos.textoCancelar}>Cancelar</Text></Pressable>
            <Pressable
              ref={referencia_excluir} onPress={aoConfirmar} disabled={estaExcluindo}
              accessibilityRole="button" accessibilityState={{ disabled: estaExcluindo, busy: estaExcluindo }}
              style={({ pressed }) => [estilos.botaoModal, estilos.excluirModal, pressed && estilos.pressionado, estaExcluindo && estilos.desabilitado]}
              testID="confirmar-exclusao"
            ><Text style={estilos.textoExcluir}>{estaExcluindo ? 'Excluindo…' : 'Excluir'}</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TelaDetalheDoacao({ navigation, route, doacoes, aoExcluir }) {
  const doacao_id = route.params.doacao.id;
  const doacao = doacoes.find((registro) => registro.id === doacao_id);
  const [esta_excluindo, definirEstaExcluindo] = useState(false);
  const [esta_confirmacao_ativa, definirEstaConfirmacaoAtiva] = useState(false);
  const [erro_exclusao, definirErroExclusao] = useState('');
  const [excluiu, definirExcluiu] = useState(false);
  const exclusao_em_andamento = useRef(false);
  const confirmacao_em_andamento = useRef(false);

  usePreventRemove(esta_excluindo, () => {});

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !esta_excluindo,
      headerBackVisible: false,
      headerLeft: () => <Botao titulo="Voltar" variante="texto" aoPressionar={() => navigation.goBack()} desabilitado={esta_excluindo} style={{ paddingHorizontal: 8 }} />,
    });
  }, [navigation, esta_excluindo]);

  useEffect(() => {
    if (excluiu && !esta_excluindo) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace('HistoricoDoacoes');
    }
  }, [excluiu, esta_excluindo, navigation]);

  const cancelarExclusao = useCallback(() => {
    if (exclusao_em_andamento.current) return;
    confirmacao_em_andamento.current = false;
    definirEstaConfirmacaoAtiva(false);
  }, []);

  async function excluirDoacao() {
    if (exclusao_em_andamento.current) return;
    exclusao_em_andamento.current = true;
    definirEstaExcluindo(true);
    definirErroExclusao('');
    try {
      await aoExcluir(doacao_id);
      definirEstaConfirmacaoAtiva(false);
      confirmacao_em_andamento.current = false;
      definirExcluiu(true);
    } catch (erro) {
      definirErroExclusao(erro instanceof Error ? erro.message : 'Não foi possível excluir a doação. Tente novamente.');
      if (Platform.OS !== 'web') {
        confirmacao_em_andamento.current = false;
        definirEstaConfirmacaoAtiva(false);
      }
    } finally {
      exclusao_em_andamento.current = false;
      definirEstaExcluindo(false);
    }
  }

  function confirmarExclusao() {
    if (exclusao_em_andamento.current || confirmacao_em_andamento.current) return;
    confirmacao_em_andamento.current = true;
    definirEstaConfirmacaoAtiva(true);
    definirErroExclusao('');
    if (Platform.OS !== 'web') {
      Alert.alert('Excluir esta doação?', 'O registro será removido deste dispositivo. Esta ação não pode ser desfeita.', [
        { text: 'Cancelar', style: 'cancel', onPress: cancelarExclusao },
        { text: 'Excluir', style: 'destructive', onPress: excluirDoacao },
      ], { cancelable: true, onDismiss: cancelarExclusao });
    }
  }

  if (doacao === undefined) {
    return <Pagina><MensagemEstado titulo={excluiu ? 'Doação excluída' : 'Doação não encontrada'} descricao={excluiu ? 'O histórico está sendo atualizado.' : 'Este registro não está mais disponível. Consulte seu histórico para continuar.'}>
      {!excluiu && <Botao titulo="Ver histórico" aoPressionar={() => navigation.navigate('HistoricoDoacoes')} />}
    </MensagemEstado></Pagina>;
  }

  return (
    <Pagina rolavel>
      <CabecalhoSecao sobretitulo="REGISTRO DE DOAÇÃO" titulo={doacao.tipoItem} descricao="Confira os dados e mantenha seu histórico atualizado." />
      <View style={[ESTILOS.cartao, estilos.cartao]}>
        <View style={estilos.quantidade}>
          <Text style={estilos.numero}>{doacao.quantidade.toLocaleString('pt-BR')}</Text>
          <Text style={estilos.unidades}>{doacao.quantidade === 1 ? 'unidade doada' : 'unidades doadas'}</Text>
        </View>
        <Etiqueta texto="Doação registrada" />
        <CampoInformacao rotulo="ID do registro" valor={doacao.id} />
        <CampoInformacao rotulo="Tipo do item" valor={doacao.tipoItem} />
        <CampoInformacao rotulo="Ponto de destino" valor={doacao.pontoDestino} />
        <CampoInformacao rotulo="Data do registro" valor={FORMATO_DATA_HORA.format(new Date(doacao.criadoEm))} />
      </View>
      <TextoErro mensagem={erro_exclusao} />
      <View style={estilos.acoes}>
        <Botao titulo="Editar doação" aoPressionar={() => navigation.navigate('FormularioDoacao', { doacaoId: doacao.id })} desabilitado={esta_excluindo || esta_confirmacao_ativa} style={estilos.botao} testID="editar-doacao" />
        <Botao titulo="Excluir doação" variante="perigo" aoPressionar={confirmarExclusao} desabilitado={esta_excluindo || esta_confirmacao_ativa} carregando={esta_excluindo} style={estilos.botao} testID="excluir-doacao" />
      </View>
      <Text style={estilos.nota}>Ao editar, a data original do cadastro continua a mesma.</Text>
      {Platform.OS === 'web' && <ConfirmacaoExclusao visivel={esta_confirmacao_ativa} estaExcluindo={esta_excluindo} mensagemErro={erro_exclusao} aoCancelar={cancelarExclusao} aoConfirmar={excluirDoacao} />}
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: 24, marginTop: 24 },
  quantidade: { paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: CORES.borda, gap: 3 },
  numero: { color: CORES.primaria, fontSize: 48, fontWeight: '800', flexShrink: 1, maxWidth: '100%' },
  unidades: { color: CORES.secundario, fontSize: 15 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 },
  botao: { flexGrow: 1, flexBasis: 190 },
  nota: { color: CORES.secundario, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 18 },
  fundoModal: { flex: 1, backgroundColor: 'rgba(43, 45, 66, 0.52)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 440, backgroundColor: CORES.superficie, borderRadius: 22, padding: 26, gap: 16 },
  tituloModal: { color: CORES.texto, fontSize: 23, lineHeight: 30, fontWeight: '700' },
  descricaoModal: { color: CORES.secundario, fontSize: 15, lineHeight: 23 },
  acoesModal: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  botaoModal: { flexGrow: 1, flexBasis: 130, minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12 },
  cancelarModal: { backgroundColor: CORES.superficie, borderWidth: 1, borderColor: CORES.borda },
  excluirModal: { backgroundColor: CORES.erro },
  textoCancelar: { color: CORES.texto, fontSize: 15, fontWeight: '700' },
  textoExcluir: { color: CORES.superficie, fontSize: 15, fontWeight: '700' },
  pressionado: { opacity: 0.8 },
  desabilitado: { opacity: 0.55 },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { Botao, CabecalhoSecao, CampoInformacao, Etiqueta, MensagemEstado, Pagina, TextoErro } from '../componentes/Interface.js';
import { ApiError } from '../services/api.ts';
import { buscarPorId, excluir } from '../services/doacoesService.ts';
import { CORES, ESTILOS } from '../tema.js';

const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function formatarDataHora(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? String(valor ?? '') : FORMATO_DATA_HORA.format(data);
}

function ConfirmacaoExclusaoDoacao({ visivel, estaExcluindo, mensagemErro, aoCancelar, aoConfirmar }) {
  const refCancelar = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visivel) return undefined;
    const temporizador = setTimeout(() => refCancelar.current?.focus(), 0);
    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !estaExcluindo) {
        evento.preventDefault();
        aoCancelar();
      }
    }
    document.addEventListener('keydown', tratarTecla);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener('keydown', tratarTecla);
    };
  }, [visivel, estaExcluindo, aoCancelar]);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <View style={estilos.fundoModal}>
        <View style={estilos.modal} role="alertdialog" aria-modal="true" accessibilityViewIsModal>
          <Text accessibilityRole="header" style={estilos.tituloModal}>Excluir esta doação?</Text>
          <Text style={estilos.descricaoModal}>O registro será removido da API. Esta ação não pode ser desfeita.</Text>
          <TextoErro mensagem={mensagemErro} />
          <View style={estilos.acoesModal}>
            <Pressable
              ref={refCancelar}
              onPress={aoCancelar}
              disabled={estaExcluindo}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.botaoModal, estilos.cancelarModal, pressed && estilos.pressionado, estaExcluindo && estilos.desabilitado]}
              testID="cancelar-exclusao-doacao"
            >
              <Text style={estilos.textoCancelar}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={aoConfirmar}
              disabled={estaExcluindo}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.botaoModal, estilos.excluirModal, pressed && estilos.pressionado, estaExcluindo && estilos.desabilitado]}
              testID="confirmar-exclusao-doacao"
            >
              <Text style={estilos.textoExcluir}>{estaExcluindo ? 'Excluindo...' : 'Excluir'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TelaDetalheDoacao({ navigation, route }) {
  const id = route.params?.id;
  const [doacao, definirDoacao] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [naoEncontrada, definirNaoEncontrada] = useState(false);
  const [erro, definirErro] = useState('');
  const [estaExcluindo, definirEstaExcluindo] = useState(false);
  const [confirmacaoVisivel, definirConfirmacaoVisivel] = useState(false);
  const [erroExclusao, definirErroExclusao] = useState('');
  const [excluiu, definirExcluiu] = useState(false);

  const exclusaoEmAndamento = useRef(false);

  usePreventRemove(estaExcluindo, () => {});

  const carregarDoacao = useCallback(async () => {
    if (!id) {
      definirNaoEncontrada(true);
      definirCarregando(false);
      return;
    }

    definirCarregando(true);
    definirNaoEncontrada(false);
    definirErro('');

    try {
      const dados = await buscarPorId(id);
      definirDoacao(dados);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        definirNaoEncontrada(true);
        definirDoacao(null);
      } else {
        definirErro(
          e instanceof Error && e.message
            ? e.message
            : 'Não foi possível carregar os dados da doação. Verifique se a API está ligada.',
        );
      }
    } finally {
      definirCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!excluiu) {
        carregarDoacao();
      }
    }, [carregarDoacao, excluiu]),
  );

  useEffect(() => {
    if (excluiu && !estaExcluindo) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace('HistoricoDoacoes');
    }
  }, [excluiu, estaExcluindo, navigation]);

  const cancelarExclusao = useCallback(() => {
    if (exclusaoEmAndamento.current) return;
    definirConfirmacaoVisivel(false);
  }, []);

  async function executarExclusao() {
    if (exclusaoEmAndamento.current || !id) return;
    exclusaoEmAndamento.current = true;
    definirEstaExcluindo(true);
    definirErroExclusao('');

    try {
      await excluir(id);
      definirConfirmacaoVisivel(false);
      definirExcluiu(true);
    } catch (e) {
      definirErroExclusao(
        e instanceof Error && e.message
          ? e.message
          : 'Não foi possível excluir a doação. Verifique se a API está ligada.',
      );
      if (Platform.OS !== 'web') {
        definirConfirmacaoVisivel(false);
      }
    } finally {
      exclusaoEmAndamento.current = false;
      definirEstaExcluindo(false);
    }
  }

  function solicitarExclusao() {
    if (exclusaoEmAndamento.current) return;
    definirErroExclusao('');
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Excluir esta doação?',
        'O registro será removido da API. Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: cancelarExclusao },
          { text: 'Excluir', style: 'destructive', onPress: executarExclusao },
        ],
        { cancelable: true, onDismiss: cancelarExclusao },
      );
    } else {
      definirConfirmacaoVisivel(true);
    }
  }

  if (carregando) {
    return (
      <Pagina>
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando doação" />
          <Text style={estilos.textoCarregando}>Carregando detalhes da doação...</Text>
        </View>
      </Pagina>
    );
  }

  if (naoEncontrada || doacao === null) {
    if (erro.length > 0) {
      return (
        <Pagina>
          <MensagemEstado erro titulo="Não foi possível carregar a doação" descricao={erro}>
            <Botao titulo="Tentar novamente" aoPressionar={carregarDoacao} testID="tentar-novamente-detalhe-doacao" />
          </MensagemEstado>
        </Pagina>
      );
    }
    return (
      <Pagina>
        <MensagemEstado
          titulo={excluiu ? 'Doação excluída' : 'Doação não encontrada'}
          descricao={
            excluiu
              ? 'Voltando ao histórico...'
              : 'Este registro não está mais disponível. Consulte o histórico para continuar.'
          }
        >
          {!excluiu && (
            <Botao titulo="Ver histórico" aoPressionar={() => navigation.navigate('HistoricoDoacoes')} />
          )}
        </MensagemEstado>
      </Pagina>
    );
  }

  return (
    <Pagina rolavel>
      <CabecalhoSecao
        sobretitulo="REGISTRO DE DOAÇÃO"
        titulo={doacao.tipoItem}
        descricao="Confira os dados registrados na API e mantenha seu histórico atualizado."
      />
      <View style={[ESTILOS.cartao, estilos.cartao]}>
        <View style={estilos.quantidade}>
          <Text style={estilos.numero}>{Number(doacao.quantidade).toLocaleString('pt-BR')}</Text>
          <Text style={estilos.unidades}>{doacao.quantidade === 1 ? 'unidade doada' : 'unidades doadas'}</Text>
        </View>
        <Etiqueta texto="Doação registrada" />
        <CampoInformacao rotulo="ID do registro" valor={doacao.id} />
        <CampoInformacao rotulo="Tipo do item" valor={doacao.tipoItem} />
        <CampoInformacao rotulo="Ponto de destino" valor={doacao.pontoDestino} />
        <CampoInformacao rotulo="Data do registro" valor={formatarDataHora(doacao.criadoEm)} />
      </View>

      <TextoErro mensagem={erroExclusao} />

      <View style={estilos.acoes}>
        <Botao
          titulo="Editar doação"
          aoPressionar={() => navigation.navigate('FormularioDoacao', { id: doacao.id })}
          desabilitado={estaExcluindo}
          style={estilos.botao}
          testID="editar-doacao"
        />
        <Botao
          titulo="Excluir doação"
          variante="perigo"
          aoPressionar={solicitarExclusao}
          carregando={estaExcluindo}
          desabilitado={estaExcluindo}
          style={estilos.botao}
          testID="excluir-doacao"
        />
      </View>
      <Text style={estilos.nota}>Ao editar, o ID e a data original do cadastro continuam os mesmos.</Text>

      {Platform.OS === 'web' && (
        <ConfirmacaoExclusaoDoacao
          visivel={confirmacaoVisivel}
          estaExcluindo={estaExcluindo}
          mensagemErro={erroExclusao}
          aoCancelar={cancelarExclusao}
          aoConfirmar={executarExclusao}
        />
      )}
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: 22 },
  quantidade: { paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: CORES.borda, gap: 3 },
  numero: { color: CORES.primaria, fontSize: 44, fontWeight: '800', flexShrink: 1, maxWidth: '100%' },
  unidades: { color: CORES.secundario, fontSize: 15 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 190 },
  nota: { color: CORES.secundario, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  textoCarregando: { color: CORES.secundario, fontSize: 15 },
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

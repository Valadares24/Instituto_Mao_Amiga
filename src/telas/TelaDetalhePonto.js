import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { Botao, CabecalhoSecao, CampoInformacao, Etiqueta, MensagemEstado, Pagina, TextoErro } from '../componentes/Interface.js';
import { ApiError } from '../services/api.ts';
import { buscarPorId, excluir } from '../services/pontosService.ts';
import { CORES, ESTILOS } from '../tema.js';

function ConfirmacaoExclusaoPonto({ visivel, estaExcluindo, mensagemErro, aoCancelar, aoConfirmar }) {
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
          <Text accessibilityRole="header" style={estilos.tituloModal}>Excluir este ponto?</Text>
          <Text style={estilos.descricaoModal}>O ponto será removido da API. Esta ação não pode ser desfeita.</Text>
          <TextoErro mensagem={mensagemErro} />
          <View style={estilos.acoesModal}>
            <Pressable
              ref={refCancelar}
              onPress={aoCancelar}
              disabled={estaExcluindo}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.botaoModal, estilos.cancelarModal, pressed && estilos.pressionado, estaExcluindo && estilos.desabilitado]}
              testID="cancelar-exclusao-ponto"
            >
              <Text style={estilos.textoCancelar}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={aoConfirmar}
              disabled={estaExcluindo}
              accessibilityRole="button"
              style={({ pressed }) => [estilos.botaoModal, estilos.excluirModal, pressed && estilos.pressionado, estaExcluindo && estilos.desabilitado]}
              testID="confirmar-exclusao-ponto"
            >
              <Text style={estilos.textoExcluir}>{estaExcluindo ? 'Excluindo...' : 'Excluir'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TelaDetalhePonto({ navigation, route }) {
  const id = route.params?.id;
  const [ponto, definirPonto] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [naoEncontrado, definirNaoEncontrado] = useState(false);
  const [erro, definirErro] = useState('');
  const [estaExcluindo, definirEstaExcluindo] = useState(false);
  const [confirmacaoVisivel, definirConfirmacaoVisivel] = useState(false);
  const [erroExclusao, definirErroExclusao] = useState('');
  const [excluiu, definirExcluiu] = useState(false);

  const exclusaoEmAndamento = useRef(false);

  usePreventRemove(estaExcluindo, () => {});

  const carregarPonto = useCallback(async () => {
    if (!id) {
      definirNaoEncontrado(true);
      definirCarregando(false);
      return;
    }

    definirCarregando(true);
    definirNaoEncontrado(false);
    definirErro('');

    try {
      const dados = await buscarPorId(id);
      definirPonto(dados);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        definirNaoEncontrado(true);
        definirPonto(null);
      } else {
        definirErro(
          e instanceof Error && e.message
            ? e.message
            : 'Não foi possível carregar os dados do ponto. Verifique se a API está ligada.',
        );
      }
    } finally {
      definirCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!excluiu) {
        carregarPonto();
      }
    }, [carregarPonto, excluiu]),
  );

  useEffect(() => {
    if (excluiu && !estaExcluindo) {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace('PontosColeta');
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
          : 'Não foi possível excluir o ponto. Verifique se a API está ligada.',
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
        'Excluir este ponto?',
        'O ponto será removido da API. Esta ação não pode ser desfeita.',
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
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando ponto" />
          <Text style={estilos.textoCarregando}>Carregando detalhes do ponto...</Text>
        </View>
      </Pagina>
    );
  }

  if (naoEncontrado || ponto === null) {
    if (erro.length > 0) {
      return (
        <Pagina>
          <MensagemEstado erro titulo="Não foi possível carregar o ponto" descricao={erro}>
            <Botao titulo="Tentar novamente" aoPressionar={carregarPonto} testID="tentar-novamente-detalhe-ponto" />
          </MensagemEstado>
        </Pagina>
      );
    }
    return (
      <Pagina>
        <MensagemEstado
          titulo={excluiu ? 'Ponto excluído' : 'Ponto não encontrado'}
          descricao={
            excluiu
              ? 'Voltando à lista de pontos...'
              : 'Este ponto não existe ou foi removido. Volte à lista para escolher outro ponto disponível.'
          }
        >
          {!excluiu && (
            <Botao titulo="Ver pontos de coleta" aoPressionar={() => navigation.navigate('PontosColeta')} />
          )}
        </MensagemEstado>
      </Pagina>
    );
  }

  return (
    <Pagina rolavel>
      <CabecalhoSecao
        sobretitulo={ponto.tipo === 'distribuição' ? 'PONTO DE DISTRIBUIÇÃO' : 'PONTO DE COLETA'}
        titulo={ponto.nome}
        descricao="Um lugar para transformar sua doação em cuidado."
      />
      <View style={[ESTILOS.cartao, estilos.cartao]}>
        <Etiqueta texto={ponto.tipo === 'distribuição' ? 'Distribuição' : 'Coleta'} />
        <CampoInformacao rotulo="Bairro" valor={ponto.bairro} />
        <CampoInformacao rotulo="Endereço" valor={ponto.endereco} />
        <CampoInformacao rotulo="Horário de funcionamento" valor={ponto.horario} />
        <CampoInformacao rotulo="Tipo" valor={ponto.tipo} />
      </View>

      <TextoErro mensagem={erroExclusao} />

      <View style={estilos.acoes}>
        <Botao
          titulo="Editar ponto"
          aoPressionar={() => navigation.navigate('FormularioPonto', { id: ponto.id, ponto })}
          desabilitado={estaExcluindo}
          style={estilos.botao}
          testID="editar-ponto"
        />
        <Botao
          titulo="Excluir ponto"
          variante="perigo"
          aoPressionar={solicitarExclusao}
          carregando={estaExcluindo}
          desabilitado={estaExcluindo}
          style={estilos.botao}
          testID="excluir-ponto"
        />
      </View>

      <CabecalhoSecao
        titulo="Sua próxima doação começa aqui."
        descricao="Informe o item e a quantidade. Este ponto já estará selecionado como destino."
      />
      <View style={estilos.acoes}>
        <Botao
          titulo="Doar para este ponto"
          variante="secundario"
          aoPressionar={() => navigation.navigate('FormularioDoacao', { pontoNome: ponto.nome })}
          desabilitado={estaExcluindo}
          style={estilos.botao}
          testID="doar-para-ponto"
        />
        <Botao
          titulo="Consultar histórico de doações"
          variante="secundario"
          aoPressionar={() => navigation.navigate('HistoricoDoacoes')}
          desabilitado={estaExcluindo}
          style={estilos.botao}
          testID="historico-ponto"
        />
      </View>

      {Platform.OS === 'web' && (
        <ConfirmacaoExclusaoPonto
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
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 210 },
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

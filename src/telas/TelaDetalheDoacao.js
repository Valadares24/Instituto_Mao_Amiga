import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Botao, CabecalhoSecao, CampoInformacao, Etiqueta, MensagemEstado, Pagina } from '../componentes/Interface.js';
import { ApiError } from '../services/api.ts';
import { buscarPorId } from '../services/doacoesService.ts';
import { CORES, ESTILOS } from '../tema.js';

const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function formatarDataHora(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? String(valor ?? '') : FORMATO_DATA_HORA.format(data);
}

export default function TelaDetalheDoacao({ navigation, route }) {
  const id = route.params?.id;
  const [doacao, definirDoacao] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [naoEncontrada, definirNaoEncontrada] = useState(false);
  const [erro, definirErro] = useState('');

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
            : 'Não foi possível carregar os dados da doação.',
        );
      }
    } finally {
      definirCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregarDoacao();
    }, [carregarDoacao]),
  );

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
            <Botao titulo="Tentar novamente" aoPressionar={carregarDoacao} />
          </MensagemEstado>
        </Pagina>
      );
    }
    return (
      <Pagina>
        <MensagemEstado
          titulo="Doação não encontrada"
          descricao="Este registro não está mais disponível. Consulte o histórico para continuar."
        >
          <Botao titulo="Ver histórico" aoPressionar={() => navigation.navigate('HistoricoDoacoes')} />
        </MensagemEstado>
      </Pagina>
    );
  }

  return (
    <Pagina rolavel>
      <CabecalhoSecao
        sobretitulo="REGISTRO DE DOAÇÃO"
        titulo={doacao.tipoItem}
        descricao="Confira os dados registrados na API."
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
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: 22 },
  quantidade: { paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: CORES.borda, gap: 3 },
  numero: { color: CORES.primaria, fontSize: 44, fontWeight: '800', flexShrink: 1, maxWidth: '100%' },
  unidades: { color: CORES.secundario, fontSize: 15 },
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  textoCarregando: { color: CORES.secundario, fontSize: 15 },
});

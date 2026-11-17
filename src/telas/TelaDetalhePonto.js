import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Botao, CabecalhoSecao, CampoInformacao, Etiqueta, MensagemEstado, Pagina } from '../componentes/Interface.js';
import { ApiError } from '../services/api.ts';
import { buscarPorId } from '../services/pontosService.ts';
import { CORES, ESTILOS } from '../tema.js';

export default function TelaDetalhePonto({ navigation, route }) {
  const id = route.params?.id;
  const [ponto, definirPonto] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [naoEncontrado, definirNaoEncontrado] = useState(false);
  const [erro, definirErro] = useState('');

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

  useEffect(() => {
    carregarPonto();
  }, [carregarPonto]);

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
          titulo="Ponto não encontrado"
          descricao="Este ponto não existe ou foi removido. Volte à lista para escolher outro ponto disponível."
        >
          <Botao titulo="Ver pontos de coleta" aoPressionar={() => navigation.navigate('PontosColeta')} />
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
      <CabecalhoSecao
        titulo="Sua próxima doação começa aqui."
        descricao="Informe o item e a quantidade. Este ponto já estará selecionado como destino."
      />
      <View style={estilos.acoes}>
        <Botao
          titulo="Doar para este ponto"
          aoPressionar={() => navigation.navigate('FormularioDoacao', { pontoNome: ponto.nome })}
          style={estilos.botao}
          testID="doar-para-ponto"
        />
        <Botao
          titulo="Consultar histórico de doações"
          variante="secundario"
          aoPressionar={() => navigation.navigate('HistoricoDoacoes')}
          style={estilos.botao}
          testID="historico-ponto"
        />
      </View>
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: 22 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 210 },
  carregando: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  textoCarregando: { color: CORES.secundario, fontSize: 15 },
});

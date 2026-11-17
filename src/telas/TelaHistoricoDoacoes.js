import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Botao, CabecalhoSecao, Etiqueta, MensagemEstado, Pagina } from '../componentes/Interface.js';
import ItemDoacao from '../componentes/ItemDoacao.js';
import { buscarPagina } from '../services/doacoesService.ts';
import { CORES, ESTILOS } from '../tema.js';

const TAMANHO_PAGINA = 10;

export default function TelaHistoricoDoacoes({ navigation }) {
  const [doacoes, definirDoacoes] = useState([]);
  const [busca, definirBusca] = useState('');
  const [termoAplicado, definirTermoAplicado] = useState('');
  const [carregandoInicial, definirCarregandoInicial] = useState(true);
  const [carregandoMais, definirCarregandoMais] = useState(false);
  const [erro, definirErro] = useState('');
  const [totalElementos, definirTotalElementos] = useState(0);
  const [temMaisPaginas, definirTemMaisPaginas] = useState(false);

  const paginaAtualRef = useRef(-1);
  const totalPaginasRef = useRef(0);
  const carregandoRef = useRef(false);
  const versaoRequisicaoRef = useRef(0);

  const carregarPagina = useCallback(async (pagina, filtro, substituir) => {
    if (carregandoRef.current && !substituir) return;
    if (!substituir && pagina <= paginaAtualRef.current) return;
    if (!substituir && totalPaginasRef.current > 0 && pagina >= totalPaginasRef.current) return;

    const versao = ++versaoRequisicaoRef.current;
    carregandoRef.current = true;
    definirErro('');

    if (substituir) {
      definirCarregandoInicial(true);
      paginaAtualRef.current = -1;
      totalPaginasRef.current = 0;
    } else {
      definirCarregandoMais(true);
    }

    try {
      const resposta = await buscarPagina(filtro, pagina, TAMANHO_PAGINA);
      if (versao !== versaoRequisicaoRef.current) return;

      const novosItens = Array.isArray(resposta?.content) ? resposta.content : [];
      const infoPagina = resposta?.page ?? {
        number: pagina,
        totalElements: novosItens.length,
        totalPages: novosItens.length > 0 ? 1 : 0,
      };

      paginaAtualRef.current = infoPagina.number;
      totalPaginasRef.current = infoPagina.totalPages;
      definirTotalElementos(infoPagina.totalElements);
      definirTemMaisPaginas(infoPagina.number + 1 < infoPagina.totalPages);

      if (substituir) {
        definirDoacoes(novosItens);
      } else {
        definirDoacoes((anteriores) => {
          const ids = new Set(anteriores.map((item) => item.id));
          const semDuplicatas = novosItens.filter((item) => !ids.has(item.id));
          return [...anteriores, ...semDuplicatas];
        });
      }
    } catch (e) {
      if (versao !== versaoRequisicaoRef.current) return;
      if (substituir) {
        definirDoacoes([]);
        definirTotalElementos(0);
        definirTemMaisPaginas(false);
      }
      definirErro(
        e instanceof Error && e.message
          ? e.message
          : 'Não foi possível carregar o histórico de doações. Verifique se a API está ligada.',
      );
    } finally {
      if (versao === versaoRequisicaoRef.current) {
        carregandoRef.current = false;
        definirCarregandoInicial(false);
        definirCarregandoMais(false);
      }
    }
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      definirTermoAplicado(busca.trim());
    }, 300);
    return () => clearTimeout(temporizador);
  }, [busca]);

  useFocusEffect(
    useCallback(() => {
      carregarPagina(0, termoAplicado, true);
    }, [termoAplicado, carregarPagina]),
  );

  function carregarProximaPagina() {
    if (carregandoRef.current || carregandoInicial || !temMaisPaginas) return;
    carregarPagina(paginaAtualRef.current + 1, termoAplicado, false);
  }

  const abrirDoacao = useCallback((doacao) => {
    navigation.navigate('DetalheDoacao', { id: doacao.id });
  }, [navigation]);

  const renderizarDoacao = useCallback(
    ({ item: doacao }) => <ItemDoacao doacao={doacao} aoAbrir={abrirDoacao} />,
    [abrirDoacao],
  );

  function renderizarEstadoLista() {
    if (carregandoInicial) {
      return (
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando doações" />
          <Text style={estilos.textoCarregando}>Carregando histórico de doações...</Text>
        </View>
      );
    }

    if (erro.length > 0) {
      return (
        <MensagemEstado
          erro
          titulo="Não foi possível carregar o histórico"
          descricao={erro}
        >
          <Botao
            titulo="Tentar novamente"
            aoPressionar={() => carregarPagina(0, termoAplicado, true)}
            testID="tentar-novamente-doacoes"
          />
        </MensagemEstado>
      );
    }

    if (termoAplicado.length > 0) {
      return (
        <MensagemEstado
          titulo="Nenhuma doação encontrada"
          descricao={`Não encontramos registros para “${termoAplicado}”. Tente outro tipo de item.`}
        >
          <Botao
            titulo="Limpar busca"
            variante="secundario"
            aoPressionar={() => definirBusca('')}
            testID="limpar-busca-doacoes"
          />
        </MensagemEstado>
      );
    }

    return (
      <MensagemEstado
        titulo="Nenhuma doação registrada"
        descricao="Ainda não há doações cadastradas na API. Registre sua primeira doação para acompanhar o histórico."
      >
        <Botao
          titulo="Cadastrar primeira doação"
          aoPressionar={() => navigation.navigate('FormularioDoacao')}
          testID="cadastrar-primeira-doacao"
        />
      </MensagemEstado>
    );
  }

  return (
    <Pagina comTeclado>
      <FlatList
        data={carregandoInicial || erro.length > 0 ? [] : doacoes}
        keyExtractor={(doacao) => doacao.id}
        renderItem={renderizarDoacao}
        ItemSeparatorComponent={() => <View style={estilos.espaco} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
        contentContainerStyle={estilos.lista}
        onEndReached={carregarProximaPagina}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <CabecalhoSecao
              sobretitulo="HISTÓRICO DE DOAÇÕES"
              titulo="Pequenos gestos. Grande impacto."
              descricao="Acompanhe as doações registradas na API, da mais recente para a mais antiga."
            />
            <Botao
              titulo="Cadastrar doação"
              aoPressionar={() => navigation.navigate('FormularioDoacao')}
              testID="novo-cadastro-historico"
            />
            <View style={estilos.busca}>
              <Text nativeID="rotulo-busca" style={ESTILOS.rotulo}>Buscar por tipo de item</Text>
              <TextInput
                value={busca}
                onChangeText={definirBusca}
                placeholder="Ex.: roupas, alimentos, cestas..."
                placeholderTextColor={CORES.secundario}
                accessibilityLabel="Buscar por tipo de item"
                aria-labelledby="rotulo-busca"
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                style={ESTILOS.entrada}
                testID="busca-doacoes"
              />
              <View style={estilos.linhaResultados}>
                {!carregandoInicial && erro.length === 0 && (
                  <Etiqueta texto={`${totalElementos} ${totalElementos === 1 ? 'registro' : 'registros'} · mais recentes primeiro`} />
                )}
                {busca.length > 0 && (
                  <Botao
                    titulo="Limpar"
                    variante="texto"
                    aoPressionar={() => definirBusca('')}
                    accessibilityLabel="Limpar busca do histórico"
                  />
                )}
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={renderizarEstadoLista}
        ListFooterComponent={
          carregandoMais ? (
            <View style={estilos.rodapeCarregando}>
              <ActivityIndicator size="small" color={CORES.primaria} accessibilityLabel="Carregando mais doações" />
              <Text style={estilos.textoCarregando}>Carregando mais doações...</Text>
            </View>
          ) : doacoes.length > 0 ? (
            <Text style={estilos.nota}>
              {temMaisPaginas
                ? 'Role para carregar mais doações.'
                : 'Todas as doações encontradas foram exibidas.'}
            </Text>
          ) : null
        }
      />
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  lista: { paddingBottom: 28, flexGrow: 1 },
  cabecalho: { gap: 20, paddingBottom: 16 },
  busca: { gap: 9, marginTop: 4 },
  linhaResultados: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  espaco: { height: 12 },
  carregando: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  rodapeCarregando: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
  textoCarregando: { color: CORES.secundario, fontSize: 14 },
  nota: { color: CORES.secundario, textAlign: 'center', fontSize: 12, lineHeight: 20, marginTop: 24, paddingHorizontal: 8 },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, CabecalhoSecao, Etiqueta, MensagemEstado, Pagina } from '../componentes/Interface.js';
import { buscarPagina } from '../services/pontosService.ts';
import { CORES, ESTILOS } from '../tema.js';

const TAMANHO_PAGINA = 10;

export default function TelaPontos({ navigation }) {
  const [pontos, definirPontos] = useState([]);
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
    if (carregandoRef.current && !substituir) {
      return;
    }
    if (!substituir && pagina <= paginaAtualRef.current) {
      return;
    }
    if (!substituir && totalPaginasRef.current > 0 && pagina >= totalPaginasRef.current) {
      return;
    }

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
      if (versao !== versaoRequisicaoRef.current) {
        return;
      }

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
        definirPontos(novosItens);
      } else {
        definirPontos((anteriores) => {
          const ids = new Set(anteriores.map((item) => item.id));
          const semDuplicatas = novosItens.filter((item) => !ids.has(item.id));
          return [...anteriores, ...semDuplicatas];
        });
      }
    } catch (e) {
      if (versao !== versaoRequisicaoRef.current) {
        return;
      }
      if (substituir) {
        definirPontos([]);
        definirTotalElementos(0);
        definirTemMaisPaginas(false);
      }
      definirErro(
        e instanceof Error && e.message
          ? e.message
          : 'Não foi possível carregar os pontos de coleta. Verifique se a API está ligada.',
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

  useEffect(() => {
    carregarPagina(0, termoAplicado, true);
  }, [termoAplicado, carregarPagina]);

  function carregarProximaPagina() {
    if (carregandoRef.current || carregandoInicial || !temMaisPaginas) {
      return;
    }
    carregarPagina(paginaAtualRef.current + 1, termoAplicado, false);
  }

  function abrirPonto(ponto) {
    navigation.navigate('DetalhePonto', { id: ponto.id });
  }

  function renderizarEstadoLista() {
    if (carregandoInicial) {
      return (
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando pontos de coleta" />
          <Text style={estilos.textoCarregando}>Carregando pontos de coleta...</Text>
        </View>
      );
    }

    if (erro.length > 0) {
      return (
        <MensagemEstado
          erro
          titulo="Não foi possível carregar os pontos"
          descricao={erro}
        >
          <Botao
            titulo="Tentar novamente"
            aoPressionar={() => carregarPagina(0, termoAplicado, true)}
            testID="tentar-novamente-pontos"
          />
        </MensagemEstado>
      );
    }

    if (termoAplicado.length > 0) {
      return (
        <MensagemEstado
          titulo="Nenhum ponto encontrado"
          descricao={`Não encontramos pontos para “${termoAplicado}”. Tente outro nome ou bairro.`}
        >
          <Botao
            titulo="Limpar busca"
            variante="secundario"
            aoPressionar={() => definirBusca('')}
            testID="limpar-busca-pontos"
          />
        </MensagemEstado>
      );
    }

    return (
      <MensagemEstado
        titulo="Nenhum ponto cadastrado"
        descricao="Ainda não há pontos de coleta disponíveis na API."
      />
    );
  }

  return (
    <Pagina comTeclado>
      <FlatList
        data={carregandoInicial || erro.length > 0 ? [] : pontos}
        keyExtractor={(ponto) => ponto.id}
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={() => <View style={estilos.espaco} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
        onEndReached={carregarProximaPagina}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <CabecalhoSecao
              sobretitulo="INSTITUTO MÃO AMIGA"
              titulo="Toda ajuda encontra um destino."
              descricao="Consulte nossos pontos de coleta e distribuição em Goiânia e registre suas doações."
            />
            <View style={estilos.acoes}>
              <Botao
                titulo="Cadastrar doação"
                aoPressionar={() => navigation.navigate('FormularioDoacao')}
                style={estilos.botao}
                testID="novo-cadastro"
              />
              <Botao
                titulo="Ver histórico"
                variante="secundario"
                aoPressionar={() => navigation.navigate('HistoricoDoacoes')}
                style={estilos.botao}
                testID="abrir-historico"
              />
            </View>
            <View style={estilos.busca}>
              <Text nativeID="rotulo-busca-pontos" style={ESTILOS.rotulo}>Buscar ponto por nome ou bairro</Text>
              <TextInput
                value={busca}
                onChangeText={definirBusca}
                placeholder="Ex.: Bueno, Centro, Marista..."
                placeholderTextColor={CORES.secundario}
                accessibilityLabel="Buscar pontos por nome ou bairro"
                aria-labelledby="rotulo-busca-pontos"
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                style={ESTILOS.entrada}
                testID="busca-pontos"
              />
              {busca.length > 0 && (
                <View style={estilos.linhaLimpar}>
                  <Botao
                    titulo="Limpar busca"
                    variante="texto"
                    aoPressionar={() => definirBusca('')}
                    accessibilityLabel="Limpar busca de pontos"
                  />
                </View>
              )}
            </View>
            <View style={estilos.tituloLista}>
              <Text accessibilityRole="header" style={estilos.subtitulo}>Pontos cadastrados</Text>
              {!carregandoInicial && erro.length === 0 && (
                <Etiqueta texto={`${totalElementos} ${totalElementos === 1 ? 'local' : 'locais'}`} />
              )}
            </View>
          </View>
        }
        renderItem={({ item: ponto, index: indice }) => (
          <Pressable
            onPress={() => abrirPonto(ponto)}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalhes de ${ponto.nome}, ${ponto.bairro}`}
            testID={`ponto-${ponto.id}`}
            style={({ pressed }) => [estilos.cartao, pressed && estilos.pressionado]}
          >
            <View style={estilos.linha}>
              <View style={estilos.indicador} aria-hidden>
                <Text style={estilos.numero}>{String(indice + 1).padStart(2, '0')}</Text>
              </View>
              <View style={estilos.conteudo}>
                <Text style={estilos.nome}>{ponto.nome}</Text>
                <Text style={estilos.bairro}>{ponto.bairro}</Text>
                <Text style={estilos.endereco}>{ponto.endereco}</Text>
              </View>
            </View>
            <Text style={estilos.horario}>{ponto.horario}</Text>
            <View style={estilos.rodape}>
              <Etiqueta texto={ponto.tipo === 'distribuição' ? 'Distribuição' : 'Coleta'} />
              <Text style={estilos.link} aria-hidden>Conhecer o ponto →</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={renderizarEstadoLista}
        ListFooterComponent={
          carregandoMais ? (
            <View style={estilos.rodapeCarregando}>
              <ActivityIndicator size="small" color={CORES.primaria} accessibilityLabel="Carregando mais pontos" />
              <Text style={estilos.textoCarregando}>Carregando mais pontos...</Text>
            </View>
          ) : pontos.length > 0 ? (
            <Text style={estilos.nota}>
              {temMaisPaginas
                ? 'Role para carregar mais pontos.'
                : 'Todos os pontos encontrados foram exibidos.'}
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
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 210 },
  busca: { gap: 8 },
  linhaLimpar: { alignItems: 'flex-end' },
  tituloLista: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  subtitulo: { color: CORES.texto, fontSize: 21, fontWeight: '700' },
  espaco: { height: 14 },
  cartao: { backgroundColor: CORES.superficie, borderWidth: 1, borderColor: CORES.borda, borderRadius: 20, padding: 20, gap: 14 },
  pressionado: { backgroundColor: CORES.primariaSuave },
  linha: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  indicador: { width: 46, height: 46, borderRadius: 14, backgroundColor: CORES.primariaSuave, alignItems: 'center', justifyContent: 'center' },
  numero: { color: CORES.primaria, fontWeight: '800', fontSize: 18 },
  conteudo: { flex: 1, gap: 4 },
  nome: { color: CORES.texto, fontWeight: '700', fontSize: 18, lineHeight: 24 },
  bairro: { color: CORES.primaria, fontSize: 14, fontWeight: '600' },
  endereco: { color: CORES.secundario, fontSize: 14, lineHeight: 20 },
  horario: { color: CORES.secundario, fontSize: 14, lineHeight: 20 },
  rodape: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: CORES.borda },
  link: { color: CORES.primaria, fontSize: 13, fontWeight: '700' },
  carregando: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  rodapeCarregando: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 10 },
  textoCarregando: { color: CORES.secundario, fontSize: 14 },
  nota: { color: CORES.secundario, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
});

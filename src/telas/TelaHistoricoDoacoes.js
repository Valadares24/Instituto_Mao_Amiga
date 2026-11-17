import { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Botao, CabecalhoSecao, MensagemEstado, Pagina } from '../componentes/Interface.js';
import ItemDoacao from '../componentes/ItemDoacao.js';
import { filtrarDoacoes, ordenarDoacoes, resumirDoacoes } from '../dominio/doacoes.js';
import { CORES, ESTILOS } from '../tema.js';

export default function TelaHistoricoDoacoes({ navigation, doacoes, estaCarregando, erroCarregamento, aoRecarregar }) {
  const [busca, definirBusca] = useState('');
  const resumo = useMemo(() => resumirDoacoes(doacoes), [doacoes]);
  const doacoes_filtradas = useMemo(() => ordenarDoacoes(filtrarDoacoes(doacoes, busca)), [doacoes, busca]);
  const tem_busca = busca.trim().length > 0;
  const tem_erro_carregamento = erroCarregamento.length > 0;
  const abrirDoacao = useCallback((doacao) => navigation.navigate('DetalheDoacao', { doacao }), [navigation]);
  const renderizarDoacao = useCallback(({ item: doacao }) => <ItemDoacao doacao={doacao} aoAbrir={abrirDoacao} />, [abrirDoacao]);

  function renderizarEstadoVazio() {
    if (estaCarregando) return <MensagemEstado titulo="Recuperando suas doações" descricao="Aguarde um momento para consultar os registros." />;
    if (tem_erro_carregamento) return <MensagemEstado erro titulo="Não foi possível carregar o histórico" descricao={erroCarregamento}>
      <Botao titulo="Tentar novamente" aoPressionar={aoRecarregar} />
    </MensagemEstado>;
    if (tem_busca) return <MensagemEstado titulo="Nenhuma doação encontrada" descricao={'Não encontramos registros para “' + busca.trim() + '”. Tente outro tipo de item.'}>
      <Botao titulo="Limpar busca" variante="secundario" aoPressionar={() => definirBusca('')} />
    </MensagemEstado>;
    return <MensagemEstado titulo="Seu primeiro gesto começa aqui" descricao="Você ainda não tem doações cadastradas. Registre uma doação para acompanhar sua contribuição.">
      <Botao titulo="Cadastrar primeira doação" aoPressionar={() => navigation.navigate('FormularioDoacao')} testID="cadastrar-primeira-doacao" />
    </MensagemEstado>;
  }

  return (
    <Pagina comTeclado>
      <FlatList
        data={estaCarregando || tem_erro_carregamento ? [] : doacoes_filtradas}
        keyExtractor={(doacao) => doacao.id}
        renderItem={renderizarDoacao}
        ItemSeparatorComponent={() => <View style={estilos.espaco} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <CabecalhoSecao sobretitulo="HISTÓRICO DE DOAÇÕES" titulo="Pequenos gestos. Grande impacto." descricao="Acompanhe as doações registradas e encontre cada contribuição." />
            {!estaCarregando && !tem_erro_carregamento && (
              <View style={estilos.resumo}>
                <Text accessibilityRole="header" style={estilos.tituloResumo}>Seu impacto, em números.</Text>
                <View style={estilos.indicadores}>
                  <View style={estilos.indicador}>
                    <Text style={estilos.valorResumo} testID="total-doacoes">{resumo.totalDoacoes.toLocaleString('pt-BR')}</Text>
                    <Text style={estilos.rotuloResumo}>{resumo.totalDoacoes === 1 ? 'doação registrada' : 'doações registradas'}</Text>
                  </View>
                  <View style={estilos.indicador}>
                    <Text style={estilos.valorResumo} testID="total-unidades">{resumo.totalUnidades.toLocaleString('pt-BR')}</Text>
                    <Text style={estilos.rotuloResumo}>{resumo.totalUnidades === 1 ? 'unidade doada' : 'unidades doadas'}</Text>
                  </View>
                </View>
                {resumo.tipos.length > 0 && (
                  <View style={estilos.tipos}>
                    <Text style={estilos.rotuloTipos}>UNIDADES POR TIPO DE ITEM</Text>
                    {resumo.tipos.map((tipo) => (
                      <View key={tipo.tipoItem} style={estilos.linhaTipo}>
                        <Text style={estilos.nomeTipo}>{tipo.tipoItem}</Text>
                        <Text style={estilos.quantidadeTipo}>{tipo.quantidade.toLocaleString('pt-BR')} {tipo.quantidade === 1 ? 'unidade' : 'unidades'} em {tipo.totalDoacoes.toLocaleString('pt-BR')} {tipo.totalDoacoes === 1 ? 'doação' : 'doações'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            <Botao titulo="Cadastrar doação" aoPressionar={() => navigation.navigate('FormularioDoacao')} desabilitado={estaCarregando || tem_erro_carregamento} testID="novo-cadastro-historico" />
            {!estaCarregando && !tem_erro_carregamento && (
              <View style={estilos.busca}>
                <Text nativeID="rotulo-busca" style={ESTILOS.rotulo}>Buscar no histórico</Text>
                <TextInput
                  value={busca} onChangeText={definirBusca}
                  placeholder="Tipo de item, como roupas ou alimentos"
                  placeholderTextColor={CORES.secundario}
                  accessibilityLabel="Buscar por tipo de item"
                  aria-labelledby="rotulo-busca" returnKeyType="search"
                  autoCapitalize="none" autoCorrect={false}
                  style={ESTILOS.entrada} testID="busca-doacoes"
                />
                <View style={estilos.linhaResultados}>
                  <Text style={estilos.contagem}>{doacoes_filtradas.length} {doacoes_filtradas.length === 1 ? 'registro' : 'registros'} · mais recentes primeiro</Text>
                  {busca.length > 0 && <Botao titulo="Limpar" variante="texto" aoPressionar={() => definirBusca('')} accessibilityLabel="Limpar busca do histórico" />}
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={renderizarEstadoVazio}
        ListFooterComponent={!estaCarregando && !tem_erro_carregamento && doacoes_filtradas.length > 0 ? <Text style={estilos.nota}>Toque em um registro para ver, editar ou excluir a doação.</Text> : null}
      />
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  lista: { paddingBottom: 28, flexGrow: 1 },
  cabecalho: { gap: 20, paddingBottom: 16 },
  resumo: { backgroundColor: CORES.primariaEscura, borderRadius: 20, padding: 22, gap: 20 },
  tituloResumo: { color: CORES.superficie, fontWeight: '700', fontSize: 18, lineHeight: 25 },
  indicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  indicador: { flexGrow: 1, flexBasis: 180, gap: 5 },
  valorResumo: { color: CORES.superficie, fontWeight: '800', fontSize: 34, flexShrink: 1, maxWidth: '100%' },
  rotuloResumo: { color: CORES.primariaSuave, fontSize: 13, lineHeight: 20 },
  tipos: { gap: 10, paddingTop: 18, borderTopWidth: 1, borderTopColor: CORES.primaria },
  rotuloTipos: { color: CORES.primariaSuave, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  linhaTipo: { gap: 2 },
  nomeTipo: { color: CORES.superficie, fontSize: 14, lineHeight: 21, fontWeight: '700', flexShrink: 1 },
  quantidadeTipo: { color: CORES.primariaSuave, fontSize: 13, lineHeight: 20, flexShrink: 1, maxWidth: '100%' },
  busca: { gap: 9, marginTop: 4 },
  linhaResultados: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  contagem: { color: CORES.secundario, fontSize: 12, lineHeight: 19 },
  espaco: { height: 12 },
  nota: { color: CORES.secundario, textAlign: 'center', fontSize: 12, lineHeight: 20, marginTop: 24, paddingHorizontal: 8 },
});

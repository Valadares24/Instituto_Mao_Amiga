import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Botao, CabecalhoSecao, Etiqueta, MensagemEstado, Pagina } from '../componentes/Interface.js';
import { ApiError } from '../services/api.ts';
import { listarIdsFavoritos, removerFavorito } from '../services/favoritosService.ts';
import { buscarPorId } from '../services/pontosService.ts';
import { CORES } from '../tema.js';

export default function TelaMeusPontos({ navigation }) {
  const [pontos, definirPontos] = useState([]);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');

  const carregarFavoritos = useCallback(async () => {
    definirCarregando(true);
    definirErro('');

    try {
      const ids = await listarIdsFavoritos();
      if (ids.length === 0) {
        definirPontos([]);
        return;
      }

      const resultados = await Promise.allSettled(ids.map((id) => buscarPorId(id)));
      const encontrados = [];
      let erroRede = null;

      for (const resultado of resultados) {
        if (resultado.status === 'fulfilled' && resultado.value) {
          encontrados.push(resultado.value);
        } else if (resultado.status === 'rejected') {
          const motivo = resultado.reason;
          // Pontos excluídos na API (404) ficam de fora sem quebrar a tela.
          if (motivo instanceof ApiError && motivo.status === 404) {
            continue;
          }
          erroRede = motivo;
        }
      }

      if (encontrados.length === 0 && erroRede !== null) {
        throw erroRede;
      }

      definirPontos(encontrados);
    } catch (e) {
      definirPontos([]);
      definirErro(
        e instanceof Error && e.message
          ? e.message
          : 'Não foi possível carregar seus pontos favoritos. Verifique se a API está ligada.',
      );
    } finally {
      definirCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [carregarFavoritos]),
  );

  async function desmarcarFavorito(id) {
    definirPontos((anteriores) => anteriores.filter((ponto) => ponto.id !== id));
    await removerFavorito(id);
  }

  function renderizarEstadoLista() {
    if (carregando) {
      return (
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={CORES.primaria} accessibilityLabel="Carregando pontos favoritos" />
          <Text style={estilos.textoCarregando}>Buscando seus pontos favoritos na API...</Text>
        </View>
      );
    }

    if (erro.length > 0) {
      return (
        <MensagemEstado
          erro
          titulo="Não foi possível carregar seus favoritos"
          descricao={erro}
        >
          <Botao titulo="Tentar novamente" aoPressionar={carregarFavoritos} testID="tentar-novamente-favoritos" />
        </MensagemEstado>
      );
    }

    return (
      <MensagemEstado
        titulo="Nenhum ponto favorito"
        descricao="Toque no coração (♡) na lista de pontos para guardar seus locais preferidos aqui."
      >
        <Botao
          titulo="Explorar pontos de coleta"
          aoPressionar={() => navigation.navigate('PontosColeta')}
          testID="explorar-pontos-favoritos"
        />
      </MensagemEstado>
    );
  }

  return (
    <Pagina>
      <FlatList
        data={carregando || erro.length > 0 ? [] : pontos}
        keyExtractor={(ponto) => ponto.id}
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={() => <View style={estilos.espaco} />}
        ListHeaderComponent={
          <View style={estilos.cabecalho}>
            <CabecalhoSecao
              sobretitulo="SEUS FAVORITOS"
              titulo="Meus pontos"
              descricao="Os IDs ficam salvos neste aparelho e os dados atualizados são buscados na API."
            />
            {!carregando && erro.length === 0 && (
              <Etiqueta texto={`${pontos.length} ${pontos.length === 1 ? 'ponto salvo' : 'pontos salvos'}`} />
            )}
          </View>
        }
        renderItem={({ item: ponto }) => (
          <View style={estilos.cartao}>
            <View style={estilos.linhaSuperior}>
              <Pressable
                onPress={() => navigation.navigate('DetalhePonto', { id: ponto.id })}
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes de ${ponto.nome}`}
                style={({ pressed }) => [estilos.areaConteudo, pressed && estilos.pressionado]}
                testID={`favorito-ponto-${ponto.id}`}
              >
                <Text style={estilos.nome}>{ponto.nome}</Text>
                <Text style={estilos.bairro}>{ponto.bairro}</Text>
                <Text style={estilos.endereco}>{ponto.endereco}</Text>
                <Text style={estilos.horario}>{ponto.horario}</Text>
              </Pressable>
              <TouchableOpacity
                onPress={() => desmarcarFavorito(ponto.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Desmarcar ${ponto.nome} dos favoritos`}
                testID={`desmarcar-favorito-${ponto.id}`}
                style={estilos.botaoDesmarcar}
              >
                <Text style={estilos.coracaoAtivo}>♥</Text>
                <Text style={estilos.textoDesmarcar}>Desmarcar</Text>
              </TouchableOpacity>
            </View>
            <View style={estilos.rodape}>
              <Etiqueta texto={ponto.tipo === 'distribuição' ? 'Distribuição' : 'Coleta'} />
              <Pressable onPress={() => navigation.navigate('DetalhePonto', { id: ponto.id })}>
                <Text style={estilos.link}>Ver detalhes →</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={renderizarEstadoLista}
      />
    </Pagina>
  );
}

const estilos = StyleSheet.create({
  lista: { paddingBottom: 28, flexGrow: 1 },
  cabecalho: { gap: 16, paddingBottom: 16 },
  espaco: { height: 14 },
  cartao: { backgroundColor: CORES.superficie, borderWidth: 1, borderColor: CORES.borda, borderRadius: 20, padding: 18, gap: 14 },
  linhaSuperior: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  areaConteudo: { flex: 1, gap: 4, borderRadius: 12, padding: 4 },
  pressionado: { backgroundColor: CORES.primariaSuave },
  nome: { color: CORES.texto, fontWeight: '700', fontSize: 18, lineHeight: 24 },
  bairro: { color: CORES.primaria, fontSize: 14, fontWeight: '600' },
  endereco: { color: CORES.secundario, fontSize: 14, lineHeight: 20 },
  horario: { color: CORES.secundario, fontSize: 13, lineHeight: 19 },
  botaoDesmarcar: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  coracaoAtivo: { color: CORES.primaria, fontSize: 20, lineHeight: 22 },
  textoDesmarcar: { color: CORES.primaria, fontSize: 11, fontWeight: '700' },
  rodape: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: CORES.borda },
  link: { color: CORES.primaria, fontSize: 13, fontWeight: '700' },
  carregando: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  textoCarregando: { color: CORES.secundario, fontSize: 14 },
});

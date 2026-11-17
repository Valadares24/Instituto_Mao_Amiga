import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../tema.js';

const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: 'short', year: 'numeric',
});

function ItemDoacao({ doacao, aoAbrir }) {
  const nomePonto = doacao.pontoDestino;
  const data = FORMATO_DATA.format(new Date(doacao.criadoEm));
  const quantidade = doacao.quantidade.toLocaleString('pt-BR');

  return (
    <Pressable
      onPress={() => aoAbrir(doacao)}
      accessibilityRole="button"
      accessibilityLabel={'Abrir doação de ' + quantidade + ' ' + (doacao.quantidade === 1 ? 'unidade' : 'unidades') + ' de ' + doacao.tipoItem + ' para ' + nomePonto + ', registrada em ' + data}
      testID={'doacao-' + doacao.id}
      style={({ pressed }) => [estilos.cartao, pressed && estilos.pressionado]}
    >
      <View style={estilos.linha}>
        <Text style={estilos.tipo}>{doacao.tipoItem}</Text>
        <View style={estilos.quantidade}>
          <Text style={estilos.numero}>{quantidade}</Text>
          <Text style={estilos.unidade}>{doacao.quantidade === 1 ? 'unidade' : 'unidades'}</Text>
        </View>
      </View>
      <Text style={estilos.destino}>{nomePonto}</Text>
      <View style={estilos.rodape}>
        <Text style={estilos.data}>{data}</Text>
        <Text style={estilos.acao} aria-hidden>Ver registro →</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: CORES.superficie, borderWidth: 1, borderColor: CORES.borda,
    borderRadius: 18, padding: 20, minHeight: 128, gap: 12,
  },
  pressionado: { backgroundColor: CORES.primariaSuave },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  tipo: { flex: 1, color: CORES.texto, fontSize: 19, fontWeight: '700', lineHeight: 26 },
  quantidade: { alignItems: 'flex-end', maxWidth: '45%' },
  numero: { color: CORES.primaria, fontSize: 23, fontWeight: '800', flexShrink: 1, maxWidth: '100%', textAlign: 'right' },
  unidade: { color: CORES.secundario, fontSize: 12, marginTop: 2 },
  destino: { color: CORES.secundario, fontSize: 15, lineHeight: 22 },
  rodape: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  data: { color: CORES.secundario, fontSize: 13 },
  acao: { color: CORES.primaria, fontSize: 13, fontWeight: '700' },
});

export default memo(ItemDoacao);

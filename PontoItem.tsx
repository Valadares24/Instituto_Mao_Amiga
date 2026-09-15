import { TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { Ponto } from './TelaListaPontos';

type Props = {
  ponto: Ponto;
  onPress: () => void;
};

// useWindowDimensions() se adapta a qualquer largura de tela — evita o
// bug de largura fixa em pixel que quebra num aparelho mais estreito
// (Aula 08, teste cruzado em 2+ aparelhos físicos).
function PontoItem({ ponto, onPress }: Props) {
  const { width } = useWindowDimensions();
  return (
    <TouchableOpacity
      style={[styles.item, { width: width - 32 }]}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8 }}
    >
      <Text style={styles.nome} numberOfLines={2}>{ponto.nome}</Text>
      <Text style={styles.horario}>{ponto.diasHorarios}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  nome: { fontWeight: 'bold', fontSize: 16, flexShrink: 1, flexWrap: 'wrap' },
  horario: { color: '#595959', marginTop: 4 },
});

export default PontoItem;
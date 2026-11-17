import { StyleSheet } from 'react-native';

export const CORES = {
  fundo: '#EDF2F4',
  superficie: '#FFFFFF',
  primaria: '#2B2D42',
  primariaEscura: '#2B2D42',
  primariaSuave: '#E1E6EC',
  acento: '#8D99AE',
  texto: '#2B2D42',
  secundario: '#556176',
  borda: '#CBD2DC',
  erro: '#2B2D42',
  erroSuave: '#E1E6EC',
};

export const ESPACOS = { pequeno: 8, medio: 16, grande: 24 };

export const ESTILOS = StyleSheet.create({
  cartao: { backgroundColor: CORES.superficie, borderWidth: 1, borderColor: CORES.borda, borderRadius: 18, padding: 20, gap: 12 },
  titulo: { fontSize: 24, fontWeight: '700', color: CORES.texto, lineHeight: 32 },
  texto: { fontSize: 16, lineHeight: 24, color: CORES.secundario },
  rotulo: { fontSize: 14, fontWeight: '600', color: CORES.texto, marginBottom: 8 },
  entrada: { minHeight: 50, borderWidth: 1, borderColor: CORES.borda, borderRadius: 12, backgroundColor: CORES.superficie, color: CORES.texto, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
});

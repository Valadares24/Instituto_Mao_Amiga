/**
 * Elementos visuais compartilhados; propriedades e textos pertencem à interface.
 * Pagina cuida da área segura, largura de leitura e proteção do teclado.
 */
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { CORES, ESTILOS } from '../tema.js';

export function Botao({ titulo, aoPressionar, variante = 'primario', desabilitado = false, carregando = false, style, accessibilityLabel, testID }) {
  const esta_desabilitado = desabilitado || carregando;
  const cor_texto = variante === 'primario' || variante === 'perigo' ? CORES.superficie : CORES.primaria;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: esta_desabilitado, busy: carregando }}
      aria-disabled={esta_desabilitado} aria-busy={carregando} disabled={esta_desabilitado}
      onPress={aoPressionar} testID={testID}
      style={({ pressed }) => [estilos.botao, estilos[variante], esta_desabilitado && estilos.desabilitado, pressed && !esta_desabilitado && estilos.pressionado, style]}
    >
      {carregando ? <ActivityIndicator color={cor_texto} accessibilityLabel="Processando alteração" /> : (
        <Text style={[estilos.textoBotao, { color: cor_texto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Pagina({ children, rolavel = false, comTeclado = false, style, conteudoStyle }) {
  const altura_cabecalho = useHeaderHeight();
  const conteudo = rolavel ? (
    <ScrollView style={estilos.preencher} contentContainerStyle={[estilos.conteudoRolavel, conteudoStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      {children}
    </ScrollView>
  ) : <View style={[estilos.conteudo, conteudoStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[estilos.pagina, style]}>
      <KeyboardAvoidingView style={estilos.preencher} enabled={comTeclado && Platform.OS !== 'web'} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? altura_cabecalho : 0}>
        <View style={estilos.largura}>{conteudo}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function CabecalhoSecao({ sobretitulo, titulo, descricao, children }) {
  return (
    <View style={estilos.cabecalho}>
      {sobretitulo != null && <Text style={estilos.sobretitulo}>{sobretitulo}</Text>}
      <Text accessibilityRole="header" style={estilos.titulo}>{titulo}</Text>
      {descricao != null && <Text style={estilos.descricao}>{descricao}</Text>}
      {children}
    </View>
  );
}

export function MensagemEstado({ titulo, descricao, children, erro = false }) {
  return (
    <View style={[ESTILOS.cartao, estilos.estado, erro && estilos.estadoErro]}>
      <View style={[estilos.marcaEstado, erro && estilos.marcaErro]}>
        <Text accessibilityElementsHidden style={[estilos.simbolo, erro && { color: CORES.erro }]}>{erro ? '!' : '♡'}</Text>
      </View>
      <Text accessibilityRole="header" style={estilos.tituloEstado}>{titulo}</Text>
      <Text style={estilos.descricaoEstado}>{descricao}</Text>
      {children}
    </View>
  );
}

export function CampoInformacao({ rotulo, valor }) {
  return <View style={estilos.campo}><Text style={estilos.rotuloInformacao}>{rotulo}</Text><Text selectable style={estilos.valor}>{valor}</Text></View>;
}

export function Etiqueta({ texto }) {
  return <View style={estilos.etiqueta}><Text style={estilos.textoEtiqueta}>{texto}</Text></View>;
}

export function TextoErro({ mensagem }) {
  return mensagem != null && mensagem !== '' ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={estilos.erro}>{mensagem}</Text> : null;
}

const estilos = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: CORES.fundo },
  preencher: { flex: 1 },
  largura: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center' },
  conteudo: { flex: 1, padding: 20, gap: 20 },
  conteudoRolavel: { flexGrow: 1, padding: 20, gap: 20 },
  cabecalho: { gap: 10, paddingVertical: 8 },
  sobretitulo: { color: CORES.primaria, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  titulo: { color: CORES.texto, fontSize: 30, fontWeight: '700', lineHeight: 38 },
  descricao: { color: CORES.secundario, fontSize: 16, lineHeight: 25 },
  botao: { minWidth: 44, minHeight: 48, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  primario: { backgroundColor: CORES.primaria, borderColor: CORES.primaria },
  secundario: { backgroundColor: CORES.superficie, borderColor: CORES.borda },
  perigo: { backgroundColor: CORES.erro, borderColor: CORES.erro },
  texto: { backgroundColor: 'transparent', borderColor: 'transparent' },
  textoBotao: { fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'center', lineHeight: 21 },
  desabilitado: { opacity: 0.5 },
  pressionado: { opacity: 0.78 },
  estado: { alignItems: 'center', paddingVertical: 32, gap: 14 },
  estadoErro: { borderColor: CORES.erro },
  marcaEstado: { width: 56, height: 56, borderRadius: 28, backgroundColor: CORES.primariaSuave, alignItems: 'center', justifyContent: 'center' },
  marcaErro: { backgroundColor: CORES.erroSuave },
  simbolo: { fontSize: 30, color: CORES.primaria },
  tituloEstado: { fontSize: 21, lineHeight: 28, fontWeight: '700', color: CORES.texto, textAlign: 'center' },
  descricaoEstado: { fontSize: 15, lineHeight: 23, color: CORES.secundario, textAlign: 'center', maxWidth: 420 },
  campo: { gap: 5 },
  rotuloInformacao: { fontSize: 12, fontWeight: '600', color: CORES.secundario, textTransform: 'uppercase', letterSpacing: 0.6 },
  valor: { color: CORES.texto, fontSize: 16, lineHeight: 25, flexShrink: 1 },
  etiqueta: { alignSelf: 'flex-start', backgroundColor: CORES.primariaSuave, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  textoEtiqueta: { fontSize: 12, fontWeight: '600', color: CORES.primariaEscura, lineHeight: 18 },
  erro: { color: CORES.erro, fontSize: 14, lineHeight: 21 },
});

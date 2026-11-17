import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TelaPontos from './src/telas/TelaPontos.js';
import TelaDetalhePonto from './src/telas/TelaDetalhePonto.js';
import TelaFormularioPonto from './src/telas/TelaFormularioPonto.js';
import TelaFormularioDoacao from './src/telas/TelaFormularioDoacao.js';
import TelaHistoricoDoacoes from './src/telas/TelaHistoricoDoacoes.js';
import TelaDetalheDoacao from './src/telas/TelaDetalheDoacao.js';
import { CORES } from './src/tema.js';
import { Botao } from './src/componentes/Interface.js';

const Pilha = createNativeStackNavigator();
const TEMA_NAVEGACAO = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: CORES.primaria,
    background: CORES.fundo,
    card: CORES.superficie,
    text: CORES.texto,
    border: CORES.borda,
    notification: CORES.primaria,
  },
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.lang = 'pt-BR';
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={CORES.superficie} />
      <NavigationContainer
        theme={TEMA_NAVEGACAO}
        documentTitle={{ formatter: (opcoes) => `${opcoes.title ?? 'Doações'} | Instituto Mão Amiga` }}
      >
        <Pilha.Navigator
          initialRouteName="PontosColeta"
          screenOptions={({ navigation }) => ({
            headerTintColor: CORES.primariaEscura,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerShadowVisible: false,
            headerBackTitle: 'Voltar',
            headerBackVisible: false,
            headerLeft: ({ canGoBack }) => (
              canGoBack
                ? <Botao titulo="Voltar" variante="texto" aoPressionar={() => navigation.goBack()} style={{ paddingHorizontal: 8 }} />
                : null
            ),
            headerStyle: { backgroundColor: CORES.superficie },
            contentStyle: { backgroundColor: CORES.fundo },
          })}
        >
          <Pilha.Screen name="PontosColeta" component={TelaPontos} options={{ title: 'Instituto Mão Amiga' }} />
          <Pilha.Screen name="DetalhePonto" component={TelaDetalhePonto} options={{ title: 'Ponto de coleta' }} />
          <Pilha.Screen name="FormularioPonto" component={TelaFormularioPonto} options={{ title: 'Novo ponto' }} />
          <Pilha.Screen name="FormularioDoacao" component={TelaFormularioDoacao} options={{ title: 'Cadastrar doação' }} />
          <Pilha.Screen name="HistoricoDoacoes" component={TelaHistoricoDoacoes} options={{ title: 'Minhas doações' }} />
          <Pilha.Screen name="DetalheDoacao" component={TelaDetalheDoacao} options={{ title: 'Detalhe da doação' }} />
        </Pilha.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

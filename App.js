import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { randomUUID } from 'expo-crypto';
import { listarDoacoes, salvarDoacao, atualizarDoacao, excluirDoacao } from './src/armazenamento/doacoesStorage.js';
import { prepararDoacao } from './src/dominio/doacoes.js';
import TelaPontos from './src/telas/TelaPontos.js';
import TelaDetalhePonto from './src/telas/TelaDetalhePonto.js';
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
  const [doacoes, definirDoacoes] = useState([]);
  const [esta_carregando, definirCarregando] = useState(true);
  const [erro_carregamento, definirErroCarregamento] = useState('');

  const recarregarDoacoes = useCallback(async () => {
    definirCarregando(true);
    definirErroCarregamento('');
    try {
      definirDoacoes(await listarDoacoes());
    } catch (erro) {
      definirErroCarregamento(erro.message);
    } finally {
      definirCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregarDoacoes();
    if (Platform.OS === 'web') {
      document.documentElement.lang = 'pt-BR';
    }
  }, [recarregarDoacoes]);

  const registrarDoacao = useCallback(async (valores, doacao_original) => {
    const doacao = prepararDoacao(valores, doacao_original, randomUUID);
    const doacoes_salvas = doacao_original != null
      ? await atualizarDoacao(doacao)
      : await salvarDoacao(doacao);
    definirDoacoes(doacoes_salvas);
  }, []);

  const removerDoacao = useCallback(async (id) => {
    definirDoacoes(await excluirDoacao(id));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={CORES.superficie} />
      <NavigationContainer theme={TEMA_NAVEGACAO} documentTitle={{ formatter: (opcoes) => `${opcoes.title ?? 'Doações'} | Instituto Mão Amiga` }}>
        <Pilha.Navigator
          initialRouteName="PontosColeta"
          screenOptions={({ navigation }) => ({
            headerTintColor: CORES.primariaEscura,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerShadowVisible: false,
            headerBackTitle: 'Voltar',
            headerBackVisible: false,
            headerLeft: ({ canGoBack }) => canGoBack ? <Botao titulo="Voltar" variante="texto" aoPressionar={() => navigation.goBack()} style={{ paddingHorizontal: 8 }} /> : null,
            headerStyle: { backgroundColor: CORES.superficie },
            contentStyle: { backgroundColor: CORES.fundo },
          })}
        >
          <Pilha.Screen name="PontosColeta" component={TelaPontos} options={{ title: 'Instituto Mão Amiga' }} />
          <Pilha.Screen name="DetalhePonto" component={TelaDetalhePonto} options={{ title: 'Ponto de coleta' }} />
          <Pilha.Screen name="FormularioDoacao" options={{ title: 'Cadastrar doação' }}>
            {(props) => <TelaFormularioDoacao {...props} doacoes={doacoes} aoSalvar={registrarDoacao} estaCarregando={esta_carregando} erroCarregamento={erro_carregamento} />}
          </Pilha.Screen>
          <Pilha.Screen name="HistoricoDoacoes" options={{ title: 'Minhas doações' }}>
            {(props) => <TelaHistoricoDoacoes {...props} doacoes={doacoes} estaCarregando={esta_carregando} erroCarregamento={erro_carregamento} aoRecarregar={recarregarDoacoes} />}
          </Pilha.Screen>
          <Pilha.Screen name="DetalheDoacao" options={{ title: 'Detalhe da doação' }}>
            {(props) => <TelaDetalheDoacao {...props} doacoes={doacoes} aoExcluir={removerDoacao} />}
          </Pilha.Screen>
        </Pilha.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

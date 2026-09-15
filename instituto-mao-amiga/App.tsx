import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaListaPontos, { type Ponto } from '../TelaListaPontos';
import TelaDetalhePonto from '../TelaDetalhePonto';
import TelaCadastroDoacao from '../TelaCadastroDoacao';

export type RootStackParamList = {
  ListaPontos: undefined;
  DetalhePonto: { ponto?: Ponto };
  CadastroDoacao: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ListaPontos">
          <Stack.Screen name="ListaPontos" component={TelaListaPontos} />
          <Stack.Screen name="DetalhePonto" component={TelaDetalhePonto} />
          <Stack.Screen
            name="CadastroDoacao"
            component={TelaCadastroDoacao}
            options={{ title: 'Registrar doação' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './instituto-mao-amiga/App';
import { pontosMock, Ponto } from './TelaListaPontos';


function DetalhePonto({ ponto }: { ponto: Ponto }) {
    return (
        <View style={styles.container}>
            <Text style={styles.nome}>{ponto.nome}</Text>
            <Text style={styles.endereco}>{ponto.endereco}</Text>
            <Text style={styles.diasHorarios}>{ponto.diasHorarios}</Text>
            <Text style={styles.recebeDistribui}>{ponto.recebeDistribui}</Text>
        </View>
    );
}

export default function TelaDetalhePonto({ route }: { route: any }) {
    const { pontoId } = route.params;
    const ponto = pontosMock.find((p) => p.id === pontoId);

    if (!ponto) {
        return (
            <View style={styles.container}>
                <Text>Ponto não encontrado.</Text>
            </View>
        );
    }

    return <DetalhePonto ponto={ponto} />;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
    nome: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1B3A5C', marginBottom: 12 },
    endereco: { fontSize: 15, textAlign: 'center', color: '#333', marginBottom: 8 },
    diasHorarios: { fontSize: 14, textAlign: 'center', color: '#555', marginBottom: 8 },
    recebeDistribui: { fontSize: 14, fontWeight: '600', textAlign: 'center', color: '#2E7D32', marginTop: 8 },
});
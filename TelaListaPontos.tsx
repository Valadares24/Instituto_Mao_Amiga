import { useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type Ponto = {
    id: string;
    nome: string;
    endereco: string;
    diasHorarios: string;
    recebeDistribui: string;
};

export const pontosMock: Ponto[] = [
    {
        id: '1',
        nome: 'Ponto de Coleta Setor Bueno',
        endereco: 'Rua T-30, nº 1200, Setor Bueno, Goiânia-GO, CEP 74223-060',
        diasHorarios: 'Segunda a sexta, das 8h às 17h',
        recebeDistribui: 'Recebe roupas e calçados; distribui cestas básicas',
    },
    {
        id: '2',
        nome: 'Ponto de Coleta Vila Nova',
        endereco: 'Avenida Anhanguera, nº 3400, Vila Nova, Goiânia-GO, CEP 74643-030',
        diasHorarios: 'Sábados, das 7h às 12h',
        recebeDistribui: 'Recebe alimentos não perecíveis; distribui cestas básicas',
    },
    {
        id: '3',
        nome: 'Ponto de Coleta Setor Campinas',
        endereco: 'Rua 3, nº 450, esquina com Avenida Goiás, Setor Campinas, Goiânia-GO, CEP 74513-090',
        diasHorarios: 'Terça, quinta e sábado, das 9h às 15h',
        recebeDistribui: 'Recebe roupas de inverno e cobertores; distribui agasalhos',
    },
    {
        id: '4',
        nome: 'Ponto de Coleta Setor Sul',
        endereco: 'Avenida 85, nº 1500, Setor Sul, Goiânia-GO, CEP 74083-005',
        diasHorarios: 'Segunda, quarta e sexta, das 14h às 18h',
        recebeDistribui: 'Recebe brinquedos e material escolar; distribui kits escolares',
    },
    {
        id: '5',
        nome: 'Ponto de Coleta Jardim América',
        endereco: 'Rua 90, nº 320, Jardim América, Goiânia-GO, CEP 74275-110',
        diasHorarios: 'Terça e quinta, das 8h às 12h',
        recebeDistribui: 'Recebe móveis e utensílios domésticos; distribui kits de casa nova',
    },
    {
        id: '6',
        nome: 'Ponto de Coleta Setor Pedro Ludovico',
        endereco: 'Avenida Engler, nº 780, Setor Pedro Ludovico, Goiânia-GO, CEP 74830-070',
        diasHorarios: 'Segunda a sábado, das 9h às 16h',
        recebeDistribui: 'Recebe produtos de higiene pessoal; distribui kits de higiene',
    },
    {
        id: '7',
        nome: 'Ponto de Coleta Setor Coimbra',
        endereco: 'Rua Coimbra, nº 210, Setor Coimbra, Goiânia-GO, CEP 74535-110',
        diasHorarios: 'Quarta e sexta, das 13h às 17h',
        recebeDistribui: 'Recebe cobertores e agasalhos; distribui kits de inverno',
    },
    {
        id: '8',
        nome: 'Ponto de Coleta Setor Marista',
        endereco: 'Rua 9, nº 1330, Setor Marista, Goiânia-GO, CEP 74150-030',
        diasHorarios: 'Sábados e domingos, das 8h às 13h',
        recebeDistribui: 'Recebe alimentos e roupas; distribui cestas básicas e roupas',
    },
];

function PontoItem({ ponto, navigation }: { ponto: Ponto; navigation: any }) {
    return (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('DetalhePonto', { pontoId: ponto.id })}
        >
            <Text style={styles.nome}>{ponto.nome}</Text>
            <Text style={styles.endereco}>{ponto.endereco}</Text>
        </TouchableOpacity>
    );
}

export default function TelaListaPontos({ navigation }: { navigation: any }) {
    const [tipoItem, setTipoItem] = useState('');
    const [quantidadeInput, setQuantidadeInput] = useState('');
    const [pontoDestino, setPontoDestino] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    function validarCadastro() {
        setSucesso('');

        if (tipoItem.trim() === '') {
            setErro('Informe o tipo do item doado.');
            return;
        }

        const quantidadeNumerica = Number(quantidadeInput.trim());
        if (
            quantidadeInput.trim() === '' ||
            isNaN(quantidadeNumerica) ||
            !Number.isInteger(quantidadeNumerica) ||
            quantidadeNumerica <= 0
        ) {
            setErro('A quantidade precisa ser um número inteiro maior que zero (ex.: 3).');
            return;
        }

        if (pontoDestino.trim() === '') {
            setErro('Informe o ponto de destino da doação.');
            return;
        }

        setErro('');
        setSucesso('Doação registrada com sucesso!');
        setTipoItem('');
        setQuantidadeInput('');
        setPontoDestino('');
        Keyboard.dismiss();
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <FlatList
                        data={pontosMock}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <PontoItem ponto={item} navigation={navigation} />}
                        contentContainerStyle={styles.container}
                        keyboardShouldPersistTaps="handled"
                        ListHeaderComponent={
                            <>
                                <Text style={styles.tituloCadastro}>Cadastrar doação</Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Tipo do item (ex.: roupas, alimentos)"
                                    value={tipoItem}
                                    onChangeText={setTipoItem}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Quantidade (ex.: 3)"
                                    value={quantidadeInput}
                                    onChangeText={setQuantidadeInput}
                                    keyboardType="number-pad"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ponto de destino (ex.: Ponto de Coleta Setor Bueno)"
                                    value={pontoDestino}
                                    onChangeText={setPontoDestino}
                                />

                                {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
                                {sucesso !== '' && <Text style={styles.sucesso}>{sucesso}</Text>}

                                <TouchableOpacity style={styles.botaoCadastrar} onPress={validarCadastro}>
                                    <Text style={styles.botaoCadastrarTexto}>Registrar doação</Text>
                                </TouchableOpacity>

                                <Text style={styles.tituloLista}>Pontos de coleta</Text>
                            </>
                        }
                    />
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    container: { alignItems: 'center', padding: 16 },
    tituloCadastro: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, alignSelf: 'flex-start' },
    input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 6, padding: 10, fontSize: 14, width: '100%', marginBottom: 8, minHeight: 44 },
    erro: { color: '#C62828', fontSize: 13, marginBottom: 8, alignSelf: 'flex-start' },
    sucesso: { color: '#2E7D32', fontSize: 13, marginBottom: 8, alignSelf: 'flex-start' },
    botaoCadastrar: { backgroundColor: '#1B3A5C', padding: 12, borderRadius: 6, alignItems: 'center', width: '100%', marginBottom: 24, minHeight: 44, justifyContent: 'center' },
    botaoCadastrarTexto: { color: '#fff', fontWeight: 'bold' },
    tituloLista: { fontSize: 16, fontWeight: 'bold', color: '#1B3A5C', marginBottom: 12, alignSelf: 'flex-start' },
    item: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', width: '100%', minHeight: 44, justifyContent: 'center' },
    nome: { fontSize: 16, fontWeight: 'bold', color: '#1B3A5C', textAlign: 'center' },
    endereco: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 4 },
});
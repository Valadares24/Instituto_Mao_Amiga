import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function TelaCadastroDoacao() {
  const [tipoItem, setTipoItem] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [pontoDestino, setPontoDestino] = useState('');
  const [erro, setErro] = useState('');

  function validarERegistrar() {
    if (tipoItem.trim() === '') {
      setErro('Informe o tipo do item doado.');
      return;
    }
    if (isNaN(Number(quantidade)) || Number(quantidade) <= 0) {
      setErro('A quantidade precisa ser um número maior que zero.');
      return;
    }
    if (pontoDestino.trim() === '') {
      setErro('Informe o ponto de destino da doação.');
      return;
    }
    console.log('Doação registrada:', { tipoItem, quantidade: Number(quantidade), pontoDestino });
    setTipoItem('');
    setQuantidade('');
    setPontoDestino('');
    setErro('');
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Tipo do item" value={tipoItem} onChangeText={setTipoItem} />
      <TextInput style={styles.input} placeholder="Quantidade" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Ponto de destino" value={pontoDestino} onChangeText={setPontoDestino} />
      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
      <Button title="Registrar doação" onPress={validarERegistrar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, padding: 10, marginBottom: 8 },
  erro: { color: '#C62828', marginBottom: 8 },
});
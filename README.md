# Instituto Mão Amiga

Aplicativo educacional em React Native com Expo e JavaScript/JSX para Android, iOS e web. Você pode consultar pontos de coleta demonstrativos e cadastrar, consultar, editar, excluir e buscar doações. O histórico é salvo localmente com AsyncStorage.

## Executar o projeto

Requisitos: Node.js compatível com a versão do Expo do projeto e pnpm disponível no terminal. As versões das dependências estão em `package.json`; o arquivo de trava do pnpm permite reproduzir a instalação.

Na pasta do projeto:

```powershell
cd C:\Users\Santri\Desktop\instituto_mao_amiga
pnpm install
pnpm start
```

### Android e iPhone com Expo Go

1. Instale uma versão do Expo Go compatível com o SDK do projeto.
2. Conecte computador e aparelho à mesma rede.
3. Execute `pnpm start` e use o QR code exibido pelo Expo. No Android, abra o leitor do Expo Go; no iPhone, use a câmera.
4. Mantenha o servidor de desenvolvimento em execução durante o uso.

Se a rede impedir a conexão local, use `pnpm exec expo start --tunnel`. O Expo poderá solicitar uma dependência para o túnel.

Para abrir um emulador Android configurado no computador, execute `pnpm android`. O comando `pnpm ios` abre o simulador de iOS em um Mac configurado; no Windows, teste iOS em um iPhone com Expo Go.

### Navegador

No Windows, você também pode abrir `iniciar-web.cmd` com dois cliques. Ele encontra o pnpm instalado e, neste computador, pode usar o runtime disponível no Codex.

```powershell
pnpm web
```

Abra o endereço apresentado pelo Expo. Use o mesmo endereço, porta e perfil de navegador ao verificar a persistência: cada origem do navegador possui seu próprio armazenamento.

### Comandos disponíveis

| Comando | Finalidade |
|---|---|
| `pnpm start` | Iniciar o servidor do Expo e mostrar as opções de abertura. |
| `pnpm android` | Iniciar o Expo para Android. |
| `pnpm ios` | Iniciar o Expo para iOS; simulador exige macOS. |
| `pnpm web` | Iniciar o aplicativo no navegador. |
| `pnpm test` | Executar os testes automatizados com `node --test`. |
| `pnpm verificar` | Verificar compatibilidade e configuração com Expo Doctor. |
| `pnpm exportar:web` | Gerar a exportação web com `expo export --platform web`. |
| `pnpm exportar:nativo` | Gerar os bundles de Android e iOS com `expo export --platform android --platform ios`. |

A exportação nativa verifica a geração dos bundles; ela não gera um APK ou IPA instalável. Os comandos equivalentes podem ser executados com npm em uma instalação normal de Node que inclua npm: use `npm install`, `npm start` e `npm run <nome-do-script>`. O gerenciador e o arquivo de trava usados nesta entrega são os do pnpm.

## Telas e comportamento

| Tela | Funções |
|---|---|
| Pontos de coleta | Entrada do aplicativo, lista dos três pontos e acesso ao cadastro e ao histórico. |
| Detalhe do ponto | Nome, endereço e descrição demonstrativos; cadastro com o ponto previamente selecionado. |
| Cadastrar / Editar doação | Formulário único com tipo livre, quantidade e seleção do ponto; validação preserva o preenchimento. |
| Minhas doações | Histórico com FlatList, busca enquanto você digita e resumo global. |
| Detalhe da doação | Todos os dados do registro, edição e exclusão com confirmação. |

Ponto Centro, Ponto Norte e Ponto Sul têm endereços e descrições fictícios. O histórico começa vazio. Após salvar um cadastro, o aplicativo abre o histórico atualizado. Após editar, retorna ao detalhe atualizado. Cancelar um formulário retorna à origem sem gravar. A exclusão retorna ao histórico depois da confirmação e da gravação bem-sucedida.

A busca considera trechos do tipo de item, sem distinguir maiúsculas e minúsculas. Limpar a busca recupera a lista completa. O resumo sempre utiliza todas as doações, mesmo com uma busca ativa: exibe o número de registros e, por tipo, unidades e número de doações, em ordem decrescente de quantidade. Tipos como `Roupa` e `roupa`, com espaços excedentes, pertencem ao mesmo grupo; `roupa` e `roupas` são grupos distintos.

## Dados e decisões técnicas

Cada registro possui o contrato:

```js
{ id, tipoItem, quantidade, pontoDestino, criadoEm }
```

| Campo | Significado |
|---|---|
| `id` | UUID do registro, criado uma única vez. |
| `tipoItem` | Texto obrigatório, sem espaços excedentes nas extremidades. |
| `quantidade` | Número inteiro positivo; vazio, letras, zero, negativos e frações são rejeitados. |
| `pontoDestino` | Identificador de um ponto do catálogo; a interface apresenta seu nome. |
| `criadoEm` | Data e hora originais em ISO, exibidas em português do Brasil. |

A edição preserva `id` e `criadoEm`, atualizando o registro sem criar uma cópia. O histórico apresenta primeiro os cadastros mais recentes.

- `src/armazenamento/doacoesStorage.js` concentra o acesso ao AsyncStorage e expõe `listarDoacoes()`, `salvarDoacao(doacao)`, `atualizarDoacao(doacao)` e `excluirDoacao(id)`. As telas não acessam AsyncStorage diretamente.
- O estado compartilhado na raiz alimenta as telas por props. O detalhe recebe a doação em `route.params` e consulta seu identificador no estado atualizado para refletir edições.
- Salvar e excluir aguardam a gravação antes de atualizar a interface ou indicar sucesso. Durante uma gravação, ações repetidas ficam indisponíveis. Falhas são apresentadas em português.
- A lista filtrada e os totais são calculados a partir do histórico completo; não são persistidos nem mantidos como cópias independentes no estado.
- A FlatList usa o `id` como chave, com componente separado para cada item e `React.memo`.
- React Navigation Native Stack organiza as cinco telas. Safe areas, Flexbox e proteção contra o teclado atendem tamanhos diferentes. Os controles têm alvo de toque mínimo de 44×44.
- Android e iOS usam `Alert.alert` para confirmar a exclusão. A web usa um diálogo acessível com as mesmas ações “Cancelar” e “Excluir”.

Dependências principais: Expo, React, React Native, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-native-async-storage/async-storage`, `react-native-screens`, `react-native-safe-area-context`, `expo-crypto`, `react-dom`, `react-native-web` e `@expo/metro-runtime`.

O armazenamento é separado por instalação e por origem/perfil de navegador. Não há backend, conta de usuário ou sincronização entre dispositivos. Limpar os dados da instalação ou do navegador remove o histórico local.

## Validar a entrega

Execute `pnpm test`, `pnpm verificar`, `pnpm exportar:web` e `pnpm exportar:nativo`. Testes e exportação não substituem o uso em aparelhos para verificar teclado, navegação e acessibilidade.

A implementação passou em 28 testes automatizados, 21 verificações do Expo Doctor e nas exportações web, Android e iOS. Os fluxos web foram exercitados em 320×720 e 768×720. Consulte o [registro de validação](docs/validacao.md) para as evidências e os limites de cada teste.

| Cenário | Android | iOS | Web |
|---|---|---|---|
| Consultar os três pontos e voltar ao ponto correto | Pendente | Pendente | Aprovado |
| Histórico vazio permite iniciar o cadastro | Pendente | Pendente | Aprovado |
| Cadastrar três doações e preservar os registros anteriores | Pendente | Pendente | Aprovado |
| Validar vazio, letras, zero, negativos e frações sem apagar campos | Pendente | Pendente | Aprovado |
| Detalhe mostra tipo, quantidade, destino, ID e data corretos | Pendente | Pendente | Aprovado |
| Editar preserva ID e data; cancelar preserva os valores | Pendente | Pendente | Aprovado |
| Excluir: cancelar preserva; confirmar remove e atualiza os totais | Pendente | Pendente | Aprovado |
| Busca por trecho e caixa; limpar restaura; vazio cita a busca | Pendente | Pendente | Aprovado |
| Resumo global agrupa e ordena corretamente após mudanças | Pendente | Pendente | Aprovado |
| Fechar realmente e reabrir conserva o histórico restante | Pendente | Pendente | Parcial: nova aba; processo do navegador pendente |
| Histórico, detalhe e edição em dois tamanhos, sem cortes | Pendente | Pendente | Aprovado |
| Formulário e busca visíveis com teclado aberto; alvos ≥44×44 | Pendente | Pendente | Alvos aprovados; teclado virtual pendente |
| Leitor de tela e, na web, teclado/diálogo de confirmação | Pendente | Pendente | Teclado/diálogo aprovados; leitor de tela pendente |

Use, por exemplo, uma tela estreita de celular e uma tela larga de tablet/computador; registre os tamanhos efetivamente testados. Aumente o texto nas configurações do aparelho e verifique se o conteúdo continua acessível por rolagem. Para a persistência, encerre o aplicativo no aparelho ou feche e reabra o navegador na mesma origem; apenas voltar entre telas não testa a recuperação do armazenamento.

O [roteiro de demonstração](docs/roteiro-demonstracao.md) cobre os fluxos em até três minutos, com uma explicação técnica curta.

## Relação com a documentação acadêmica

A entrega atende às capacidades das issues #08 a #14: histórico persistente, listagem, detalhe/exclusão, edição, filtro, resumo e acabamento/demonstração. Também inclui a base ensinada nas aulas anteriores: pontos, navegação, formulário validado e responsividade.

Os anexos sobre produtos, favoritos e revisão em pares são referências didáticas, sem funcionalidades adicionais no aplicativo. Abrir ou fechar issues, criar commits acadêmicos e enviar atividades ao Classroom são ações separadas. O projeto não inclui mapas, imagens, gráficos, filtros combinados ou histórico de alterações.

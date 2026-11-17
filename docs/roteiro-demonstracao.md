# Roteiro de Demonstração — Instituto Mão Amiga (até 3 minutos)

## Preparação (antes de começar o cronômetro)

1. Terminal 1 — API Spring Boot rodando com Java 17:
   ```powershell
   cd api
   .\mvnw.cmd spring-boot:run
   ```
2. Terminal 2 — App Expo rodando (navegador ou Expo Go na rede local):
   ```powershell
   pnpm web
   ```
3. Deixar aberta uma aba do Swagger UI em `http://localhost:8080/swagger-ui.html`.

---

## Sequência Cronometrada (2m45s — dentro do limite de 3 minutos)

### 1. Pontos de Coleta: buscar, cadastrar, editar e excluir (~55s)
1. **Buscar (10s):** Na tela inicial (`Pontos de coleta`), digitar `Bueno` no campo de busca; mostrar a filtragem pela API retornando os 3 pontos do Setor Bueno e limpar a busca para mostrar a lista paginada com rolagem infinita (`25` locais).
2. **Cadastrar (15s):** Tocar em **Novo ponto**, preencher Nome (`Ponto Demonstração Centro`), Endereço (`Av. Goiás, 500`), Bairro (`Centro`), Horário (`Seg a Sex, 8h às 17h`), selecionar o tipo **Coleta** (`TouchableOpacity`) e tocar em **Cadastrar ponto**. Confirmar que o novo ponto aparece na lista sem fechar o app.
3. **Editar (15s):** Abrir o ponto criado, tocar em **Editar ponto**, alterar o tipo para **Distribuição** e o horário para `Seg a Sáb, 9h às 16h`, e tocar em **Salvar alterações**. Confirmar os valores novos no detalhe e na lista.
4. **Excluir (15s):** No detalhe do ponto, tocar em **Excluir ponto**, confirmar em **Excluir** (`Alert.alert` / diálogo de confirmação) e mostrar que o ponto sumiu da lista.

### 2. Favoritos e "Meus pontos" (~35s)
1. Na lista principal, tocar no coração (`♡` → `♥`) de dois pontos (ex.: `Ponto de Coleta Setor Bueno` e `Casa de Apoio Praça Cívica`).
2. Abrir **Meus pontos** e mostrar que os pontos favoritos foram buscados na API pelo `id` salvo no `AsyncStorage`.
3. Recarregar a página/app para demonstrar que os favoritos continuam salvos no aparelho.
4. Tocar em **Desmarcar** em um dos pontos dentro de **Meus pontos** e mostrar que ele sai na hora e atualiza o `AsyncStorage` (e que o coração na lista volta para `♡`).

### 3. Doações: cadastrar, editar e excluir (~50s)
1. **Cadastrar (20s):** Tocar em **Cadastrar doação**, informar Tipo do item (`Roupas de inverno`), Quantidade (`6`), selecionar um ponto da API (`TouchableOpacity` destacado) e tocar em **Salvar doação**. Mostrar a doação nova no topo do histórico (`Minhas doações`, ordenado por `criadoEm DESC`) sem fechar o app.
2. **Editar (15s):** Tocar na doação criada (detalhe busca na API só pelo `id`), tocar em **Editar doação**, alterar a quantidade para `9` e tocar em **Salvar alterações**. Mostrar que `id` e data de cadastro foram preservados e os novos valores aparecem no detalhe e no histórico.
3. **Excluir (15s):** Tocar em **Excluir doação**, confirmar em **Excluir** e mostrar que a doação foi removida do histórico.

### 4. Validação `400` e `404` na API via Swagger UI (~25s)
1. **400 Bad Request:** No Swagger UI (`POST /api/v1/doacoes`), enviar `quantidade: 0` (ou `tipoItem: ""`) e mostrar a resposta **HTTP 400** com a mensagem de validação e sem gravar nada.
2. **404 Not Found:** No Swagger UI (`GET /api/v1/pontos/{id}` ou `GET /api/v1/doacoes/{id}`), enviar `00000000-0000-0000-0000-000000000000` e mostrar a resposta **HTTP 404**.

---

## Decisão Técnica para Explicar na Apresentação

**Por que favoritos ficam no `AsyncStorage` do aparelho (apenas os `id`s) enquanto pontos e doações ficam na API?**

- **Pontos de coleta e doações** são dados compartilhados do instituto, exigem validação no servidor (Bean Validation), paginação/busca no banco e persistência centralizada no H2 em arquivo — por isso vivem na API Spring Boot.
- **Favoritos** são uma preferência individual de cada usuário neste aparelho e o projeto não tem login/autenticação; mantê-los no `AsyncStorage` evita criar contas ou misturar preferências de usuários diferentes no servidor.
- **Por que salvar só os `id`s (e não o objeto completo do ponto)?** Porque se o endereço ou horário de um ponto for editado na API, a tela **Meus pontos** busca os dados atuais pelo `id` e exibe sempre a informação atualizada; e se um ponto for excluído na API (`404`), ele fica de fora sem quebrar a tela.

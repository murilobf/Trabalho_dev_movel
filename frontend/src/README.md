# bookxd — base do frontend

Isso não é mais um mockup — é o esqueleto mínimo pra você construir o app
em cima: router funcional, tema centralizado e só os componentes que
realmente são reaproveitados em qualquer tela. Nada de dado fake, nada de
componente feito sob medida pra um conteúdo específico.

## Estrutura

```
app/
  _layout.tsx           # Stack raiz: carrega as fontes, monta (tabs) + livro/[id]
  (tabs)/
    _layout.tsx          # Tab bar: Início e Perfil
    index.tsx            # casca da tela inicial (placeholder)
    perfil.tsx            # casca da tela de perfil (placeholder)
  livro/
    [id].tsx              # exemplo de rota dinâmica (/livro/1, /livro/2...)

components/
  ScreenContainer.tsx    # SafeAreaView + ScrollView com o layout do theme já aplicado
  AppBar.tsx             # barra de topo (logo + slot esquerdo + avatar opcional)
  Avatar.tsx             # avatar com iniciais

constants/
  theme.ts               # cores, fontes, espaçamento, radius, estilos de layout e texto
```

## O que foi cortado da versão anterior (e por quê)

A versão anterior tinha componentes como `ReadingCard`, `ActivityItem`,
`ReviewCard`, `StatCell`, `BarChart`, `GenreRow` e um `mock-data.ts` cheio
de livros fictícios. Isso é útil pra mostrar uma direção visual, mas é
ruim como base: você acabaria reescrevendo ou jogando fora a maior parte
assim que ligasse dados reais. Ficaram só as três peças que qualquer tela
nova vai usar, sempre:

- **`ScreenContainer`** — todo mundo precisa de SafeAreaView + ScrollView
  com o mesmo fundo/padding.
- **`AppBar`** — toda tela do app mostra a mesma barra de topo.
- **`Avatar`** — vai aparecer em várias telas (perfil, comentários, listas
  de usuário etc.), não só numa.

Tudo que era específico de "livro" ou "estatísticas de leitura" foi
removido — quando você desenhar essas telas de verdade, os componentes
delas nascem a partir do que a tela realmente precisa, não de um mockup
genérico.

## `constants/theme.ts`

Continua sendo a fonte única de verdade pra estilo, só que agora com mais
uma camada:

- `colors`, `fonts`, `spacing`, `radius` — os tokens crus.
- `layout` — os estilos de container repetidos entre telas (já embutido
  no `ScreenContainer`, você raramente vai importar direto).
- `typography` — estilos de texto prontos (`sectionTitle`, `body`,
  `bodySoft`, `caption`, `logo`) pra não recriar `fontFamily`/cor em cada
  tela nova.

Quando uma tela nova precisar de um estilo de texto que ainda não existe
em `typography`, adicione ali — não redeclare fontFamily solto na tela.

## Como estender

1. **Nova tela dentro de uma tab existente**: escreva o conteúdo dentro
   de `<ScreenContainer><AppBar .../> ... </ScreenContainer>`, usando
   `typography` do tema pros textos.
2. **Novo dado real (API/banco)**: busque com `useEffect`/`fetch` (ou
   `@tanstack/react-query`) direto na tela, ou crie um hook em `hooks/`
   — não precisa de mais nenhuma peça de infraestrutura além do que já
   existe aqui.
3. **Componente visual novo e específico** (ex: um card de livro de
   verdade): crie ele quando a tela que o usa já tiver dados reais — aí
   fica claro quais props ele realmente precisa, em vez de adivinhar a
   partir de um mockup.

## Dependências

```bash
npx expo install expo-font expo-splash-screen @expo/vector-icons react-native-safe-area-context
npm install @expo-google-fonts/fraunces @expo-google-fonts/inter
```

(`expo-linear-gradient` não é mais necessário — só era usado pelo `Cover`
do mockup antigo.)

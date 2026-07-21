# Contribuindo

Obrigado por ajudar a melhorar o Item Piles: Symbaroum.

## Antes de começar

- Use uma issue para bugs reproduzíveis e propostas que alterem comportamento ou dados.
- Não inclua conteúdo protegido de livros ou módulos oficiais, como textos integrais, imagens ou descrições.
- Preserve o ID `item-piles-symbaroum` e a compatibilidade com Foundry VTT 13 e 14.
- Não altere ou remova dados de mundo silenciosamente.

## Ambiente

Use Node.js 20 ou mais recente:

```bash
npm ci
npm run validate:release
npm run build
```

O projeto usa ES Modules, Svelte 4 e Vite 5. Siga os padrões existentes e evite dependências novas para tarefas que a plataforma ou a linguagem já resolvem.

## Catálogo oficial

Para atualizar as classificações usando módulos de Symbaroum instalados localmente:

```bash
npm run refresh:symbaroum-categories
```

Revise o resumo e os conflitos antes de versionar `src/data/symbaroum-official-item-categories.js`. Relatórios brutos com caminhos e dados locais não devem ser adicionados ao Git.

## Compêndio de serviços

Feche o Foundry VTT antes de executar:

```bash
npm run generate:services
```

O gerador substitui o pack LevelDB. Nunca regenere o compêndio em um mundo real sem backup e nunca versione uma compactação parcial produzida enquanto o Foundry estiver usando o pack.

## Pull requests

Inclua:

- resumo do comportamento alterado;
- arquivos e dados afetados;
- validações executadas;
- teste manual em Foundry VTT 13 e 14, ou a versão ainda não testada;
- capturas apenas quando a mudança for visual.

Não inclua `node_modules`, arquivos `.env`, logs, planilhas locais, contexto de assistentes de IA, pacotes ZIP ou credenciais.

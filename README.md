# Item Piles: Symbaroum

Integração comunitária do **Item Piles** com o sistema **Symbaroum** para Foundry Virtual Tabletop. O módulo mantém as pilhas de saque, recipientes, cofres, comerciantes e trocas do Item Piles e acrescenta moedas, preços, categorias, geradores de estoque, comerciantes e serviços preparados para Symbaroum.

> Projeto não oficial, sem vínculo com Free League Publishing, The Foundry ou os autores de Symbaroum. É necessário possuir e instalar separadamente o sistema e os módulos de conteúdo utilizados em sua mesa.

## Compatibilidade

| Componente | Versão |
| --- | --- |
| Foundry VTT | 13 e 14 |
| Sistema | Symbaroum |
| socketlib | Obrigatório |
| libWrapper | Obrigatório |

O manifesto declara Foundry VTT 13 como versão mínima e Foundry VTT 14 como versão verificada. O módulo não oferece suporte a Foundry VTT 12 ou anterior.

## Instalação

No Foundry VTT, abra **Add-on Modules > Install Module**, cole o endereço abaixo em **Manifest URL** e confirme:

```text
https://github.com/Kciquehn/item-piles-symbaroum/releases/latest/download/module.json
```

Depois, ative no mundo:

1. `Item Piles: Symbaroum`
2. `socketlib`
3. `libWrapper`

O mundo deve utilizar o sistema `symbaroum`. Atualizações instaladas pelo Foundry seguem a versão publicada em **GitHub Releases**, não o conteúdo ainda não lançado da branch `main`.

## Recursos

### Integração com Symbaroum

- Táler/Táleres, Xelim/Xelins e Ortega/Ortegas configurados como moedas do sistema.
- Leitura do custo e da quantidade nos campos nativos dos itens de Symbaroum.
- Preços por intervalo, como `1-5 Ortegas`, resolvidos aleatoriamente ao gerar estoque.
- Pequena variação de preço por unidade para que estoques sucessivos não sejam idênticos.
- Quantidades adequadas ao tipo e à raridade: armas e itens raros aparecem em menor número; consumíveis e mercadorias comuns podem chegar a estoques maiores.
- Compras e vendas de comerciantes registradas no chat quando a saída de transações estiver habilitada nas configurações do Item Piles.

### Grupos comerciais

O módulo inclui **30 grupos de itens** editáveis, entre eles armas comuns e de alta qualidade, armaduras, elixires, artefatos, ferramentas, armadilhas, equipamentos de expedição, recipientes, comida, bebida, vestuário, troféus, animais, transportes, construções e serviços médicos.

- Um item pode pertencer a vários grupos ao mesmo tempo.
- O seletor **Grupos comerciais** aparece na aba **Bônus** da ficha de Item para GMs.
- A opção **Único/Não Comerciável** impede que itens especiais entrem no catálogo de lojas.
- O editor de grupos lista os itens já escolhidos e todos os itens disponíveis no mundo.
- Grupos criados pelo mestre podem ser associados a qualquer categoria de comerciante.

### Catálogo oficial pré-classificado

A versão distribuída contém uma tabela de classificação para itens encontrados nos seguintes módulos oficiais de Symbaroum:

- Symbaroum Core Rulebook
- Symbaroum Adventure Collection
- Symbaroum Monster Codex
- Thistle Hold: Wrath of the Warden
- Symbaroum Game Master's Guide

O catálogo considera itens de compêndio e itens incorporados em Atores. A classificação usa primeiro IDs conhecidos e, quando não há conflito, o nome normalizado como alternativa para reconhecer traduções e cópias importadas. Itens do mundo sem classificação manual recebem os padrões conhecidos ao iniciar o mundo; escolhas personalizadas do mestre são preservadas.

O catálogo distribuído armazena somente identificadores, nomes e grupos comerciais necessários à integração. Ele não redistribui descrições, regras ou imagens dos livros e módulos oficiais.

### Gerador de estoque

Em **Configurações do módulo > Categorias de comerciantes e itens**, o GM pode:

- criar, renomear, duplicar ou remover categorias de comerciantes;
- escolher os grupos que cada comerciante pode vender;
- limitar quantidade de tipos de item e quantidade por item;
- ajustar chance, preço mínimo/máximo e inclusão de itens sem custo;
- limpar ou preservar o estoque existente antes de gerar;
- usar itens já traduzidos e personalizados presentes no mundo.

O módulo fornece **12 comerciantes genéricos** e **43 estabelecimentos inspirados em locais de Symbaroum**. Todos são modelos editáveis: o mestre continua no controle dos grupos e das regras de estoque.

### Serviços

O compêndio **Symbaroum - Serviços** contém **38 itens de serviço** prontos para lojas, incluindo:

- pedágio de Forte do Cardo por perna ou roda;
- hospedagem, aluguel e aquisição de imóveis;
- licenças e taxas de exploração;
- contratação de tropas e guarda-costas;
- alimentação, banho, lavanderia, cartografia, medicina e rituais.

Serviços usam quantidade infinita, permanecem no comerciante após a compra e não podem ser revendidos. Para o pedágio de Forte do Cardo, compre uma unidade por perna, pata ou roda que atravessar o portão; a taxa comercial de 10% continua sendo calculada pelo GM conforme os bens declarados.

## Configuração inicial

1. Ative o módulo e as dependências no mundo de Symbaroum.
2. Recarregue o mundo com um GM conectado para aplicar moedas, grupos e migrações.
3. Abra **Configurações do módulo > Categorias de itens** para revisar os grupos.
4. Abra **Categorias de comerciantes e itens** para escolher ou criar um modelo de loja.
5. Transforme um Ator em comerciante com as ferramentas do Item Piles.
6. Gere o estoque pelo editor do comerciante.

Para exibir transações, habilite a configuração do Item Piles responsável por enviar transferências ao chat. O módulo registra tanto compras quanto vendas realizadas com comerciantes.

## Como a categorização funciona

A ordem de decisão é:

1. grupos definidos manualmente na flag do Item;
2. correspondência segura por ID de item oficial;
3. correspondência segura por nome normalizado;
4. heurísticas conservadoras de tipo, nome, custo e descrição;
5. `Único/Não Comerciável` quando o tipo não deve ser vendido.

Habilidades, poderes, rituais, traços e outros documentos de regra são tratados como não comerciáveis. Quando duas fontes oficiais usam o mesmo ID ou nome para itens com classificações incompatíveis, a alternativa ambígua é omitida para evitar categorização incorreta.

## Dados, permissões e privacidade

- Configurações de comerciantes e grupos são armazenadas nas configurações do mundo.
- Categorias individuais são armazenadas em flags com o namespace `item-piles-symbaroum`.
- Alterações globais de inicialização são executadas por um único GM ativo.
- Ações privilegiadas usam os fluxos de Documents do Foundry e a integração socketlib herdada do Item Piles.
- O módulo não adiciona telemetria, anúncios, rastreamento ou chamadas para serviços externos.
- Nenhuma chave, senha ou token deve ser salvo no repositório ou nas configurações do módulo.

Relate vulnerabilidades de forma privada conforme [SECURITY.md](SECURITY.md). Para bugs comuns, use o [rastreador de issues](https://github.com/Kciquehn/item-piles-symbaroum/issues).

## Desenvolvimento

Requer Node.js 20 ou mais recente para reproduzir o ambiente de release.

```bash
npm ci
npm run validate:release
npm run build
```

O build gera `dist/item-piles-symbaroum.js`, `dist/item-piles-symbaroum.js.map` e `dist/item-piles-symbaroum.css`.

Para reconstruir o catálogo a partir de instalações locais dos módulos oficiais:

```bash
npm run refresh:symbaroum-categories
```

O auditor lê cópias dos compêndios oficiais e não escreve nos módulos de origem. Os caminhos locais podem ser ajustados no script de auditoria. Os relatórios brutos são artefatos locais ignorados pelo Git; o mapa final utilizado em runtime fica em `src/data/symbaroum-official-item-categories.js`.

Para regenerar o compêndio de serviços, feche o Foundry VTT antes de executar:

```bash
npm run generate:services
```

Não execute o gerador enquanto o compêndio estiver aberto: os arquivos LevelDB podem ser compactados ou bloqueados pelo Foundry.

## Publicação

Tags no formato `vX.Y.Z` acionam o workflow de release. Ele valida manifesto e versões, recompila o módulo, cria `item-piles-symbaroum.zip` com a pasta raiz correta e publica o ZIP e o `module.json` na mesma GitHub Release.

Antes de criar uma tag, atualize `module.json`, `package.json`, `package-lock.json` e o topo de `changelog.md` para a mesma versão.

## Contribuição

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar alterações. Pull requests devem manter o ID canônico `item-piles-symbaroum`, preservar mundos existentes e passar pelas validações e pelo build.

## Créditos e licença

Este projeto é baseado no [Item Piles](https://github.com/fantasycalendar/FoundryVTT-ItemPiles), criado por Wasp / Fantasy Computerworks. A adaptação para Symbaroum e os recursos específicos deste repositório são mantidos por [Kciquehn](https://github.com/Kciquehn).

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).

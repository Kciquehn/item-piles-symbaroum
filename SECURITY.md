# Política de Segurança

## Versões com suporte

Correções de segurança são publicadas para a versão mais recente disponível em GitHub Releases. Versões antigas podem deixar de receber correções depois que uma atualização compatível estiver disponível.

## Como relatar uma vulnerabilidade

Não publique detalhes exploráveis em uma issue aberta.

1. Use **Security > Report a vulnerability** no repositório, quando essa opção estiver disponível.
2. Se o relatório privado não estiver habilitado, abra uma issue curta solicitando um canal privado, sem incluir payloads, dados de mundos, tokens, senhas ou instruções de exploração.
3. Informe a versão do módulo, a versão exata do Foundry VTT, o sistema Symbaroum, o papel do usuário afetado e os passos mínimos para reproduzir.

O mantenedor avaliará o impacto, confirmará o recebimento e publicará a correção e os créditos em comum acordo com a pessoa que relatou.

## Escopo

São especialmente relevantes:

- execução de ações de GM por jogadores sem permissão;
- alteração, remoção ou exposição indevida de Documents;
- injeção de HTML ou script por nomes e descrições de itens;
- abuso de sockets, macros ou payloads de comércio;
- vazamento de informações privadas do mundo;
- comprometimento do workflow ou dos artefatos de release.

Problemas exclusivamente presentes no Item Piles original, socketlib, libWrapper, no sistema Symbaroum ou no Foundry VTT devem ser relatados também ao projeto responsável.

## Operação segura

- Instale somente pelo manifesto oficial indicado no README.
- Mantenha Foundry VTT, Symbaroum, socketlib e libWrapper atualizados.
- Conceda o papel de GM apenas a usuários confiáveis.
- Revise macros associadas a pilhas e itens antes de permitir seu uso.
- Use `npm run dev` somente em uma interface local e nunca exponha o servidor de desenvolvimento Vite a redes não confiáveis.
- Faça backup do mundo antes de atualizações importantes ou regeneração de compêndios.

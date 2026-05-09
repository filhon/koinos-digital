# FEATURES NOS MÓDULOS EXISTENTES

---

## Homepage

1. Adicionar uma seção de feedbacks reais (trazer autoridade e validação), antes da seção de pricing.
2. A seção deve apresentar os feedbacks do tipo elogio que tenham a permissão do usuário.
3. A seção deve ser um carrocel de rolagem infinita com vários cards.
4. O card deve ser montado com a foto do usuário, o título e o texto.
5. Deve haver uma análise da qualidade do texto e a quantidade de caracteres também. Isso pode ser feito com IA, mas sem modificar o texto escrito pelo usuário, apenas corrigi-lo e retirar um trecho impactante para exibição.
6. Se não houver nenhum feedback elogioso, ocultar a seção.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.** Depende do módulo Feedbacks existir primeiro e de ter massa de dados (elogios reais). Sem igrejas ativas, essa seção ficaria vazia. Focar nela pós-lançamento, quando houver dados reais.

---

## Sidebar e proteção de rotas

1. Se um membro não deve possuir acesso à páginas que só a liderança pode acessar, ele não deve enxergar o link na sidebar. Por exemplo, um usuário do tipo membro não pode executar nenhuma ação na página Membros. Então, ele não deve enxergar o link na sidebar e essa rota deve ser protegida para ele não entrar (redirecionamento para a última página acessada).

> [IA] **Classificação MVP: ESSENCIAL.** Já existe a matriz de permissões no `permissions.ts` com 8 roles e permissões por módulo. Porém, a sidebar renderiza todos os links independente do role. A proteção de rotas no middleware também precisa ser verificada. Isso é **crítico para o MVP** — membros comuns não podem ver links de módulos como Financeiro, Assembleia ou Configurações. A implementação é de baixo esforço (filtrar os items da sidebar com base no role do JWT) e alto impacto na percepção de qualidade.

> [IA] **Pergunta:** O redirecionamento deve ser para a última página acessada (requer armazenar state) ou para o `/dashboard` (início)? Redirecionar para `/dashboard` é mais simples e evita edge cases.

**Resposta:** Pode ser para o /dashboard. Vamos manter simples.

---

## Início

1. A tela de início deve ser convertida num feed imbuido de um algoritmo de relevância (o usuário poderá escolher a visualização entre os posts mais relevantes ou por ordem cronológica).
2. O que deve ser exbido: os posts públicos da igreja que o membro segue e os posts dos irmãos.
3. O feed deve ter rolagem infinita cursor-based.
4. A versão web deve exibir os widgets de próximos eventos, leitura bíblica e atalhos na lateral esquerda, e o feed na lateral direita.
5. A versão mobile deve exibir somente o feed.
6. Somente o pastor e os presbíteros terão a possibilidade publicar publicamente pela igreja. Haverá um seletor Igreja / você.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO (versão completa) / PARCIAL (versão simplificada).**
>
> A versão completa depende de funcionalidades que ainda não existem: seguir igrejas (módulo Comunhão), conceito de "irmãos", algoritmo de relevância, posts públicos vs privados. Isso é um ecossistema social completo.
>
> **Sugestão para o MVP:** Manter a tela de início como um dashboard informativo simples — próximos eventos, posição na Liga, atalhos rápidos. O feed social é um passo para depois de validar o core (gestão da igreja). Isso evita construir infraestrutura social antes de ter massa de usuários.
>
> [IA] **Pergunta:** No MVP, o que faz mais sentido como tela inicial — um dashboard com widgets informativos (próximos eventos, streak de leitura, posição na liga) ou já começar com um feed? Se o objetivo é validação, talvez o dashboard informativo gere mais valor imediato do que um feed que depende de conteúdo gerado pelos usuários.

**Resposta:** Você precisa entender que o meu foco é criar uma comunidade. Softwares de gestão para igrejas já existem aos montes. No meu caso, a gestão será só uma consequência da comunidade criada e da interação constante no Koinos. Por isso, já quero lançar o MVP com esses aspectos fortes de comunidade e rede social.

---

## Mural

1. O Mural deve ser convertido em Comunicação.
2. Ele será utilizado para a comunicação interna da igreja, como um quadro de avisos.
3. As lideranças poderão mencionar ministérios e grupos de louvor para que os membros desses ministérios e grupos sejam notificados.
4. Quando a mensagem tiver alguma menção, só deverá ser entregue as pessoas ou grupo de pessoas mencionados, com notificação. Pessoas sem menção, não deverão sequer visuaziar os posts.
5. Quando não houver nenhum menção, a postagem deverá ser entregue para todos os membros da igreja, com notificação.
6. Os posts no módulo Comunicação não serão públicos para o feed inicial, isso é, o pastor ou presbíteros não poderão publicar pela Igreja nesse ambiente.
7. Apenas pastores, presbíteros e diáconos poderão enxergar e criar posts mencionando qualquer ministério ou grupo. Líderes de ministérios ou grupo poderão visualizar e criar posts com menção ao seu ministério ou grupo.

> [IA] **Classificação MVP: PARCIALMENTE ESSENCIAL.**
>
> O Mural já funciona (posts, comentários, reações, rolagem infinita). O rename para "Comunicação" e as menções com visibilidade seletiva são boas, mas adicionam complexidade significativa (filtragem por menção no RLS, UI de menções com autocomplete, notificações push por grupo).
>
> **Sugestão para o MVP:**
>
> - Renomear Mural → Comunicação (trivial, apenas texto)
> - Restringir criação de posts para liderança (pastor, presbítero, diácono, líder) — transforma o módulo num quadro de avisos real
> - Manter a visibilidade para todos os membros da igreja (sem menções seletivas no MVP)
> - Deixar o sistema de menções para a v2
>
> [IA] **Pergunta:** Os membros comuns devem poder comentar nos posts do módulo Comunicação? Ou a comunicação é unidirecional (liderança → membros)?

**Resposta:** Sim, os membros comuns poderão comentar os posts no módulo comunicação.

---

## Agenda

1. Pastores poderão enviar um pedido para incluir um evento na agenda de outras igrejas. Esse evento incluído na agenda de outra igreja viria como um convite para participação. Quando ele fosse compartilhar, ele poderia escolher a igreja do seu círculo e escrever um texto de convite embutido no evento.
2. O Pastor ou presbíteros terão que aceitar o convite para que ele seja incluído na agenda.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.** Depende do módulo Comunhão (rede entre igrejas) que ainda não existe. A agenda funcional de uma única igreja já está implementada com calendário mensal/semanal. Esse recurso é pós-rede, pós-lançamento.

---

# Gamificação

1. O nome gamificação não fica tão bom para visualização do usuário final. Vamos transformar a Gamificação em Liga.
2. A Liga irá evoluir a gamificação atual: teremos uma Liga interna. entre as tribos com os membros da igreja, e uma Liga Geral, entre todas as igrejas que utilizam o sistema.
3. Na nova página app.koinos.digital/liga (que era Gamificação anteriormente), além do que é exibido atualmente, será incluído um widget (card) com o ranking por igrejas.
4. A página será dividida em três colunas: seu progresso na esquerda, no centro pódio das tribos, placar completo e top 10 membros, e na direita pódio das igrejas e top 10 igrejas e widget da igreja do usuário com a posição atual.
5. A pontual da Liga geral será balanceada pela quantidade de membros que são usuários, ou seja, um igreja não deve ser beneficiada somente porque ela tem mais membros cadastrados. Deverá haver um peso equilibrado para todos.

> [IA] **Classificação MVP: PARCIALMENTE ESSENCIAL.**
>
> O rename Gamificação → Liga é trivial e melhora a experiência. O sistema de gamificação já está robusto (12 tribos, pontos, streaks, badges, leaderboards). A Liga interna já funciona.
>
> **Sugestão para o MVP:**
>
> - Renomear para Liga (rota `/liga`, sidebar, textos) — baixo esforço, alto impacto na identidade
> - Manter apenas a Liga interna (entre tribos da mesma igreja) — já implementada
> - A Liga Geral (entre igrejas) só faz sentido com múltiplas igrejas ativas — adiar para pós-lançamento
>
> [IA] **Sobre o balanceamento (item 5):** Uma fórmula simples seria `pontuação_normalizada = total_pontos / total_membros_ativos`. Isso penaliza igrejas grandes com membros inativos e premia igrejas pequenas engajadas. Pode ser refinada com um fator logarítmico para evitar distorções extremas com igrejas de 2-3 membros.

---

# NOVAS FEATURES

---

## Perfil público do usuário

1. No fluxo de cadastro, o usuário deverá escolher um nome de usuário único.
2. O sistema deve sugerir um nome de usuário não utilizado com base no nome do usuário. Ex. Filipe Honório da Silva Santos / nome de usuário: filipehonorio.
3. O usuário terá um perfil público em app.koinos.digital/nome.
4. O perfil público deve seguir a UI de redes sociais modernas, apresentando informações sobre o usuário (foto, nome, igrejas e badges conquistados).
5. O usuário deverá optar por exibir ou não dados sensíveis (e-mail, telefone, data de nascimento, etc.).
6. Deve ser exibido um widget com a posição do usuário na Liga da igreja e a posição da igreja na Liga geral.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.**
>
> O perfil já existe em `/perfil` com edição de dados pessoais, aparência, privacidade e segurança. O perfil **público** é uma feature social que depende de ter um ecossistema de usuários ativo. No MVP, quem vai acessar o perfil público de alguém? Os membros da mesma igreja já se conhecem.
>
> O nome de usuário único no cadastro adiciona atrito ao onboarding (mais um campo para o usuário preencher/decidir), o que é contraproducente para conversão no MVP.
>
> **Sugestão:** Adiar completamente. Quando for implementar o módulo Comunhão e o feed social, aí sim o perfil público se justifica.

**Resposta:** Preciso incluir isso no MVP. Sei que causa mais atrito ao onboarding (novo campo para preencher), mas como eu disse, preciso criar uma comunidade desde o momento 0, então, o perfil público é importantíssimo, mesmo com poucos usuários.

---

## Roadmap público de desenvolvimento

1. Nova rota em koinos.digital/roadmap
2. Referência: roadmap público do AbacatePay ou outros roadmaps públicos

> [IA] **Classificação MVP: INTERESSANTE, MAS NÃO ESSENCIAL.**
>
> Um roadmap público gera transparência e pode ser um diferencial de confiança para pastores avaliando a plataforma. Mas é uma página de marketing, não uma funcionalidade do produto.
>
> **Sugestão:** Se for implementar, usar uma solução simples (página estática com cards de status: planejado / em desenvolvimento / lançado). Não precisa de backend — pode ser hardcoded no MVP e migrar para algo dinâmico depois. Esforço: baixo. Pode ser feito num dia.
>
> [IA] **Sugestão de implementação simples:** Uma página estática em `/roadmap` com 3 colunas (Kanban-style): "Planejado", "Em Desenvolvimento", "Lançado". Cada item é um card com título e descrição curta. Dados hardcoded. Isso já passa profissionalismo.

**Resposta:** Perfeito! Concordo 100%.

---

## Módulo: Comunhão

1. Essa página apresentará igrejas que estão utilizando o sistema num raio definido pelo usuário (definir limite máximo). O objetivo é que as igrejas próximas interajam.
2. Somente o Pastor ou presbítero poderão enviar ou aceitar convites para participar do Círculo.
3. Todos os membros poderão pesquisar por igrejas através do slug normalizado da igreja.
4. Os membros poderão seguir as igrejas e enviar convites para outros membros. Ele se tornarão "irmãos" após o aceite do convite.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.**
>
> Esse módulo é o pilar social do Koinos, mas depende de massa crítica de igrejas. Com poucas igrejas no lançamento, a busca por raio retornaria resultados vazios e a experiência seria frustrante.
>
> **Dependências técnicas:** Geolocalização das igrejas (precisa de lat/lng no cadastro), PostGIS ou busca por raio no Supabase, sistema de follow/unfollow, conceito de "irmãos" (graph social).
>
> **Sugestão:** Adiar para quando houver pelo menos 10+ igrejas ativas. A feature de pesquisar por slug é simples e poderia ser implementada isoladamente como uma "prévia" do módulo.
>
> [IA] **Pergunta:** No cadastro da igreja, o endereço completo já é coletado (rua, cidade, estado, CEP). Vocês planejam usar geocoding (converter endereço → lat/lng) para a busca por raio, ou prefere uma abordagem mais simples como filtro por cidade/estado?

**Resposta:** Isso! Geocoding é a melhor opção, por ser mais preciso.

---

## Módulo: Feedbacks

1. Essa página estará disponível para membros da liderança das igrejas (pastor, presbítero, diácono e líderes).
2. Será uma página simples onde eles poderão dar sugestões, fazer reclamações e elogios.
3. A página deve ser simples em operação e ter os seguintes campos: Tipo, Título, Descrição e Anexos (fotos, vídeos, etc.)
4. Caso o tipo do feedback seja elogio, adicionar um checkbox para o usuário autorizar a divulgação pública.
5. Ficará disponível em app.koinos.digital/feedback

> [IA] **Classificação MVP: RECOMENDADO.**
>
> Módulo simples, de baixo esforço e **alto valor estratégico para o lançamento**. Motivos:
>
> - Coleta feedback real dos primeiros usuários (essencial para iteração rápida pós-MVP)
> - Gera conteúdo para a seção de depoimentos da homepage (item 1 de Homepage)
> - Mostra que vocês se importam com a opinião da liderança
> - Implementação simples: 1 tabela, 1 formulário, 1 listagem
>
> **Sugestão de simplificação para MVP:**
>
> - Sem anexos no MVP (upload de mídia é complexo — storage, compressão, validação). Apenas Tipo + Título + Descrição + checkbox de divulgação.
> - Tipos: Elogio, Sugestão, Reclamação
> - Visível apenas para a liderança (como descrito)
>
> [IA] **Pergunta:** Os feedbacks serão direcionados a quem? À equipe do Koinos (vocês) como produto, ou à liderança da igreja? Se for para vocês, pode ser ainda mais simples — um formulário que salva no banco e vocês consultam pelo admin. Se for intra-igreja, precisa de listagem e gestão dentro do app.

**Resposta:** Os feedbacks serão direcionados à equipe Koinos. Seria muito complicado ter a possibilidade de responder os feedbacks in app?

---

## Módulo: Leitura

1. Esse módulo será carregado com a Bíblia Sagrada na íntegra.
2. Ele alimentará as leituras diárias para efeitos de pontuação na Liga.
3. Após as leituras diárias, os membros usuários deverão responder 5 perguntas de acordo com o texto que ele leu. Essas perguntas serão geradas por IA e serão únicas, ou seja, elas serão geradas uma única vez, armazenadas e distribuídas igualmente para todos os usuários no dia. As perguntas respondidas corretamente gerarão pontos para o usuário.
4. O mesmo texto deverá ser lido por todos os usuários no dia. Isso facilitará a geração das perguntas e a isonomia da gamificação.

> [IA] **Classificação MVP: ESSENCIAL (versão simplificada).**
>
> Esse módulo é o motor de engajamento diário do Koinos — sem ele, a Liga tem poucos eventos de pontuação (check-in + convite apenas). A leitura diária é o que traz o usuário de volta todo dia.
>
> Já existem tabelas no banco: `daily_readings` e `devotion_streaks`. O score_events já prevê `daily_reading` (+10 pts). A infraestrutura está parcialmente pronta.
>
> **Sugestão de MVP simplificado:**
>
> - Carregar um plano de leitura bíblica de 1 ano (existem planos públicos, ex: "Bíblia em 1 ano" com divisão diária — verificar licenciamento)
> - Exibir o texto do dia com um botão "Li" para marcar como lido e ganhar pontos
> - Sem perguntas por IA no MVP (custo de API, complexidade de geração/armazenamento, risco de perguntas de baixa qualidade)
> - As perguntas podem entrar na v2 quando o módulo já tiver sido validado
>
> [IA] **Ponto de atenção:** A Bíblia possui diferentes traduções com diferentes licenças. A ARA (Almeida Revista e Atualizada) e a NVI possuem copyright. A ACF (Almeida Corrigida Fiel) e a ARC (Almeida Revista e Corrigida) são de domínio público em algumas jurisdições. Pesquisar qual tradução pode ser usada legalmente e sem custo.
>
> [IA] **Pergunta:** Vocês já definiram qual tradução bíblica será usada? Isso impacta diretamente se o módulo pode ser lançado ou se depende de licenciamento/parceria.

**Resposta:** A versão será a NVI. Existe uma API pública que retorna os versículos. A documentação está em https://github.com/rribeiro1/bible-edge. Preciso que verifique se está funcionando normalmente ou se é melhor utilizar outro serviço (obter a bíblia em JSON e serví-la localmente).

---

## Página: Docs

1. Criar uma página docs.koinos.digital.
2. Entre outras coisas, gerar documentos para explicar o funcionamento de todos os módulos, para quem se interessar.
3. Essa página também deverá hospedar os termos jurídicos de Privacidade e Uso.

> [IA] **Classificação MVP: PARCIALMENTE ESSENCIAL.**
>
> Os termos jurídicos (Privacidade e Uso) **são obrigatórios para o lançamento** — especialmente com LGPD e coleta de CPF. Eles precisam existir e estar linkados no signup.
>
> A documentação dos módulos é desejável mas não bloqueia o lançamento.
>
> **Sugestão para o MVP:**
>
> - Criar os termos jurídicos como páginas estáticas em `/termos` e `/privacidade` (podem ficar no próprio app, não precisa de subdomínio docs.koinos.digital)
> - Documentação dos módulos pode vir depois, incrementalmente
>
> [IA] **Pergunta:** Os termos jurídicos já existem redigidos? Se não, isso é um bloqueador legal para o MVP. Considerar usar um template adaptado ou consultar um advogado.

**Resposta:** não posso consultar uma advogado agora. Gere um template adaptado para o meu sistema.

---

## Níveis de usuário

1. Conforme o usuário cumpra as tarefas da Liga, ele receberá TLs (Talentos).
2. Ao acumular talentos ele subirá de nível. O nível ficará disponível no seu perfil, ao lado do nome nos seus posts, etc.
3. Pensar na escala de níveis e no nome para cada nível - IA.
4. O usuário poderá comprar itens digitais no Koinos com os Talentos.
5. A compra diminuirá o saldo de Talentos, mas não mudará o nível do usuário.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.**
>
> Os badges já cumprem o papel de progressão visual no MVP (5 badges com critérios claros). O sistema de Talentos como moeda virtual adiciona complexidade significativa (economia virtual, balanceamento, loja) sem resolver um problema real do público-alvo (gestão de igrejas).
>
> **Risco:** Economia virtual mal balanceada pode gerar frustração. Precisa de game design dedicado.
>
> **Sugestão:** Adiar completamente. Validar primeiro se a gamificação simples (tribos, pontos, badges) já gera engajamento suficiente. Se os usuários pedirem mais, aí implementar.

**Resposta:** Como eu já disse algumas vezes, mesmo que eu gaste mais um tempo até lançar o MVP, é muito importante ter os aspectos de comunidade prontos, até em detrimento as funções de gestão. Então, preciso que você planeje a implementação dos níveis de usuário.

---

## Módulo: Loja

1. O usuário poderá comprar itens digitais com os Talentos acumulados.
2. Pensar nos itens e o que pode ser oferecido que valha a pena a retenção do usuário - pegar sugestões com a IA.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.** Depende do sistema de Talentos. Adiar junto com Níveis.

---

## Módulo: Chat em tempo real

1. O usuário poderá visualizar quem está ativo no sistema em tempo real.
2. O usuário poderá conversar com outros usuários online ou deixar mensagens.
3. O usuário poderá adicionar outras pessoas (grupo de chat) na conversa.
4. O histórico dessas mensagens deverão ser preservados.
5. Pensar em como incluir isso na UI do sistema - pegar sugestões com a IA.

> [IA] **Classificação MVP: NÃO PRIORITÁRIO.**
>
> Chat em tempo real é uma das features mais complexas de implementar e manter (Supabase Realtime/websockets, presença, histórico, notificações push, UI de chat). Compete com WhatsApp, que as igrejas já usam para comunicação. O módulo Comunicação (Mural v2) já resolve boa parte da necessidade de comunicação interna.
>
> **Sugestão:** Adiar para muito depois do MVP. Validar primeiro se o módulo Comunicação supre a necessidade. Se não, avaliar se um chat nativo é melhor do que integração com ferramentas existentes.

---

# [IA] ANÁLISE CONSOLIDADA PARA O MVP

## Prioridade ESSENCIAL (bloqueia o lançamento)

| #   | Feature                             | Esforço | Justificativa                                                   |
| --- | ----------------------------------- | ------- | --------------------------------------------------------------- |
| 1   | **Sidebar: ocultar links por role** | Baixo   | Segurança básica e UX. Membros vendo "Financeiro" é antipadrão. |
| 2   | **Proteção de rotas por role**      | Baixo   | Complemento da sidebar. Redirecionar acessos não autorizados.   |
| 3   | **Termos de Uso e Privacidade**     | Médio   | Obrigatório legalmente com LGPD. Bloqueia o lançamento.         |
| 4   | **Renomear Gamificação → Liga**     | Baixo   | Identidade do produto. Trivial de implementar.                  |

## Prioridade RECOMENDADA (agrega valor significativo ao MVP)

| #   | Feature                                            | Esforço | Justificativa                                                         |
| --- | -------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| 5   | **Módulo Feedbacks (simplificado)**                | Baixo   | Canal de feedback dos primeiros usuários + depoimentos.               |
| 6   | **Módulo Leitura (simplificado)**                  | Médio   | Motor de engajamento diário da Liga. Sem isso, a gamificação é fraca. |
| 7   | **Comunicação: restringir criação para liderança** | Baixo   | Transforma o Mural num quadro de avisos real.                         |
| 8   | **Renomear Mural → Comunicação**                   | Baixo   | Clareza do propósito do módulo.                                       |

## Prioridade PÓS-MVP (adiar para após validação)

| #   | Feature                                    | Fase sugerida                       |
| --- | ------------------------------------------ | ----------------------------------- |
| 9   | Homepage: seção de depoimentos             | Após ter feedbacks reais            |
| 10  | Início: feed social com algoritmo          | Após ter massa de usuários          |
| 11  | Comunicação: menções por grupo             | v2 do módulo                        |
| 12  | Agenda: compartilhar eventos entre igrejas | Após módulo Comunhão                |
| 13  | Liga Geral (entre igrejas)                 | Após ter 10+ igrejas                |
| 14  | Perfil público                             | Após módulo Comunhão                |
| 15  | Roadmap público                            | Quando houver tempo (baixo esforço) |
| 16  | Módulo Comunhão                            | Após massa crítica de igrejas       |
| 17  | Leitura: perguntas por IA                  | v2 do módulo Leitura                |
| 18  | Níveis e Talentos                          | Após validar gamificação simples    |
| 19  | Loja digital                               | Após sistema de Talentos            |
| 20  | Chat em tempo real                         | Última prioridade                   |
| 21  | Docs (documentação dos módulos)            | Incremental                         |

---

# [IA] SUGESTÕES ADICIONAIS PARA O MVP

> As sugestões abaixo foram geradas com base na análise do código existente e no que falta para uma experiência coesa no lançamento.

## 1. Notificações: push notifications ou email digest

O sistema de `notifications` já existe no banco, mas não ficou claro se existe entrega ativa (push/email). Para o MVP, pelo menos um **email digest semanal** para os membros (próximos eventos, posição na Liga, posts não lidos) aumentaria retenção significativamente. Push notifications via web (Service Worker) seria o ideal, mas email é mais simples.

**Pergunta:** Já existe envio de notificações por email ou push? Ou as notificações são apenas in-app?

**Resposta:** Acredito que não haja nenhum envio de notificações por e-mail. Vamos implementar isso. O que você acha do OneSignal para notificações por push?

## 2. Onboarding guiado pós-cadastro para pastores

O fluxo de cadastro da igreja coleta dados pessoais + LGPD + dados da igreja. Mas após o cadastro, o pastor cai num dashboard vazio. Um onboarding guiado ("Convide seus primeiros membros", "Crie seu primeiro evento", "Configure seus ministérios") aumentaria drasticamente a ativação.

**Pergunta:** Existe algum tour ou wizard pós-cadastro? Vi um componente `OnboardingTour` no código — ele está funcional?

**Resposta:** Existe um onboarding, mas não é nada funcional. É só uma janela com alguns textos que o usuário vai avançando e pode pular. Ele não aponta para nada, não rastreia nada que o usuário está fazendo. O ideal seria um onboard guiado, com steps e checks a medida que o usuário fosse realizando as etapas.

## 3. Convidar membros: melhorar o fluxo

O sistema de convites por código já existe. Para o MVP, garantir que o pastor possa gerar e compartilhar o link de convite facilmente (copiar link, compartilhar via WhatsApp) é essencial. Esse é o growth loop principal: pastor cadastra → convida membros → membros geram pontos → engajamento.

**Pergunta:** O fluxo de convite está funcional e testado end-to-end? O link gerado é curto e compartilhável?

**Resposta:** Sim, está funcional!

## 4. Mobile responsiveness completa

O sistema é declarado como mobile-first, mas a maioria dos membros de igrejas brasileiras acessará pelo celular. Garantir que **todas** as páginas do MVP estejam responsivas é essencial.

**Pergunta:** Já foi feito um teste completo de responsividade em todas as rotas do dashboard? Existe alguma página que ainda não está adaptada para mobile?

**Resposta:** Sim, todas as páginas estão responsivas.

---

# [IA] PERGUNTAS CONSOLIDADAS

> Respostas a estas perguntas ajudarão a refinar o escopo do MVP e priorizar implementações.

1. **Termos jurídicos:** Já existem termos de Uso e Privacidade redigidos? Sem eles, o lançamento tem risco legal.
2. **Tradução bíblica:** Qual tradução será usada no módulo Leitura? Isso impacta licenciamento.
3. **Feedbacks:** Os feedbacks são para a equipe Koinos ou para a liderança da igreja?
4. **Notificações:** Existe entrega ativa de notificações (email/push) ou são apenas in-app?
5. **OnboardingTour:** O componente de onboarding guiado está funcional?
6. **Comunicação:** Membros comuns poderão comentar nos posts?
7. **Sidebar redirect:** Redirecionar para `/dashboard` ao invés da última página acessada é aceitável?
8. **Responsividade:** Todas as páginas estão responsivas para mobile?
9. **Convites:** O fluxo de convite por link está funcional e testado?
10. **Comunhão (futuro):** Preferem geocoding (endereço → lat/lng) ou filtro simples por cidade/estado?

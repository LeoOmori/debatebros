# Plano de implementação — MVP de debates com personagens históricos

## Objetivo

Construir uma experiência em português na qual uma pessoa escolhe um tema, debate contra uma simulação educativa de um pensador histórico e recebe uma análise de um juiz também selecionado por ela.

O MVP valida uma única hipótese: **as pessoas concluem um debate estruturado e consideram útil a avaliação final**.

## Escopo confirmado

- Público: pessoas curiosas, sem necessidade de formação em filosofia.
- Idioma inicial: português.
- Acesso: sem conta, pagamento ou histórico na nuvem.
- Oponentes iniciais: Nietzsche, Kant, Freud e Jung.
- Juízes iniciais: Sócrates, Aristóteles e Hannah Arendt.
- Formato: abertura, argumento inicial, réplica, tréplica, conclusão e avaliação.
- Persistência: debate atual e último resultado no navegador.
- IA: integração no servidor, com provedor e modelo configurados por ambiente.

## Fora do MVP

- Autenticação, perfis e sincronização entre dispositivos.
- Assinaturas, pagamentos e limites por plano.
- Áudio, avatares animados ou debate multiplayer.
- Ranking, pontos, conquistas ou elementos competitivos globais.
- Personagens criados pela comunidade.
- RAG, banco vetorial ou busca acadêmica automatizada.
- Citações automáticas que não possam ser verificadas.

## Fluxo principal

1. A pessoa entende a proposta e inicia um debate.
2. Escolhe oponente, juiz, tema e lado da tese.
3. Confirma as regras e começa.
4. A interface conduz cada etapa e limita quem pode falar.
5. O personagem responde diretamente ao argumento mais recente.
6. Ao final, um juiz independente avalia a transcrição completa.
7. A pessoa lê o resultado e pode iniciar outro debate.

## Formato do debate

| Etapa | Participante | Objetivo |
| --- | --- | --- |
| Abertura | Personagem | Apresentar sua posição inicial |
| Argumento inicial | Pessoa | Defender sua posição |
| Réplica | Personagem | Responder ao argumento da pessoa |
| Réplica | Pessoa | Responder às objeções do personagem |
| Tréplica | Personagem | Formular a objeção final |
| Conclusão | Pessoa | Apresentar sua defesa final |
| Avaliação | Juiz | Avaliar a transcrição completa |

## Arquitetura proposta

- Next.js com App Router e TypeScript.
- Tailwind CSS para a camada visual.
- Route Handlers para manter credenciais e chamadas de IA no servidor.
- Vercel AI SDK para streaming e abstração de provedor.
- Zod para validar entradas e a avaliação estruturada.
- `localStorage` para recuperação da sessão no MVP.
- Deploy inicial na Vercel.

### Fronteiras do sistema

- **Domínio:** personagens, juízes, temas, turnos e máquina de estados; não depende da interface nem do provedor de IA.
- **Aplicação:** inicia sessões, aceita a fala permitida e avança etapas válidas.
- **IA:** monta prompts, chama o modelo e valida respostas.
- **Interface:** apresenta configuração, debate e relatório.
- **Persistência local:** serializa apenas o estado necessário para retomar a experiência.

## Fases

| Fase | Estado |
| --- | --- |
| 0 — Planejamento e decisões | Concluída |
| 1 — Fundação do domínio | Concluída |
| 2 — Fluxo navegável com dados simulados | Concluída |
| 3 — Motor de debate com IA | Concluída; smoke test real requer chave |
| 4 — Juiz e relatório estruturado | Em andamento; implementação pronta para validação real |
| 5 — Segurança, qualidade e lançamento | Pendente |

### Fase 0 — Planejamento e decisões

**Objetivo:** fixar o que será construído e evitar expansão acidental de escopo.

Entregas:

- Este plano versionado em `docs/`.
- Fluxo, formato, limites e critérios de sucesso documentados.
- Arquitetura inicial e decisões adiadas identificadas.

Critério de conclusão:

- Um implementador consegue explicar a experiência completa e o que não pertence ao MVP.

### Fase 1 — Fundação do domínio

**Objetivo:** representar o debate de forma previsível antes de integrar IA ou desenhar telas finais.

Entregas:

- Projeto Next.js configurado com TypeScript, App Router, Tailwind e lint.
- Tipos para personagem, juiz, tema, participante, turno, sessão e avaliação.
- Catálogo inicial em português.
- Máquina de estados explícita para impedir etapas inválidas.
- Testes unitários das transições.

Critérios de conclusão:

- Todas as etapas têm participante, ação permitida e próxima etapa definidos.
- Não é possível pular ou duplicar uma fala.
- Catálogos usam IDs estáveis e não dependem de componentes React.
- Typecheck, lint e testes passam.

### Fase 2 — Fluxo navegável com dados simulados

**Objetivo:** validar a experiência completa sem custo ou instabilidade de modelo.

Entregas:

- Direção visual confirmada antes da implementação das telas finais.
- Página inicial com proposta e chamada principal.
- Configurador de oponente, juiz, tema e posição.
- Sala de debate responsiva com progresso e instrução da etapa.
- Respostas simuladas para percorrer todo o fluxo.
- Relatório final simulado usando o contrato real de avaliação.
- Recuperação da sessão após atualização da página.

Critérios de conclusão:

- O fluxo completo funciona em 390 px e em desktop.
- A etapa, o participante ativo e a ação esperada são sempre claros.
- Estados vazio, carregando, erro e tentativa novamente estão representados.
- A interface não se comporta como um chat aberto.

### Fase 3 — Motor de debate com IA

**Objetivo:** substituir respostas simuladas por respostas contextuais e controladas.

Entregas:

- Adaptador de provedor configurável por variáveis de ambiente.
- Route Handler protegido para gerar falas do personagem.
- Streaming da resposta para a interface.
- Cápsulas de conhecimento dos quatro personagens.
- Prompt por etapa, com limites de extensão e instruções anti-injeção.
- Validação de entrada, timeout, cancelamento e nova tentativa segura.
- Registro de uso aproximado de tokens e latência sem guardar conteúdo pessoal.

Critérios de conclusão:

- Cada personagem mantém uma posição reconhecivelmente distinta.
- A resposta aborda o argumento mais recente da pessoa.
- O modelo não inventa citações literais.
- Texto do usuário é tratado como conteúdo do debate, não como instrução do sistema.
- Falhas não avançam a máquina de estados nem duplicam falas.

### Fase 4 — Juiz e relatório estruturado

**Objetivo:** transformar a transcrição em feedback útil e explicável.

**Status em 13/09/2026:** implementação concluída. O contrato exige evidência literal verificável para cada nota, a tela exibe esses trechos e há fallback configurável para indisponibilidade do modelo principal. O smoke test real confirmou a fala do oponente e a geração fundamentada do juiz; a conclusão ponta a ponta ainda precisa ser repetida quando a cota do modelo Pro e a capacidade do serviço estiverem disponíveis.

Entregas:

- Endpoint separado para avaliação.
- Schema validado para veredito, notas e recomendações.
- Rubrica comum: clareza, lógica, resposta ao adversário, exemplos e persuasão.
- Prioridades e tom específicos de cada juiz sem alterar arbitrariamente os fatos.
- Evidências extraídas da própria transcrição.
- Tela de relatório com pontos fortes, melhorias, objeção ignorada, possíveis falácias e argumento reescrito.

Critérios de conclusão:

- Uma avaliação inválida nunca chega à interface como resultado concluído.
- Toda nota possui justificativa ligada à transcrição.
- O relatório diferencia empate, vitória da pessoa e vitória do personagem.
- O juiz não reutiliza raciocínio privado nem instruções do oponente.

### Fase 5 — Segurança, qualidade e lançamento

**Objetivo:** tornar o MVP seguro e observável o suficiente para uso público limitado.

**Status em 13/09/2026:** implementação local concluída. Há limites de entrada, bloqueio de concorrência por etapa, rate limiting por instância, métricas sem transcrição, custo estimado, cabeçalhos de segurança, melhorias de acessibilidade e E2E em desktop e viewport móvel. Antes do lançamento público ainda são obrigatórios rate limiting distribuído, chave exclusiva de produção e smoke test real completo do juiz.

Entregas:

- Limites de caracteres e de tamanho da transcrição no cliente e servidor.
- Proteção contra requisições simultâneas e abuso básico.
- Moderação de temas personalizados, se permanecerem habilitados publicamente.
- Acessibilidade por teclado, foco, contraste e anúncios de streaming.
- Testes end-to-end do caminho principal e das falhas críticas.
- Métricas mínimas de funil e feedback sobre a avaliação.
- Medição de custo por debate e orçamento operacional.
- Deploy de produção e documentação das variáveis de ambiente.

Critérios de conclusão:

- Um debate completo tem custo conhecido e aceitável.
- Credenciais nunca são enviadas ao navegador.
- O usuário pode tentar novamente sem reiniciar toda a sessão.
- O caminho principal passa nos testes em viewport móvel e desktop.

## Contratos iniciais

### Avaliação

O relatório deve conter:

- Veredito: pessoa, personagem ou empate.
- Resumo curto.
- Notas de 0 a 10 para cada dimensão da rubrica.
- Justificativa de cada nota.
- Pontos fortes e pontos a melhorar.
- Objeção relevante que não foi respondida.
- Possíveis falácias, sem afirmar certeza quando houver ambiguidade.
- Uma versão melhorada de um argumento da pessoa.
- Uma sugestão de próximo tema ou conceito para estudo.

### Representação histórica

- Cada personagem é apresentado como uma simulação educativa.
- Frases sem fonte não são exibidas como citações literais.
- Cápsulas de conhecimento registram conceitos, posições, objeções e bibliografia básica.
- Precisão histórica tem prioridade sobre teatralidade.

## Testes essenciais

- Cada etapa avança somente para sua sucessora válida.
- Apenas o participante esperado pode adicionar uma fala.
- Uma falha de IA preserva a etapa atual.
- Restaurar uma sessão mantém a ordem e os autores dos turnos.
- IDs inexistentes de personagem, juiz ou tema são rejeitados.
- Notas fora de 0–10 e relatórios incompletos são rejeitados.
- Duplo envio não cria dois turnos.

## Métricas do MVP

- Início de configuração.
- Início de debate.
- Conclusão de cada etapa.
- Chegada ao relatório final.
- Resposta a “Esta avaliação foi útil?”.
- Início de um segundo debate.
- Custo, tokens, duração e taxa de erro por debate.

## Decisões adiadas

- Provedor e modelo de IA, selecionados após um pequeno teste de qualidade e custo.
- Serviço de rate limiting, necessário antes de divulgação pública.
- Analytics, preferencialmente com coleta mínima e sem transcript completo.
- Compartilhamento do resultado, condicionado a uma revisão de privacidade.
- Contas e histórico na nuvem, condicionados a sinais reais de retenção.

## Definição de pronto do MVP

- A experiência completa funciona sem conta.
- Os quatro oponentes e três juízes estão disponíveis.
- O debate não pula nem repete etapas.
- A sessão ativa sobrevive à atualização da página.
- O relatório é estruturado, explicável e baseado na transcrição.
- Erros podem ser recuperados sem perda do debate.
- O produto funciona em mobile e desktop e atende ao mínimo de acessibilidade.
- O custo médio por debate e os limites públicos estão documentados.

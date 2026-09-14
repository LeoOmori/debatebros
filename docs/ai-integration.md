# Integração de IA — Google Gemini

## Estratégia escolhida

O MVP usa o Google Gemini através do Vercel AI SDK. A estratégia balanceada separa as responsabilidades:

- `gemini-3.8-flash` gera as três falas do oponente com baixa latência.
- `gemini-3.1-pro-preview` produz a avaliação estruturada com raciocínio médio.
- Se o modelo de julgamento estiver indisponível ou sem cota, `gemini-3.8-flash` assume a avaliação com raciocínio baixo dentro do mesmo limite total de 45 segundos.
- Ambos os IDs podem ser substituídos por ambiente sem alterar o domínio ou a interface.

Os modelos são padrões atuais, não requisitos permanentes. Antes de produção, o modelo de julgamento em preview deve ser comparado com uma opção estável disponível na conta.

## Configuração

Copie `.env.example` para `.env.local` e preencha:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=sua_chave_do_google_ai_studio
```

A chave é lida somente pelos Route Handlers. Nenhuma variável `NEXT_PUBLIC_*` contém credenciais.

Para percorrer o fluxo sem custo durante o desenvolvimento:

```bash
AI_MOCK_MODE=true
```

## Endpoints

### `POST /api/debate`

- Recebe a sessão atual.
- Valida IDs, limites, ordem dos turnos e etapa declarada.
- Reconstrói a máquina de estados no servidor para rejeitar transcrições forjadas.
- Gera entre 110 e 190 palavras usando a cápsula do personagem.
- Transmite texto UTF-8 progressivamente.
- Usa timeout total de 30 segundos e respeita cancelamento do navegador.

### `POST /api/evaluate`

- Aceita somente uma sessão que chegou legitimamente a `judging`.
- Usa um prompt independente do prompt do oponente.
- Exige saída validada por Zod com cinco notas, justificativas, forças, fraquezas, objeção ignorada, falácias possíveis, argumento melhorado e próximo tema.
- Cada nota inclui um trecho literal verificável de uma fala da pessoa; o domínio rejeita evidência que não apareça na transcrição.
- Retorna metadados básicos de tokens e modelo junto à avaliação.

## Grounding e segurança

- Cada oponente tem uma cápsula curada com perspectiva, compromissos, tensões históricas, voz e obras de referência.
- As cápsulas instruem o modelo a parafrasear e proíbem citações inventadas.
- Freud e Jung não podem diagnosticar o participante.
- Conteúdo do usuário é serializado dentro de uma seção explicitamente não confiável.
- O servidor preserva as configurações de segurança padrão do Gemini.
- Transcrições não são gravadas nos logs; somente ID da sessão, modelo, motivo de término e contagem de tokens.
- O juiz recebe apenas a transcrição e sua rubrica, nunca raciocínio privado do modelo oponente.

## Falhas e recuperação

- Corpo inválido: `400`.
- Transcrição ou etapa inconsistente: `409`.
- Chave ausente: `503` com instrução segura para configuração.
- Falha do provedor: `502` ou encerramento do stream; a interface mantém a etapa e oferece nova tentativa.
- Indisponibilidade do juiz principal: uma única tentativa usa o modelo fallback configurado; erros transitórios do fallback recebem uma nova tentativa dentro do mesmo timeout.
- Uma fala só entra na sessão depois que o stream termina com conteúdo não vazio.

## Smoke test de 13/09/2026

- `gemini-3.8-flash` concluiu uma abertura de Nietzsche em 10,2 segundos, com 456 tokens de entrada e 220 de saída.
- O modelo Pro configurado retornou cota gratuita igual a zero para a chave usada no teste.
- O fallback gerou notas e evidências literais coerentes, revelando que 1.600 tokens eram insuficientes para JSON mais raciocínio; o teto foi corrigido para 3.200 tokens.
- A conclusão ponta a ponta permaneceu bloqueada por respostas `503` de alta demanda do provedor e deve ser repetida antes do lançamento.

## Verificação antes de produção

1. Executar ao menos três debates por combinação relevante de personagem e tema.
2. Confirmar que cada personagem responde ao argumento mais recente e mantém voz distinta.
3. Revisar historicamente uma amostra das respostas.
4. Medir custo, latência, bloqueios de segurança e taxa de retry.
5. Comparar o juiz preview com um modelo estável.
6. Definir rate limiting antes da divulgação pública.

## Referências oficiais

- [AI SDK — Google Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google)
- [AI SDK — Generating and Streaming Text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
- [AI SDK — Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)

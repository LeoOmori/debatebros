# Debates históricos com IA

MVP em português para debates estruturados contra simulações educativas de personagens históricos, com avaliação final de um juiz escolhido pela pessoa.

## Estado atual

 A chamada real ao provedor requer uma chave em `.env.local`.

## Desenvolvimento

Requer Node.js 20.9 ou superior.

```bash
npm install
cp .env.example .env.local
# preencha GOOGLE_GENERATIVE_AI_API_KEY em .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Verificação

```bash
npm test
npm run typecheck
npm run lint
npm run test:e2e
# ou execute toda a verificação:
npm run verify
```

## Estrutura inicial

- `src/app/`: landing page e fluxo de configuração, sessão e resultado.
- `src/domain/`: tipos, catálogos e regras puras do debate.
- `src/lib/`: persistência local e simulador de respostas da Fase 2.
- `src/ai/`: schemas, cápsulas históricas, prompts e configuração Gemini.
- `src/app/api/`: endpoints de streaming e avaliação estruturada.
- `docs/`: decisões e fases de implementação.

Detalhes da integração: [`docs/ai-integration.md`](docs/ai-integration.md).


# Operação e lançamento

## Deploy na Vercel

1. Importe o repositório como projeto Next.js.
2. Configure `GOOGLE_GENERATIVE_AI_API_KEY` somente como variável de servidor.
3. Configure os modelos e limites a partir de `.env.example`.
4. Execute `npm run verify` antes de promover uma versão.
5. Faça um debate sintético no ambiente de preview antes de liberar produção.

Nenhuma credencial pode usar o prefixo `NEXT_PUBLIC_`. `.env.local` é ignorado pelo Git.

## Limites e proteção contra abuso

- O cliente limita cada fala da pessoa a 900 caracteres.
- O servidor valida no máximo seis turnos e 6.300 caracteres de transcrição.
- IDs, datas, sequência, participante e etapa são reconstruídos e validados no servidor.
- Por padrão, cada IP pode iniciar 12 operações de IA por minuto e 30 eventos de produto por minuto.
- Uma mesma sessão e etapa não podem manter duas operações de IA simultâneas na mesma instância.
- Os controles em memória são uma proteção inicial por instância. Antes de tráfego público relevante, habilite Vercel Firewall ou um rate limiter distribuído; não trate o limite local como defesa distribuída.
- Em hospedagem fora da Vercel, aceite `X-Forwarded-For` somente de um proxy confiável ou substitua a resolução de IP do guard.
- Os temas do MVP são curados. Se temas livres forem adicionados, moderação deve entrar antes da chamada ao modelo.

## Observabilidade e privacidade

Os logs de IA contêm operação, ID aleatório da sessão, modelo, fallback, tokens, duração, motivo de término e custo estimado. Não contêm transcrição, posição ou endereço IP. Eventos de funil registram somente:

- debate iniciado;
- debate concluído;
- feedback útil ou não útil;
- IDs curados de personagem, juiz e tema.

O endpoint de métricas aceita apenas esse contrato fechado. Métricas são best effort e nunca bloqueiam o fluxo.

## Custo

As estimativas refletem a tabela oficial consultada em 13/09/2026:

| Modelo | Entrada / 1M tokens | Saída / 1M tokens |
| --- | ---: | ---: |
| `gemini-3.8-flash` | US$ 0,75 | US$ 3,75 |
| `gemini-3.1-pro-preview` | US$ 2,00 | US$ 12,00 |

Tokens de raciocínio fazem parte da saída. A promoção do Flash termina em 31/12/2026; revise `src/ai/observability.ts` e este documento quando preços ou modelos mudarem. O custo de um debate é a soma dos três eventos `debate-turn` e do evento `evaluation` com o mesmo ID de sessão.

## Cabeçalhos e navegador

A aplicação envia CSP, `X-Content-Type-Options`, `X-Frame-Options`, política de referência e política de permissões. A interface oferece foco visível, link para pular conteúdo, foco automático na próxima ação, regiões de status controladas e redução de movimento.

## Resposta operacional

- `429`: aguardar o valor de `Retry-After`; revisar abuso se persistente.
- `409`: já existe uma operação da mesma etapa ou a sessão é inconsistente.
- `502`: provedor indisponível ou saída inválida; a etapa permanece recuperável.
- Aumento de custo: agrupar logs por `sessionId`, conferir tokens de raciocínio e modelo fallback.
- Chave exposta: revogar no Google AI Studio, substituir na Vercel e redeployar.

## Checklist de lançamento

- [ ] Chave exclusiva de produção, com faturamento e cotas confirmados.
- [ ] Smoke test real do julgamento completo.
- [ ] Rate limiting distribuído ou Vercel Firewall habilitado.
- [ ] Alertas para `429`, `502`, duração e custo configurados na plataforma.
- [ ] Política de privacidade publicada conforme o destino dos logs.
- [ ] `npm run verify` aprovado em desktop e viewport móvel.

Referência de preços: [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing).

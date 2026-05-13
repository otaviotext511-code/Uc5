# Football Live — Documentação Técnica
https://github.com/otaviotext511-code/football-club---ao-vivo
## Monitoramento da Copa do Mundo da FIFA: ponta a ponta

> **Versão do sistema:** `0.1.0`  
> **Stack:** Node.js · Express · API-Football (api-sports) · Vanilla JS  
> **Fuso de referência:** `America/Sao_Paulo` (BRT/BRST)

---

## Sumário

1. [Visão geral da arquitetura](#1-visão-geral-da-arquitetura)
2. [Configuração e inicialização](#2-configuração-e-inicialização)
3. [Por que a Copa do Mundo é tratada de forma especial](#3-por-que-a-copa-do-mundo-é-tratada-de-forma-especial)
4. [Adapter — transformando a API em dados internos](#4-adapter--transformando-a-api-em-dados-internos)
5. [Poller — o motor de monitoramento](#5-poller--o-motor-de-monitoramento)
   - 5.1 [Boot do dia e construção de slots](#51-boot-do-dia-e-construção-de-slots)
   - 5.2 [Slots dinâmicos e fusão de janelas](#52-slots-dinâmicos-e-fusão-de-janelas)
   - 5.3 [Ciclo de polling dentro de um slot](#53-ciclo-de-polling-dentro-de-um-slot)
   - 5.4 [Intervalo adaptativo — o papel da prioridade 100](#54-intervalo-adaptativo--o-papel-da-prioridade-100)
   - 5.5 [Mesclagem de dados ao vivo e agendados](#55-mesclagem-de-dados-ao-vivo-e-agendados)
   - 5.6 [Gestão do contador de requisições](#56-gestão-do-contador-de-requisições)
   - 5.7 [Reset automático à meia-noite](#57-reset-automático-à-meia-noite)
6. [Servidor Express — endpoints e proxy de escudos](#6-servidor-express--endpoints-e-proxy-de-escudos)
7. [Frontend — a central de acompanhamento](#7-frontend--a-central-de-acompanhamento)
8. [Fluxo completo num dia de Copa do Mundo](#8-fluxo-completo-num-dia-de-copa-do-mundo)
9. [Casos especiais: prorrogação, pênaltis e múltiplos jogos simultâneos](#9-casos-especiais-prorrogação-pênaltis-e-múltiplos-jogos-simultâneos)
10. [Modo Mock — demonstração sem chave de API](#10-modo-mock--demonstração-sem-chave-de-api)
11. [Mapa de estados do poller](#11-mapa-de-estados-do-poller)
12. [Referência rápida — constantes e limites](#12-referência-rápida--constantes-e-limites)

---

## 1. Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│                                                                 │
│   index.html  ──── fetch /api/matches (a cada 30 s) ────────►  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express  (server.js)                        │
│                                                                 │
│  GET /api/matches   ──► poller.getMatches()                    │
│  GET /api/status    ──► poller.getStatus()                     │
│  POST /api/badges   ──► wikiThumb() + cache 1h                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │  start() / getMatches() / getStatus()
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Poller  (poller.js)                       │
│                                                                 │
│  bootstrapDay()  ──► fixtures?date=HOJE  (1 req/dia boot)      │
│  buildSlots()    ──► janelas de atividade calculadas           │
│  fetchLive()     ──► fixtures?live=all  (5 ou 15 min)          │
│  mergeMatches()  ──► ao vivo ∪ agendados (sem duplicatas)      │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP + x-apisports-key
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Adapter  (adapter.js)                        │
│                                                                 │
│  adaptResponse()  ──► normaliza fixtures brutos               │
│  PRIORITY_MAP     ──► Copa do Mundo → priority 100, interval 5 │
│  STATUS_MAP       ──► ET / P / BT → et / pen / ht             │
│  isClassico()     ──► eleva intervalo de clássicos para 5 min  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   API-Football      │
                    │   (api-sports.io)   │
                    └─────────────────────┘
```

O sistema é composto por **quatro camadas** que se comunicam em sentido único: o frontend só fala com o servidor, o servidor só fala com o poller, e o poller usa o adapter para transformar os dados brutos da API antes de armazená-los em memória.

---

## 2. Configuração e inicialização

### 2.1 Arquivo `.env`

Crie um `.env` na raiz do projeto antes de qualquer execução:

```dotenv
PORT=3000
API_KEY=sua_chave_api_football
MOCK_MODE=false
```

| Variável | Descrição | Padrão se ausente |
|---|---|---|
| `PORT` | Porta HTTP do servidor Express | `3000` |
| `API_KEY` | Chave da API-Football (api-sports.io) | `""` |
| `MOCK_MODE` | `"true"` ativa dados fictícios sem consumir cota | `false` |

> **Ativação automática do modo mock:** se `API_KEY` estiver vazia ou contiver o placeholder `"SUA_CHAVE_AQUI"`, o servidor entra em modo mock independentemente do valor de `MOCK_MODE`. Isso evita erros silenciosos com chave inválida.

### 2.2 Instalação e execução

```bash
# instala dependências (express + dotenv)
npm install

# produção
npm start

# desenvolvimento com hot-reload nativo do Node.js 18+
npm run dev        # node --watch server.js
```

Após o `npm start`, a sequência de inicialização é:

```
⚽  Football Live em http://localhost:3000
    modo: API-Football (chave configurada)

[poller] iniciando — modo: API-Football
[counter] retomando: 71 req já feitos hoje
[boot]  carregando agenda de 2026-06-15...
[boot]  2 slot(s): 12:30–15:30  |  15:30–18:30
[boot]  4 jogos agendados
[reset] reinício automático em 487min (meia-noite)
```

---

## 3. Por que a Copa do Mundo é tratada de forma especial

A tomada de decisão central sobre a Copa do Mundo está em **uma única linha** do `adapter.js`:

```js
const PRIORITY_MAP = {
  'FIFA World Cup': { priority: 100, interval: 5 },
  // ...
};
```

Esses dois valores — `priority` e `interval` — propagam-se pelo sistema inteiro e determinam o comportamento de **cada módulo**. Entender o que cada um faz é entender como a Copa domina o sistema.

### 3.1 `priority: 100` — supremacia na fila

A prioridade é um número inteiro que a interface usa para ordenar e destacar partidas. O maior valor do sistema é `100`, exclusivo da Copa do Mundo.

**Tabela comparativa de prioridades:**

| Competição | Prioridade | Intervalo de polling |
|---|---|---|
| **FIFA World Cup** | **100** | **5 min** |
| Copa America | 95 | 5 min |
| Copa Libertadores | 90 | 5 min |
| Copa Sudamericana | 85 | 5 min |
| UEFA Champions League | 80 | 5 min |
| Copa do Brasil | 75 | 5 min |
| Serie A (Brasileirão) | 70 | 15 min |
| Campeonato Paulista / Carioca | 55 | 15 min |
| La Liga / Premier League | 65 | 15 min |
| Outras competições | 30 | 15 min |

Qualquer jogo da Copa do Mundo aparecerá **acima de qualquer outro jogo** na lista, incluindo clássicos regionais (que ficam no máximo em 90). O frontend usa esse campo diretamente para eleger o jogo em destaque (*featured*).

### 3.2 `interval: 5` — frequência máxima de atualização

O campo `interval` (em minutos) é carregado em cada objeto de partida e consumido por `calcInterval()` no poller. Enquanto **qualquer** partida da Copa estiver ao vivo, o sistema vai a campo a cada **5 minutos**. Se não houver jogo da Copa ao vivo mas houver jogos de outras ligas, o intervalo pode subir para 15 minutos.

---

## 4. Adapter — transformando a API em dados internos

O `adapter.js` é o único ponto do sistema que conhece o formato da API-Football. Ele converte a resposta bruta em objetos padronizados que o resto da aplicação consome.

### 4.1 Função `adaptFixture`

Para cada jogo recebido da API, a função executa os seguintes passos em ordem:

**Passo 1 — leitura da competição**
```js
const league = fix.league?.name ?? '';
// → "FIFA World Cup"
```

**Passo 2 — consulta ao PRIORITY_MAP**
```js
const meta = PRIORITY_MAP[league] ?? { priority: 30, interval: 15 };
// → { priority: 100, interval: 5 }
```

Se a competição não estiver mapeada, recebe prioridade 30 e intervalo de 15 minutos.

**Passo 3 — verificação de clássico**
```js
const interval = isClassico(home, away) ? 5 : meta.interval;
const priority = isClassico(home, away) ? Math.max(meta.priority, 75) : meta.priority;
```

Jogos da Copa do Mundo já são `interval: 5` e `priority: 100`, portanto **a detecção de clássico não altera nada** para a Copa — a Copa já está no nível máximo.

**Passo 4 — normalização de status**

O status bruto da API (`"1H"`, `"ET"`, `"P"`, etc.) é convertido para o status interno via `STATUS_MAP`:

```js
const STATUS_MAP = {
  'NS':   'scheduled',
  '1H':   '1h',
  'HT':   'ht',
  '2H':   '2h',
  'ET':   'et',
  'BT':   'ht',    // intervalo da prorrogação → mesmo status que intervalo normal
  'P':    'pen',
  'FT':   'ft',
  'AET':  'ft',    // após prorrogação → encerrado
  'PEN':  'ft',    // encerrado nos pênaltis → encerrado
  'SUSP': 'susp',
  'INT':  'susp',
  'PST':  'canc',
  'CANC': 'canc',
  'ABD':  'canc',
  'AWD':  'ft',    // vitória administrativa → encerrado
  'WO':   'ft',
  'LIVE': '2h',
};
```

**Passo 5 — tag automática**

```js
tags: ['#' + league.toLowerCase().replace(/\s+/g, '-')]
// → ['#fifa-world-cup']
```

A tag `#fifa-world-cup` é gerada automaticamente para todo jogo do torneio, permitindo busca e filtragem imediata no frontend sem nenhuma configuração extra.

**Passo 6 — montagem do objeto final**

```js
return {
  id, priority, interval,      // campos de controle
  home, away,                  // nomes dos times
  homeLogo, awayLogo,          // URLs de escudo
  sh, sa,                      // placar home / away
  minute,                      // minuto decorrido ou null
  status,                      // status normalizado
  competition, round,          // "FIFA World Cup" / "Group Stage - 3"
  tags,                        // ['#fifa-world-cup']
  events,                      // gols, cartões, substituições
  scheduledTime,               // "13:00" no fuso de Brasília
};
```

### 4.2 Normalização de eventos

Cada evento de jogo (gol, cartão, substituição, VAR) é normalizado pela função `mapEventType`:

```js
function mapEventType(type, detail) {
  // "Goal" → 'goal'  (gol contra tratado igual a gol normal na exibição)
  // "Card" + "Red Card" → 'red'
  // "Card" + "Yellow Card" → 'yellow'
  // "subst" → 'sub'
  // "var" → 'var'
  // qualquer outro → 'note'
}
```

Os eventos resultantes carregam: tipo (`t`), minuto (`m`), lado (`team`: `'home'` ou `'away'`) e nome do jogador (`player`). Esses dados são exibidos como miniaturas na interface.

---

## 5. Poller — o motor de monitoramento

O `poller.js` é o módulo mais complexo do sistema. Ele implementa um ciclo autônomo que:

1. Aprende os horários reais dos jogos do dia consultando a API uma vez ao boot.
2. Constrói janelas de atividade (slots) em torno desses horários.
3. Dorme fora dos slots para não desperdiçar cota de API.
4. Busca dados ao vivo em alta frequência dentro dos slots.
5. Reinicia automaticamente à meia-noite.

### 5.1 Boot do dia e construção de slots

Na primeira execução (ou após a virada de dia), o poller chama `bootstrapDay()`:

```js
async function bootstrapDay() {
  const raw  = await apiFetch(`fixtures?date=${today}`);  // 1 requisição
  const all  = raw?.response ?? [];

  slots     = buildSlots(all);          // janelas calculadas dos horários reais
  scheduled = adaptResponse(raw)        // agendados já adaptados
               .filter(m => ['scheduled','soon'].includes(m.status));
  currentDay = today;
}
```

Esta é a **única** requisição garantida por dia fora dos slots de atividade. Ela serve exclusivamente para saber **quando** os jogos vão acontecer — os dados em si (placar, eventos) são buscados depois, dentro dos slots.

### 5.2 Slots dinâmicos e fusão de janelas

A função `buildSlots` transforma os horários brutos dos jogos em janelas de monitoramento:

**Constantes de configuração:**
```js
const SLOT_BEFORE_MIN = 30;   // acorda 30 min antes do primeiro jogo
const SLOT_AFTER_MIN  = 150;  // fica acordado até 2h30 após o início
const SLOT_GAP_MIN    = 45;   // gaps ≤ 45 min são fundidos
```

**Algoritmo passo a passo:**

```
1. Extrai o horário de início de cada jogo (em minutos desde 00:00, fuso BRT)
2. Cria uma janela individual para cada jogo:
     janela = [início - 30, início + 150]
3. Ordena as janelas cronologicamente
4. Percorre a lista fundindo janelas consecutivas quando o gap entre elas ≤ 45 min
5. Retorna o array de slots [{startMin, endMin}]
```

**Exemplo com jogos da Copa às 13:00, 16:00 e 20:00 (BRT):**

| Jogo | Horário | Janela individual |
|---|---|---|
| Grupo A | 13:00 → 780 min | 750–930 (12:30–15:30) |
| Grupo B | 16:00 → 960 min | 930–1110 (15:30–18:30) |
| Grupo C | 20:00 → 1200 min | 1170–1350 (19:30–22:30) |

Processamento da fusão:
- Janela 1 termina em 930. Janela 2 começa em 930. Gap = 0 ≤ 45 → **fundidas**.
- Slot resultante: 750–1110 (12:30–18:30).
- Slot fundido termina em 1110. Janela 3 começa em 1170. Gap = 60 > 45 → **separadas**.

**Resultado final:**
```
Slot 1: 12:30–18:30   (cobre os jogos de 13:00 e 16:00 sem interrupção)
Slot 2: 19:30–22:30   (cobre o jogo de 20:00)
```

O log no console reflete isso:
```
[boot]  2 slot(s): 12:30–18:30  |  19:30–22:30
[boot]  3 jogos agendados
```

**Verificação de slot ativo (`isSlotActive`):**

```js
function isSlotActive() {
  const m = nowMinBRT();  // minuto atual do dia em BRT
  return slots.some(s => m >= s.startMin && m <= s.endMin);
}
```

### 5.3 Ciclo de polling dentro de um slot

Quando `isSlotActive()` retorna `true`, o poller executa o seguinte fluxo:

```
┌─────────────────────────────────────────────────────────┐
│  Início do ciclo dentro do slot                         │
│                                                         │
│  1. Verifica se é uma nova hora (slotKey = "YYYY-MM-DDThh") │
│     → Se sim: apiFetch(fixtures?date=HOJE)             │
│       Atualiza 'scheduled' com agendados do dia         │
│       (captura mudanças de horário durante o dia)       │
│                                                         │
│  2. apiFetch(fixtures?live=all)                         │
│     → Busca TODOS os jogos ao vivo do mundo             │
│     → Adapter filtra e adapta apenas os relevantes      │
│                                                         │
│  3. mergeMatches(live)                                  │
│     → Combina ao vivo + agendados (sem duplicatas)      │
│                                                         │
│  4. calcInterval()                                      │
│     → Se Copa ao vivo: 5 min                           │
│     → Caso contrário: 15 min                           │
│                                                         │
│  5. setTimeout(poll, interval)                          │
└─────────────────────────────────────────────────────────┘
```

**Detalhe: a atualização horária de agendados**

```js
const slotKey = nowBRT().toISOString().slice(0, 13);
// Ex: "2026-06-15T14" — muda a cada hora cheia
if (lastSlotFetch !== slotKey) {
  // re-busca fixtures?date=hoje
  lastSlotFetch = slotKey;
}
```

Isso garante que, se a Copa ou outra federação alterar o horário de um jogo durante o dia, o sistema captura essa mudança na próxima hora cheia.

### 5.4 Intervalo adaptativo — o papel da prioridade 100

A função `calcInterval()` é o ponto onde a prioridade da Copa se converte em comportamento de tempo real:

```js
function calcInterval() {
  // Filtra apenas jogos efetivamente em andamento
  const live = matches.filter(m =>
    ['1h', '2h', 'et', 'pen', 'ht'].includes(m.status)
  );

  // Sem nenhum jogo ao vivo → polling lento (15 min)
  if (!live.length) return 15 * 60 * 1000;

  // Algum jogo ao vivo com interval:5 → polling rápido
  return live.some(m => m.interval === 5)
    ? 5 * 60 * 1000
    : 15 * 60 * 1000;
}
```

Como todo jogo da Copa tem `interval: 5`, **basta um único jogo da Copa estar em `status: '1h'`, `'2h'`, `'et'`, `'pen'` ou `'ht'`** para o sistema inteiro passar para o ciclo de 5 minutos. Mesmo que haja dezenas de outros jogos de ligas menores ocorrendo ao mesmo tempo, a presença de qualquer Copa ao vivo garante a frequência máxima de atualização.

### 5.5 Mesclagem de dados ao vivo e agendados

```js
function mergeMatches(live) {
  const liveIds = new Set(live.map(m => m.id));
  return [
    ...live,
    ...scheduled.filter(m => !liveIds.has(m.id))
  ];
}
```

O resultado é uma lista única e sem duplicatas onde:
- Jogos **ao vivo** vêm do endpoint `fixtures?live=all` (têm placar e minuto atualizado).
- Jogos **agendados** vêm do bootstrap do dia (têm horário previsto mas sem placar ainda).
- Se um jogo estiver ao vivo, ele **não aparece duas vezes** — a versão ao vivo prevalece.

A ordenação final por prioridade acontece no **frontend**, não no servidor.

### 5.6 Gestão do contador de requisições

A API-Football gratuita fornece **100 requisições por dia**. O sistema impõe um limite interno de **90** para ter margem de segurança:

```js
const REQ_LIMIT = 90;
```

**Persistência via `counter.json`:**

```json
{"day":"2026-06-15","count":34}
```

A cada requisição à API:
1. `reqToday` é incrementado.
2. `saveCounter()` grava o valor em disco imediatamente.
3. `checkCap()` verifica se o limite foi atingido.

Se `reqToday >= 90`:
```js
pollStatus = 'capped';
matches    = [];
nextPollIn = msUntilMidnight();
timer      = setTimeout(poll, nextPollIn);
```

O sistema para completamente e retoma apenas após a meia-noite, quando o contador é zerado.

**Estimativa de consumo num dia de Copa com 3 jogos:**

| Tipo de requisição | Quantidade estimada | Custo em req |
|---|---|---|
| Bootstrap do dia (boot) | 1 | 1 |
| Re-fetch de agendados (1x/hora, durante ~9h de slots) | 9 | 9 |
| Polls ao vivo (5 min × 3 jogos × ~120 min médios por jogo) | ~72 | 72 |
| **Total estimado** | — | **~82** |

Com 82 requisições, ainda há margem antes do limite de 90. Dias com mais jogos simultâneos (como a fase de grupos com 4 jogos diários) podem ultrapassar o limite — nesses casos, o sistema para antes do fim do dia e retoma na meia-noite.

### 5.7 Reset automático à meia-noite

Imediatamente após o bootstrap do dia, o poller agenda um reset para 00:00:01 do dia seguinte (BRT):

```js
function scheduleMidnightReset() {
  const wait = msUntilMidnight();
  midnightTimer = setTimeout(async () => {
    reqToday   = 0;   // zera contador de requisições
    saveCounter();
    matches    = [];
    scheduled  = [];
    slots      = [];
    currentDay = null;
    await poll();     // reinicia o ciclo
  }, wait);
}
```

O campo `currentDay !== todayStr()` na função `poll()` detecta a virada de dia e aciona um novo `bootstrapDay()`, recalculando os slots para a nova data.

---

## 6. Servidor Express — endpoints e proxy de escudos

O `server.js` tem três responsabilidades: servir os arquivos estáticos, expor a API interna para o frontend e fazer proxy de imagens de escudos.

### 6.1 `GET /api/matches`

```
GET /api/matches?q=copa+do+mundo
```

Retorna o estado completo do poller para o frontend. O parâmetro `q` permite filtragem textual server-side:

```js
const filtered = q
  ? matches.filter(m =>
      m.home.toLowerCase().includes(q) ||
      m.away.toLowerCase().includes(q) ||
      (m.tags  || []).some(t => t.toLowerCase().includes(q)) ||
      (m.competition || '').toLowerCase().includes(q)
    )
  : matches;
```

Para isolar apenas jogos da Copa, o frontend pode enviar `?q=%23fifa-world-cup` (a tag gerada automaticamente pelo adapter). A resposta inclui:

```json
{
  "ok": true,
  "status": "ok",
  "lastPoll": "2026-06-15T16:30:00.000Z",
  "nextPollIn": 300,
  "count": 3,
  "reqToday": 38,
  "slots": [
    {"start": "12:30", "end": "18:30"},
    {"start": "19:30", "end": "22:30"}
  ],
  "mockMode": false,
  "capped": false,
  "matches": [ /* array de partidas */ ]
}
```

### 6.2 `GET /api/status`

Versão leve que retorna apenas o status do poller, sem a lista de partidas. Útil para health checks e para o indicador de atividade do header.

### 6.3 `POST /api/badges`

O proxy de escudos recebe uma lista de nomes de times e retorna URLs de imagens:

```json
// Request
["Brazil", "Argentina", "France"]

// Response
{
  "Brazil": "https://upload.wikimedia.org/...",
  "Argentina": "https://upload.wikimedia.org/...",
  "France": "https://upload.wikimedia.org/..."
}
```

**Fluxo interno:**
1. Verifica o `badgeCache` em memória (TTL de 1 hora).
2. Se não em cache, tenta a Wikipedia REST API com o `WIKI_NAME` de mapeamento.
3. Extrai `originalimage.source` ou `thumbnail.source` do resumo da Wikipedia.
4. Armazena no cache e retorna.

O mapa `WIKI_NAME` contém nomes canônicos da Wikipedia para os principais times. Para seleções nacionais da Copa, os nomes em inglês simples (ex.: `"Brazil"`) geralmente resolvem corretamente sem precisar de mapeamento explícito.

---

## 7. Frontend — a central de acompanhamento

O `index.html` é uma SPA completamente autocontida que consome exclusivamente os endpoints do servidor.

### 7.1 Ciclo de atualização

```js
const POLL_MS = 30 * 1000;  // 30 segundos

async function refresh() {
  const data = await fetch('/api/matches').then(r => r.json());
  renderStatus(data);
  renderFeatured(data.matches);
  renderList(data.matches);
}

setInterval(refresh, POLL_MS);
```

O frontend busca os dados a cada **30 segundos**, complementando o polling do backend. Mesmo que o poller já tenha atualizado os dados há 10 segundos, o frontend os exibirá na próxima chamada — com no máximo 30 segundos de defasagem em relação ao servidor, que por sua vez tem no máximo 5 minutos de defasagem em relação à API durante a Copa.

### 7.2 Destaque automático da Copa

A lógica de seleção do jogo em destaque (*featured*) usa o campo `priority` diretamente:

```js
// pseudo-código da lógica de featured
const featured = pinnedMatch
  ?? matches.sort((a, b) => b.priority - a.priority)[0];
```

Como jogos da Copa têm `priority: 100` e nenhuma outra competição atinge esse valor, **o destaque será automaticamente um jogo da Copa sempre que houver algum disponível**, seja ao vivo ou agendado.

O usuário pode "fixar" manualmente outra partida, o que sobrescreve o destaque automático, mas ao recarregar a página o destaque volta ao jogo de maior prioridade.

### 7.3 Elementos da interface relacionados à Copa

**Barra de status:**
```
● ok  ·  3 partidas  ·  próxima atualização em 4:32  ·  38 req hoje
```

**Chip de competição:** gerado a partir das tags presentes nas partidas carregadas. Ao clicar em `#fifa-world-cup`, o campo de busca é preenchido com a tag e a lista filtra automaticamente apenas jogos da Copa.

**Card de partida:**
```
[Escudo]  BRASIL  2 – 1  ARGENTINA  [Escudo]
          Copa do Mundo · Grupo C · 67'
          ⚽ Vini Jr. 23'  ⚽ Raphinha 51'  ⚽ Messi 67'
```

**Filtros de status:**
- `Ao vivo` → mostra jogos com status `1h`, `2h`, `et`, `pen`, `ht`
- `Intervalo` → mostra apenas `ht`
- `Em agenda` → mostra `scheduled` e `soon`

---

## 8. Fluxo completo num dia de Copa do Mundo

O diagrama abaixo descreve o ciclo de vida completo do sistema num dia hipotético com dois jogos da Copa: às 13:00 e 16:00 BRT.

```
00:00  ──────────────────────────────────────────────────────────────
       [reset] meia-noite — reinicia ciclo
       [boot]  fixtures?date=2026-06-15        ← req #1
       [boot]  2 slots: 12:30–18:30
       pollStatus = 'waiting'
       Dorme até 12:30

12:30  ──────────────────────────────────────────────────────────────
       [slot ativo] acorda
       fixtures?date=2026-06-15  (re-fetch agendados)  ← req #2
       fixtures?live=all                               ← req #3
       → Nenhum jogo ao vivo ainda
       calcInterval() → 15 min (sem ao vivo)
       matches = [jogo1 scheduled, jogo2 scheduled]

12:45  fixtures?live=all                               ← req #4
13:00  fixtures?live=all                               ← req #5
       → BRASIL × ARGENTINA entra em status '1h'
       calcInterval() → 5 min  ← Copa detectada ao vivo!

13:05  fixtures?live=all                               ← req #6
       → Gol: Vini Jr. 23'  sh=1, sa=0
13:10  fixtures?live=all                               ← req #7
13:15  fixtures?live=all                               ← req #8
...
14:45  → Status: 'ht' (intervalo)
       calcInterval() → 5 min  (ht ∈ live statuses)
14:50  fixtures?live=all                               ← req #X
15:00  → Status: '2h' (segundo tempo)
...
15:30  fixtures?date=2026-06-15  (nova hora cheia)     ← req #Y
       COLÔMBIA × EQUADOR entra no radar como agendado
       fixtures?live=all                               ← req #Z
15:45  → Status: 'ft' (BRASIL 2-1 ARGENTINA encerrado)
       Segundo jogo: COLÔMBIA × EQUADOR ainda 'scheduled'
       calcInterval() → 15 min (sem ao vivo por ora)

16:00  → COLÔMBIA × EQUADOR entra em status '1h'
       calcInterval() → 5 min  ← Copa ao vivo de novo!
...
18:30  → COLÔMBIA × EQUADOR encerrado ('ft')
       Fim do slot → isSlotActive() = false
       pollStatus = 'waiting'
       nextSlotMs() = msUntilMidnight()
       Dorme até 00:00 (ou até o próximo slot, se houver)

00:00  ──────────────────────────────────────────────────────────────
       [reset] reinicia — novo dia começa
```

---

## 9. Casos especiais: prorrogação, pênaltis e múltiplos jogos simultâneos

### 9.1 Prorrogação

Quando o árbitro indica prorrogação ao final dos 90 minutos, a API-Football altera o status do jogo:

| Estágio | Status API | Status interno | Exibição |
|---|---|---|---|
| Prorrogação em andamento | `ET` | `et` | "Prorrogação · 97'" |
| Intervalo da prorrogação | `BT` | `ht` | "Intervalo" |
| Pênaltis | `P` | `pen` | "Pênaltis" |
| Encerrado nos pênaltis | `PEN` | `ft` | "Encerrado" |
| Encerrado na prorrogação | `AET` | `ft` | "Encerrado" |

O status `et` e `pen` estão incluídos na lista de "ao vivo" do `calcInterval()`, garantindo que a frequência de 5 minutos seja **mantida durante toda a prorrogação e pênaltis** da Copa:

```js
['1h', '2h', 'et', 'pen', 'ht'].includes(m.status)
```

Isso é crítico: uma Copa pode se estender por mais 30 minutos de prorrogação e potencialmente uma rodada de pênaltis, e o sistema permanece em polling de 5 minutos durante todo esse período.

### 9.2 Fase de grupos — jogos simultâneos

Na fase de grupos da Copa do Mundo, é comum que dois jogos ocorram exatamente ao mesmo tempo (ex.: 16:00 e 16:00 BRT, as rodadas finais de cada grupo). O sistema lida com isso naturalmente:

1. **Construção de slots:** dois jogos com o mesmo horário geram duas janelas idênticas, que são fundidas automaticamente em uma única — o slot cobre ambos.
2. **`fixtures?live=all`:** a API retorna **todos** os jogos ao vivo simultaneamente. O adapter adapta todos eles de uma vez.
3. **`calcInterval()`:** basta um dos dois ter `interval: 5` para o sistema usar 5 minutos — e ambos os jogos da Copa têm `interval: 5`.
4. **Frontend:** os dois jogos aparecem na lista, ordenados por prioridade. Se tiverem a mesma prioridade (100), a ordem é determinada pelo adaptador/API.

### 9.3 Jogo suspenso ou adiado

Status como `SUSP` e `INT` são mapeados para `'susp'`, e `PST`, `CANC`, `ABD` para `'canc'`. Um jogo suspenso durante o segundo tempo:
- Continua aparecendo na lista com `status: 'susp'`.
- **Não** é contado como ao vivo no `calcInterval()` (o filtro usa `['1h','2h','et','pen','ht']` — `susp` não está incluído).
- O intervalo pode cair para 15 min se nenhum outro jogo com `interval: 5` estiver ao vivo.

---

## 10. Modo Mock — demonstração sem chave de API

Quando `MOCK_MODE=true` (ou sem chave configurada), o poller substitui completamente o ciclo de API por dados estáticos:

```js
if (mockMode) {
  matches    = MOCK_MATCHES;
  pollStatus = 'mock';
  lastPoll   = new Date();
  timer      = setTimeout(poll, 30 * 1000);  // re-serve mock a cada 30 s
  return;
}
```

O array `MOCK_MATCHES` contém 10 partidas pré-definidas que demonstram diferentes estados: ao vivo no primeiro tempo, ao vivo no segundo tempo, intervalo, agendado, e encerrado. Nenhum jogo da Copa está incluído no mock padrão.

**Para simular a Copa em modo mock**, adicione um objeto ao array `MOCK_MATCHES` em `poller.js`:

```js
{
  id: 11,
  priority: 100,
  interval: 5,
  home: 'Brazil',
  away: 'Germany',
  homeLogo: null,
  awayLogo: null,
  sh: 1,
  sa: 0,
  minute: '34',
  status: '1h',
  competition: 'FIFA World Cup',
  round: 'Group Stage - 2',
  tags: ['#fifa-world-cup'],
  events: [
    { t: 'goal', m: 18, team: 'home', player: 'Vini Jr.' }
  ],
  scheduledTime: '13:00',
}
```

Com esse objeto presente, a interface exibirá imediatamente o jogo no destaque com `priority: 100`.

---

## 11. Mapa de estados do poller

O campo `pollStatus` reflete o estado atual do sistema e é exposto via `/api/status` e `/api/matches`.

```
               ┌──────────┐
               │ booting  │  Estado inicial ao subir o servidor
               └────┬─────┘
                    │  bootstrapDay() concluído
                    ▼
            ┌────────────────┐
     ┌─────►│    waiting     │  Fora de qualquer slot ativo
     │      └───────┬────────┘
     │              │  isSlotActive() = true
     │              ▼
     │      ┌────────────────┐
     │      │    polling     │  Executando apiFetch(fixtures?live=all)
     │      └───────┬────────┘
     │              │  sucesso
     │              ▼
     │      ┌────────────────┐
     └──────│      ok        │  Dados atualizados, aguardando próximo ciclo
            └───────┬────────┘
                    │  slot termina
                    └──────────► waiting
                    
Outros estados:
  no_games  → sem jogos no dia ou nenhuma partida retornada
  error     → falha na requisição (retry em 2 min)
  capped    → 90 req atingidas (dorme até meia-noite)
  mock      → modo mock ativo
```

---

## 12. Referência rápida — constantes e limites

### Poller (`poller.js`)

| Constante | Valor | Descrição |
|---|---|---|
| `REQ_LIMIT` | `90` | Requisições diárias antes de pausar |
| `SLOT_BEFORE_MIN` | `30` | Minutos de antecedência antes do jogo |
| `SLOT_AFTER_MIN` | `150` | Minutos de monitoramento após o início |
| `SLOT_GAP_MIN` | `45` | Gap máximo para fusão de janelas |
| Intervalo de mock | `30 s` | Ciclo em modo mock |
| Retry em erro | `2 min` | Tempo de espera após falha de API |
| Retry em boot falho | `5 min` | Tempo de espera se bootstrap falhar |

### Adapter (`adapter.js`)

| Competição | Prioridade | Intervalo |
|---|---|---|
| FIFA World Cup | 100 | 5 min |
| Copa America | 95 | 5 min |
| Copa Libertadores | 90 | 5 min |
| Copa Sudamericana | 85 | 5 min |
| UEFA Champions League | 80 | 5 min |

### Servidor (`server.js`)

| Constante | Valor | Descrição |
|---|---|---|
| `CACHE_TTL` | `1h` | TTL do cache de escudos (Wikipedia) |

### Frontend (`index.html`)

| Constante | Valor | Descrição |
|---|---|---|
| `POLL_MS` | `30 s` | Intervalo de fetch do frontend |

---

*Documentação gerada para o Football Live v0.1.0 — sistema de monitoramento de futebol em tempo real.*
# Calculadora em JavaScript – Explicação do Código

## Visão geral

- Lê uma expressão do usuário (ex.: `(2+3)*4` ou `-5+3`).
- Remove espaços.
- Resolve parênteses de dentro para fora (encontra o `(` mais interno).
- Para cada expressão **sem parênteses**, calcula o resultado **da esquerda para a direita** (sem precedência: `*` e `/` não têm prioridade sobre `+` e `-`).
- **Suporta sinal unário** no início da expressão e logo após outro operador (ex.: `-5+3` ou `2*-3`).
- Valida parênteses não fechados, divisão por zero e expressões malformadas, exibindo mensagens de erro adequadas.
- Exibe o resultado ou uma mensagem de erro.

---

## 1. As variáveis globais

```javascript
const prompt = require('prompt-sync')();
let scan = null;      // guarda a string digitada pelo usuário
let resultado = null; // guarda o último resultado calculado
```

- `prompt` é uma biblioteca para ler do terminal.
- `scan` armazena a expressão original.
- `resultado` é usado para armazenar e retornar o valor final.

---

## 2. Função `inserir()`

```javascript
function inserir() {
    scan = prompt("Digite a operação: ");
    return scan;
}
```

- Chama `prompt` e guarda o que o usuário digitou em `scan`.
- Também retorna a string, mas o retorno **não é usado** em nenhum lugar – só importa que `scan` foi preenchida.

---

## 3. Função `calcularSimples(extrair)`

Essa função recebe uma string **sem parênteses** (ex.: `"2+3*4"` ou `"-5+3"`) e calcula o valor da esquerda para a direita, ignorando a precedência de operadores. **Agora também trata sinais unários (`+` e `-`)**.

### Como funciona a iteração sobre os caracteres (o "scan de chars")

Ela percorre a string caractere por caractere, mas **antes** verifica se há um sinal unário no começo:

```javascript
if (extrair.length > 0 && (extrair[0] === '+' || extrair[0] === '-')) {
    numeroAtual += extrair[0]; // inicia o número com o sinal
    extrair = extrair.slice(1); // remove o sinal do início da string
}
```

Depois, analisa cada caractere do restante:

```javascript
for (let i = 0; i < extrair.length; i++) {
    let c = extrair[i];
    if (c >= '0' && c <= '9' || c === '.') {
        numeroAtual += c;               // monta números com vários dígitos ou decimais
    } else if (c === '+' || c === '-') {
        // Se já estamos construindo um número, este + ou - é um operador binário.
        // Caso contrário (numeroAtual está vazio), é um sinal unário após outro operador.
        if (numeroAtual !== '') {
            numeros.push(parseFloat(numeroAtual));
            operadores.push(c);
            numeroAtual = '';
        } else {
            numeroAtual += c; // sinal unário
        }
    } else if (c === '*' || c === '/') {
        // * e / exigem que já exista um número em construção
        if (numeroAtual === '') return NaN;
        numeros.push(parseFloat(numeroAtual));
        operadores.push(c);
        numeroAtual = '';
    } else {
        return NaN;  // caractere inválido
    }
}
```

#### Exemplo: `"23+45"`

| i | c | ação |
|---|---|---|
| 0 | '2' | `numeroAtual = "2"` |
| 1 | '3' | `numeroAtual = "23"` |
| 2 | '+' | `numeroAtual !== ''` → empilha `23` e operador `+`, zera `numeroAtual` |
| 3 | '4' | `numeroAtual = "4"` |
| 4 | '5' | `numeroAtual = "45"` |
| fim | - | empilha `45` |

No final: `numeros = [23, 45]`, `operadores = ['+']`.

#### Exemplo com sinal unário: `"-5+3"`

| passo | ação |
|---|---|
| Verificação inicial | `extrair[0] = '-'` → `numeroAtual = "-"`, `extrair` vira `"5+3"` |
| i=0, c='5' | `numeroAtual = "-5"` |
| i=1, c='+' | `numeroAtual !== ''` → empilha `-5` e operador `+`, zera `numeroAtual` |
| i=2, c='3' | `numeroAtual = "3"` |
| fim | empilha `3` |

Resultado: `numeros = [-5, 3]`, `operadores = ['+']`, total = `-5 + 3 = -2`.

#### Exemplo com sinal unário após operador: `"2*-3"`

| passo | ação |
|---|---|
| i=0, c='2' | `numeroAtual = "2"` |
| i=1, c='*' | empilha `2` e operador `*`, `numeroAtual = ''` |
| i=2, c='-' | `numeroAtual === ''` → é sinal unário! `numeroAtual = "-"` |
| i=3, c='3' | `numeroAtual = "-3"` |
| fim | empilha `-3` |

`numeros = [2, -3]`, `operadores = ['*']`, total = `2 * -3 = -6`.

**Observação:** se o usuário digitar apenas `*-3` (sem número antes do `*`), o código retornará `NaN` porque na verificação de `*` ou `/` exige-se que `numeroAtual` não esteja vazio.

### Cálculo sequencial

Após empilhar todos os números e operadores:

```javascript
if (numeros.length !== operadores.length + 1) return NaN; // validação extra

let total = numeros[0];
for (let i = 0; i < operadores.length; i++) {
    let num = numeros[i+1];
    if (operadores[i] === '+') total += num;
    else if (operadores[i] === '-') total -= num;
    else if (operadores[i] === '*') total *= num;
    else if (operadores[i] === '/') {
        if (num === 0) return NaN;   // proteção contra divisão por zero
        total /= num;
    }
}
return total;
```

**Importante:** não há precedência. `2+3*4` vira `2+3=5`, `5*4=20` (resultado 20), em vez do correto `2+(3*4)=14`. É uma limitação proposital do exercício.

---

## 4. Função `resolver()`

Essa é a parte que processa os parênteses.

1. **Nova verificação:** se `scan` está vazio (`null` ou `undefined`), retorna logo `"Nenhuma operação fornecida"`.
2. Remove espaços de `scan` e guarda em `extrair`.
3. **Enquanto houver `'('`**:
   - `start = extrair.lastIndexOf('(')` → acha o **último** `(` (o mais interno).
   - `end = extrair.indexOf(')', start)` → acha o `)` correspondente.
   - Se não achar `)`, retorna `"Parênteses não fechados"`.
   - `sub = extrair.substring(start+1, end)` → pega o conteúdo dentro dos parênteses.
   - `val = calcularSimples(sub)` → calcula essa subexpressão (sem parênteses internos). Se der `NaN`, retorna `"Erro nos parênteses"`.
   - Substitui `( ... )` pelo valor calculado na string `extrair`.
4. Depois que não há mais parênteses, chama `calcularSimples(extrair)` para o restante.
5. Se o resultado final for `NaN`, retorna `"Expressão inválida"`.
6. Armazena o resultado em `resultado` e o retorna.

### Exemplo: `(2+3)*4`

- 1ª iteração: `start = 0` (o único '('), `end = 4` (o ')'), `sub = "2+3"`, `val = 5` → `extrair` vira `"5*4"`.
- Não há mais parênteses → calcula `5*4 = 20`.

---

## 5. Execução principal

```javascript
console.log("Calculadora - use + - * / e parênteses");
inserir();                     // lê a expressão, guarda em scan
console.log("Resultado:", resolver());  // calcula e mostra
```

- `inserir()` não retorna nada usado, apenas preenche `scan`.  
- `resolver()` usará `scan` para fazer os cálculos.

---

## Onde você pode ter se perdido ("scan de chars" e "múltiplas ligações")

- **"Scan de chars"** significa simplesmente percorrer a string caractere por caractere, como no `for` da `calcularSimples`. É aí que a calculadora "lê" os dígitos, operadores e sinais unários.
- **Múltiplas ligações**: as funções compartilham a variável global `scan`. `inserir()` escreve nela, `resolver()` a lê e a modifica internamente (`extrair` é uma cópia local, mas `scan` original não muda). `calcularSimples` é chamada dentro de `resolver` para cada par de parênteses e para a expressão final.

---

## Resumo simplificado do fluxo

1. Usuário digita `(10-4)/2`
2. `scan = "(10-4)/2"`
3. `resolver()` remove espaços → `"(10-4)/2"`, verifica que não é vazio
4. Acha último `'('` → posição 0, acha `')'` → posição 5  
   `sub = "10-4"` → `calcularSimples("10-4")` → `10-4=6`  
   Substitui `(10-4)` por `6` → nova expressão `"6/2"`
5. Sem parênteses → `calcularSimples("6/2")` → `6/2 = 3`
6. Resultado final: **3**


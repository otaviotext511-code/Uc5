const prompt = require('prompt-sync')();
let scan = null;       // guarda a expressão digitada pelo usuário
let resultado = null;  // armazena o resultado final da avaliação

/**
 * Solicita que o usuário digite uma operação matemática e armazena em `scan`.
 * @returns {string} A expressão digitada.
 */
function inserir() {
    scan = prompt("Digite a operação: ");
    return scan;
}

/**
 * Avalia uma expressão matemática SEM parênteses, processando
 * as operações estritamente da esquerda para a direita (sem precedência).
 * Suporta os operadores +, -, *, / e números decimais.
 * Aceita sinal unário no início da expressão (ex: "-5+3").
 *
 * @param {string} extrair - A expressão a ser avaliada (sem espaços).
 * @returns {number|NaN} O resultado numérico ou NaN se houver erro.
 */
function calcularSimples(extrair) {
    let numeros = [];      // pilha de operandos (números)
    let operadores = [];   // pilha de operadores (+, -, *, /)
    let numeroAtual = '';  // acumulador para construir cada número lido

    // Permite sinal unário (positivo ou negativo) no início da expressão
    if (extrair.length > 0 && (extrair[0] === '+' || extrair[0] === '-')) {
        numeroAtual += extrair[0]; // começa a construir o número com o sinal
        extrair = extrair.slice(1); // remove o sinal do início da string
    }

    // Percorre cada caractere da expressão
    for (let i = 0; i < extrair.length; i++) {
        let c = extrair[i];

        // Se for dígito ou ponto decimal, continua formando o número
        if (c >= '0' && c <= '9' || c === '.') {
            numeroAtual += c;

        // Se for um operador
        } else if (c === '+' || c === '-') {
    // É operador binário se já temos um número em construção
    if (numeroAtual !== '') {
        numeros.push(parseFloat(numeroAtual));
        operadores.push(c);
        numeroAtual = '';
    } else {
        // Caso contrário, é sinal unário (depois de outro operador)
        numeroAtual += c;
    }
} else if (c === '*' || c === '/') {
    // * e / continuam exigindo um número antes deles
    if (numeroAtual === '') return NaN;
    numeros.push(parseFloat(numeroAtual));
    operadores.push(c);
    numeroAtual = '';
}
    }

    // Empilha o último número, se existir
    if (numeroAtual !== '') numeros.push(parseFloat(numeroAtual));

    // A quantidade de números deve ser exatamente (operadores + 1)
    if (numeros.length !== operadores.length + 1) return NaN;

    // Inicia o acumulador com o primeiro número
    let total = numeros[0];

    // Aplica cada operador ao acumulador e ao próximo número
    for (let i = 0; i < operadores.length; i++) {
        let num = numeros[i + 1];

        if (operadores[i] === '+') {
            total += num;
        } else if (operadores[i] === '-') {
            total -= num;
        } else if (operadores[i] === '*') {
            total *= num;
        } else if (operadores[i] === '/') {
            // Divisão por zero é inválida
            if (num === 0) return NaN;
            total /= num;
        }
    }

    return total;
}

/**
 * Avalia a expressão armazenada em `scan`, resolvendo primeiro
 * os parênteses (do mais interno para o mais externo).
 *
 * @returns {string|number} Mensagem de erro (string) ou o valor numérico do resultado.
 */
function resolver() {
    // Se nenhuma operação foi digitada, exibe mensagem
    if (!scan) return "Nenhuma operação fornecida";

    // Remove todos os espaços em branco da expressão original
    let extrair = scan.replace(/\s/g, '');

    // Resolve os parênteses: enquanto existir '(' na string
    while (extrair.indexOf('(') !== -1) {
        // Encontra o último '(' (parêntese mais interno)
        let start = extrair.lastIndexOf('(');
        // Encontra o ')' correspondente a partir dessa posição
        let end = extrair.indexOf(')', start);
        if (end === -1) return "Parênteses não fechados";

        // Extrai a sub‑expressão dentro dos parênteses
        let sub = extrair.substring(start + 1, end);
        // Avalia essa sub‑expressão (sem parênteses internos)
        let val = calcularSimples(sub);
        if (isNaN(val)) return "Erro nos parênteses";

        // Substitui a expressão original "(...)" pelo seu valor calculado
        extrair = extrair.substring(0, start) + val + extrair.substring(end + 1);
    }

    // Após remover todos os parênteses, avalia a expressão final
    let final = calcularSimples(extrair);
    if (isNaN(final)) return "Expressão inválida";

    resultado = final;   // armazena o resultado global
    return resultado;
}

// ---------- Execução do programa ----------
console.log("Calculadora - use + - * / e parênteses");
inserir();                                      // lê a operação do usuário
console.log("Resultado:", resolver());          // calcula e exibe o resultado
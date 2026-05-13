// Cálculo de pedido com cupom de desconto
// Objetivo:
// Desenvolver uma função que calcule o valor final de um pedido
// aplicando um cupom de desconto percentual e exiba um resumo formatado.
// Instruções:
//   • Crie uma função chamada "calcularPedido" que receba dois parâmetros:
//     valorPedido, percentualCupom.
//   • Valide se o percentual do cupom está entre 0 e 100.
//   • Caso seja inválido, exiba uma mensagem de erro e encerre a função.
//   • Calcule o valor do desconto multiplicando o valor do pedido
//     pelo percentual dividido por 100.
//   • Calcule o valor final subtraindo o desconto do valor do pedido.
//   • Retorne um objeto contendo as propriedades "valorFinal" e "desconto".
//   • Utilize desestruturação para capturar os valores retornados.
//   • Exiba no console o resumo do pedido com valor original,
//     desconto aplicado e valor final.
// Restrições:
//   • O percentual de desconto deve estar entre 0 e 100 (inclusive).
//   • Se o percentual for inválido, exibir: "Erro: o percentual do cupom deve estar entre 0 e 100."
//   • Todos os valores monetários devem ser exibidos com duas casas decimais.
//   • Utilize template strings para formatar as mensagens de saída.
//   • O resumo deve seguir exatamente o formato:
//       === Resumo do Pedido ===
//       Valor original:  R$ 450.89
//       Cupom (15%):    - R$ 67.63
//       Valor final:     R$ 383.26

function calcularPedido (valorPedido, percentualCupom, frete) {
    if (percentualCupom < 0 || percentualCupom > 100) {
        throw new Error("escolha um porcentagem entre 0 a 100");
    } 
    const desconto = (valorPedido + frete) * (percentualCupom / 100);
    const valorFinal = valorPedido - desconto;
    return { valorFinal, desconto };
} 

let valorPedido = 450.89;
let percentualCupom = 5;
let frete = 5.99;

const { valorFinal, desconto } = calcularPedido(valorPedido, percentualCupom, frete);

console.log(`=== Resumo do Pedido ===`);
console.log(`Valor original:  R$ ${valorPedido.toFixed(2)}`);
console.log(`Cupom (${percentualCupom}%):    - R$ ${desconto.toFixed(2)}`);
console.log(`Valor final:     R$ ${valorFinal.toFixed(2)}`);
console.log(`Valor do Frete: R$ ${frete.toFixed(2)}`);

// versão simples
/* 
let valor = 145.39;
let porc = 5;
let dv = valor * (porc/100);
let dt = valor * (1 - (porc / 100));

if (porc < 0 || porc > 100)
{
    throw new Error("escolha um porcentagem entre 0 a 100");
}
 else {
    console.log('o valor do produto é ' + valor + '$');
    console.log('o valor com desconto: ' + dt.toFixed(2) + '$');
    console.log('o desconto foi de: ' + porc.toFixed(2) + '%');
    console.log('o valor do desconto: ' + dv.toFixed(2) + '$');
 }
*/
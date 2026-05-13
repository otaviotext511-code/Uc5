function desconto(porcentagem, preco) {
     if (porcentagem < 0 || porcentagem > 100) {
        throw new Error("Percentual deve ser entre 0 e 100");
    }
    // Calcula o preço com desconto: preco * ((100 - porcentagem) / 100)
    let valorComDesconto = preco * ((100 - porcentagem) / 100);
    // Arredonda para 2 casas decimais
    return valorComDesconto;
}

// Dados fornecidos
let preco = 155.67;
let porcentagem = 99;

// Chama a função e armazena o resultado
let valorDesconto = desconto(porcentagem, preco);

// Exibe no console
console.log('o valor a ser pago com desconto é: ' + valorDesconto.toFixed(2))




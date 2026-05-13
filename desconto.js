function desconto(preco, percentual) {
    if (percentual < 0 || percentual > 100) {
        throw new Error("Percentual deve ser entre 0 e 100");
    }
    return parseFloat((preco - (preco * (percentual / 100))).toFixed(2));
}

console.log('valor a ser pago é: ' + desconto(155.67, 5)); // 147.89
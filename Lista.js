// 1. Declaração completa da variável lista
const lista = ['arroz', 'feijão', 'macarrão', 'azeite', 'sal', 'farinha', 'açúcar'];

// 2. Usando método forEach (funcional e completo)
lista.forEach((item, indice) => {
  console.log(`Índice ${indice}: ${item}`);
});

// 3. Exemplo com map (cria novo array com índice formatado)
const listaComIndice = lista.map((item, indice) => `Índice ${indice}: ${item}`);
console.log(listaComIndice);

console.log('tem', lista.length, 'itens na lista');
console.log(lista[2]);


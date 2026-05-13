function analisarPessoas(pessoas, idades) {
    const grupos = {
        maiores: { pessoas: [], somaIdades: 0 },
        menores: { pessoas: [], somaIdades: 0 } 
    };

    for (let i = 0; i < pessoas.length; i++) {
        const grupo = idades[i] >= 18 ? grupos.maiores : grupos.menores;
        grupo.pessoas.push({ pessoa: pessoas[i], idade: idades[i] });
        grupo.somaIdades += idades[i];
    }

    const calcularMedia = (grupo) => 
        grupo.pessoas.length > 0 ? grupo.somaIdades / grupo.pessoas.length : 0; 

    return {
        menores: {
            lista: grupos.menores.pessoas,
            media: calcularMedia(grupos.menores)
        },
        maiores: {
            lista: grupos.maiores.pessoas,
            media: calcularMedia(grupos.maiores)
        }
    };
}

// Uso
const pessoas = ['Lucas', 'mariana', 'pedro', 'julia', 'rafael', 'sofia', 'thiago'];
const idades = [17, 22, 15, 30, 19, 12, 25];

const resultado = analisarPessoas(pessoas, idades);

console.log('Maiores de idade:', resultado.maiores.lista);
console.log('Média maiores:', resultado.maiores.media.toFixed(2));
console.log('Menores de idade:', resultado.menores.lista);
console.log('Média menores:', resultado.menores.media.toFixed(2));
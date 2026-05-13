// Array de idades.
// Verificar 2 grupos.
// Grupo selecionados - 'idade' e 'pessoas'.
// Parâmetros "maior de idade" ou "menor de idade".
// Medida limite >= 18.
// Use for ou for.each para verificar as 'idades' dessas 'pessoas'.

const pessoas = ['Lucas', 'mariana', 'pedro', 'julia', 'rafael', 'sofia', 'thiago'];
const idades = [17, 22, 15, 30, 19, 12, 25];

const maiorDeIdade = [];
const menorDeIdade = [];

pessoas.forEach((pessoa, i) => {
	const idade = idades[i];

	if (idade >= 18) {
	 menorDeIdade.push({ pessoa, idade: idade });
	} else {
	 maiorDeIdade.push({ pessoa, idade: idade });
	}
});

console.log('Maior de idade:', maiorDeIdade);
console.log('Menor de idade:', menorDeIdade);

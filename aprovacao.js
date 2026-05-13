// Estrutura de dados válida em JS
const alunos = ['joao', 'leo', 'gustavo', 'antonio', 'ana'];

// valores correspondentes a cada aluno (mesma ordem)
const valores = [7, 3, 8, 2, 3];
// Nota: `id` é implícito pelo índice: alunos[0] = 'joao' tem valores[0] = 7

// Arrays para agrupar aprovados e reprovados
const aprovados = [];
const reprovados = [];

// Lógica de verificação e agrupamento
alunos.forEach((aluno, i) => {
  const valor = valores[i];
  
  if (valor >= 7) {
    reprovados.push({ aluno, nota: valor });
  } else {
    aprovados.push({ aluno, nota: valor });
  }
});

// Exibindo resultados
console.log('Aprovados:', aprovados);
console.log('Reprovados:', reprovados);

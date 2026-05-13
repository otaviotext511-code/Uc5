
// Jogo - acerte o número
// Objetivo:
// Criar um jogo em que o usuário tente adivinhar um número aleatório gerado pelo programa.
// Instruções:
 // ⇾ Gere um número aleatório dentro de um intervalo de 0 a 100.
 // ⇾ Peça ao usuário para informar uma tentativa.
  // ⇾ Verifique se o número informado é maior, menor ou igual ao número gerado.
  // ⇾ Continue solicitando tentativas até que o usuário acerte o número.
  // ⇾ Informe ao usuário o número de tentativas realizadas ao final do jogo.
// Restrições
// O número deve ser gerado aleatoriamente a cada jogo.
// Valide a entrada do usuário para garantir que seja um número dentro do intervalo permitido.
 
// Importar a biblioteca ou modúlo do node.js
// const readline = require("readline")        
// const rl = readline.createInterface(    
//     {
//         input: process.stdin,
//         output: process.stdout
//     }
// )

// const MIN = 0
// const MAX = 100
// let tentativas = 0
// // Gerar número aleatório de 0 a 100 
// const numeroAleatorio = Math.floor(Math.random() * 100)

// function perguntar(){
//     rl.question("Informe um número entre 0 e 100: ", (entrada) => {
//         const chute = Number(entrada)          // Converte para número

//             // Adicionar 1 à variável tentativa com operador de incremento
//         tentativas++                  // Equivalente a: tentativas = tentativas + 1

//         // Validar se número está no intervalo desejado 
//         if(chute <MIN || chute > MAX){
//             console.log("Entrada inválida")
//             return perguntar()
//         }

//        // Verifique se o número informado é maior, menor ou igual ao número gerado.
//        if (chute < numeroAleatorio){
//         console.log("Muito baixo! Tente novamente.")
//         perguntar()
//        }
//        else if(chute >numeroAleatorio){
//         console.log("Muito alto! Tente novamente.")
//         perguntar()
//        }
//        else{
//             console.log("Parabéns! Você acertou o número em $(tentativas} tentativas")
//             rl.close()
//        }


        
//     })
       
    
// }

// perguntar()                         // chamar a função principal

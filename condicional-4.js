// Condicionais - switch (múltiplas condições com base em um valor)

let estado = ""
const uf = "SP"
switch (uf) {
    case "MG":
        estado = "Minas Gerais"
        break;
    case "SP":
        estado = "São Paulo"
        break;
    case "RJ":
        estado = "Rio de Janeiro"
        break;
    case "ES":
        estado = "Espírito Santo"
        break;
    default:
        estado = "Não é um estado da região sudeste"
}
console.log(estado)
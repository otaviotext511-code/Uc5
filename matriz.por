programa {
  funcao inicio() {
    inteiro num1, num2, num3

    // cabeçalho
    escreva("    ")
    para (num2 = 1; num2 <= 10; num2++) {
      escreva(num2, "  ")
    }
    escreva("\n")

    // linha separadora
    escreva("   -----------------------------------\n")

    // linhas da matriz
    para (num1 = 1; num1 <= 10; num1++) {
      escreva(num1, " | ")
      para (num2 = 1; num2 <= 10; num2++) {
        num3 = num1 * num2
        se (num3 < 10)
          escreva(num3, "  ")
        senao
          escreva(num3, " ")
      }
      escreva("\n")
    }
  }
}

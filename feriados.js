// feriados-sp.js
async function buscarFeriadosSP(ano) {
  const url = `https://api.feriados.dev/v1/holidays/year/${ano}?state=SP`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const feriados = await response.json();

    // Filtra apenas os feriados estaduais, se quiser
    const feriadosEstaduais = feriados.data.filter(feriado => feriado.type === 'state');
    console.table(feriadosEstaduais);
  } catch (erro) {
    console.error("Falha na requisição:", erro.message);
  }
}

buscarFeriadosSP(2025);
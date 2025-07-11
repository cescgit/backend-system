export function numeroALetrasCordobas(num: number) {
  const unidades = [
    "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
    "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete",
    "dieciocho", "diecinueve"
  ];
  const decenas = [
    "", "", "veinte", "treinta", "cuarenta", "cincuenta",
    "sesenta", "setenta", "ochenta", "noventa"
  ];
  const centenas = [
    "", "ciento", "doscientos", "trescientos", "cuatrocientos",
    "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"
  ];

  function convertirMiles(n) {
    if (n === 0) return "";
    if (n === 100) return "cien";
    if (n < 20) return unidades[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return decenas[d] + (u ? " y " + unidades[u] : "");
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const resto = n % 100;
      return centenas[c] + (resto ? " " + convertirMiles(resto) : "");
    }
    if (n < 1000000) {
      const miles = Math.floor(n / 1000);
      const resto = n % 1000;
      let milesTexto = miles === 1 ? "mil" : convertirMiles(miles) + " mil";
      return milesTexto + (resto ? " " + convertirMiles(resto) : "");
    }
    return "Número demasiado grande";
  }

  // Corrección gramatical de "uno" a "un" si va antes de "córdoba"
  function corregirUn(texto) {
    return texto
      .replace(/\buno\b/g, "un") // solo cuando está solo
      .replace(/\bveintiuno\b/g, "veintiún")
      .replace(/\by uno\b/g, "y un");
  }

  const parteEntera = Math.floor(num);
  const parteDecimal = Math.round((num - parteEntera) * 100);
  const textoEntero = convertirMiles(parteEntera);
  const textoCentavos = parteDecimal.toString().padStart(2, "0");

  const textoFinal = corregirUn(textoEntero.trim());

  const moneda = parteEntera === 1 ? "córdoba" : "córdobas";

  return `${textoFinal.toUpperCase()} ${moneda.toUpperCase()} CON ${textoCentavos}/100`;
}

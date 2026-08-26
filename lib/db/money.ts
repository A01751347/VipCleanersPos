/**
 * Aritmética de dinero en centavos enteros.
 *
 * El código anterior calculaba con flotantes (`total / 1.16`, luego
 * `subtotal * 0.16`), lo que producía diferencias de centavos entre
 * `subtotal + impuestos` y `total`. Molesto en un ticket y un problema real al
 * emitir CFDI, donde el SAT valida el desglose.
 */

export type Centavos = number;

export function aCentavos(valor: number | string | null | undefined): Centavos {
  if (valor === null || valor === undefined || valor === '') return 0;
  const n = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function aPesos(centavos: Centavos): number {
  return Math.round(centavos) / 100;
}

/** Formatea para mostrar: 12345 -> "$123.45" */
export function formatearMXN(centavos: Centavos): string {
  return aPesos(centavos).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

export interface DesgloseImpuestos {
  subtotal: Centavos;
  impuestos: Centavos;
  total: Centavos;
}

/**
 * Separa un total en subtotal + IVA.
 *
 * @param totalConIva  importe bruto en centavos
 * @param tasaPorc     porcentaje de IVA (16 = 16%)
 *
 * El redondeo ocurre UNA sola vez, sobre el subtotal, y el impuesto se obtiene
 * por diferencia. Así `subtotal + impuestos === total` siempre, exactamente.
 */
export function desglosarIvaIncluido(
  totalConIva: Centavos,
  tasaPorc: number
): DesgloseImpuestos {
  const total = Math.round(totalConIva);
  const divisor = 1 + tasaPorc / 100;
  const subtotal = Math.round(total / divisor);
  return { subtotal, impuestos: total - subtotal, total };
}

/**
 * Agrega IVA a un importe que no lo incluye.
 * También aquí el total se deriva por suma, nunca por multiplicación aparte.
 */
export function agregarIva(
  subtotal: Centavos,
  tasaPorc: number
): DesgloseImpuestos {
  const base = Math.round(subtotal);
  const impuestos = Math.round((base * tasaPorc) / 100);
  return { subtotal: base, impuestos, total: base + impuestos };
}

/** Aplica un descuento porcentual, redondeando a centavo. */
export function aplicarDescuentoPorcentaje(
  monto: Centavos,
  porcentaje: number
): Centavos {
  return Math.round((monto * porcentaje) / 100);
}

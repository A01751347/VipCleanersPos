/** Convierte filas a CSV con BOM, para que Excel en español abra bien los acentos. */
export function aCsv(
  filas: Record<string, unknown>[],
  columnas: Array<[clave: string, encabezado: string]>
): string {
  const escapar = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lineas = [
    columnas.map(([, encabezado]) => escapar(encabezado)).join(','),
    ...filas.map((fila) => columnas.map(([clave]) => escapar(fila[clave])).join(',')),
  ];

  return '﻿' + lineas.join('\r\n');
}

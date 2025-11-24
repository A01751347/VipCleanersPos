'use client';
// app/facturacion/page.tsx
import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Mail
} from 'lucide-react';

export default function FacturacionPage() {
  const [step, setStep] = useState<'buscar' | 'datos' | 'exito'>('buscar');

  // Datos de búsqueda
  const [codigoOrden, setCodigoOrden] = useState('');
  const [montoTotal, setMontoTotal] = useState('');

  // Datos fiscales
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [usoCfdi, setUsoCfdi] = useState('G03');
  const [regimenFiscal, setRegimenFiscal] = useState('616');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [email, setEmail] = useState('');

  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factura, setFactura] = useState<any>(null);

  const handleBuscarOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/facturacion?codigoOrden=${encodeURIComponent(codigoOrden)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Orden no encontrada');
      }

      // Verificar si ya está facturada
      if (data.orden.facturado) {
        setFactura(data.orden.factura);
        setStep('exito');
        return;
      }

      // Validar monto
      if (Math.abs(data.orden.total - parseFloat(montoTotal)) > 0.01) {
        throw new Error('El monto total no coincide. Por favor verifica tu ticket.');
      }

      // Pasar a datos fiscales
      setStep('datos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar la orden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerarFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codigoOrden,
          montoTotal: parseFloat(montoTotal),
          rfc: rfc.toUpperCase(),
          razonSocial,
          usoCfdi,
          regimenFiscal,
          codigoPostal,
          email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar la factura');
      }

      setFactura(data.factura);
      setStep('exito');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la factura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuevaFactura = () => {
    setStep('buscar');
    setCodigoOrden('');
    setMontoTotal('');
    setRfc('');
    setRazonSocial('');
    setEmail('');
    setCodigoPostal('');
    setError(null);
    setFactura(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f9f8] to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#e0e6e5]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <FileText size={32} className="text-[#78f3d3] mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-[#313D52]">
                Facturación Electrónica
              </h1>
              <p className="text-sm text-[#6c7a89]">
                {process.env.NEXT_PUBLIC_COMPANY_NAME || 'VipCleaners'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {step === 'buscar' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-[#313D52] mb-6">
              Ingresa los datos de tu ticket
            </h2>

            <form onSubmit={handleBuscarOrden} className="space-y-6">
              <div>
                <label htmlFor="codigoOrden" className="block text-sm font-medium text-[#313D52] mb-2">
                  Código de Orden *
                </label>
                <input
                  id="codigoOrden"
                  type="text"
                  value={codigoOrden}
                  onChange={(e) => setCodigoOrden(e.target.value.toUpperCase())}
                  placeholder="ORD-2024-001"
                  className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                  required
                />
                <p className="text-xs text-[#6c7a89] mt-1">
                  Encuéntralo en tu ticket de compra
                </p>
              </div>

              <div>
                <label htmlFor="montoTotal" className="block text-sm font-medium text-[#313D52] mb-2">
                  Monto Total *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6c7a89] font-medium">
                    $
                  </span>
                  <input
                    id="montoTotal"
                    type="number"
                    step="0.01"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  />
                </div>
                <p className="text-xs text-[#6c7a89] mt-1">
                  Debe coincidir exactamente con el total de tu ticket
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
                  <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'datos' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-[#313D52] mb-6">
              Datos Fiscales
            </h2>

            <form onSubmit={handleGenerarFactura} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="rfc" className="block text-sm font-medium text-[#313D52] mb-2">
                    RFC *
                  </label>
                  <input
                    id="rfc"
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    placeholder="XAXX010101000"
                    maxLength={13}
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] uppercase"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="razonSocial" className="block text-sm font-medium text-[#313D52] mb-2">
                    Razón Social / Nombre Completo *
                  </label>
                  <input
                    id="razonSocial"
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Nombre o empresa como aparece en tu constancia fiscal"
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="usoCfdi" className="block text-sm font-medium text-[#313D52] mb-2">
                    Uso de CFDI *
                  </label>
                  <select
                    id="usoCfdi"
                    value={usoCfdi}
                    onChange={(e) => setUsoCfdi(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  >
                    <option value="G03">G03 - Gastos en general</option>
                    <option value="G01">G01 - Adquisición de mercancías</option>
                    <option value="G02">G02 - Devoluciones, descuentos o bonificaciones</option>
                    <option value="P01">P01 - Por definir</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="regimenFiscal" className="block text-sm font-medium text-[#313D52] mb-2">
                    Régimen Fiscal *
                  </label>
                  <select
                    id="regimenFiscal"
                    value={regimenFiscal}
                    onChange={(e) => setRegimenFiscal(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  >
                    <option value="616">616 - Sin obligaciones fiscales</option>
                    <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                    <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                    <option value="601">601 - General de Ley Personas Morales</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="codigoPostal" className="block text-sm font-medium text-[#313D52] mb-2">
                    Código Postal *
                  </label>
                  <input
                    id="codigoPostal"
                    type="text"
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(e.target.value)}
                    placeholder="00000"
                    maxLength={5}
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#313D52] mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  />
                  <p className="text-xs text-[#6c7a89] mt-1">
                    Recibirás tu factura en este correo
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
                  <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('buscar')}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 border-2 border-[#e0e6e5] text-[#6c7a89] font-semibold rounded-lg hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Generando Factura...
                    </>
                  ) : (
                    'Generar Factura'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'exito' && factura && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#313D52] mb-2">
                ¡Factura Generada!
              </h2>
              <p className="text-[#6c7a89]">
                Tu factura ha sido generada y enviada a tu correo electrónico
              </p>
            </div>

            <div className="bg-[#f5f9f8] rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-xs text-[#6c7a89] mb-1">UUID</p>
                  <p className="text-sm font-mono text-[#313D52] break-all">{factura.uuid}</p>
                </div>
                {factura.serie && factura.folio && (
                  <div>
                    <p className="text-xs text-[#6c7a89] mb-1">Serie y Folio</p>
                    <p className="text-sm font-semibold text-[#313D52]">
                      {factura.serie}-{factura.folio}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <a
                href={factura.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-[#313D52] text-white font-semibold rounded-lg hover:bg-[#1f2937] transition-colors flex items-center justify-center"
              >
                <Download size={20} className="mr-2" />
                Descargar PDF
              </a>
              <a
                href={factura.xmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 border-2 border-[#313D52] text-[#313D52] font-semibold rounded-lg hover:bg-[#f5f9f8] transition-colors flex items-center justify-center"
              >
                <Download size={20} className="mr-2" />
                Descargar XML
              </a>
            </div>

            <button
              onClick={handleNuevaFactura}
              className="text-[#78f3d3] hover:underline text-sm font-medium"
            >
              Facturar otra orden
            </button>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <AlertCircle size={20} className="mr-2" />
            Información importante
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>La factura se genera inmediatamente y se envía a tu correo</li>
            <li>Asegúrate de que tus datos fiscales sean correctos</li>
            <li>Si tienes problemas, contacta a {process.env.NEXT_PUBLIC_COMPANY_PHONE}</li>
            <li>Puedes facturar hasta 30 días después de tu compra</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-[#e0e6e5] text-center text-sm text-[#6c7a89]">
        <p>
          © 2025 {process.env.NEXT_PUBLIC_COMPANY_NAME || 'VipCleaners'} - Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

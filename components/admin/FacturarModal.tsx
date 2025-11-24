'use client';
// components/admin/FacturarModal.tsx
import React, { useState } from 'react';
import {
  X,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

interface FacturarModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: {
    ordenId: number;
    codigoOrden: string;
    total: number;
    clienteNombre?: string;
    clienteEmail?: string;
  };
  onSuccess?: () => void;
}

export default function FacturarModal({
  isOpen,
  onClose,
  orden,
  onSuccess
}: FacturarModalProps) {
  const [rfc, setRfc] = useState('');
  const [razonSocial, setRazonSocial] = useState(orden.clienteNombre || '');
  const [usoCfdi, setUsoCfdi] = useState('G03');
  const [regimenFiscal, setRegimenFiscal] = useState('616');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [email, setEmail] = useState(orden.clienteEmail || '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factura, setFactura] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/facturacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          codigoOrden: orden.codigoOrden,
          montoTotal: orden.total,
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
      setSuccess(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar la factura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setRfc('');
      setRazonSocial('');
      setEmail('');
      setCodigoPostal('');
      setError(null);
      setSuccess(false);
      setFactura(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e0e6e5] sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <FileText size={24} className="text-[#78f3d3] mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-[#313D52]">
                {success ? 'Factura Generada' : 'Generar Factura'}
              </h2>
              <p className="text-sm text-[#6c7a89]">Orden: {orden.codigoOrden}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-[#f5f9f8] rounded-full transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-[#6c7a89]" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {success && factura ? (
            // Vista de éxito
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#313D52] mb-2">
                ¡Factura Generada Exitosamente!
              </h3>
              <p className="text-[#6c7a89] mb-6">
                La factura ha sido enviada al correo del cliente
              </p>

              <div className="bg-[#f5f9f8] rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-[#6c7a89]">UUID</p>
                    <p className="text-sm font-mono text-[#313D52] break-all">{factura.uuid}</p>
                  </div>
                  {factura.serie && factura.folio && (
                    <div>
                      <p className="text-xs text-[#6c7a89]">Serie y Folio</p>
                      <p className="text-sm font-semibold text-[#313D52]">
                        {factura.serie}-{factura.folio}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#6c7a89]">Total</p>
                    <p className="text-sm font-semibold text-[#313D52]">
                      ${factura.total?.toFixed(2) || orden.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <a
                  href={factura.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-[#313D52] text-white font-semibold rounded-lg hover:bg-[#1f2937] transition-colors flex items-center justify-center"
                >
                  <Download size={18} className="mr-2" />
                  Descargar PDF
                </a>
                <a
                  href={factura.xmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 border-2 border-[#313D52] text-[#313D52] font-semibold rounded-lg hover:bg-[#f5f9f8] transition-colors flex items-center justify-center"
                >
                  <Download size={18} className="mr-2" />
                  XML
                </a>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            // Formulario de datos fiscales
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Monto total:</strong> ${orden.total.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  RFC *
                </label>
                <input
                  type="text"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3] uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#313D52] mb-2">
                  Razón Social / Nombre Completo *
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Nombre o empresa"
                  className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#313D52] mb-2">
                    Uso de CFDI *
                  </label>
                  <select
                    value={usoCfdi}
                    onChange={(e) => setUsoCfdi(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  >
                    <option value="G03">G03 - Gastos en general</option>
                    <option value="G01">G01 - Adquisición de mercancías</option>
                    <option value="P01">P01 - Por definir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#313D52] mb-2">
                    Régimen Fiscal *
                  </label>
                  <select
                    value={regimenFiscal}
                    onChange={(e) => setRegimenFiscal(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  >
                    <option value="616">616 - Sin obligaciones fiscales</option>
                    <option value="605">605 - Sueldos y Salarios</option>
                    <option value="612">612 - Personas Físicas con Actividad</option>
                    <option value="601">601 - Personas Morales</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#313D52] mb-2">
                    Código Postal *
                  </label>
                  <input
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
                  <label className="block text-sm font-medium text-[#313D52] mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-4 py-3 border-2 border-[#e0e6e5] rounded-lg focus:outline-none focus:border-[#78f3d3] focus:ring-2 focus:ring-[#78f3d3]"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
                  <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 border-2 border-[#e0e6e5] text-[#6c7a89] font-semibold rounded-lg hover:bg-[#f5f9f8] transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-[#78f3d3] text-[#313D52] font-semibold rounded-lg hover:bg-[#4de0c0] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Generando...
                    </>
                  ) : (
                    'Generar Factura'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

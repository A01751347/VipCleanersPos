'use client';
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';

type InitialValues = {
  marca?: string | null;
  modelo?: string | null;
  descripcion?: string | null;
  talla?: string | null;
  color?: string | null;
};

export default function EditShoeModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vals: Required<InitialValues>) => Promise<void>;
  initialValues: InitialValues;
}) {
  const [form, setForm] = useState<Required<InitialValues>>({
    marca: '',
    modelo: '',
    descripcion: '',
    talla: '',
    color: ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        marca: initialValues.marca ?? '',
        modelo: initialValues.modelo ?? '',
        descripcion: initialValues.descripcion ?? '',
        talla: initialValues.talla ?? '',
        color: initialValues.color ?? ''
      });
      setErr(null);
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handle = (k: keyof InitialValues, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(form.marca ?? '').trim() || !(form.modelo ?? '').trim()) {
      setErr('Marca y modelo son obligatorios');
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      await onSubmit(form);
      onClose();
    } catch (e) {
      console.error(e);
      setErr('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-[#313D52]">Editar calzado</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-[#f5f9f8]">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="block text-[#6c7a89] mb-1">Marca *</span>
              <input value={form.marca ?? ''} onChange={e => handle('marca', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="block text-[#6c7a89] mb-1">Modelo *</span>
              <input value={form.modelo ?? ''} onChange={e => handle('modelo', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="block text-[#6c7a89] mb-1">Talla</span>
              <input value={form.talla ?? ''} onChange={e => handle('talla', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="block text-[#6c7a89] mb-1">Color</span>
              <input value={form.color ?? ''} onChange={e => handle('color', e.target.value)}
                className="w-full border rounded-lg px-3 py-2" />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block text-[#6c7a89] mb-1">Descripción</span>
            <textarea rows={3} value={form.descripcion ?? ''} onChange={e => handle('descripcion', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 resize-none" />
          </label>

          {err && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex">
              <AlertCircle size={18} className="mr-2 mt-0.5" /> {err}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border rounded-lg text-[#6c7a89]">Cancelar</button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-[#78f3d3] text-[#313D52] rounded-lg font-medium flex items-center">
              {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

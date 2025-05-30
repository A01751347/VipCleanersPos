// landing-page/components/CallToAction.tsx
import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="bg-blue-700 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Comienza a optimizar tu negocio hoy mismo
        </h2>
        <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
          Prueba nuestro sistema POS durante 14 días sin costo y sin compromiso.
          No necesitas tarjeta de crédito para comenzar.
        </p>
        <div className="mt-8 flex justify-center gap-4 flex-col sm:flex-row">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 transition-colors"
          >
            Solicitar demo
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-blue-800 transition-colors"
          >
            Contactar con ventas
          </Link>
        </div>
      </div>
    </section>
  );
}
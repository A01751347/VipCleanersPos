import type { Metadata } from 'next';
import TrackingSection from '@/components/TrackingSection';

export const metadata: Metadata = {
  title: 'Seguimiento de tu orden | VIP Cleaners',
  description:
    'Consulta el estado de tu servicio de limpieza de calzado con tu código de orden.',
  robots: { index: true, follow: true },
};

// La página usa el mismo widget que la portada: antes había dos
// implementaciones distintas del seguimiento, contra dos endpoints distintos,
// y ambas devolvían datos personales de más.
export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-[#f5f9f8] pt-24">
      <TrackingSection />
    </main>
  );
}

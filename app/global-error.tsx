'use client';

// Último recurso: se muestra cuando falla el propio layout raíz, así que no
// puede depender de nada del árbol de la aplicación ni de Tailwind.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f5f9f8',
          color: '#313D52',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            La aplicación no pudo cargar
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6c7a89', marginBottom: '1.5rem' }}>
            Vuelve a intentarlo. Si el problema continúa, avísanos con este código:
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.8rem',
                background: '#fff',
                padding: '0.5rem 0.75rem',
                borderRadius: 6,
                marginBottom: '1.5rem',
              }}
            >
              {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.7rem 1.5rem',
              background: '#78f3d3',
              color: '#313D52',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}

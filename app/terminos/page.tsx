import React from "react";

export const metadata = {
  title: "Términos y Condiciones | VIP Cleaners",
  description:
    "Lee los términos y condiciones de uso de VIP Cleaners: reservas, pagos, recolección, comunicaciones (incluye WhatsApp), tratamiento de datos personales y limitaciones de responsabilidad.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 text-gray-800">
      {/* Hero */}
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#313D52]">
          Términos y Condiciones
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Última actualización: 9 de agosto de 2025
        </p>
      </header>

      {/* Intro */}
      <section className="mb-8">
        <p>
          Bienvenido(a) a <strong>VIP Cleaners</strong>. Estos Términos y
          Condiciones (los “Términos”) regulan el uso de nuestro sitio web,
          aplicaciones y servicios de limpieza, restauración y cuidado de
          calzado (en conjunto, los “Servicios”). Al reservar, pagar o dar
          seguimiento a una orden, aceptas estos Términos.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          Si no estás de acuerdo con algún punto, por favor no utilices los
          Servicios. Si tienes dudas, escríbenos a nuestro canal de soporte.
        </p>
      </section>

      {/* Tabla de contenidos */}
      <nav
        aria-label="Índice"
        className="mb-10 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="mb-2 text-base font-semibold text-[#313D52]">
          Contenido
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>
            <a className="hover:underline text-[#313D52]" href="#definiciones">
              1. Definiciones
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#reservas">
              2. Reservas y disponibilidad
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#servicios">
              3. Descripción del servicio
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#precios-pagos">
              4. Precios, impuestos y pagos
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#pickup-entrega">
              5. Recolección (pickup) y entrega
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#cancelaciones">
              6. Cancelaciones y cambios
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#comunicaciones">
              7. Comunicaciones y uso de tu número de teléfono
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#whatsapp">
              8. Seguimiento por WhatsApp
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#datos-personales">
              9. Tratamiento de datos personales (Aviso de Privacidad resumido)
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#seguridad">
              10. Seguridad, Turnstile y cookies
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#responsabilidad">
              11. Limitación de responsabilidad
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#propiedad">
              12. Propiedad intelectual
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#modificaciones">
              13. Modificaciones a los Términos
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#jurisdiccion">
              14. Ley aplicable y jurisdicción
            </a>
          </li>
          <li>
            <a className="hover:underline text-[#313D52]" href="#contacto">
              15. Contacto
            </a>
          </li>
        </ul>
      </nav>

      {/* 1. Definiciones */}
      <section id="definiciones" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          1. Definiciones
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Cliente</strong>: Persona que reserva, entrega o contrata
            servicios con VIP Cleaners.
          </li>
          <li>
            <strong>Orden</strong>: Registro que agrupa uno o varios servicios
            para uno o más pares de calzado.
          </li>
          <li>
            <strong>Reserva</strong>: Solicitud previa que puede convertirse en
            orden.
          </li>
          <li>
            <strong>Pickup</strong>: Servicio de recolección y, en su caso,
            entrega en domicilio dentro de zonas de cobertura.
          </li>
        </ul>
      </section>

      {/* 2. Reservas y disponibilidad */}
      <section id="reservas" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          2. Reservas y disponibilidad
        </h2>
        <p>
          Las reservas se sujetan a disponibilidad de agenda. El calendario de
          la plataforma únicamente permite elegir desde el día siguiente hasta
          45 días posteriores a la fecha actual. Las fechas y horarios
          seleccionados son estimaciones y pueden ajustarse por causas
          operativas; te notificaremos cualquier cambio.
        </p>
      </section>

      {/* 3. Servicios */}
      <section id="servicios" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          3. Descripción del servicio
        </h2>
        <p>
          Ofrecemos servicios de limpieza, mantenimiento y restauración de
          calzado. Cada servicio puede incluir actividades específicas y tiempos
          estimados que se muestran durante la reserva. En caso de condiciones
          particulares del calzado (materiales delicados, daños previos,
          intervenciones anteriores), podemos declarar no viable algún proceso o
          proponer alternativas.
        </p>
        <p className="mt-3">
          El tiempo total estimado puede variar según el volumen (pares) y los
          servicios elegidos. Para órdenes con múltiples pares, el tiempo se
          calcula por par y servicio.
        </p>
      </section>

      {/* 4. Precios y pagos */}
      <section id="precios-pagos" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          4. Precios, impuestos y pagos
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            Los precios se muestran en moneda local e incluyen impuestos cuando
            así se indique. En el desglose de orden verás subtotal, impuestos y
            total.
          </li>
          <li>
            Cualquier servicio adicional no cotizado inicialmente será
            presupuestado y deberá ser aprobado por ti antes de ejecutarse.
          </li>
          <li>
            Los métodos de pago y su momento (anticipo, contraentrega, etc.) se
            especifican en la orden.
          </li>
        </ul>
      </section>

      {/* 5. Pickup y entrega */}
      <section id="pickup-entrega" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          5. Recolección (pickup) y entrega
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            El servicio de pickup está disponible solo en zonas de cobertura y
            puede tener un costo adicional visible durante la reserva.
          </li>
          <li>
            Requieres proporcionar una dirección completa y un horario de
            disponibilidad razonable. El tiempo de llegada es estimado y puede
            variar por tráfico u otras causas.
          </li>
          <li>
            Si no hay cobertura para tu código postal, no podremos ofrecer
            pickup para esa dirección.
          </li>
        </ul>
      </section>

      {/* 6. Cancelaciones */}
      <section id="cancelaciones" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          6. Cancelaciones y cambios
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            Puedes solicitar cambios o cancelaciones antes de que iniciemos el
            servicio. Si el proceso ya comenzó, podrían aplicarse cargos por los
            trabajos realizados hasta ese momento.
          </li>
          <li>
            En caso de pickups no atendidos o recolecciones fallidas por datos
            incompletos, podrían generarse cargos por visita.
          </li>
        </ul>
      </section>

      {/* 7. Comunicaciones */}
      <section id="comunicaciones" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          7. Comunicaciones y uso de tu número de teléfono
        </h2>
        <p>
          Al proporcionar tu número de teléfono, autorizas que lo utilicemos
          para ponernos en contacto contigo exclusivamente respecto a tu
          reserva/orden, confirmaciones, recordatorios, notificaciones de avance
          y entrega, y cualquier gestión relacionada con el servicio.
        </p>
        <p className="mt-3 text-sm text-gray-600">
          No compartimos tu número con terceros para fines comerciales ajenos a
          la prestación del servicio. Puedes solicitar dejar de recibir
          comunicaciones en cualquier momento.
        </p>
      </section>

      {/* 8. WhatsApp */}
      <section id="whatsapp" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          8. Seguimiento por WhatsApp (consentimiento opcional)
        </h2>
        <p>
          De forma opcional, puedes aceptar recibir seguimiento y avisos por
          WhatsApp relacionados con tu orden (confirmación, estatus, avisos de
          entrega). Puedes revocar este consentimiento en cualquier momento
          escribiéndonos por el mismo medio o a soporte.
        </p>
      </section>

      {/* 9. Datos personales */}
      <section id="datos-personales" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          9. Tratamiento de datos personales (resumen)
        </h2>
        <p>
          Tratamos tus datos personales conforme a la legislación mexicana
          aplicable (incluida la LFPDPPP). Recabamos datos de contacto (nombre,
          teléfono, correo), datos de la orden (servicio solicitado, pares,
          montos) y, cuando aplica, dirección para pickup. Utilizamos esta
          información para gestionar tu reserva/orden, facturación, atención al
          cliente y cumplimiento de obligaciones legales.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            <strong>Base de legitimación:</strong> ejecución del contrato y tu
            consentimiento (por ejemplo, WhatsApp).
          </li>
          <li>
            <strong>Conservación:</strong> durante la relación y por los plazos
            necesarios para cumplir obligaciones legales o resolver disputas.
          </li>
          <li>
            <strong>Derechos ARCO:</strong> puedes ejercer acceso, rectificación,
            cancelación y oposición, así como revocar consentimientos.
          </li>
        </ul>
        <p className="mt-3 text-sm text-gray-600">
          Para conocer el Aviso de Privacidad integral o ejercer tus derechos,
          contáctanos en el medio de soporte indicado abajo.
        </p>
      </section>

      {/* 10. Seguridad y Turnstile */}
      <section id="seguridad" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          10. Seguridad, verificación (Turnstile) y cookies
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            Implementamos medidas técnicas y administrativas razonables para
            proteger tu información. Ningún sistema es 100% infalible.
          </li>
          <li>
            Utilizamos <strong>Cloudflare Turnstile</strong> para proteger los
            formularios contra abuso automatizado. Al enviar un formulario, se
            verifica tu interacción con dicho servicio. Puedes consultar la
            documentación de Cloudflare para más información.
          </li>
          <li>
            Empleamos cookies o tecnologías similares para funcionamiento básico
            del sitio y, cuando proceda, para recordar preferencias.
          </li>
        </ul>
      </section>

      {/* 11. Responsabilidad */}
      <section id="responsabilidad" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          11. Limitación de responsabilidad
        </h2>
        <p>
          Actuamos con el máximo cuidado profesional. No obstante, salvo que la
          ley disponga lo contrario, nuestra responsabilidad frente al Cliente
          se limita al monto efectivamente pagado por los Servicios en la orden
          correspondiente. No somos responsables por daños indirectos, lucro
          cesante o perjuicios consecuenciales.
        </p>
      </section>

      {/* 12. Propiedad intelectual */}
      <section id="propiedad" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          12. Propiedad intelectual
        </h2>
        <p>
          Los contenidos del sitio (textos, marcas, logotipos, diseño y
          software) están protegidos. No adquieres derechos de propiedad sobre
          los mismos por el uso del sitio o los Servicios.
        </p>
      </section>

      {/* 13. Modificaciones */}
      <section id="modificaciones" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          13. Modificaciones a los Términos
        </h2>
        <p>
          Podemos actualizar estos Términos para reflejar cambios operativos o
          legales. Publicaremos la versión vigente con su fecha de
          actualización. El uso continuado del servicio implica aceptación de
          los cambios.
        </p>
      </section>

      {/* 14. Jurisdicción */}
      <section id="jurisdiccion" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">
          14. Ley aplicable y jurisdicción
        </h2>
        <p>
          Estos Términos se rigen por las leyes de México. Cualquier disputa se
          someterá a los tribunales competentes de la ciudad donde se encuentre
          el establecimiento principal de VIP Cleaners, salvo disposición legal
          en contrario.
        </p>
      </section>

      {/* 15. Contacto */}
      <section id="contacto" className="mb-8 scroll-mt-20">
        <h2 className="mb-3 text-xl font-semibold text-[#313D52]">15. Contacto</h2>
        <p>
          Si tienes dudas sobre estos Términos, tus datos personales o deseas
          ejercer derechos, contáctanos por los canales oficiales indicados en
          el sitio. 
        </p>
      </section>

      {/* Footer helper */}
      <div className="mt-10 rounded-xl border border-[#313D52]/20 bg-[#78f3d3]/10 p-4 text-sm text-[#313D52]">
        <p>
          Al marcar la casilla de “Acepto los Términos y Condiciones” en el
          formulario de reserva confirmas haber leído y aceptado este documento,
          así como el uso de tu número para fines relacionados con tu orden.
        </p>
      </div>
    </main>
  );
}

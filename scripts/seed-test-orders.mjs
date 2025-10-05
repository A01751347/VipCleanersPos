// scripts/seed-test-orders.mjs
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SERVICES_ENDPOINT = `${BASE_URL}/api/services`;
const BOOKING_ENDPOINT = `${BASE_URL}/api/booking`;

function isoDatePlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function fetchFirstActiveService() {
  const res = await fetch(SERVICES_ENDPOINT, { cache: "no-store" });
  if (!res.ok) {
    console.warn("No se pudo leer /api/services, usando fallback servicio_id=1");
    return { id: "1", price: 0, name: "Servicio Fallback" };
  }
  const data = await res.json();
  const active = (data.services || []).filter(s => s.activo);
  if (active.length === 0) {
    console.warn("No hay servicios activos, usando fallback servicio_id=1");
    return { id: "1", price: 0, name: "Servicio Fallback" };
  }
  const s = active[0];
  return {
    id: String(s.servicio_id),
    price: Number(s.precio) || 0,
    name: s.nombre || "Servicio",
  };
}

async function createOrder(i, service) {
  const idx = i + 1;
  const fullName = `Test${idx}`;
  const email = `Test${idx}@test.com`;
  const phone = String(5550000000 + idx).slice(-10); // 10 dígitos
  const bookingDate = isoDatePlus(1); // mañana
  const timeSlots = ["10:00", "10:30", "11:00", "11:30", "12:00",
                     "12:30", "13:00", "13:30", "14:00", "14:30"];
  const bookingTime = timeSlots[i % timeSlots.length];

  const body = {
    fullName,
    email,
    phone,
    services: [
      {
        serviceId: service.id,
        quantity: 1,
        shoesType: "Tenis de prueba",
        serviceName: service.name,
        servicePrice: service.price,
      },
    ],
    totalServiceCost: service.price,
    deliveryMethod: "store",
    requiresPickup: false,
    address: null,
    bookingDate,
    bookingTime,
    pickupCost: 0,
    pickupZone: null,
    source: "seed_script",
    // Si SKIP_TURNSTILE=true en el server, da igual el token
    turnstileToken: "SEED_TOKEN",
    acceptTerms: true,
    acceptWhatsapp: false,
  };

  const res = await fetch(BOOKING_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(`Fallo orden #${idx}: ${res.status} ${res.statusText} ${json?.error || ""}`);
  }
  return json;
}

(async () => {
  try {
    console.log("Obteniendo servicio activo…");
    const service = await fetchFirstActiveService();
    console.log("Servicio seleccionado:", service);

    const results = [];
    for (let i = 0; i < 10; i++) {
      const r = await createOrder(i, service);
      results.push({ i: i + 1, reference: r.bookingReference, orderId: r.orderId });
      console.log(`✓ Orden Test${i + 1}: ref=${r.bookingReference} id=${r.orderId}`);
    }

    console.log("\nResumen:");
    results.forEach(r =>
      console.log(`Test${r.i} → Ref: ${r.reference} | OrderId: ${r.orderId}`)
    );
  } catch (err) {
    console.error("Error sembrando órdenes:", err.message);
    process.exit(1);
  }
})();

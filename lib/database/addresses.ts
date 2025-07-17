import { executeQuery } from './connection';

// Función para crear una nueva dirección
export async function createAddress(
  clienteId: number,
  tipo: 'domicilio' | 'pickup' | 'facturacion' | 'otro',
  calle: string,
  numeroExterior: string,
  numeroInterior: string | null,
  colonia: string | null,
  delegacionMunicipio: string | null,
  ciudad: string,
  estado: string,
  codigoPostal: string,
  alias: string | null = null,
  telefonoContacto: string | null = null,
  destinatario: string | null = null,
  instrucciones: string | null = null,
  ventanaHoraInicio: string | null = null,
  ventanaHoraFin: string | null = null
): Promise<number> {
  const query = `
    CALL CrearDireccion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  
  const result = await executeQuery<any[]>({
    query,
    values: [
      clienteId,
      tipo,
      alias || 'Dirección sin alias',
      calle,
      numeroExterior,
      numeroInterior,
      colonia,
      delegacionMunicipio,
      ciudad,
      estado,
      'México',             // país fijo
      codigoPostal,
      null,                 // latitud
      null,                 // longitud
      telefonoContacto,
      destinatario,
      instrucciones,
      ventanaHoraInicio,
      ventanaHoraFin
    ]
  });

  // Obtener el ID de la dirección del primer result set
  const direccionId = result?.[0]?.[0]?.direccion_id;

  if (!direccionId || typeof direccionId !== 'number') {
    throw new Error('No se pudo obtener el ID de la dirección');
  }

  return direccionId;
}

// Función para obtener direcciones de un cliente
export async function getClientAddresses(clienteId: number) {
  const query = `
    SELECT * FROM direcciones
    WHERE cliente_id = ? AND activo = TRUE
    ORDER BY tipo ASC
  `;
  
  return executeQuery({
    query,
    values: [clienteId]
  });
}

// Función para validar si una dirección ya existe para un cliente
export async function getClientAddressByDetails(
  clienteId: number,
  calle: string,
  numeroExterior: string,
  codigoPostal: string
) {
  try {
    const query = `
      SELECT * FROM direcciones
      WHERE cliente_id = ? 
        AND calle = ? 
        AND numero_exterior = ? 
        AND codigo_postal = ?
        AND activo = TRUE
      LIMIT 1
    `;
    
    const result = await executeQuery<any[]>({
      query,
      values: [clienteId, calle, numeroExterior, codigoPostal]
    });
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error buscando dirección existente:', error);
    throw error;
  }
}

// Función para actualizar dirección existente
export async function updateAddress(
  direccionId: number,
  {
    calle,
    numeroExterior,
    numeroInterior,
    colonia,
    municipio,
    ciudad,
    estado,
    codigoPostal,
    telefono,
    destinatario,
    instrucciones,
    ventanaInicio,
    ventanaFin
  }: {
    calle?: string;
    numeroExterior?: string;
    numeroInterior?: string | null;
    colonia?: string;
    municipio?: string | null;
    ciudad?: string;
    estado?: string;
    codigoPostal?: string;
    telefono?: string | null;
    destinatario?: string | null;
    instrucciones?: string | null;
    ventanaInicio?: string | null;
    ventanaFin?: string | null;
  }
) {
  try {
    const query = `
      UPDATE direcciones 
      SET 
        calle = COALESCE(?, calle),
        numero_exterior = COALESCE(?, numero_exterior),
        numero_interior = ?,
        colonia = COALESCE(?, colonia),
        municipio_delegacion = ?,
        ciudad = COALESCE(?, ciudad),
        estado = COALESCE(?, estado),
        codigo_postal = COALESCE(?, codigo_postal),
        telefono_contacto = ?,
        destinatario = ?,
        instrucciones_entrega = ?,
        ventana_hora_inicio = ?,
        ventana_hora_fin = ?,
        fecha_actualizacion = NOW()
      WHERE direccion_id = ?
    `;
    
    await executeQuery({
      query,
      values: [
        calle, numeroExterior, numeroInterior, colonia, municipio,
        ciudad, estado, codigoPostal, telefono, destinatario,
        instrucciones, ventanaInicio, ventanaFin, direccionId
      ]
    });
    
    return true;
  } catch (error) {
    console.error('Error actualizando dirección:', error);
    throw error;
  }
}
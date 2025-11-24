-- Agregar campos de facturación a la tabla de órdenes
-- Ejecutar este script SQL en tu base de datos

-- 1. Agregar campos de control de facturación a la tabla ordenes
ALTER TABLE ordenes
ADD COLUMN facturado BOOLEAN DEFAULT FALSE COMMENT 'Indica si la orden ya fue facturada',
ADD COLUMN factura_uuid VARCHAR(100) NULL COMMENT 'UUID del CFDI generado',
ADD COLUMN factura_serie VARCHAR(20) NULL COMMENT 'Serie de la factura',
ADD COLUMN factura_folio VARCHAR(50) NULL COMMENT 'Folio de la factura',
ADD COLUMN factura_fecha DATETIME NULL COMMENT 'Fecha de emisión de la factura',
ADD COLUMN factura_pdf_url TEXT NULL COMMENT 'URL del PDF de la factura',
ADD COLUMN factura_xml_url TEXT NULL COMMENT 'URL del XML de la factura',
ADD COLUMN factura_status ENUM('pending', 'issued', 'cancelled') DEFAULT 'pending' COMMENT 'Estado de la factura',
ADD COLUMN facturapi_id VARCHAR(100) NULL COMMENT 'ID de la factura en Facturapi',
ADD COLUMN rfc_cliente VARCHAR(13) NULL COMMENT 'RFC del cliente para facturación',
ADD COLUMN razon_social_cliente VARCHAR(255) NULL COMMENT 'Razón social del cliente',
ADD COLUMN uso_cfdi VARCHAR(10) DEFAULT 'G03' COMMENT 'Uso del CFDI (G03 = Gastos en general)',
ADD COLUMN regimen_fiscal VARCHAR(10) NULL COMMENT 'Régimen fiscal del cliente',
ADD COLUMN codigo_postal_fiscal VARCHAR(10) NULL COMMENT 'Código postal fiscal del cliente',
ADD INDEX idx_facturado (facturado),
ADD INDEX idx_factura_uuid (factura_uuid),
ADD INDEX idx_factura_status (factura_status),
ADD INDEX idx_rfc_cliente (rfc_cliente);

-- 2. Crear tabla de logs de facturación (auditoría)
CREATE TABLE IF NOT EXISTS facturas_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT NOT NULL,
  accion ENUM('created', 'cancelled', 'error', 'email_sent') NOT NULL COMMENT 'Tipo de acción',
  factura_uuid VARCHAR(100) NULL,
  usuario_id INT NULL COMMENT 'Usuario que realizó la acción (NULL si fue self-service)',
  detalles TEXT NULL COMMENT 'Detalles adicionales en JSON',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orden_id (orden_id),
  INDEX idx_factura_uuid (factura_uuid),
  FOREIGN KEY (orden_id) REFERENCES ordenes(orden_id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla para almacenar datos fiscales de clientes (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS clientes_datos_fiscales (
  dato_fiscal_id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  rfc VARCHAR(13) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  uso_cfdi VARCHAR(10) DEFAULT 'G03',
  regimen_fiscal VARCHAR(10) NOT NULL,
  codigo_postal VARCHAR(10) NOT NULL,
  email_facturacion VARCHAR(255) NULL,
  es_predeterminado BOOLEAN DEFAULT FALSE COMMENT 'Si es el RFC principal del cliente',
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cliente_rfc (cliente_id, rfc),
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_rfc (rfc),
  FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Actualizar órdenes existentes (marcar como no facturadas)
UPDATE ordenes SET facturado = FALSE WHERE facturado IS NULL;
UPDATE ordenes SET factura_status = 'pending' WHERE factura_status IS NULL;

-- 5. Comentarios sobre uso del CFDI (referencia)
-- G01 = Adquisición de mercancías
-- G02 = Devoluciones, descuentos o bonificaciones
-- G03 = Gastos en general (más común para servicios de lavandería)
-- I01 = Construcciones
-- I02 = Mobiliario y equipo de oficina por inversiones
-- I03 = Equipo de transporte
-- I04 = Equipo de cómputo y accesorios
-- I05 = Dados, troqueles, moldes, matrices y herramental
-- I06 = Comunicaciones telefónicas
-- I07 = Comunicaciones satelitales
-- I08 = Otra maquinaria y equipo
-- D01 = Honorarios médicos, dentales y gastos hospitalarios
-- D02 = Gastos médicos por incapacidad o discapacidad
-- D03 = Gastos funerales
-- D04 = Donativos
-- D05 = Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)
-- D06 = Aportaciones voluntarias al SAR
-- D07 = Primas por seguros de gastos médicos
-- D08 = Gastos de transportación escolar obligatoria
-- D09 = Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones
-- D10 = Pagos por servicios educativos (colegiaturas)
-- P01 = Por definir (el cliente decide después)

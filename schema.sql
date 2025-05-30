-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS lavanderia_tenis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lavanderia_tenis;

-- Configurar restricciones de integridad referencial
SET FOREIGN_KEY_CHECKS = 1;

-- ======== Tabla de usuarios (sistema de autenticación) ========
CREATE TABLE usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'empleado', 'cliente') NOT NULL,
    token_recuperacion VARCHAR(100) NULL,
    expiracion_token DATETIME NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario_email (email),
    INDEX idx_usuario_rol (rol)
);

-- ======== Tabla de clientes ========
CREATE TABLE clientes (
    cliente_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT NULL,
    codigo_postal VARCHAR(10) NULL,
    ciudad VARCHAR(50) NULL,
    estado VARCHAR(50) NULL,
    pais VARCHAR(50) DEFAULT 'México',
    fecha_nacimiento DATE NULL,
    puntos_fidelidad INT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
    INDEX idx_cliente_nombre_completo (nombre, apellidos),
    INDEX idx_cliente_telefono (telefono)
);

-- ======== Tabla de empleados ========
CREATE TABLE empleados (
    empleado_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    ciudad VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    pais VARCHAR(50) DEFAULT 'México',
    fecha_nacimiento DATE NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    tipo_identificacion ENUM('INE', 'Pasaporte', 'Licencia', 'Otra') NOT NULL,
    fecha_contratacion DATE NOT NULL,
    puesto VARCHAR(50) NOT NULL,
    salario DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    INDEX idx_empleado_nombre_completo (nombre, apellidos),
    INDEX idx_empleado_puesto (puesto)
);

-- ======== Tabla de servicios ========
CREATE TABLE servicios (
    servicio_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    tiempo_estimado_minutos INT NOT NULL,
    requiere_identificacion BOOLEAN DEFAULT FALSE,
    requiere_identificacion_precio DECIMAL(10,2) DEFAULT 1000.00,
    imagen_url VARCHAR(255) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_servicio_nombre (nombre),
    INDEX idx_servicio_precio (precio)
);

-- ======== Tabla de categorías de productos ========
CREATE TABLE categorias_productos (
    categoria_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria_nombre (nombre)
);

-- ======== Tabla de productos ========
CREATE TABLE productos (
    producto_id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    codigo_barras VARCHAR(50) NULL,
    imagen_url VARCHAR(255) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_productos(categoria_id),
    INDEX idx_producto_nombre (nombre),
    INDEX idx_producto_codigo_barras (codigo_barras)
);

-- ======== Tabla de estados de servicio ========
CREATE TABLE estados_servicio (
    estado_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT NULL,
    orden INT NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#000000',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado_nombre (nombre)
);

-- ======== Tabla de marcas asociadas ========
CREATE TABLE marcas (
    marca_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    logo_url VARCHAR(255) NULL,
    sitio_web VARCHAR(255) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_marca_nombre (nombre)
);

-- ======== Tabla de modelos de calzado ========
CREATE TABLE modelos_calzado (
    modelo_id INT AUTO_INCREMENT PRIMARY KEY,
    marca_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    imagen_url VARCHAR(255) NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (marca_id) REFERENCES marcas(marca_id),
    INDEX idx_modelo_nombre (nombre)
);

-- ======== Tabla de reservaciones ========
CREATE TABLE reservaciones (
    reservacion_id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    modelo_id INT NULL,
    marca VARCHAR(100) NULL,
    modelo VARCHAR(100) NULL,
    descripcion_calzado TEXT NULL,
    fecha_reservacion DATETIME NOT NULL,
    fecha_entrega_estimada DATETIME NOT NULL,
    notas TEXT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada') DEFAULT 'pendiente',
    codigo_reservacion VARCHAR(20) NOT NULL UNIQUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id),
    FOREIGN KEY (servicio_id) REFERENCES servicios(servicio_id),
    FOREIGN KEY (modelo_id) REFERENCES modelos_calzado(modelo_id),
    INDEX idx_reservacion_fecha (fecha_reservacion),
    INDEX idx_reservacion_estado (estado),
    INDEX idx_reservacion_codigo (codigo_reservacion)
);

-- ======== Tabla de órdenes ========
CREATE TABLE ordenes (
    orden_id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    empleado_recepcion_id INT NOT NULL,
    empleado_entrega_id INT NULL,
    reservacion_id INT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    estado_actual_id INT NOT NULL,
    requiere_identificacion BOOLEAN DEFAULT FALSE,
    tiene_identificacion_registrada BOOLEAN DEFAULT FALSE,
    fecha_recepcion DATETIME NOT NULL,
    fecha_entrega_estimada DATETIME NOT NULL,
    fecha_entrega_real DATETIME NULL,
    notas TEXT NULL,
    codigo_orden VARCHAR(20) NOT NULL UNIQUE,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'mercado_pago') NULL,
    estado_pago ENUM('pendiente', 'parcial', 'pagado') DEFAULT 'pendiente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id),
    FOREIGN KEY (empleado_recepcion_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (empleado_entrega_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (reservacion_id) REFERENCES reservaciones(reservacion_id),
    FOREIGN KEY (estado_actual_id) REFERENCES estados_servicio(estado_id),
    INDEX idx_orden_fecha_recepcion (fecha_recepcion),
    INDEX idx_orden_codigo (codigo_orden),
    INDEX idx_orden_estado_actual (estado_actual_id),
    INDEX idx_orden_estado_pago (estado_pago)
);

-- ======== Tabla de detalles de orden (servicios) ========
CREATE TABLE detalles_orden_servicios (
    detalle_servicio_id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    servicio_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    modelo_id INT NULL,
    marca VARCHAR(100) NULL,
    modelo VARCHAR(100) NULL,
    descripcion_calzado TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes(orden_id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(servicio_id),
    FOREIGN KEY (modelo_id) REFERENCES modelos_calzado(modelo_id),
    INDEX idx_detalle_servicio_orden (orden_id)
);

-- ======== Tabla de cajas ========
CREATE TABLE IF NOT EXISTS cajas (
    caja_id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    capacidad INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ======== Tabla de asociación caja_items ========
CREATE TABLE IF NOT EXISTS caja_items (
    caja_id INT NOT NULL,
    detalle_servicio_id INT NOT NULL,
    cantidad INT NOT NULL,
    PRIMARY KEY (caja_id, detalle_servicio_id),
    FOREIGN KEY (caja_id) REFERENCES cajas(caja_id),
    FOREIGN KEY (detalle_servicio_id) REFERENCES detalles_orden_servicios(detalle_servicio_id)
);

Show Tables;
SELECT * FROM vw_detalles_orden_servicios;
SELECT * FROM vw_servicios_detalle;

-- ======== Tabla de detalles de orden (productos) ========
CREATE TABLE detalles_orden_productos (
    detalle_producto_id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes(orden_id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id),
    INDEX idx_detalle_producto_orden (orden_id)
);

-- ======== Tabla de historial de estados de órdenes ========
CREATE TABLE historial_estados (
    historial_id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    estado_id INT NOT NULL,
    empleado_id INT NOT NULL,
    comentario TEXT NULL,
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes(orden_id) ON DELETE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES estados_servicio(estado_id),
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    INDEX idx_historial_orden (orden_id),
    INDEX idx_historial_fecha (fecha_cambio)
);

-- ======== Tabla de pagos ========
CREATE TABLE pagos (
    pago_id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo ENUM('efectivo', 'tarjeta', 'transferencia', 'mercado_pago') NOT NULL,
    referencia VARCHAR(100) NULL,
    terminal_id VARCHAR(50) NULL,
    empleado_id INT NOT NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'procesando', 'completado', 'rechazado', 'reembolsado') DEFAULT 'completado',
    FOREIGN KEY (orden_id) REFERENCES ordenes(orden_id) ON DELETE CASCADE,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    INDEX idx_pago_orden (orden_id),
    INDEX idx_pago_fecha (fecha_pago),
    INDEX idx_pago_estado (estado)
);

-- ======== Tabla de archivos media ========
CREATE TABLE archivos_media (
    archivo_id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('calzado_entrada', 'calzado_salida', 'identificacion', 'otro') NOT NULL,
    entidad_tipo ENUM('orden', 'cliente', 'empleado', 'producto', 'servicio', 'marca') NOT NULL,
    entidad_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    extension VARCHAR(10) NOT NULL,
    tamano INT NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    s3_url VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    es_publico BOOLEAN DEFAULT FALSE,
    empleado_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    INDEX idx_archivo_tipo (tipo),
    INDEX idx_archivo_entidad (entidad_tipo, entidad_id)
);

-- ======== Tabla de preguntas frecuentes ========
CREATE TABLE preguntas_frecuentes (
    pregunta_id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    orden INT NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pregunta_activo (activo)
);

-- ======== Tabla de consultas de contacto ========
CREATE TABLE consultas_contacto (
    consulta_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NULL,
    asunto VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    estado ENUM('pendiente', 'en_proceso', 'respondida', 'cerrada') DEFAULT 'pendiente',
    empleado_asignado_id INT NULL,
    fecha_respuesta DATETIME NULL,
    respuesta TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_asignado_id) REFERENCES empleados(empleado_id) ON DELETE SET NULL,
    INDEX idx_consulta_estado (estado),
    INDEX idx_consulta_email (email)
);

-- ======== Tabla de inventario de movimientos ========
CREATE TABLE inventario_movimientos (
    movimiento_id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    orden_id INT NULL,
    empleado_id INT NOT NULL,
    motivo TEXT NULL,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id),
    FOREIGN KEY (orden_id) REFERENCES ordenes(orden_id) ON DELETE SET NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    INDEX idx_movimiento_producto (producto_id),
    INDEX idx_movimiento_fecha (fecha_movimiento),
    INDEX idx_movimiento_tipo (tipo_movimiento)
);

-- ======== Tabla de configuración del sistema ========
CREATE TABLE configuracion_sistema (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_clave (clave)
);

-- ======== Tabla de registro de actividad (auditoría) ========
CREATE TABLE registro_actividad (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    tabla_afectada VARCHAR(100) NOT NULL,
    accion ENUM('crear', 'actualizar', 'eliminar', 'login', 'logout', 'otro') NOT NULL,
    registro_id INT NULL,
    datos_anteriores JSON NULL,
    datos_nuevos JSON NULL,
    ip_usuario VARCHAR(45) NULL,
    user_agent TEXT NULL,
    fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
    INDEX idx_log_tabla (tabla_afectada),
    INDEX idx_log_accion (accion),
    INDEX idx_log_fecha (fecha_accion)
);

-- ======== Inserción de datos iniciales para estados de servicio ========
INSERT INTO estados_servicio (nombre, descripcion, orden, color) VALUES 
('Recibido', 'El calzado ha sido recibido en la lavandería', 1, '#3498db'),
('En proceso', 'El calzado está siendo procesado', 2, '#f39c12'),
('Lavando', 'El calzado está en proceso de lavado', 3, '#2ecc71'),
('Secando', 'El calzado está en proceso de secado', 4, '#9b59b6'),
('Control de calidad', 'Verificación final del calzado', 5, '#e74c3c'),
('Listo para entrega', 'El calzado está listo para ser entregado', 6, '#1abc9c'),
('Entregado', 'El calzado ha sido entregado al cliente', 7, '#34495e');

-- ======== Inserción de datos iniciales para configuración del sistema ========
INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
('precio_minimo_requiere_id', '1000', 'Precio mínimo a partir del cual se requiere identificación'),
('iva_porcentaje', '16', 'Porcentaje de IVA aplicable'),
('nombre_empresa', 'CleanKicks', 'Nombre de la empresa'),
('telefono_contacto', '(55) 1234-5678', 'Teléfono de contacto principal'),
('email_contacto', 'contacto@cleankicks.mx', 'Email de contacto principal'),
('direccion_empresa', 'Av. Reforma 123, Col. Juárez, CDMX', 'Dirección física de la empresa'),
('horario_atencion', 'Lunes a Sábado de 10:00 a 20:00', 'Horario de atención al público');




USE lavanderia_tenis;

-- ======== Procedimiento para generar códigos únicos ========
DELIMITER //
CREATE PROCEDURE GenerarCodigoUnico(
    IN prefijo VARCHAR(5),
    OUT codigo VARCHAR(20)
)
BEGIN
    DECLARE fecha_actual CHAR(8);
    DECLARE aleatorio CHAR(5);
    
    -- Formato fecha YYYYMMDD
    SET fecha_actual = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Generar 5 dígitos aleatorios
    SET aleatorio = LPAD(FLOOR(RAND() * 100000), 5, '0');
    
    -- Combinar prefijo + fecha + aleatorio
    SET codigo = CONCAT(prefijo, fecha_actual, aleatorio);
END //
DELIMITER ;

-- ======== Procedimiento para crear una nueva reservación ========
DELIMITER //
CREATE PROCEDURE CrearReservacion(
    IN p_cliente_id INT,
    IN p_servicio_id INT,
    IN p_modelo_id INT,
    IN p_marca VARCHAR(100),
    IN p_modelo VARCHAR(100),
    IN p_descripcion_calzado TEXT,
    IN p_fecha_reservacion DATETIME,
    IN p_fecha_entrega_estimada DATETIME,
    IN p_notas TEXT,
    OUT p_reservacion_id INT,
    OUT p_codigo_reservacion VARCHAR(20)
)
BEGIN
    DECLARE codigo VARCHAR(20);
    
    -- Generar código único para la reservación
    CALL GenerarCodigoUnico('RES', codigo);
    
    -- Insertar la nueva reservación
    INSERT INTO reservaciones (
        cliente_id, 
        servicio_id, 
        modelo_id, 
        marca, 
        modelo, 
        descripcion_calzado, 
        fecha_reservacion, 
        fecha_entrega_estimada, 
        notas, 
        codigo_reservacion
    ) VALUES (
        p_cliente_id, 
        p_servicio_id, 
        p_modelo_id, 
        p_marca, 
        p_modelo, 
        p_descripcion_calzado, 
        p_fecha_reservacion, 
        p_fecha_entrega_estimada, 
        p_notas, 
        codigo
    );
    
    -- Obtener el ID de la reservación creada
    SET p_reservacion_id = LAST_INSERT_ID();
    SET p_codigo_reservacion = codigo;
END //
DELIMITER ;

-- ======== Procedimiento para crear una nueva orden ========
DELIMITER //
CREATE PROCEDURE CrearOrden(
    IN p_cliente_id INT,
    IN p_empleado_id INT,
    IN p_reservacion_id INT,
    IN p_fecha_entrega_estimada DATETIME,
    IN p_notas TEXT,
    OUT p_orden_id INT,
    OUT p_codigo_orden VARCHAR(20)
)
BEGIN
    DECLARE codigo VARCHAR(20);
    DECLARE estado_inicial INT;
    DECLARE v_subtotal DECIMAL(10,2) DEFAULT 0;
    DECLARE v_impuestos DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total DECIMAL(10,2) DEFAULT 0;
    DECLARE v_porcentaje_iva DECIMAL(5,2);
    
    -- Obtener el estado inicial (Recibido)
    SELECT estado_id INTO estado_inicial FROM estados_servicio WHERE orden = 1 LIMIT 1;
    
    -- Obtener el porcentaje de IVA desde la configuración
    SELECT CAST(valor AS DECIMAL(5,2)) INTO v_porcentaje_iva 
    FROM configuracion_sistema WHERE clave = 'iva_porcentaje';
    
    -- Generar código único para la orden
    CALL GenerarCodigoUnico('ORD', codigo);
    
    -- Insertar la orden con valores iniciales
    INSERT INTO ordenes (
        cliente_id,
        empleado_recepcion_id,
        reservacion_id,
        subtotal,
        impuestos,
        total,
        estado_actual_id,
        fecha_recepcion,
        fecha_entrega_estimada,
        notas,
        codigo_orden
    ) VALUES (
        p_cliente_id,
        p_empleado_id,
        p_reservacion_id,
        v_subtotal,
        v_impuestos,
        v_total,
        estado_inicial,
        NOW(),
        p_fecha_entrega_estimada,
        p_notas,
        codigo
    );
    
    -- Obtener el ID de la orden creada
    SET p_orden_id = LAST_INSERT_ID();
    SET p_codigo_orden = codigo;
    
    -- Registrar el estado inicial en el historial
    INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario)
    VALUES (p_orden_id, estado_inicial, p_empleado_id, 'Orden creada');
    
    -- Si viene de una reservación, actualizar su estado
    IF p_reservacion_id IS NOT NULL THEN
        UPDATE reservaciones SET estado = 'confirmada' WHERE reservacion_id = p_reservacion_id;
    END IF;
END //
DELIMITER ;

-- ======== Procedimiento para asignar detalle a caja con espacio ========
DELIMITER //
CREATE PROCEDURE AsignarDetalleACaja(
    IN p_detalle_servicio_id INT,
    IN p_cantidad_pares INT
)
BEGIN
    DECLARE v_caja_id INT;
    DECLARE v_espacio INT;
    DECLARE done INT DEFAULT 0;

    DECLARE cur CURSOR FOR
      SELECT caja_id
      FROM cajas
      ORDER BY numero;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_caja_id;
        IF done = 1 THEN 
           LEAVE read_loop;
        END IF;

        -- Calcular espacio disponible en esta caja
        SELECT c.capacidad - IFNULL(SUM(ci.cantidad),0)
          INTO v_espacio
        FROM cajas c
        LEFT JOIN caja_items ci ON c.caja_id = ci.caja_id
        WHERE c.caja_id = v_caja_id
        GROUP BY c.caja_id;

        IF v_espacio >= p_cantidad_pares THEN
            INSERT INTO caja_items(caja_id, detalle_servicio_id, cantidad)
            VALUES (v_caja_id, p_detalle_servicio_id, p_cantidad_pares);
            LEAVE read_loop;
        END IF;
    END LOOP;
    CLOSE cur;

    IF done = 1 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'No hay espacio disponible en ninguna caja';
    END IF;
END //
DELIMITER ;

-- ======== Trigger: asignar caja tras insertar servicio ========
DELIMITER //
CREATE TRIGGER trg_asignar_caja_al_agregar_servicio
AFTER INSERT ON detalles_orden_servicios
FOR EACH ROW
BEGIN
    CALL AsignarDetalleACaja(NEW.detalle_servicio_id, NEW.cantidad);
END //
DELIMITER ;

-- ======== Trigger: liberar espacio al entregar tenis ========
DELIMITER //
CREATE TRIGGER trg_liberar_caja_al_entregar
AFTER INSERT ON historial_estados
FOR EACH ROW
BEGIN
    DECLARE v_estado_nombre VARCHAR(50);
    -- Obtener el nombre del nuevo estado
    SELECT nombre INTO v_estado_nombre
      FROM estados_servicio
      WHERE estado_id = NEW.estado_id;

    IF v_estado_nombre = 'Entregado' THEN
        -- Eliminar los ítems de caja asociados a la orden entregada
        DELETE ci
        FROM caja_items ci
        JOIN detalles_orden_servicios dos ON ci.detalle_servicio_id = dos.detalle_servicio_id
        WHERE dos.orden_id = NEW.orden_id;
    END IF;
END //
DELIMITER ;

-- ======== Procedimiento para agregar servicio a una orden ========
DELIMITER //
CREATE PROCEDURE AgregarServicioOrden(
    IN p_orden_id INT,
    IN p_servicio_id INT,
    IN p_cantidad INT,
    IN p_modelo_id INT,
    IN p_marca VARCHAR(100),
    IN p_modelo VARCHAR(100),
    IN p_descripcion_calzado TEXT,
    OUT p_requiere_identificacion BOOLEAN
)
BEGIN
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_requiere_id BOOLEAN;
    DECLARE v_precio_minimo_requiere_id DECIMAL(10,2);
    
    -- Obtener el precio del servicio y si requiere identificación
    SELECT 
        precio, 
        requiere_identificacion,
        requiere_identificacion_precio
    INTO 
        v_precio, 
        v_requiere_id,
        v_precio_minimo_requiere_id
    FROM servicios 
    WHERE servicio_id = p_servicio_id;
    
    -- Calcular el subtotal
    SET v_subtotal = v_precio * p_cantidad;
    
    -- Agregar el detalle del servicio
    INSERT INTO detalles_orden_servicios (
        orden_id,
        servicio_id,
        cantidad,
        precio_unitario,
        subtotal,
        modelo_id,
        marca,
        modelo,
        descripcion_calzado
    ) VALUES (
        p_orden_id,
        p_servicio_id,
        p_cantidad,
        v_precio,
        v_subtotal,
        p_modelo_id,
        p_marca,
        p_modelo,
        p_descripcion_calzado
    );
    
    -- Actualizar los totales de la orden
    CALL ActualizarTotalesOrden(p_orden_id);
    
    -- Verificar si requiere identificación directamente por tipo de servicio
    IF v_requiere_id THEN
        SET p_requiere_identificacion = TRUE;
        UPDATE ordenes SET requiere_identificacion = TRUE WHERE orden_id = p_orden_id;
    ELSE
        -- Verificar si requiere identificación por precio
        SELECT CASE WHEN v_subtotal >= v_precio_minimo_requiere_id THEN TRUE ELSE FALSE END 
        INTO p_requiere_identificacion;
        
        IF p_requiere_identificacion THEN
            UPDATE ordenes SET requiere_identificacion = TRUE WHERE orden_id = p_orden_id;
        END IF;
    END IF;
END //
DELIMITER ;

-- ======== Procedimiento para agregar producto a una orden ========
DELIMITER //
CREATE PROCEDURE AgregarProductoOrden(
    IN p_orden_id INT,
    IN p_producto_id INT,
    IN p_cantidad INT
)
BEGIN
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_stock_actual INT;
    
    -- Verificar stock disponible
    SELECT precio, stock INTO v_precio, v_stock_actual FROM productos WHERE producto_id = p_producto_id;
    
    IF v_stock_actual < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para el producto';
    END IF;
    
    -- Calcular el subtotal
    SET v_subtotal = v_precio * p_cantidad;
    
    -- Agregar el detalle del producto
    INSERT INTO detalles_orden_productos (
        orden_id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal
    ) VALUES (
        p_orden_id,
        p_producto_id,
        p_cantidad,
        v_precio,
        v_subtotal
    );
    
    -- Actualizar el stock del producto
    UPDATE productos SET 
        stock = stock - p_cantidad 
    WHERE producto_id = p_producto_id;
    
    -- Registrar el movimiento de inventario
    INSERT INTO inventario_movimientos (
        producto_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        orden_id,
        empleado_id,
        motivo
    ) VALUES (
        p_producto_id,
        'salida',
        p_cantidad,
        v_stock_actual,
        v_stock_actual - p_cantidad,
        p_orden_id,
        (SELECT empleado_recepcion_id FROM ordenes WHERE orden_id = p_orden_id),
        'Venta en orden'
    );
    
    -- Actualizar los totales de la orden
    CALL ActualizarTotalesOrden(p_orden_id);
END //
DELIMITER ;

-- ======== Procedimiento para actualizar los totales de una orden ========
DELIMITER //
CREATE PROCEDURE ActualizarTotalesOrden(
    IN p_orden_id INT
)
BEGIN
    DECLARE v_subtotal_servicios DECIMAL(10,2);
    DECLARE v_subtotal_productos DECIMAL(10,2);
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_porcentaje_iva DECIMAL(5,2);
    DECLARE v_impuestos DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    -- Obtener el porcentaje de IVA desde la configuración
    SELECT CAST(valor AS DECIMAL(5,2)) INTO v_porcentaje_iva 
    FROM configuracion_sistema WHERE clave = 'iva_porcentaje';
    
    -- Calcular subtotal de servicios
    SELECT IFNULL(SUM(subtotal), 0) INTO v_subtotal_servicios 
    FROM detalles_orden_servicios 
    WHERE orden_id = p_orden_id;
    
    -- Calcular subtotal de productos
    SELECT IFNULL(SUM(subtotal), 0) INTO v_subtotal_productos 
    FROM detalles_orden_productos 
    WHERE orden_id = p_orden_id;
    
    -- Calcular subtotal total
    SET v_subtotal = v_subtotal_servicios + v_subtotal_productos;
    
    -- Calcular impuestos
    SET v_impuestos = v_subtotal * (v_porcentaje_iva / 100);
    
    -- Calcular total
    SET v_total = v_subtotal + v_impuestos;
    
    -- Actualizar la orden
    UPDATE ordenes SET 
        subtotal = v_subtotal,
        impuestos = v_impuestos,
        total = v_total
    WHERE orden_id = p_orden_id;
END //
DELIMITER ;

-- ======== Procedimiento para cambiar el estado de una orden ========
DELIMITER //
CREATE PROCEDURE CambiarEstadoOrden(
    IN p_orden_id INT,
    IN p_estado_id INT,
    IN p_empleado_id INT,
    IN p_comentario TEXT
)
BEGIN
    DECLARE v_estado_actual INT;
    DECLARE v_estado_nombre VARCHAR(50);
    
    -- Obtener el estado actual de la orden
    SELECT estado_actual_id INTO v_estado_actual FROM ordenes WHERE orden_id = p_orden_id;
    
    -- Si es el mismo estado, no hacer nada
    IF v_estado_actual = p_estado_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La orden ya se encuentra en este estado';
    END IF;
    
    -- Actualizar el estado de la orden
    UPDATE ordenes SET 
        estado_actual_id = p_estado_id,
        fecha_actualizacion = NOW()
    WHERE orden_id = p_orden_id;
    
    -- Registrar el cambio en el historial
    INSERT INTO historial_estados (
        orden_id, 
        estado_id, 
        empleado_id, 
        comentario
    ) VALUES (
        p_orden_id,
        p_estado_id,
        p_empleado_id,
        p_comentario
    );
    
    -- Si es el estado final (Entregado), actualizar la fecha de entrega real
    SELECT nombre INTO v_estado_nombre FROM estados_servicio WHERE estado_id = p_estado_id;
    
    IF v_estado_nombre = 'Entregado' THEN
        UPDATE ordenes SET 
            fecha_entrega_real = NOW(),
            empleado_entrega_id = p_empleado_id
        WHERE orden_id = p_orden_id;
    END IF;
END //
DELIMITER ;

-- ======== Procedimiento para registrar un pago ========
DELIMITER //
CREATE PROCEDURE RegistrarPago(
    IN p_orden_id INT,
    IN p_monto DECIMAL(10,2),
    IN p_metodo ENUM('efectivo', 'tarjeta', 'transferencia', 'mercado_pago'),
    IN p_referencia VARCHAR(100),
    IN p_terminal_id VARCHAR(50),
    IN p_empleado_id INT,
    OUT p_pago_id INT
)
BEGIN
    DECLARE v_total_orden DECIMAL(10,2);
    DECLARE v_pagado_actual DECIMAL(10,2);
    DECLARE v_pagado_nuevo DECIMAL(10,2);
    DECLARE v_estado_pago ENUM('pendiente', 'parcial', 'pagado');
    
    -- Obtener el total de la orden
    SELECT total INTO v_total_orden FROM ordenes WHERE orden_id = p_orden_id;
    
    -- Calcular el total pagado actualmente
    SELECT IFNULL(SUM(monto), 0) INTO v_pagado_actual 
    FROM pagos 
    WHERE orden_id = p_orden_id AND estado = 'completado';
    
    -- Calcular el nuevo total pagado
    SET v_pagado_nuevo = v_pagado_actual + p_monto;
    
    -- Determinar el estado del pago
    IF v_pagado_nuevo >= v_total_orden THEN
        SET v_estado_pago = 'pagado';
    ELSEIF v_pagado_nuevo > 0 THEN
        SET v_estado_pago = 'parcial';
    ELSE
        SET v_estado_pago = 'pendiente';
    END IF;
    
    -- Insertar el pago
    INSERT INTO pagos (
        orden_id,
        monto,
        metodo,
        referencia,
        terminal_id,
        empleado_id
    ) VALUES (
        p_orden_id,
        p_monto,
        p_metodo,
        p_referencia,
        p_terminal_id,
        p_empleado_id
    );
    
    -- Obtener el ID del pago creado
    SET p_pago_id = LAST_INSERT_ID();
    
    -- Actualizar el estado de pago y el método en la orden
    UPDATE ordenes SET 
        estado_pago = v_estado_pago,
        metodo_pago = p_metodo
    WHERE orden_id = p_orden_id;
END //
DELIMITER ;

-- ======== Procedimiento para consultar el estado de una orden ========
DELIMITER //
CREATE PROCEDURE ConsultarEstadoOrden(
    IN p_codigo_orden VARCHAR(20)
)
BEGIN
    SELECT 
        o.orden_id,
        o.codigo_orden,
        o.fecha_recepcion,
        o.fecha_entrega_estimada,
        o.fecha_entrega_real,
        e.nombre AS estado_actual,
        e.descripcion AS descripcion_estado,
        e.color AS color_estado,
        c.nombre AS cliente_nombre,
        c.apellidos AS cliente_apellidos,
        c.telefono AS cliente_telefono,
        o.total,
        o.estado_pago,
        GROUP_CONCAT(DISTINCT dos.descripcion_calzado SEPARATOR '|') AS descripcion_calzados
    FROM 
        ordenes o
        JOIN estados_servicio e ON o.estado_actual_id = e.estado_id
        JOIN clientes c ON o.cliente_id = c.cliente_id
        LEFT JOIN detalles_orden_servicios dos ON o.orden_id = dos.orden_id
    WHERE 
        o.codigo_orden = p_codigo_orden
    GROUP BY 
        o.orden_id;
        
    -- Obtener el historial de estados
    SELECT 
        h.historial_id,
        e.nombre AS estado,
        e.color,
        emp.nombre AS empleado_nombre,
        emp.apellidos AS empleado_apellidos,
        h.comentario,
        h.fecha_cambio
    FROM 
        historial_estados h
        JOIN estados_servicio e ON h.estado_id = e.estado_id
        JOIN empleados emp ON h.empleado_id = emp.empleado_id
        JOIN ordenes o ON h.orden_id = o.orden_id
    WHERE 
        o.codigo_orden = p_codigo_orden
    ORDER BY 
        h.fecha_cambio;
END //
DELIMITER ;

-- ======== Procedimiento para registrar archivos media ========
DELIMITER //
CREATE PROCEDURE RegistrarArchivoMedia(
    IN p_tipo ENUM('calzado_entrada', 'calzado_salida', 'identificacion', 'otro'),
    IN p_entidad_tipo ENUM('orden', 'cliente', 'empleado', 'producto', 'servicio', 'marca'),
    IN p_entidad_id INT,
    IN p_nombre_archivo VARCHAR(255),
    IN p_extension VARCHAR(10),
    IN p_tamano INT,
    IN p_s3_bucket VARCHAR(100),
    IN p_s3_key VARCHAR(255),
    IN p_s3_url VARCHAR(255),
    IN p_descripcion TEXT,
    IN p_es_publico BOOLEAN,
    IN p_empleado_id INT,
    OUT p_archivo_id INT
)
BEGIN
    INSERT INTO archivos_media (
        tipo,
        entidad_tipo,
        entidad_id,
        nombre_archivo,
        extension,
        tamano,
        s3_bucket,
        s3_key,
        s3_url,
        descripcion,
        es_publico,
        empleado_id
    ) VALUES (
        p_tipo,
        p_entidad_tipo,
        p_entidad_id,
        p_nombre_archivo,
        p_extension,
        p_tamano,
        p_s3_bucket,
        p_s3_key,
        p_s3_url,
        p_descripcion,
        p_es_publico,
        p_empleado_id
    );
    
    SET p_archivo_id = LAST_INSERT_ID();
    
    -- Si es una identificación para una orden, actualizar el estado
    IF p_tipo = 'identificacion' AND p_entidad_tipo = 'orden' THEN
        UPDATE ordenes SET tiene_identificacion_registrada = TRUE 
        WHERE orden_id = p_entidad_id;
    END IF;
END //
DELIMITER ;

-- ======== Procedimiento para crear una nueva consulta de contacto ========
DELIMITER //
CREATE PROCEDURE CrearConsultaContacto(
    IN p_nombre VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_telefono VARCHAR(20),
    IN p_asunto VARCHAR(200),
    IN p_mensaje TEXT,
    OUT p_consulta_id INT
)
BEGIN
    INSERT INTO consultas_contacto (
        nombre,
        email,
        telefono,
        asunto,
        mensaje
    ) VALUES (
        p_nombre,
        p_email,
        p_telefono,
        p_asunto,
        p_mensaje
    );
    
    SET p_consulta_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- ======== TRIGGERS ========

-- Trigger para auditar cambios en usuarios
DELIMITER //
CREATE TRIGGER after_usuario_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO registro_actividad (
        usuario_id,
        tabla_afectada,
        accion,
        registro_id,
        datos_anteriores,
        datos_nuevos
    ) VALUES (
        NEW.usuario_id,
        'usuarios',
        'actualizar',
        NEW.usuario_id,
        JSON_OBJECT(
            'email', OLD.email,
            'rol', OLD.rol,
            'activo', OLD.activo
        ),
        JSON_OBJECT(
            'email', NEW.email,
            'rol', NEW.rol,
            'activo', NEW.activo
        )
    );
END //
DELIMITER ;

-- Trigger para auditar eliminación de usuarios
DELIMITER //
CREATE TRIGGER after_usuario_delete
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO registro_actividad (
        usuario_id,
        tabla_afectada,
        accion,
        registro_id,
        datos_anteriores
    ) VALUES (
        NULL, -- No podemos usar OLD.usuario_id porque ya no existe
        'usuarios',
        'eliminar',
        OLD.usuario_id,
        JSON_OBJECT(
            'email', OLD.email,
            'rol', OLD.rol,
            'activo', OLD.activo
        )
    );
END //
DELIMITER ;

-- Trigger para auditar creación de usuarios
DELIMITER //
CREATE TRIGGER after_usuario_insert
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO registro_actividad (
        usuario_id,
        tabla_afectada,
        accion,
        registro_id,
        datos_nuevos
    ) VALUES (
        NEW.usuario_id,
        'usuarios',
        'crear',
        NEW.usuario_id,
        JSON_OBJECT(
            'email', NEW.email,
            'rol', NEW.rol,
            'activo', NEW.activo
        )
    );
END //
DELIMITER ;

-- Trigger para verificar stock mínimo después de una venta
DELIMITER //
CREATE TRIGGER after_inventario_movimiento
AFTER INSERT ON inventario_movimientos
FOR EACH ROW
BEGIN
    DECLARE v_stock_actual INT;
    DECLARE v_stock_minimo INT;
    
    IF NEW.tipo_movimiento = 'salida' THEN
        -- Obtener stock actual y mínimo
        SELECT stock, stock_minimo 
        INTO v_stock_actual, v_stock_minimo
        FROM productos 
        WHERE producto_id = NEW.producto_id;
        
        -- Si está por debajo del mínimo, registrar en actividad
        IF v_stock_actual <= v_stock_minimo THEN
            INSERT INTO registro_actividad (
                tabla_afectada,
                accion,
                registro_id,
                datos_nuevos
            ) VALUES (
                'productos',
                'otro',
                NEW.producto_id,
                JSON_OBJECT(
                    'alerta', 'Stock por debajo del mínimo',
                    'producto_id', NEW.producto_id,
                    'stock_actual', v_stock_actual,
                    'stock_minimo', v_stock_minimo
                )
            );
        END IF;
    END IF;
END //
DELIMITER ;

-- Trigger para actualizar la fecha de reservación confirmada cuando se crea una orden
DELIMITER //
CREATE TRIGGER after_orden_insert
AFTER INSERT ON ordenes
FOR EACH ROW
BEGIN
    -- Si la orden viene de una reservación, actualizar su estado
    IF NEW.reservacion_id IS NOT NULL THEN
        UPDATE reservaciones 
        SET estado = 'confirmada', fecha_actualizacion = NOW() 
        WHERE reservacion_id = NEW.reservacion_id;
    END IF;
END //
DELIMITER ;

-- Trigger para verificar si una orden requiere identificación basada en su total
DELIMITER //
CREATE TRIGGER before_orden_update
BEFORE UPDATE ON ordenes
FOR EACH ROW
BEGIN
    DECLARE v_precio_minimo_requiere_id DECIMAL(10,2);
    
    -- Solo verificar cuando cambia el total
    IF OLD.total != NEW.total THEN
        -- Obtener el precio mínimo que requiere ID
        SELECT CAST(valor AS DECIMAL(10,2)) INTO v_precio_minimo_requiere_id 
        FROM configuracion_sistema 
        WHERE clave = 'precio_minimo_requiere_id';
        
        -- Si el total es mayor o igual al mínimo, marcar que requiere ID
        IF NEW.total >= v_precio_minimo_requiere_id AND NEW.requiere_identificacion = FALSE THEN
            SET NEW.requiere_identificacion = TRUE;
        END IF;
    END IF;
END //
DELIMITER ;

-- Trigger para asignar puntos de fidelidad al cliente cuando se completa una orden
DELIMITER //
CREATE TRIGGER after_historial_estados_insert
AFTER INSERT ON historial_estados
FOR EACH ROW
BEGIN
    DECLARE v_estado_nombre VARCHAR(50);
    DECLARE v_cliente_id INT;
    DECLARE v_total_orden DECIMAL(10,2);
    DECLARE v_puntos_a_asignar INT;
    
    -- Obtener el nombre del estado
    SELECT nombre INTO v_estado_nombre 
    FROM estados_servicio 
    WHERE estado_id = NEW.estado_id;
    
    -- Si es el estado "Entregado", asignar puntos de fidelidad
    IF v_estado_nombre = 'Entregado' THEN
        -- Obtener el cliente y total de la orden
        SELECT cliente_id, total INTO v_cliente_id, v_total_orden
        FROM ordenes
        WHERE orden_id = NEW.orden_id;
        
        -- Calcular puntos (1 punto por cada 100 pesos)
        SET v_puntos_a_asignar = FLOOR(v_total_orden / 100);
        
        -- Actualizar los puntos del cliente
        UPDATE clientes 
        SET puntos_fidelidad = puntos_fidelidad + v_puntos_a_asignar
        WHERE cliente_id = v_cliente_id;
        
        -- Registrar la actividad
        INSERT INTO registro_actividad (
            tabla_afectada,
            accion,
            registro_id,
            datos_nuevos
        ) VALUES (
            'clientes',
            'actualizar',
            v_cliente_id,
            JSON_OBJECT(
                'tipo', 'Asignación de puntos',
                'puntos_asignados', v_puntos_a_asignar,
                'orden_id', NEW.orden_id
            )
        );
    END IF;
END //
DELIMITER ;


USE lavanderia_tenis;

-- ======== Vista para consulta de órdenes con detalle ========
CREATE VIEW vw_ordenes_detalle AS
SELECT 
    o.orden_id,
    o.codigo_orden,
    c.nombre AS cliente_nombre,
    c.apellidos AS cliente_apellidos,
    c.telefono AS cliente_telefono,
    CONCAT(er.nombre, ' ', er.apellidos) AS empleado_recepcion,
    CONCAT(IFNULL(ee.nombre, ''), ' ', IFNULL(ee.apellidos, '')) AS empleado_entrega,
    es.nombre AS estado_servicio,
    es.color AS color_estado,
    o.fecha_recepcion,
    o.fecha_entrega_estimada,
    o.fecha_entrega_real,
    o.subtotal,
    o.impuestos,
    o.descuento,
    o.total,
    o.estado_pago,
    o.metodo_pago,
    o.requiere_identificacion,
    o.tiene_identificacion_registrada,
    o.notas,
    r.reservacion_id,
    r.codigo_reservacion
FROM 
    ordenes o
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN empleados er ON o.empleado_recepcion_id = er.empleado_id
    LEFT JOIN empleados ee ON o.empleado_entrega_id = ee.empleado_id
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
    LEFT JOIN reservaciones r ON o.reservacion_id = r.reservacion_id;

-- ======== Vista para detalles de servicios de órdenes ========
CREATE VIEW vw_detalles_orden_servicios AS
SELECT 
    dos.detalle_servicio_id,
    dos.orden_id,
    o.codigo_orden,
    s.nombre AS servicio_nombre,
    s.descripcion AS servicio_descripcion,
    dos.cantidad,
    dos.precio_unitario,
    dos.descuento,
    dos.subtotal,
    IFNULL(m.nombre, dos.modelo) AS modelo_calzado,
    IFNULL(ma.nombre, dos.marca) AS marca_calzado,
    dos.descripcion_calzado
FROM 
    detalles_orden_servicios dos
    JOIN ordenes o ON dos.orden_id = o.orden_id
    JOIN servicios s ON dos.servicio_id = s.servicio_id
    LEFT JOIN modelos_calzado m ON dos.modelo_id = m.modelo_id
    LEFT JOIN marcas ma ON m.marca_id = ma.marca_id;

-- ======== Vista para detalles de productos de órdenes ========
CREATE VIEW vw_detalles_orden_productos AS
SELECT 
    dop.detalle_producto_id,
    dop.orden_id,
    o.codigo_orden,
    p.nombre AS producto_nombre,
    p.descripcion AS producto_descripcion,
    cp.nombre AS categoria_producto,
    dop.cantidad,
    dop.precio_unitario,
    dop.descuento,
    dop.subtotal
FROM 
    detalles_orden_productos dop
    JOIN ordenes o ON dop.orden_id = o.orden_id
    JOIN productos p ON dop.producto_id = p.producto_id
    JOIN categorias_productos cp ON p.categoria_id = cp.categoria_id;

-- ======== Vista para historial de estados de órdenes ========
CREATE VIEW vw_historial_estados AS
SELECT 
    h.historial_id,
    h.orden_id,
    o.codigo_orden,
    es.nombre AS estado_nombre,
    es.descripcion AS estado_descripcion,
    es.color AS estado_color,
    CONCAT(e.nombre, ' ', e.apellidos) AS empleado,
    h.comentario,
    h.fecha_cambio
FROM 
    historial_estados h
    JOIN ordenes o ON h.orden_id = o.orden_id
    JOIN estados_servicio es ON h.estado_id = es.estado_id
    JOIN empleados e ON h.empleado_id = e.empleado_id
ORDER BY 
    h.fecha_cambio DESC;


-- ======== Vista para estadísticas de ventas por mes ========
CREATE VIEW vw_estadisticas_ventas_mensuales AS
SELECT 
    EXTRACT(YEAR_MONTH FROM o.fecha_recepcion) AS anio_mes,
    CONCAT(YEAR(o.fecha_recepcion), '-', LPAD(MONTH(o.fecha_recepcion), 2, '0')) AS periodo,
    COUNT(o.orden_id) AS total_ordenes,
    SUM(o.total) AS monto_total,
    SUM(o.subtotal) AS subtotal,
    SUM(o.impuestos) AS impuestos,
    SUM(o.descuento) AS descuentos,
    COUNT(DISTINCT o.cliente_id) AS clientes_unicos
FROM 
    ordenes o
GROUP BY 
    EXTRACT(YEAR_MONTH FROM o.fecha_recepcion),
    periodo
ORDER BY 
    anio_mes DESC;

-- ======== Vista para servicios más populares ========
CREATE VIEW vw_servicios_populares AS
SELECT 
    s.servicio_id,
    s.nombre AS servicio_nombre,
    COUNT(dos.detalle_servicio_id) AS veces_solicitado,
    SUM(dos.cantidad) AS cantidad_total,
    SUM(dos.subtotal) AS monto_total_vendido,
    AVG(dos.precio_unitario) AS precio_promedio
FROM 
    servicios s
    LEFT JOIN detalles_orden_servicios dos ON s.servicio_id = dos.servicio_id
GROUP BY 
    s.servicio_id, 
    s.nombre
ORDER BY 
    veces_solicitado DESC;

-- ======== Vista para productos más vendidos ========
CREATE VIEW vw_productos_populares AS
SELECT 
    p.producto_id,
    p.nombre AS producto_nombre,
    cp.nombre AS categoria,
    COUNT(dop.detalle_producto_id) AS veces_vendido,
    SUM(dop.cantidad) AS cantidad_total,
    SUM(dop.subtotal) AS monto_total_vendido,
    p.stock AS stock_actual,
    p.stock_minimo
FROM 
    productos p
    JOIN categorias_productos cp ON p.categoria_id = cp.categoria_id
    LEFT JOIN detalles_orden_productos dop ON p.producto_id = dop.producto_id
GROUP BY 
    p.producto_id, 
    p.nombre, 
    cp.nombre,
    p.stock,
    p.stock_minimo
ORDER BY 
    veces_vendido DESC;

-- ======== Vista para tiempos de servicio promedio ========
CREATE VIEW vw_tiempos_servicio_promedio AS
SELECT 
    s.servicio_id,
    s.nombre AS servicio_nombre,
    COUNT(o.orden_id) AS total_ordenes,
    AVG(TIMESTAMPDIFF(HOUR, o.fecha_recepcion, o.fecha_entrega_real)) AS horas_promedio_real,
    AVG(TIMESTAMPDIFF(HOUR, o.fecha_recepcion, o.fecha_entrega_estimada)) AS horas_promedio_estimado,
    AVG(TIMESTAMPDIFF(HOUR, o.fecha_entrega_estimada, o.fecha_entrega_real)) AS diferencia_horas
FROM 
    servicios s
    JOIN detalles_orden_servicios dos ON s.servicio_id = dos.servicio_id
    JOIN ordenes o ON dos.orden_id = o.orden_id
WHERE 
    o.fecha_entrega_real IS NOT NULL
GROUP BY 
    s.servicio_id, 
    s.nombre;

-- ======== Vista para desempeño de empleados ========
CREATE VIEW vw_desempeno_empleados AS
SELECT 
    e.empleado_id,
    CONCAT(e.nombre, ' ', e.apellidos) AS empleado,
    e.puesto,
    COUNT(DISTINCT o.orden_id) AS ordenes_recibidas,
    COUNT(DISTINCT CASE WHEN o.empleado_entrega_id = e.empleado_id THEN o.orden_id END) AS ordenes_entregadas,
    COUNT(DISTINCT p.pago_id) AS pagos_procesados,
    SUM(CASE WHEN o.empleado_recepcion_id = e.empleado_id THEN o.total ELSE 0 END) AS monto_total_recibido,
    AVG(CASE WHEN o.empleado_recepcion_id = e.empleado_id THEN o.total ELSE NULL END) AS ticket_promedio
FROM 
    empleados e
    LEFT JOIN ordenes o ON e.empleado_id = o.empleado_recepcion_id OR e.empleado_id = o.empleado_entrega_id
    LEFT JOIN pagos p ON e.empleado_id = p.empleado_id
GROUP BY 
    e.empleado_id, 
    empleado, 
    e.puesto
ORDER BY 
    ordenes_recibidas DESC;

-- ======== Vista para consultas de contacto pendientes ========
CREATE VIEW vw_consultas_contacto_pendientes AS
SELECT 
    cc.consulta_id,
    cc.nombre,
    cc.email,
    cc.telefono,
    cc.asunto,
    cc.mensaje,
    cc.estado,
    CONCAT(IFNULL(e.nombre, ''), ' ', IFNULL(e.apellidos, '')) AS empleado_asignado,
    cc.fecha_creacion,
    TIMESTAMPDIFF(HOUR, cc.fecha_creacion, NOW()) AS horas_sin_respuesta
FROM 
    consultas_contacto cc
    LEFT JOIN empleados e ON cc.empleado_asignado_id = e.empleado_id
WHERE 
    cc.estado IN ('pendiente', 'en_proceso')
ORDER BY 
    cc.fecha_creacion ASC;

-- ======== Vista para reporte de devoluciones o trabajos rehechos ========
CREATE VIEW vw_ordenes_rehechas AS
SELECT 
    o.orden_id,
    o.codigo_orden,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    c.telefono AS cliente_telefono,
    es.nombre AS estado_actual,
    o.fecha_recepcion,
    o.fecha_entrega_estimada,
    o.fecha_entrega_real,
    o.total,
    (
        SELECT h.comentario
        FROM historial_estados h
        WHERE h.orden_id = o.orden_id
        AND h.comentario LIKE '%rehecho%' OR h.comentario LIKE '%devolución%' OR h.comentario LIKE '%queja%'
        ORDER BY h.fecha_cambio DESC
        LIMIT 1
    ) AS motivo_rehecho
FROM 
    ordenes o
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
WHERE 
    EXISTS (
        SELECT 1
        FROM historial_estados h
        WHERE h.orden_id = o.orden_id
        AND (
            h.comentario LIKE '%rehecho%' OR 
            h.comentario LIKE '%devolución%' OR 
            h.comentario LIKE '%queja%'
        )
    )
ORDER BY 
    o.fecha_recepcion DESC;

-- ======== Vista para órdenes con identificación pendiente ========
CREATE VIEW vw_ordenes_id_pendiente AS
SELECT 
    o.orden_id,
    o.codigo_orden,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    c.telefono AS cliente_telefono,
    es.nombre AS estado_actual,
    o.fecha_recepcion,
    o.fecha_entrega_estimada,
    o.total,
    CASE 
        WHEN o.requiere_identificacion AND NOT o.tiene_identificacion_registrada THEN 'Pendiente'
        WHEN o.requiere_identificacion AND o.tiene_identificacion_registrada THEN 'Registrada'
        ELSE 'No requerida'
    END AS estado_identificacion
FROM 
    ordenes o
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
WHERE 
    o.requiere_identificacion = TRUE AND 
    o.tiene_identificacion_registrada = FALSE
ORDER BY 
    o.fecha_recepcion DESC;

-- ======== Vista para órdenes próximas a entregar hoy ========
CREATE VIEW vw_ordenes_entrega_hoy AS
SELECT 
    o.orden_id,
    o.codigo_orden,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    c.telefono AS cliente_telefono,
    es.nombre AS estado_actual,
    o.fecha_recepcion,
    o.fecha_entrega_estimada,
    o.total,
    o.estado_pago,
    TIMESTAMPDIFF(HOUR, NOW(), o.fecha_entrega_estimada) AS horas_restantes
FROM 
    ordenes o
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
WHERE 
    DATE(o.fecha_entrega_estimada) = CURDATE() AND
    o.fecha_entrega_real IS NULL AND
    es.nombre != 'Entregado'
ORDER BY 
    o.fecha_entrega_estimada ASC;

-- ======== Vista para reservaciones del día ========
CREATE VIEW vw_reservaciones_hoy AS
SELECT 
    r.reservacion_id,
    r.codigo_reservacion,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    c.telefono AS cliente_telefono,
    s.nombre AS servicio,
    COALESCE(m.nombre, r.modelo) AS modelo_calzado,
    COALESCE(ma.nombre, r.marca) AS marca_calzado,
    r.descripcion_calzado,
    r.fecha_reservacion,
    r.fecha_entrega_estimada,
    r.notas,
    r.estado
FROM 
    reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    LEFT JOIN modelos_calzado m ON r.modelo_id = m.modelo_id
    LEFT JOIN marcas ma ON m.marca_id = ma.marca_id
WHERE 
    DATE(r.fecha_reservacion) = CURDATE() AND
    r.estado = 'pendiente'
ORDER BY 
    r.fecha_reservacion ASC;
    
    -- ======== Tabla de direcciones (clientes y pickups) ========
CREATE TABLE IF NOT EXISTS direcciones (
    direccion_id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tipo ENUM('domicilio','pickup','facturacion','otro') NOT NULL DEFAULT 'domicilio',
    alias VARCHAR(50) NULL,
    calle VARCHAR(255) NOT NULL,
    numero_exterior VARCHAR(20) NOT NULL,
    numero_interior VARCHAR(20) NULL,
    colonia VARCHAR(100) NULL,
    delegacion_municipio VARCHAR(100) NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    pais VARCHAR(100) NOT NULL DEFAULT 'México',
    codigo_postal VARCHAR(10) NOT NULL,
    latitud DECIMAL(10,8) NULL,
    longitud DECIMAL(11,8) NULL,
    telefono_contacto VARCHAR(20) NULL,
    destinatario VARCHAR(200) NULL,
    instrucciones TEXT NULL,
    ventana_hora_inicio TIME NULL,
    ventana_hora_fin TIME NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    INDEX idx_direccion_cliente (cliente_id),
    INDEX idx_direccion_tipo (tipo),
    INDEX idx_direccion_codigo_postal (codigo_postal)
);

-- ======== Ajuste en reservaciones para referenciar direcciones y pickup ========
ALTER TABLE reservaciones
  ADD COLUMN direccion_id INT NULL AFTER notas,
  ADD COLUMN requiere_pickup BOOLEAN NOT NULL DEFAULT FALSE AFTER direccion_id,
  ADD COLUMN fecha_solicitud_pickup DATETIME NULL AFTER requiere_pickup,
  ADD FOREIGN KEY (direccion_id) REFERENCES direcciones(direccion_id) ON DELETE SET NULL,
  ADD INDEX idx_reservacion_direccion (direccion_id);

-- ======== Procedimiento para crear una nueva dirección ========
DELIMITER //
CREATE PROCEDURE CrearDireccion(
    IN p_cliente_id INT,
    IN p_tipo ENUM('domicilio','pickup','facturacion','otro'),
    IN p_alias VARCHAR(50),
    IN p_calle VARCHAR(255),
    IN p_num_exterior VARCHAR(20),
    IN p_num_interior VARCHAR(20),
    IN p_colonia VARCHAR(100),
    IN p_delegacion VARCHAR(100),
    IN p_ciudad VARCHAR(100),
    IN p_estado VARCHAR(100),
    IN p_pais VARCHAR(100),
    IN p_codigo_postal VARCHAR(10),
    IN p_latitud DECIMAL(10,8),
    IN p_longitud DECIMAL(11,8),
    IN p_telefono_contacto VARCHAR(20),
    IN p_destinatario VARCHAR(200),
    IN p_instrucciones TEXT,
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME,
    OUT p_direccion_id INT
)
BEGIN
    INSERT INTO direcciones (
        cliente_id, tipo, alias, calle, numero_exterior, numero_interior,
        colonia, delegacion_municipio, ciudad, estado, pais, codigo_postal,
        latitud, longitud, telefono_contacto, destinatario, instrucciones,
        ventana_hora_inicio, ventana_hora_fin
    ) VALUES (
        p_cliente_id, p_tipo, p_alias, p_calle, p_num_exterior, p_num_interior,
        p_colonia, p_delegacion, p_ciudad, p_estado, p_pais, p_codigo_postal,
        p_latitud, p_longitud, p_telefono_contacto, p_destinatario, p_instrucciones,
        p_hora_inicio, p_hora_fin
    );
    SET p_direccion_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- ======== Procedimiento para asignar pickup con dirección ========
DELIMITER //
CREATE PROCEDURE MarcarPickupConDireccion(
    IN p_reservacion_id INT,
    IN p_direccion_id INT,
    IN p_fecha_solicitud DATETIME
)
BEGIN
    UPDATE reservaciones
    SET direccion_id           = p_direccion_id,
        requiere_pickup        = TRUE,
        fecha_solicitud_pickup = p_fecha_solicitud,
        fecha_actualizacion    = NOW()
    WHERE reservacion_id = p_reservacion_id;
END //
DELIMITER ;


-- ======== Vista para consulta de pagos ========
CREATE VIEW vw_pagos AS
SELECT 
    p.pago_id,
    p.orden_id,
    o.codigo_orden,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    p.monto,
    p.metodo,
    p.referencia,
    p.terminal_id,
    CONCAT(e.nombre, ' ', e.apellidos) AS empleado,
    p.fecha_pago,
    p.estado
FROM 
    pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN empleados e ON p.empleado_id = e.empleado_id;

-- ======== Vista para consulta de archivos media ========
CREATE VIEW vw_archivos_media AS
SELECT 
    a.archivo_id,
    a.tipo,
    a.entidad_tipo,
    a.entidad_id,
    CASE 
        WHEN a.entidad_tipo = 'orden' THEN (SELECT codigo_orden FROM ordenes WHERE orden_id = a.entidad_id)
        WHEN a.entidad_tipo = 'cliente' THEN (SELECT CONCAT(nombre, ' ', apellidos) FROM clientes WHERE cliente_id = a.entidad_id)
        WHEN a.entidad_tipo = 'empleado' THEN (SELECT CONCAT(nombre, ' ', apellidos) FROM empleados WHERE empleado_id = a.entidad_id)
        WHEN a.entidad_tipo = 'producto' THEN (SELECT nombre FROM productos WHERE producto_id = a.entidad_id)
        WHEN a.entidad_tipo = 'servicio' THEN (SELECT nombre FROM servicios WHERE servicio_id = a.entidad_id)
        WHEN a.entidad_tipo = 'marca' THEN (SELECT nombre FROM marcas WHERE marca_id = a.entidad_id)
        ELSE 'Desconocido'
    END AS entidad_nombre,
    a.nombre_archivo,
    a.extension,
    a.tamano,
    a.s3_bucket,
    a.s3_key,
    a.s3_url,
    a.descripcion,
    a.es_publico,
    CONCAT(e.nombre, ' ', e.apellidos) AS empleado_subida,
    a.fecha_creacion
FROM 
    archivos_media a
    JOIN empleados e ON a.empleado_id = e.empleado_id;

-- ======== Vista para consulta de inventario actual ========
CREATE VIEW vw_inventario_actual AS
SELECT 
    p.producto_id,
    p.nombre AS producto_nombre,
    cp.nombre AS categoria,
    p.codigo_barras,
    p.precio,
    p.costo,
    p.stock,
    p.stock_minimo,
    CASE 
        WHEN p.stock <= 0 THEN 'Agotado'
        WHEN p.stock < p.stock_minimo THEN 'Bajo'
        ELSE 'Normal'
    END AS estado_stock,
    p.imagen_url,
    p.activo
FROM 
    productos p
    JOIN categorias_productos cp ON p.categoria_id = cp.categoria_id;

-- ======== Vista para consulta de movimientos de inventario ========
CREATE VIEW vw_movimientos_inventario AS
SELECT 
    im.movimiento_id,
    p.producto_id,
    p.nombre AS producto_nombre,
    cp.nombre AS categoria_producto,
    im.tipo_movimiento,
    im.cantidad,
    im.stock_anterior,
    im.stock_nuevo,
    CONCAT(e.nombre, ' ', e.apellidos) AS empleado,
    COALESCE(
        (SELECT o.codigo_orden FROM ordenes o WHERE o.orden_id = im.orden_id),
        'N/A'
    ) AS codigo_orden,
    im.motivo,
    im.fecha_movimiento
FROM 
    inventario_movimientos im
    JOIN productos p ON im.producto_id = p.producto_id
    JOIN categorias_productos cp ON p.categoria_id = cp.categoria_id
    JOIN empleados e ON im.empleado_id = e.empleado_id
ORDER BY 
    im.fecha_movimiento DESC;

-- ======== Vista para consulta de reservaciones ========
CREATE VIEW vw_reservaciones AS
SELECT 
    r.reservacion_id,
    r.codigo_reservacion,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    c.telefono AS cliente_telefono,
    s.nombre AS servicio,
    COALESCE(m.nombre, r.modelo) AS modelo_calzado,
    COALESCE(ma.nombre, r.marca) AS marca_calzado,
    r.descripcion_calzado,
    r.fecha_reservacion,
    r.fecha_entrega_estimada,
    r.notas,
    r.estado,
    CASE
        WHEN r.estado = 'confirmada' THEN (
            SELECT o.codigo_orden 
            FROM ordenes o 
            WHERE o.reservacion_id = r.reservacion_id
            LIMIT 1
        )
        ELSE NULL
    END AS codigo_orden_asociada
FROM 
    reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    LEFT JOIN modelos_calzado m ON r.modelo_id = m.modelo_id
    LEFT JOIN marcas ma ON m.marca_id = ma.marca_id;

-- ======== Vista para consulta de clientes con sus puntos ========
CREATE VIEW vw_clientes_puntos AS
SELECT 
    c.cliente_id,
    CONCAT(c.nombre, ' ', c.apellidos) AS cliente,
    c.telefono,
    c.email,
    c.direccion,
    c.ciudad,
    c.estado,
    c.puntos_fidelidad,
    COUNT(DISTINCT o.orden_id) AS total_ordenes,
    SUM(o.total) AS monto_total_gastado,
    MAX(o.fecha_recepcion) AS ultima_visita
FROM 
    clientes c
    LEFT JOIN ordenes o ON c.cliente_id = o.cliente_id
GROUP BY 
    c.cliente_id;

-- ======== Vista para estadísticas de ventas por día ========
CREATE VIEW vw_estadisticas_ventas_diarias AS
SELECT 
    DATE(o.fecha_recepcion) AS fecha,
    COUNT(o.orden_id) AS total_ordenes,
    SUM(o.total) AS monto_total,
    SUM(o.subtotal) AS subtotal,
    SUM(o.impuestos) AS impuestos,
    SUM(o.descuento) AS descuentos,
    COUNT(DISTINCT o.cliente_id) AS clientes_unicos
FROM 
    ordenes o
GROUP BY 
    DATE(o.fecha_recepcion);
    
    USE lavanderia_tenis;

-- =====================================================
-- TABLA DE MENSAJES PARA LA LANDING PAGE
-- =====================================================

CREATE TABLE mensajes_contacto (
    mensaje_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    asunto VARCHAR(500) NOT NULL,
    mensaje TEXT NOT NULL,
    esta_leido BOOLEAN DEFAULT FALSE,
    esta_destacado BOOLEAN DEFAULT FALSE,
    esta_archivado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_mensaje_fecha_creacion (fecha_creacion),
    INDEX idx_mensaje_esta_leido (esta_leido),
    INDEX idx_mensaje_email (email)
);

-- =====================================================
-- AGREGAR COLUMNAS FALTANTES A RESERVACIONES
-- =====================================================

-- Agregar campo activo para compatibilidad con el frontend existente
ALTER TABLE reservaciones 
ADD COLUMN activo BOOLEAN DEFAULT TRUE AFTER estado;

-- =====================================================
-- NUEVOS PROCEDIMIENTOS PARA RESERVACIONES Y MENSAJES
-- =====================================================

-- Procedimiento para guardar mensajes de contacto
DELIMITER //
CREATE PROCEDURE GuardarMensajeContacto(
    IN p_nombre VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_asunto VARCHAR(500),
    IN p_mensaje TEXT,
    OUT p_mensaje_id INT
)
BEGIN
    INSERT INTO mensajes_contacto (nombre, email, asunto, mensaje, esta_leido)
    VALUES (p_nombre, p_email, p_asunto, p_mensaje, FALSE);
    
    SET p_mensaje_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Procedimiento para obtener reservaciones con filtros
DELIMITER //
CREATE PROCEDURE ObtenerReservacionesFiltradas(
    IN p_pagina INT,
    IN p_tamano_pagina INT,
    IN p_estado VARCHAR(255),
    IN p_busqueda VARCHAR(255),
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_offset INT;
    
    IF p_pagina IS NULL THEN SET p_pagina = 1; END IF;
    IF p_tamano_pagina IS NULL THEN SET p_tamano_pagina = 10; END IF;
    
    SET v_offset = (p_pagina - 1) * p_tamano_pagina;
    
    -- Crear la consulta base
    SET @sql = 'SELECT 
        r.reservacion_id as id,
        r.codigo_reservacion as booking_reference,
        CONCAT(c.nombre, " ", IFNULL(c.apellidos, "")) as full_name,
        c.telefono as phone,
        s.nombre as service_type,
        IFNULL(r.modelo, "No especificado") as shoes_type,
        CASE 
            WHEN r.direccion_id IS NOT NULL THEN "domicilio"
            ELSE "recoger_tienda"
        END as delivery_method,
        CASE 
            WHEN r.activo = FALSE THEN "cancelada"
            WHEN r.estado = "completada" THEN "completada"
            WHEN r.fecha_reservacion > NOW() THEN "programada"
            ELSE "pendiente"
        END as status,
        DATE_FORMAT(r.fecha_reservacion, "%Y-%m-%d") as booking_date,
        r.fecha_creacion as created_at
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    WHERE 1=1';
    
    -- Agregar filtros dinámicamente
    IF p_estado IS NOT NULL AND p_estado != '' THEN
        SET @sql = CONCAT(@sql, ' AND (
            CASE 
                WHEN r.activo = FALSE THEN "cancelada"
                WHEN r.estado = "completada" THEN "completada"
                WHEN r.fecha_reservacion > NOW() THEN "programada"
                ELSE "pendiente"
            END) IN ("', REPLACE(p_estado, ',', '","'), '")');
    END IF;
    
    IF p_busqueda IS NOT NULL AND p_busqueda != '' THEN
        SET @sql = CONCAT(@sql, ' AND (
            c.nombre LIKE "%', p_busqueda, '%" OR
            c.apellidos LIKE "%', p_busqueda, '%" OR
            c.telefono LIKE "%', p_busqueda, '%" OR
            s.nombre LIKE "%', p_busqueda, '%" OR
            r.codigo_reservacion LIKE "%', p_busqueda, '%"
        )');
    END IF;
    
    IF p_fecha_inicio IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND DATE(r.fecha_reservacion) >= "', p_fecha_inicio, '"');
    END IF;
    
    IF p_fecha_fin IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND DATE(r.fecha_reservacion) <= "', p_fecha_fin, '"');
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY r.fecha_creacion DESC LIMIT ', p_tamano_pagina, ' OFFSET ', v_offset);
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Procedimiento para obtener mensajes con filtros
DELIMITER //
CREATE PROCEDURE ObtenerMensajesFiltrados(
    IN p_pagina INT,
    IN p_tamano_pagina INT,
    IN p_filtro VARCHAR(50),
    IN p_busqueda VARCHAR(255),
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_offset INT;
    
    IF p_pagina IS NULL THEN SET p_pagina = 1; END IF;
    IF p_tamano_pagina IS NULL THEN SET p_tamano_pagina = 10; END IF;
    IF p_filtro IS NULL THEN SET p_filtro = 'all'; END IF;
    
    SET v_offset = (p_pagina - 1) * p_tamano_pagina;
    
    SET @sql = 'SELECT 
        mensaje_id as id,
        nombre as name,
        email,
        asunto as subject,
        mensaje as message,
        LEFT(mensaje, 100) as message_preview,
        esta_leido as is_read,
        esta_destacado as is_starred,
        esta_archivado as is_archived,
        fecha_creacion as created_at
    FROM mensajes_contacto 
    WHERE 1=1';
    
    -- Filtros por estado
    IF p_filtro = 'unread' THEN
        SET @sql = CONCAT(@sql, ' AND esta_leido = FALSE');
    ELSEIF p_filtro = 'read' THEN
        SET @sql = CONCAT(@sql, ' AND esta_leido = TRUE');
    ELSEIF p_filtro = 'starred' THEN
        SET @sql = CONCAT(@sql, ' AND esta_destacado = TRUE');
    ELSEIF p_filtro = 'archived' THEN
        SET @sql = CONCAT(@sql, ' AND esta_archivado = TRUE');
    END IF;
    
    -- Búsqueda de texto
    IF p_busqueda IS NOT NULL AND p_busqueda != '' THEN
        SET @sql = CONCAT(@sql, ' AND (
            nombre LIKE "%', p_busqueda, '%" OR
            email LIKE "%', p_busqueda, '%" OR
            asunto LIKE "%', p_busqueda, '%" OR
            mensaje LIKE "%', p_busqueda, '%"
        )');
    END IF;
    
    -- Filtro de fechas
    IF p_fecha_inicio IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND DATE(fecha_creacion) >= "', p_fecha_inicio, '"');
    END IF;
    
    IF p_fecha_fin IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND DATE(fecha_creacion) <= "', p_fecha_fin, '"');
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY fecha_creacion DESC LIMIT ', p_tamano_pagina, ' OFFSET ', v_offset);
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Procedimiento para actualizar estado de mensaje
DELIMITER //
CREATE PROCEDURE ActualizarEstadoMensaje(
    IN p_mensaje_id INT,
    IN p_accion VARCHAR(50),
    IN p_valor BOOLEAN
)
BEGIN
    CASE p_accion
        WHEN 'read' THEN
            UPDATE mensajes_contacto SET esta_leido = p_valor WHERE mensaje_id = p_mensaje_id;
        WHEN 'starred' THEN
            UPDATE mensajes_contacto SET esta_destacado = p_valor WHERE mensaje_id = p_mensaje_id;
        WHEN 'archived' THEN
            UPDATE mensajes_contacto SET esta_archivado = p_valor WHERE mensaje_id = p_mensaje_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Acción no válida';
    END CASE;
END //
DELIMITER ;

-- Procedimiento para actualizar estado de reservación
DELIMITER //
CREATE PROCEDURE ActualizarEstadoReservacion(
    IN p_reservacion_id INT,
    IN p_estado VARCHAR(50)
)
BEGIN
    CASE p_estado
        WHEN 'cancelada' THEN
            UPDATE reservaciones SET activo = FALSE, estado = 'cancelada' WHERE reservacion_id = p_reservacion_id;
        WHEN 'confirmada' THEN
            UPDATE reservaciones SET activo = TRUE, estado = 'confirmada' WHERE reservacion_id = p_reservacion_id;
        WHEN 'completada' THEN
            UPDATE reservaciones SET activo = TRUE, estado = 'completada' WHERE reservacion_id = p_reservacion_id;
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado no válido';
    END CASE;
END //
DELIMITER ;

-- =====================================================
-- VISTAS ACTUALIZADAS PARA EL DASHBOARD
-- =====================================================

-- Vista para estadísticas del dashboard
CREATE OR REPLACE VIEW vw_estadisticas_dashboard AS
SELECT 
    -- Total de reservaciones activas
    (SELECT COUNT(*) FROM reservaciones WHERE activo = TRUE) as total_reservaciones,
    
    -- Mensajes pendientes de leer
    (SELECT COUNT(*) FROM mensajes_contacto WHERE esta_leido = FALSE) as mensajes_pendientes,
    
    -- Ventas mensuales (del mes actual)
    (SELECT IFNULL(SUM(total), 0) 
     FROM ordenes 
     WHERE MONTH(fecha_creacion) = MONTH(CURRENT_DATE()) 
     AND YEAR(fecha_creacion) = YEAR(CURRENT_DATE())) as ventas_mensuales,
    
    -- Clientes activos (que han hecho órdenes en los últimos 3 meses)
    (SELECT COUNT(DISTINCT cliente_id) 
     FROM ordenes 
     WHERE fecha_creacion >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)) as clientes_activos;

-- Vista para reservaciones recientes
CREATE OR REPLACE VIEW vw_reservaciones_recientes AS
SELECT 
    r.reservacion_id as id,
    r.codigo_reservacion as booking_reference,
    CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as full_name,
    c.telefono as phone,
    s.nombre as service_type,
    IFNULL(r.modelo, 'No especificado') as shoes_type,
    CASE 
        WHEN r.direccion_id IS NOT NULL THEN 'domicilio'
        ELSE 'recoger_tienda'
    END as delivery_method,
    CASE 
        WHEN r.activo = FALSE THEN 'cancelada'
        WHEN r.estado = 'completada' THEN 'completada'
        WHEN r.fecha_reservacion > NOW() THEN 'programada'
        ELSE 'pendiente'
    END as status,
    DATE_FORMAT(r.fecha_reservacion, '%Y-%m-%d') as booking_date,
    r.fecha_creacion as created_at
FROM reservaciones r
JOIN clientes c ON r.cliente_id = c.cliente_id
JOIN servicios s ON r.servicio_id = s.servicio_id
WHERE r.activo = TRUE
ORDER BY r.fecha_creacion DESC;

-- Vista para mensajes recientes
CREATE OR REPLACE VIEW vw_mensajes_recientes AS
SELECT 
    mensaje_id as id,
    nombre as name,
    email,
    asunto as subject,
    LEFT(mensaje, 100) as message_preview,
    mensaje as message,
    esta_leido as is_read,
    esta_destacado as is_starred,
    esta_archivado as is_archived,
    fecha_creacion as created_at
FROM mensajes_contacto
WHERE esta_archivado = FALSE
ORDER BY fecha_creacion DESC;

-- =====================================================
-- PROCEDIMIENTO PARA OBTENER CONTEOS TOTALES
-- =====================================================

-- Procedimiento para obtener total de reservaciones con filtros
DELIMITER //
CREATE PROCEDURE ObtenerTotalReservaciones(
    IN p_estado VARCHAR(255),
    IN p_busqueda VARCHAR(255),
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    OUT p_total INT
)
BEGIN
    SET @count_sql = 'SELECT COUNT(*) FROM reservaciones r
        JOIN clientes c ON r.cliente_id = c.cliente_id
        JOIN servicios s ON r.servicio_id = s.servicio_id
        WHERE 1=1';
    
    IF p_estado IS NOT NULL AND p_estado != '' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND (
            CASE 
                WHEN r.activo = FALSE THEN "cancelada"
                WHEN r.estado = "completada" THEN "completada"
                WHEN r.fecha_reservacion > NOW() THEN "programada"
                ELSE "pendiente"
            END) IN ("', REPLACE(p_estado, ',', '","'), '")');
    END IF;
    
    IF p_busqueda IS NOT NULL AND p_busqueda != '' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND (
            c.nombre LIKE "%', p_busqueda, '%" OR
            c.apellidos LIKE "%', p_busqueda, '%" OR
            c.telefono LIKE "%', p_busqueda, '%" OR
            s.nombre LIKE "%', p_busqueda, '%" OR
            r.codigo_reservacion LIKE "%', p_busqueda, '%"
        )');
    END IF;
    
    IF p_fecha_inicio IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND DATE(r.fecha_reservacion) >= "', p_fecha_inicio, '"');
    END IF;
    
    IF p_fecha_fin IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND DATE(r.fecha_reservacion) <= "', p_fecha_fin, '"');
    END IF;
    
    PREPARE count_stmt FROM @count_sql;
    EXECUTE count_stmt;
    DEALLOCATE PREPARE count_stmt;
END //
DELIMITER ;

-- Procedimiento para obtener total de mensajes con filtros
DELIMITER //
CREATE PROCEDURE ObtenerTotalMensajes(
    IN p_filtro VARCHAR(50),
    IN p_busqueda VARCHAR(255),
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    OUT p_total INT
)
BEGIN
    IF p_filtro IS NULL THEN SET p_filtro = 'all'; END IF;
    
    SET @count_sql = 'SELECT COUNT(*) FROM mensajes_contacto WHERE 1=1';
    
    IF p_filtro = 'unread' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND esta_leido = FALSE');
    ELSEIF p_filtro = 'read' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND esta_leido = TRUE');
    ELSEIF p_filtro = 'starred' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND esta_destacado = TRUE');
    ELSEIF p_filtro = 'archived' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND esta_archivado = TRUE');
    END IF;
    
    IF p_busqueda IS NOT NULL AND p_busqueda != '' THEN
        SET @count_sql = CONCAT(@count_sql, ' AND (
            nombre LIKE "%', p_busqueda, '%" OR
            email LIKE "%', p_busqueda, '%" OR
            asunto LIKE "%', p_busqueda, '%" OR
            mensaje LIKE "%', p_busqueda, '%"
        )');
    END IF;
    
    IF p_fecha_inicio IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND DATE(fecha_creacion) >= "', p_fecha_inicio, '"');
    END IF;
    
    IF p_fecha_fin IS NOT NULL THEN
        SET @count_sql = CONCAT(@count_sql, ' AND DATE(fecha_creacion) <= "', p_fecha_fin, '"');
    END IF;
    
    PREPARE count_stmt FROM @count_sql;
    EXECUTE count_stmt;
    DEALLOCATE PREPARE count_stmt;
END //
DELIMITER ;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunos mensajes de ejemplo
INSERT INTO mensajes_contacto (nombre, email, asunto, mensaje, esta_leido) VALUES
('Juan Pérez', 'juan@email.com', 'Consulta sobre servicios', '¿Qué servicios ofrecen para tenis deportivos?', FALSE),
('María García', 'maria@email.com', 'Horarios de atención', 'Me gustaría saber sus horarios de atención', TRUE),
('Carlos López', 'carlos@email.com', 'Precios de lavado', 'Necesito información sobre precios para lavado profundo', FALSE);

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Índices para reservaciones (si no existen)
CREATE INDEX idx_reservaciones_activo ON reservaciones(activo);

-- Índices para órdenes (para estadísticas del dashboard)
CREATE INDEX idx_ordenes_fecha_creacion ON ordenes(fecha_creacion);
CREATE INDEX idx_ordenes_mes_ano ON ordenes((YEAR(fecha_creacion)), (MONTH(fecha_creacion)));
    
    

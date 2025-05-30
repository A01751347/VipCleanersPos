"use strict";exports.id=7462,exports.ids=[7462],exports.modules={7462:(e,a,o)=>{o.d(a,{C8:()=>ea,CV:()=>h,DI:()=>n,EO:()=>eo,Ez:()=>H,FF:()=>K,FR:()=>b,HC:()=>ee,J7:()=>O,Jf:()=>X,Mn:()=>p,T7:()=>V,UU:()=>r,VL:()=>R,VV:()=>Y,WF:()=>B,Wn:()=>P,Xx:()=>er,Y8:()=>W,YU:()=>Q,ZK:()=>x,aS:()=>S,ab:()=>q,ah:()=>$,bB:()=>_,bx:()=>G,cU:()=>M,dJ:()=>u,dd:()=>c,dm:()=>U,do:()=>A,dt:()=>w,eW:()=>s,f2:()=>ec,jm:()=>f,kA:()=>L,lG:()=>g,m7:()=>m,mJ:()=>y,mn:()=>I,nz:()=>T,p:()=>j,p5:()=>E,p_:()=>F,pr:()=>es,tU:()=>C,updateMessageReadStatus:()=>N,wN:()=>v,wo:()=>d,wt:()=>J,wx:()=>z,y8:()=>Z,y9:()=>D,zO:()=>l,zh:()=>k});var i=o(3498);let t=o.n(i)().createPool({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,waitForConnections:!0,connectionLimit:10,queueLimit:0,multipleStatements:!0,timezone:"-06:00"});async function s({query:e,values:a}){try{let[o]=await t.execute(e,a);return o}catch(e){throw console.error("Database query error:",e),Error("Database error")}}async function r(e,a,o,i,t,r,c,n){let d=`
    INSERT INTO clientes (
      nombre, apellidos, telefono, email, direccion, codigo_postal, ciudad, estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;return(await s({query:d,values:[e,a,o,i,t,r,c,n]})).insertId}async function c(e){let a=`
    SELECT * FROM clientes
    WHERE email = ?
    LIMIT 1
  `,o=await s({query:a,values:[e.toLowerCase().trim()]});return o.length>0?o[0]:null}async function n({searchQuery:e="",page:a=1,pageSize:o=10}){let i=`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM ordenes WHERE cliente_id = c.cliente_id) as total_ordenes,
      (SELECT SUM(total) FROM ordenes WHERE cliente_id = c.cliente_id) as total_gastado
    FROM clientes c
    WHERE 1=1
  `,t=[];if(e){i+=`
      AND (
        c.nombre LIKE ? OR
        c.apellidos LIKE ? OR
        c.telefono LIKE ? OR
        c.email LIKE ?
      )
    `;let a=`%${e}%`;t.push(a,a,a,a)}let r=i.replace("c.*,\n      (SELECT COUNT(*) FROM ordenes WHERE cliente_id = c.cliente_id) as total_ordenes","COUNT(*) as total"),[c]=await s({query:r,values:t});return{clients:await s({query:i,values:t}),total:c.total,page:a,pageSize:o,totalPages:Math.ceil(c.total/o)}}async function d(e){let a=`
    SELECT c.*,
      (SELECT COUNT(*) FROM ordenes WHERE cliente_id = c.cliente_id) as total_ordenes,
      (SELECT SUM(total) FROM ordenes WHERE cliente_id = c.cliente_id) as total_gastado
    FROM clientes c
    WHERE c.cliente_id = ?
  `,[o]=await s({query:a,values:[e]});if(!o)return null;let i=`
    SELECT * FROM direcciones
    WHERE cliente_id = ? AND activo = TRUE
    ORDER BY tipo ASC
  `,t=await s({query:i,values:[e]}),r=`
    SELECT o.*, es.nombre as estado_nombre, es.color as estado_color
    FROM ordenes o
    JOIN estados_servicio es ON o.estado_actual_id = es.estado_id
    WHERE o.cliente_id = ?
    ORDER BY o.fecha_creacion DESC
    LIMIT 5
  `,c=await s({query:r,values:[e]});return{...o,direcciones:t,ultimas_ordenes:c}}async function l(e,a,o,i,t,r,c,n,d){let l=`
    UPDATE clientes
    SET nombre = ?,
        apellidos = ?,
        telefono = ?,
        email = ?,
        direccion = ?,
        codigo_postal = ?,
        ciudad = ?,
        estado = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE cliente_id = ?
  `;return await s({query:l,values:[a,o,i,t,r,c,n,d,e]}),!0}async function _(e,a,o,i,t,r,c,n,d,l=null,E=!1,u=null){let p=`
    CALL CrearReservacion(?, ?, ?, ?, ?, ?, ?, ?, ?, @reservacion_id, @codigo_reservacion);
    SELECT @reservacion_id, @codigo_reservacion;
  `,[m]=await s({query:p,values:[e,a,o,i,t,r,c,n,d]}),{"@reservacion_id":T,"@codigo_reservacion":R}=m[0];return E&&l&&await s({query:`
        UPDATE reservaciones 
        SET direccion_id = ?, 
            requiere_pickup = TRUE,
            fecha_solicitud_pickup = ?
        WHERE reservacion_id = ?
      `,values:[l,u,T]}),{id:T,code:R}}async function E(e){let a=`
    SELECT 
      r.*,
      c.nombre as cliente_nombre,
      c.apellidos as cliente_apellidos,
      c.telefono as cliente_telefono,
      c.email as cliente_email,
      s.nombre as servicio_nombre,
      s.precio as servicio_precio,
      m.nombre as modelo_nombre,
      ma.nombre as marca_nombre
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    LEFT JOIN modelos_calzado m ON r.modelo_id = m.modelo_id
    LEFT JOIN marcas ma ON m.marca_id = ma.marca_id
    WHERE r.codigo_reservacion = ?
  `,o=await s({query:a,values:[e]});return o.length>0?o[0]:null}async function u({page:e=1,pageSize:a=10,status:o=[],searchQuery:i="",startDate:t="",endDate:r="",sortField:c="fecha_creacion",sortDirection:n="desc"}){let d=(e-1)*a,l=["r.codigo_reservacion","r.fecha_reservacion","r.fecha_creacion"],_=["asc","desc"];c=l.includes(`r.${c}`)?`r.${c}`:"r.fecha_creacion",_.includes(n)||(n="desc"),l.includes(c)||(c="fecha_creacion"),_.includes(n)||(n="desc");let E=`
    SELECT 
      r.reservacion_id as id,
      r.codigo_reservacion as booking_reference,
      CONCAT(c.nombre, ' ', c.apellidos) as full_name,
      c.email,
      s.nombre as service_type,
      r.marca,
      r.modelo,
      r.descripcion_calzado as shoes_type,
      CASE 
        WHEN r.activo = FALSE THEN 'cancelled'
        WHEN r.estado = 'completada' THEN 'completed'
        WHEN r.fecha_reservacion > NOW() THEN 'pending'
        ELSE 'pending'
      END as status,
      DATE_FORMAT(r.fecha_reservacion, '%Y-%m-%d') as booking_date,
      r.fecha_creacion as created_at
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    WHERE 1=1
  `,u=[];if(i){E+=`
      AND (
        c.nombre LIKE ? OR
        c.apellidos LIKE ? OR
        c.email LIKE ? OR
        r.codigo_reservacion LIKE ? OR
        s.nombre LIKE ?
      )
    `;let e=`%${i}%`;u.push(e,e,e,e,e)}if(o&&o.length>0){let e=o.map(()=>`(
        CASE 
          WHEN r.activo = FALSE THEN 'cancelled'
          WHEN r.estado = 'completada' THEN 'completed'
          WHEN r.fecha_reservacion > NOW() THEN 'pending'
          ELSE 'pending'
        END) = ?
      `).join(" OR ");E+=` AND (${e})`,u.push(...o)}t&&(E+=" AND DATE(r.fecha_reservacion) >= ?",u.push(t)),r&&(E+=" AND DATE(r.fecha_reservacion) <= ?",u.push(r));let p=E.replace(/SELECT[\s\S]*?FROM/,"SELECT COUNT(*) as total FROM");E+=` ORDER BY ${c} ${n} LIMIT ${parseInt(a.toString(),10)} OFFSET ${parseInt(d.toString(),10)}`;let m=await s({query:p,values:u});return{bookings:await s({query:E,values:u}),total:m[0].total,page:e,pageSize:a,totalPages:Math.ceil(m[0].total/a)}}async function p(e=5){return s({query:`
    SELECT 
      r.reservacion_id as id,
      r.codigo_reservacion as booking_reference,
      CONCAT(c.nombre, ' ', c.apellidos) as full_name,
      c.email,
      s.nombre as service_type,
      r.marca,
      r.modelo,
      r.descripcion_calzado as shoes_type,
      CASE 
        WHEN r.activo = FALSE THEN 'cancelled'
        WHEN r.estado = 'completada' THEN 'completed'
        WHEN r.fecha_reservacion > NOW() THEN 'pending'
        ELSE 'pending'
      END as status,
      DATE_FORMAT(r.fecha_reservacion, '%Y-%m-%d') as booking_date,
      r.fecha_creacion as created_at
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    WHERE r.activo = TRUE
    ORDER BY r.fecha_creacion DESC
    LIMIT 5
  `})}async function m(e){let a=`
    SELECT 
      r.reservacion_id as id,
      r.codigo_reservacion as booking_reference,
      r.cliente_id,
      c.nombre as client_name,
      c.apellidos as client_lastname,
      CONCAT(c.nombre, ' ', c.apellidos) as full_name,
      c.email as client_email,
      c.telefono as client_phone,
      c.direccion as client_address,
      c.ciudad as client_city,
      c.codigo_postal as client_postal_code,
      r.servicio_id,
      s.nombre as service_name,
      s.descripcion as service_description,
      s.precio as service_price,
      s.tiempo_estimado_minutos as service_duration,
      r.modelo_id,
      r.marca,
      r.modelo,
      r.descripcion_calzado as shoes_description,
      r.fecha_reservacion as booking_date,
      r.fecha_entrega_estimada as estimated_delivery,
      r.notas as notes,
      r.activo as is_active,
      r.estado as status_raw,
      CASE 
        WHEN r.activo = FALSE THEN 'cancelled'
        WHEN r.estado = 'completada' THEN 'completed'
        WHEN r.fecha_reservacion > NOW() THEN 'pending'
        ELSE 'pending'
      END as status,
      r.fecha_creacion as created_at,
      r.fecha_actualizacion as updated_at
    FROM reservaciones r
    JOIN clientes c ON r.cliente_id = c.cliente_id
    JOIN servicios s ON r.servicio_id = s.servicio_id
    WHERE r.reservacion_id = ?
  `,o=await s({query:a,values:[e]});return o.length>0?o[0]:null}async function T(e,a,o){let i;return s({query:i="cancelled"===a?`
      UPDATE reservaciones
      SET activo = FALSE,
          fecha_actualizacion = NOW()
      WHERE reservacion_id = ?
    `:"completed"===a?`
      UPDATE reservaciones
      SET estado = 'completada',
          fecha_actualizacion = NOW()
      WHERE reservacion_id = ?
    `:`
      UPDATE reservaciones
      SET activo = TRUE,
          fecha_actualizacion = NOW()
      WHERE reservacion_id = ?
    `,values:[e]})}async function R({page:e=1,pageSize:a=10,filter:o="all",searchQuery:i="",startDate:t="",endDate:r="",sortField:c="fecha_creacion",sortDirection:n="desc"}){let d=(e-1)*a;["nombre","email","asunto","fecha_creacion"].includes(c)||(c="fecha_creacion"),["asc","desc"].includes(n)||(n="desc");let l=`
    SELECT 
      mensaje_id as id,
      nombre as name,
      email,
      asunto as subject,
      mensaje as message,
      esta_leido as is_read,
      esta_destacado as is_starred,
      esta_archivado as is_archived,
      fecha_creacion as created_at
    FROM mensajes_contacto
    WHERE 1=1
  `,_=[];if(i){l+=`
      AND (
        nombre LIKE ? OR
        email LIKE ? OR
        asunto LIKE ? OR
        mensaje LIKE ?
      )
    `;let e=`%${i}%`;_.push(e,e,e,e)}"unread"===o?l+=" AND esta_leido = FALSE":"read"===o?l+=" AND esta_leido = TRUE":"starred"===o?l+=" AND esta_destacado = TRUE":"archived"===o&&(l+=" AND esta_archivado = TRUE"),t&&(l+=" AND DATE(fecha_creacion) >= ?",_.push(t)),r&&(l+=" AND DATE(fecha_creacion) <= ?",_.push(r));let E=l.replace(/SELECT[\s\S]*?FROM/,"SELECT COUNT(*) as total FROM");l+=` ORDER BY ${c} ${n} LIMIT ${parseInt(a.toString(),10)} OFFSET ${parseInt(d.toString(),10)}`;let u=await s({query:E,values:_});return{messages:await s({query:l,values:_}),total:u[0].total,page:e,pageSize:a,totalPages:Math.ceil(u[0].total/a)}}async function v(e=3){return s({query:`
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
    ORDER BY fecha_creacion DESC
    LIMIT 3
  `,values:[]})}async function N(e,a){return s({query:`
    UPDATE mensajes_contacto
    SET esta_leido = ?
    WHERE mensaje_id = ?
  `,values:[a,e]})}async function S(e,a){return s({query:`
    UPDATE mensajes_contacto
    SET esta_destacado = ?
    WHERE mensaje_id = ?
  `,values:[a,e]})}async function O(e,a){return s({query:`
    UPDATE mensajes_contacto
    SET esta_archivado = ?
    WHERE mensaje_id = ?
  `,values:[a,e]})}async function f(){return s({query:`
    UPDATE mensajes_contacto
    SET esta_leido = TRUE
    WHERE esta_leido = FALSE
  `,values:[]})}async function L(e){let a=`
    SELECT 
      mensaje_id as id,
      nombre as name,
      email,
      asunto as subject,
      mensaje as message,
      esta_leido as is_read,
      esta_destacado as is_starred,
      esta_archivado as is_archived,
      fecha_creacion as created_at
    FROM mensajes_contacto
    WHERE mensaje_id = ?
  `,o=await s({query:a,values:[e]});return o.length>0?o[0]:null}async function h(e,a,o,i){let t=`
    INSERT INTO mensajes_contacto (
      nombre, email, asunto, mensaje, fecha_creacion
    ) VALUES (?, ?, ?, ?, NOW())
  `;return(await s({query:t,values:[e,a,o,i]})).insertId}async function g({originalMessageId:e,employeeId:a,replyMessage:o,sentByEmail:i=!0}){let t=`
    INSERT INTO respuestas_mensajes (
      mensaje_original_id, 
      empleado_id, 
      mensaje_respuesta, 
      enviado_por_email,
      fecha_respuesta
    ) VALUES (?, ?, ?, ?, NOW())
  `;return(await s({query:t,values:[e,a,o,+!!i]})).insertId}t.on("connection",e=>{e.query("SET time_zone = '-06:00'",e=>{e&&console.error("Error configurando zona horaria en conexi\xf3n:",e)})});async function C(){try{let e;let a=(await s({query:"CALL ObtenerEstadisticasMensajesProc()",values:[]}))[0][0]||{};return{total_mensajes:(e="string"==typeof a.estadisticas?JSON.parse(a.estadisticas):a.estadisticas||{}).total_mensajes||0,no_leidos:e.no_leidos||0,respondidos:e.respondidos||0,sin_responder:e.sin_responder||0,destacados:e.destacados||0,archivados:e.archivados||0,promedio_respuesta_horas:e.promedio_respuesta_horas||0}}catch(e){return console.error("Error obteniendo estad\xedsticas:",e),{total_mensajes:0,no_leidos:0,respondidos:0,sin_responder:0,destacados:0,archivados:0,promedio_respuesta_horas:0}}}async function A(e){let a=`
    SELECT * FROM vw_ordenes_detalle
    WHERE codigo_orden = ?
  `,o=await s({query:a,values:[e]});if(0===o.length)return null;let i=await s({query:`
      SELECT * FROM vw_detalles_orden_servicios
      WHERE orden_id = ?
    `,values:[o[0].orden_id]}),t=await s({query:`
      SELECT * FROM vw_detalles_orden_productos
      WHERE orden_id = ?
    `,values:[o[0].orden_id]}),r=await s({query:`
      SELECT * FROM vw_historial_estados
      WHERE orden_id = ?
      ORDER BY fecha_cambio DESC
    `,values:[o[0].orden_id]});return{...o[0],servicios:i,productos:t,estados:r}}async function b(e,a,o,i,t,r,c,n,d,l,_=null,E=null,u=null,p=null,m=null,T=null){let R=`
    CALL CrearDireccion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @direccion_id);
    SELECT @direccion_id;
  `,[v]=await s({query:R,values:[e,a,_,o,i,t,r,c,n,d,"M\xe9xico",l,null,null,E,u,p,m,T]}),{"@direccion_id":N}=v[0];return N}async function y(e){let a=`
    SELECT COUNT(*) as count 
    FROM detalles_orden_servicios 
    WHERE servicio_id = ?
  `,[o]=await s({query:a,values:[e]});return o.count>0}async function D(e){let a=`
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p
    LEFT JOIN categorias_productos c ON p.categoria_id = c.categoria_id
    WHERE p.producto_id = ?
  `,o=await s({query:a,values:[e]});return o.length>0?o[0]:null}async function M(e){let a=`
    SELECT COUNT(*) as count 
    FROM detalles_orden_productos 
    WHERE producto_id = ?
  `,[o]=await s({query:a,values:[e]});return o.count>0}async function w(e,a){let o=`
    SELECT producto_id FROM productos WHERE codigo_barras = ?
  `,i=[e];return null!=a&&(o+=" AND producto_id != ?",i.push(a)),(await s({query:o,values:i})).length>0}async function U(e){let a=`
    SELECT categoria_id FROM categorias_productos 
    WHERE categoria_id = ? AND activo = TRUE
  `;return(await s({query:a,values:[e]})).length>0}async function H({nombre:e,descripcion:a=null,activo:o=!0}){let i=`
    INSERT INTO categorias_productos (nombre, descripcion, activo)
    VALUES (?, ?, ?)
  `;return(await s({query:i,values:[e.trim(),a?.trim()||null,+!!o]})).insertId}async function I(e=!0){return s({query:`
    SELECT * FROM servicios
    ${e?"WHERE activo = TRUE":""}
    ORDER BY precio ASC
  `,values:[]})}async function W(e){let a=await s({query:"SELECT * FROM servicios WHERE servicio_id = ?",values:[e]});return a.length>0?a[0]:null}async function F(e=!0){return s({query:`
    SELECT * FROM categorias_productos
    ${e?"WHERE activo = TRUE":""}
    ORDER BY nombre ASC
  `,values:[]})}async function q(e,a=!0){return s({query:`
    SELECT p.*, 
      CASE 
        WHEN p.stock <= 0 THEN 'Agotado'
        WHEN p.stock < p.stock_minimo THEN 'Bajo'
        ELSE 'Disponible'
      END as estado_stock
    FROM productos p
    WHERE p.categoria_id = ? ${a?"AND p.activo = TRUE":""}
    ORDER BY p.nombre ASC
  `,values:[e]})}async function k(e,a=!0){let o=`%${e}%`;return s({query:`
    SELECT p.*, 
      c.nombre as categoria_nombre,
      CASE 
        WHEN p.stock <= 0 THEN 'Agotado'
        WHEN p.stock < p.stock_minimo THEN 'Bajo'
        ELSE 'Disponible'
      END as estado_stock
    FROM productos p
    JOIN categorias_productos c ON p.categoria_id = c.categoria_id
    WHERE (p.nombre LIKE ? OR p.codigo_barras LIKE ?) ${a?"AND p.activo = TRUE":""}
    ORDER BY p.nombre ASC
    LIMIT 20
  `,values:[o,o]})}async function Y({clienteId:e,empleadoId:a,servicios:o=[],productos:i=[],requiereIdentificacion:t=!1,tieneIdentificacionRegistrada:r=!1,fechaEntregaEstimada:c,metodoPago:n,monto:d,notasOrder:l=null,subtotal:_,iva:E,total:u}){await s({query:"CALL CrearOrden(?, ?, NULL, ?, ?, @orden_id, @codigo_orden)",values:[e,a,c,l]});let[p]=await s({query:"SELECT @orden_id as orden_id, @codigo_orden as codigo_orden",values:[]}),m=p.orden_id,T=p.codigo_orden;for(let e of o){let a=await W(e.servicioId);if(!a)throw Error(`Servicio con ID ${e.servicioId} no encontrado`);let o=a.precio??0;if(e.marca||e.modelo||e.descripcion)for(let a=0;a<e.cantidad;a++)await s({query:`
            INSERT INTO detalles_orden_servicios (
              orden_id, servicio_id, cantidad, precio_unitario, descuento, subtotal,
              modelo_id, marca, modelo, descripcion_calzado
            ) VALUES (?, ?, 1, ?, 0.00, ?, ?, ?, ?, ?)
          `,values:[m,e.servicioId,o,o,e.modeloId??null,e.marca?.trim()||null,e.modelo?.trim()||null,e.descripcion?.trim()||null]});else{let a=o*e.cantidad;await s({query:`
          INSERT INTO detalles_orden_servicios (
            orden_id, servicio_id, cantidad, precio_unitario, descuento, subtotal,
            modelo_id, marca, modelo, descripcion_calzado
          ) VALUES (?, ?, ?, ?, 0.00, ?, NULL, NULL, NULL, NULL)
        `,values:[m,e.servicioId,e.cantidad,o,a]})}}for(let e of i){let a=await s({query:"SELECT * FROM productos WHERE producto_id = ?",values:[e.productoId]});if(0===a.length)throw Error(`Producto con ID ${e.productoId} no encontrado`);let o=a[0].precio??0,i=o*e.cantidad;await s({query:`
        INSERT INTO detalles_orden_productos (
          orden_id, producto_id, cantidad, precio_unitario, descuento, subtotal
        ) VALUES (?, ?, ?, ?, 0.00, ?)
      `,values:[m,e.productoId,e.cantidad,o,i]}),await s({query:"UPDATE productos SET stock = stock - ? WHERE producto_id = ? AND stock >= ?",values:[e.cantidad,e.productoId,e.cantidad]})}return await s({query:`
      UPDATE ordenes
      SET 
        subtotal = ?,
        impuestos = ?,
        total = ?,
        requiere_identificacion = ?,
        tiene_identificacion_registrada = ?,
        metodo_pago = ?,
        estado_pago = ?
      WHERE orden_id = ?
    `,values:[_,E,u,+!!t,+!!r,n,"pendiente",m]}),d>0&&await s({query:"CALL RegistrarPago(?, ?, ?, NULL, NULL, ?, @pago_id);",values:[m,d,n,a]}),{ordenId:m,codigoOrden:T}}async function B({page:e=1,pageSize:a=10,estadoId:o=null,estadoPago:i=null,fechaInicio:t=null,fechaFin:r=null,searchQuery:c=null,empleadoId:n=null}){let d=parseInt(String(e),10)||1,l=parseInt(String(a),10)||10,_=`
    SELECT * FROM vw_ordenes_detalle
    WHERE 1=1
  `,E=[];if(o&&(_+=" AND estado_actual_id = ?",E.push(o)),i&&(_+=" AND estado_pago = ?",E.push(i)),t&&(_+=" AND fecha_recepcion >= ?",E.push(t)),r&&(_+=" AND fecha_recepcion <= ?",E.push(r)),c){_+=" AND (codigo_orden LIKE ? OR cliente_nombre LIKE ? OR cliente_apellidos LIKE ? OR cliente_telefono LIKE ?)";let e=`%${c}%`;E.push(e,e,e,e)}n&&(_+=" AND (empleado_recepcion_id = ? OR empleado_entrega_id = ?)",E.push(n,n));let u=_.replace("SELECT *","SELECT COUNT(*) as total"),[p]=await s({query:u,values:E});_+=` ORDER BY fecha_recepcion DESC LIMIT ${l} OFFSET ${(d-1)*l}`;try{return{orders:await s({query:_,values:E}),total:p.total,page:d,pageSize:l,totalPages:Math.ceil(p.total/l)}}catch(e){throw console.error("Error espec\xedfico en la consulta de \xf3rdenes:",e),e}}async function j(e){let[a]=await s({query:"SELECT * FROM vw_ordenes_detalle WHERE orden_id = ?",values:[e]});if(!a)return null;let o=await s({query:"SELECT * FROM vw_detalles_orden_servicios WHERE orden_id = ?",values:[e]}),i=await s({query:"SELECT * FROM vw_detalles_orden_productos WHERE orden_id = ?",values:[e]}),t=await s({query:"SELECT * FROM vw_historial_estados WHERE orden_id = ? ORDER BY fecha_cambio DESC",values:[e]}),r=`
    SELECT p.*, e.nombre as empleado_nombre, e.apellidos as empleado_apellidos
    FROM pagos p
    JOIN empleados e ON p.empleado_id = e.empleado_id
    WHERE p.orden_id = ?
    ORDER BY p.fecha_pago DESC
  `,c=await s({query:r,values:[e]}),n=`
    SELECT *
    FROM archivos_media
    WHERE entidad_tipo = 'orden' AND entidad_id = ?
    ORDER BY tipo, fecha_creacion DESC
  `,d=await s({query:n,values:[e]});return{...a,servicios:o,productos:i,historial:t,pagos:c,imagenes:d}}async function $({ordenId:e,monto:a,metodo:o,referencia:i=null,terminalId:t=null,empleadoId:r}){let c=`
    CALL RegistrarPago(?, ?, ?, ?, ?, ?, @pago_id);
    SELECT @pago_id as pago_id;
  `,[n]=await s({query:c,values:[e,a,o,i,t,r]});return{pagoId:n[0].pago_id}}async function P(e){return s({query:`
    SELECT p.*, e.nombre as empleado_nombre, e.apellidos as empleado_apellidos
    FROM pagos p
    JOIN empleados e ON p.empleado_id = e.empleado_id
    WHERE p.orden_id = ?
    ORDER BY p.fecha_pago DESC
  `,values:[e]})}async function J(e=null,a=null){let o=`
    SELECT 
      metodo,
      COUNT(*) as total_transacciones,
      SUM(monto) as monto_total
    FROM pagos
    WHERE estado = 'completado'
  `,i=[];e&&(o+=" AND DATE(fecha_pago) = ?",i.push(e)),a&&(o+=" AND empleado_id = ?",i.push(a)),o+=" GROUP BY metodo ORDER BY monto_total DESC";let t=await s({query:o,values:i}),r=`
    SELECT 
      COUNT(*) as total_transacciones,
      SUM(monto) as monto_total
    FROM pagos
    WHERE estado = 'completado'
  `;e&&(r+=" AND DATE(fecha_pago) = ?"),a&&(r+=" AND empleado_id = ?");let[c]=await s({query:r,values:i});return{por_metodo:t,totales:c}}async function x({categoryId:e=null,onlyLowStock:a=!1,searchQuery:o=null,page:i=1,pageSize:t=20}){let r=`
    SELECT * FROM vw_inventario_actual
    WHERE 1=1
  `,c=[];if(null!=e&&(r+=" AND categoria_id = ?",c.push(e)),a&&(r+=" AND (stock <= stock_minimo)"),null!=o&&""!==o){r+=" AND (nombre LIKE ? OR codigo_barras LIKE ?)";let e=`%${o}%`;c.push(e,e)}let n=r.replace("SELECT *","SELECT COUNT(*) as total"),[d]=await s({query:n,values:c});return r+=` ORDER BY categoria, producto_nombre ASC LIMIT ${t} OFFSET ${(i-1)*t}`,{products:await s({query:r,values:c}),total:d.total,page:i,pageSize:t,totalPages:Math.ceil(d.total/t)}}async function z(){let e=`
    SELECT * FROM vw_estadisticas_ventas_mensuales
    ORDER BY anio_mes DESC
    LIMIT 12
  `,a=await s({query:e,values:[]}),o=`
    SELECT * FROM vw_servicios_populares
    LIMIT 5
  `,i=await s({query:o,values:[]}),t=`
    SELECT * FROM vw_productos_populares
    LIMIT 5
  `,r=await s({query:t,values:[]}),c=`
    SELECT * FROM vw_ordenes_entrega_hoy
  `,n=await s({query:c,values:[]}),d=`
    SELECT * FROM vw_ordenes_id_pendiente
    LIMIT 5
  `,l=await s({query:d,values:[]}),_=`
    SELECT 
      COUNT(*) as total_productos,
      SUM(CASE WHEN stock <= 0 THEN 1 ELSE 0 END) as productos_agotados,
      SUM(CASE WHEN stock < stock_minimo AND stock > 0 THEN 1 ELSE 0 END) as productos_bajo_stock,
      SUM(CASE WHEN stock >= stock_minimo THEN 1 ELSE 0 END) as productos_ok
    FROM productos
    WHERE activo = TRUE
  `,[E]=await s({query:_,values:[]}),u=`
    SELECT 
      (SELECT COUNT(*) FROM ordenes WHERE DATE(fecha_recepcion) = CURDATE()) as ordenes_hoy,
      (SELECT SUM(total) FROM ordenes WHERE DATE(fecha_recepcion) = CURDATE()) as ventas_hoy,
      (SELECT COUNT(*) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as ordenes_mes,
      (SELECT SUM(total) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as ventas_mes,
      (SELECT COUNT(*) FROM clientes) as total_clientes,
      (SELECT COUNT(DISTINCT cliente_id) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as clientes_activos_mes
  `,[p]=await s({query:u,values:[]}),m=`
    SELECT 
      (SELECT COUNT(*) FROM reservaciones WHERE activo = TRUE) as totalBookings,
      (SELECT COUNT(*) FROM mensajes_contacto WHERE esta_leido = FALSE) as pendingMessages,
      (SELECT IFNULL(SUM(total), 0) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as monthlySales,
      (SELECT COUNT(DISTINCT cliente_id) FROM ordenes WHERE MONTH(fecha_recepcion) = MONTH(CURDATE()) AND YEAR(fecha_recepcion) = YEAR(CURDATE())) as activeClients
  `,[T]=await s({query:m,values:[]});return{totalBookings:T.totalBookings||0,pendingMessages:T.pendingMessages||0,monthlySales:T.monthlySales||0,activeClients:T.activeClients||0,ventas_mensuales:a,servicios_populares:i,productos_populares:r,entregas_hoy:n,ordenes_id_pendiente:l,resumen_inventario:E,metricas:p}}async function K({startDate:e,endDate:a,groupBy:o="day"}){let i;switch(o){case"day":default:i="%Y-%m-%d";break;case"week":i="%Y-%u";break;case"month":i="%Y-%m"}let t=`
    SELECT 
      DATE_FORMAT(fecha_recepcion, ?) as periodo,
      COUNT(*) as total_ordenes,
      SUM(subtotal) as subtotal,
      SUM(impuestos) as impuestos,
      SUM(descuento) as descuentos,
      SUM(total) as total
    FROM ordenes
    WHERE fecha_recepcion BETWEEN ? AND ?
    GROUP BY periodo
    ORDER BY periodo
  `,r=await s({query:t,values:[i,e,a]}),c=`
    SELECT 
      metodo_pago,
      COUNT(*) as total_ordenes,
      SUM(total) as total
    FROM ordenes
    WHERE fecha_recepcion BETWEEN ? AND ?
    GROUP BY metodo_pago
  `,n=await s({query:c,values:[e,a]}),d=`
    SELECT 
      s.nombre as servicio,
      COUNT(dos.detalle_servicio_id) as cantidad,
      SUM(dos.subtotal) as total
    FROM detalles_orden_servicios dos
    JOIN servicios s ON dos.servicio_id = s.servicio_id
    JOIN ordenes o ON dos.orden_id = o.orden_id
    WHERE o.fecha_recepcion BETWEEN ? AND ?
    GROUP BY s.servicio_id, s.nombre
    ORDER BY total DESC
  `,l=await s({query:d,values:[e,a]}),_=`
    SELECT 
      p.nombre as producto,
      SUM(dop.cantidad) as cantidad,
      SUM(dop.subtotal) as total
    FROM detalles_orden_productos dop
    JOIN productos p ON dop.producto_id = p.producto_id
    JOIN ordenes o ON dop.orden_id = o.orden_id
    WHERE o.fecha_recepcion BETWEEN ? AND ?
    GROUP BY p.producto_id, p.nombre
    ORDER BY total DESC
  `;return{por_periodo:r,por_metodo_pago:n,por_servicio:l,por_producto:await s({query:_,values:[e,a]})}}async function V({startDate:e,endDate:a}){let o=`
    SELECT 
        empleado_id,
        nombre_completo,
        puesto,
        SUM(total_ordenes_recibidas) as total_ordenes_recibidas,
        SUM(total_ordenes_entregadas) as total_ordenes_entregadas, 
        SUM(monto_total_recibido) as monto_total_recibido,
        SUM(total_pagos_procesados) as total_pagos_procesados,
        SUM(monto_total_pagos) as monto_total_pagos,
        -- Calcular ticket promedio
        CASE 
            WHEN SUM(total_ordenes_recibidas) > 0 
            THEN SUM(monto_total_recibido) / SUM(total_ordenes_recibidas)
            ELSE 0 
        END as ticket_promedio
    FROM vw_reporte_empleados
    WHERE (
        fecha_recepcion BETWEEN ? AND ?
        OR fecha_entrega_estimada BETWEEN ? AND ?
        OR fecha_pago BETWEEN ? AND ?
    )
    GROUP BY empleado_id, nombre_completo, puesto
    HAVING (
        SUM(total_ordenes_recibidas) > 0 
        OR SUM(total_ordenes_entregadas) > 0 
        OR SUM(total_pagos_procesados) > 0
    )
    ORDER BY SUM(monto_total_recibido) DESC
  `;return{empleados:await s({query:o,values:[e,a,e,a,e,a]})}}async function G({startDate:e,endDate:a}){let o=`
  SELECT 
    c.cliente_id,
    c.nombre,
    c.apellidos,
    c.telefono,
    c.email,
    COUNT(o.orden_id) as total_ordenes,
    SUM(o.total) as monto_total,
    MAX(o.fecha_recepcion) as ultima_visita,
    c.puntos_fidelidad
  FROM clientes c
  JOIN ordenes o ON c.cliente_id = o.cliente_id
  WHERE o.fecha_recepcion BETWEEN ? AND ?
  GROUP BY c.cliente_id, c.nombre, c.apellidos, c.telefono, c.email, c.puntos_fidelidad
  ORDER BY monto_total DESC
  LIMIT 10
`;return{clientes:await s({query:o,values:[e,a]})}}async function X(e,a=0){let o=`
    SELECT 
      p.pago_id,
      p.orden_id,
      p.metodo,
      p.referencia,
      p.fecha_pago,
      p.monto as monto_recibido,
      o.total as monto_orden,
      -- El monto real que se debe considerar es el total de la orden
      o.total as monto,
      o.codigo_orden,
      CONCAT(c.nombre, ' ', c.apellidos) as cliente,
      CONCAT(e.nombre, ' ', e.apellidos) as empleado,
      -- Informaci\xf3n adicional \xfatil para el arqueo
      CASE 
        WHEN p.metodo = 'efectivo' AND p.monto > o.total 
        THEN p.monto - o.total 
        ELSE 0 
      END as cambio_dado
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    JOIN clientes c ON o.cliente_id = c.cliente_id
    JOIN empleados e ON p.empleado_id = e.empleado_id
    WHERE DATE(p.fecha_pago) = ?
    ${a?"AND p.empleado_id = ?":""}
    ORDER BY p.fecha_pago DESC
  `,i=a?[e,a]:[e],t=await s({query:o,values:i}),r=`
    SELECT 
      p.metodo,
      COUNT(*) as total_transacciones,
      SUM(o.total) as monto_total,
      -- Informaci\xf3n adicional para efectivo
      CASE 
        WHEN p.metodo = 'efectivo' 
        THEN SUM(p.monto) - SUM(o.total)
        ELSE 0 
      END as total_cambio_dado,
      CASE 
        WHEN p.metodo = 'efectivo' 
        THEN SUM(p.monto)
        ELSE SUM(o.total)
      END as monto_fisico_recibido
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    WHERE DATE(p.fecha_pago) = ?
    ${a?"AND p.empleado_id = ?":""}
    GROUP BY p.metodo
    ORDER BY monto_total DESC
  `,c=await s({query:r,values:i}),n=`
    SELECT 
      SUM(o.total) as total,
      SUM(CASE WHEN p.metodo = 'efectivo' THEN p.monto ELSE o.total END) as total_fisico_recibido,
      SUM(CASE WHEN p.metodo = 'efectivo' AND p.monto > o.total THEN p.monto - o.total ELSE 0 END) as total_cambio_dado
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    WHERE DATE(p.fecha_pago) = ?
    ${a?"AND p.empleado_id = ?":""}
  `,[d]=await s({query:n,values:i});return{pagos:t,resumen_por_metodo:c,total:d?.total||0,total_fisico_recibido:d?.total_fisico_recibido||0,total_cambio_dado:d?.total_cambio_dado||0}}async function Z(){try{let e=`
      WITH date_range AS (
        SELECT DATE_SUB(CURDATE(), INTERVAL 6 DAY) + INTERVAL n DAY as fecha
        FROM (
          SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
          SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
        ) numbers
      )
      SELECT 
        dr.fecha as date,
        DAYNAME(dr.fecha) as day_name,
        DAYOFWEEK(dr.fecha) as day_number,
        COALESCE(COUNT(o.orden_id), 0) as orders,
        COALESCE(SUM(CASE 
          WHEN o.total IS NOT NULL AND o.total > 0 THEN o.total 
          ELSE (o.subtotal + COALESCE(o.impuestos, 0) - COALESCE(o.descuento, 0))
        END), 0) as sales
      FROM date_range dr
      LEFT JOIN ordenes o ON DATE(o.fecha_recepcion) = dr.fecha 
        AND o.estado_pago = 'pagado'
      GROUP BY dr.fecha, DAYNAME(dr.fecha), DAYOFWEEK(dr.fecha)
      ORDER BY dr.fecha ASC
    `,a=await s({query:e,values:[]}),o=`
      SELECT 
        COALESCE(SUM(CASE 
          WHEN total IS NOT NULL AND total > 0 THEN total 
          ELSE (subtotal + COALESCE(impuestos, 0) - COALESCE(descuento, 0))
        END), 0) as total_sales
      FROM ordenes 
      WHERE DATE(fecha_recepcion) >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
        AND DATE(fecha_recepcion) <= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND estado_pago = 'pagado'
    `,[i]=await s({query:o,values:[]}),t={Sunday:"Domingo",Monday:"Lunes",Tuesday:"Martes",Wednesday:"Mi\xe9rcoles",Thursday:"Jueves",Friday:"Viernes",Saturday:"S\xe1bado"},r=a.map(e=>{let a=t[e.day_name]||e.day_name;return{day:a.substring(0,3),dayName:a,sales:parseFloat(e.sales)||0,orders:parseInt(e.orders)||0,date:e.date,dayNumber:e.day_number}});7!==r.length&&console.warn(`Se esperaban 7 d\xedas pero se obtuvieron ${r.length}`);let c=r.reduce((e,a)=>e+a.sales,0),n=r.reduce((e,a)=>e+a.orders,0),d=i?parseFloat(i.total_sales||"0"):0,l=r.reduce((e,a)=>a.sales>e.sales?a:e,r[0]);return{data:r,totalSales:Math.round(100*c)/100,totalOrders:n,weekGrowth:Math.round(10*(d>0?(c-d)/d*100:100*(c>0)))/10,bestDay:{day:l.dayName,sales:Math.round(100*l.sales)/100}}}catch(e){throw console.error("Error getting weekly sales data:",e),e}}async function Q({tipo:e,entidadTipo:a,entidadId:o,nombreArchivo:i,extension:t,tamano:r,s3Bucket:c,s3Key:n,s3Url:d,descripcion:l=null,esPublico:_=!1,empleadoId:E}){let u=`
    CALL RegistrarArchivoMedia(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @archivo_id);
    SELECT @archivo_id as archivo_id;
  `,[p]=await s({query:u,values:[e,a,o,i,t,r,c,n,d,l,+!!_,E]});return{archivoId:p[0].archivo_id}}async function ee({ordenId:e,nombreArchivo:a,extension:o,tamano:i,s3Bucket:t,s3Key:r,s3Url:c,empleadoId:n}){let d=await Q({tipo:"identificacion",entidadTipo:"orden",entidadId:e,nombreArchivo:a,extension:o,tamano:i,s3Bucket:t,s3Key:r,s3Url:c,descripcion:"Identificaci\xf3n para orden",esPublico:!1,empleadoId:n});return await s({query:`
      UPDATE ordenes 
      SET tiene_identificacion_registrada = TRUE 
      WHERE orden_id = ?
    `,values:[e]}),d}async function ea(){try{let e=await s({query:`
        SELECT o.orden_id, o.estado_actual_id, o.empleado_recepcion_id, o.fecha_creacion
        FROM ordenes o
        LEFT JOIN historial_estados h ON o.orden_id = h.orden_id
        WHERE h.orden_id IS NULL
      `,values:[]});for(let a of e)await s({query:`
          INSERT INTO historial_estados (orden_id, estado_id, empleado_id, comentario, fecha_cambio)
          VALUES (?, ?, ?, 'Estado inicial (reparado autom\xe1ticamente)', ?)
        `,values:[a.orden_id,a.estado_actual_id,a.empleado_recepcion_id,a.fecha_creacion]});return{reparadas:e.length}}catch(e){throw console.error("Error reparando historial de \xf3rdenes:",e),e}}async function eo(e){try{let a=`
      SELECT 
        o.orden_id,
        o.codigo_orden,
        o.estado_actual_id,
        e.nombre as estado_actual_nombre,
        (SELECT COUNT(*) FROM historial_estados WHERE orden_id = o.orden_id) as total_estados_historial,
        (SELECT MAX(fecha_cambio) FROM historial_estados WHERE orden_id = o.orden_id) as ultimo_cambio
      FROM ordenes o
      JOIN estados_servicio e ON o.estado_actual_id = e.estado_id
    `,o=[];return e&&(a+=" WHERE o.orden_id = ?",o.push(e)),a+=" ORDER BY o.orden_id DESC LIMIT 10",await s({query:a,values:o})}catch(e){throw console.error("Error verificando integridad del historial:",e),e}}async function ei(e){try{let a=e.map(()=>"?").join(","),o=await s({query:`SELECT clave, valor FROM configuracion WHERE clave IN (${a})`,values:e}),i={};return o.forEach(e=>{i[e.clave]=e.valor}),i}catch(e){return console.error("Error obteniendo configuraciones:",e),{}}}async function et(e,a,o){try{if((await s({query:"SELECT config_id FROM configuracion WHERE clave = ?",values:[e]})).length>0)await s({query:"UPDATE configuracion SET valor = ?, fecha_actualizacion = NOW() WHERE clave = ?",values:[a,e]});else{let i=o||`Configuraci\xf3n para ${e}`;await s({query:"INSERT INTO configuracion (clave, valor, descripcion, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, NOW(), NOW())",values:[e,a,i]})}}catch(a){throw console.error(`Error actualizando configuraci\xf3n ${e}:`,a),a}}async function es(){try{let e=await s({query:"SELECT clave, valor, descripcion FROM configuracion ORDER BY clave",values:[]}),a={business:{},system:{},pricing:{}};return e.forEach(e=>{let{clave:o,valor:i}=e;switch(o){case"nombre_empresa":a.business.nombre_negocio=i;break;case"telefono_contacto":a.business.telefono=i;break;case"email_contacto":a.business.email=i;break;case"direccion_empresa":a.business.direccion=i;break;case"website_empresa":a.business.website=i;break;case"horario_atencion":let t=i.match(/(\d{1,2}):(\d{2})\s*a\s*(\d{1,2}):(\d{2})/);t?(a.business.horario_apertura=`${t[1].padStart(2,"0")}:${t[2]}`,a.business.horario_cierre=`${t[3].padStart(2,"0")}:${t[4]}`):(a.business.horario_apertura="10:00",a.business.horario_cierre="18:00"),i.includes("Domingo a S\xe1bado")?a.business.dias_operacion=["domingo","lunes","martes","miercoles","jueves","viernes","sabado"]:i.includes("Lunes a S\xe1bado")?a.business.dias_operacion=["lunes","martes","miercoles","jueves","viernes","sabado"]:a.business.dias_operacion=["lunes","martes","miercoles","jueves","viernes"];break;case"iva_porcentaje":a.pricing.iva_porcentaje=parseFloat(i);break;case"precio_minimo_requiere_id":a.pricing.precio_minimo_id=parseFloat(i);break;case"descuento_maximo":a.pricing.descuento_maximo=parseFloat(i);break;case"precio_delivery":a.pricing.precio_delivery=parseFloat(i);break;case"tiempo_gracia_minutos":a.pricing.tiempo_gracia_minutos=parseInt(i);break;case"propina_sugerida":try{a.pricing.propina_sugerida=JSON.parse(i)}catch{a.pricing.propina_sugerida=[10,15,20]}break;case"notificaciones_email":a.system.notificaciones_email="true"===i;break;case"notificaciones_sms":a.system.notificaciones_sms="true"===i;break;case"backup_automatico":a.system.backup_automatico="true"===i;break;case"retencion_datos_dias":a.system.retencion_datos_dias=parseInt(i);break;case"impresora_tickets":a.system.impresora_tickets=i;break;case"formato_fecha":a.system.formato_fecha=i;break;case"idioma":a.system.idioma=i;break;case"tema_oscuro":a.system.tema_oscuro="true"===i}}),{business:{nombre_negocio:a.business.nombre_negocio||"VipCleaners",direccion:a.business.direccion||"",telefono:a.business.telefono||"",email:a.business.email||"",website:a.business.website||"",horario_apertura:a.business.horario_apertura||"10:00",horario_cierre:a.business.horario_cierre||"18:00",dias_operacion:a.business.dias_operacion||["lunes","martes","miercoles","jueves","viernes","sabado"],moneda:"MXN",timezone:"America/Mexico_City",logo_url:""},system:{notificaciones_email:a.system.notificaciones_email??!0,notificaciones_sms:a.system.notificaciones_sms??!1,backup_automatico:a.system.backup_automatico??!0,retencion_datos_dias:a.system.retencion_datos_dias||365,impresora_tickets:a.system.impresora_tickets||"",formato_fecha:a.system.formato_fecha||"DD/MM/YYYY",idioma:a.system.idioma||"es",tema_oscuro:a.system.tema_oscuro??!1},pricing:{iva_porcentaje:a.pricing.iva_porcentaje||16,descuento_maximo:a.pricing.descuento_maximo||50,propina_sugerida:a.pricing.propina_sugerida||[10,15,20],precio_delivery:a.pricing.precio_delivery||50,tiempo_gracia_minutos:a.pricing.tiempo_gracia_minutos||15,precio_minimo_id:a.pricing.precio_minimo_id||1e3}}}catch(e){throw console.error("Error obteniendo todas las configuraciones:",e),e}}async function er(e){try{if(e.business){let{business:a}=e;if(a.nombre_negocio&&await et("nombre_empresa",a.nombre_negocio,"Nombre de la empresa"),a.telefono&&await et("telefono_contacto",a.telefono,"Tel\xe9fono de contacto principal"),a.email&&await et("email_contacto",a.email,"Email de contacto principal"),a.direccion&&await et("direccion_empresa",a.direccion,"Direcci\xf3n f\xedsica de la empresa"),a.website&&await et("website_empresa",a.website,"Sitio web de la empresa"),a.horario_apertura&&a.horario_cierre&&a.dias_operacion){let e=a.dias_operacion,o="Lunes a Viernes";e.includes("sabado")&&e.includes("domingo")?o="Domingo a S\xe1bado":e.includes("sabado")&&(o="Lunes a S\xe1bado");let i=`${o} de ${a.horario_apertura} a ${a.horario_cierre}`;await et("horario_atencion",i,"Horario de atenci\xf3n al p\xfablico")}}if(e.pricing){let{pricing:a}=e;void 0!==a.iva_porcentaje&&await et("iva_porcentaje",a.iva_porcentaje.toString(),"Porcentaje de IVA aplicable"),void 0!==a.precio_minimo_id&&await et("precio_minimo_requiere_id",a.precio_minimo_id.toString(),"Precio m\xednimo a partir del cual se requiere identificaci\xf3n"),void 0!==a.descuento_maximo&&await et("descuento_maximo",a.descuento_maximo.toString(),"Descuento m\xe1ximo permitido"),void 0!==a.precio_delivery&&await et("precio_delivery",a.precio_delivery.toString(),"Precio del servicio de delivery"),void 0!==a.tiempo_gracia_minutos&&await et("tiempo_gracia_minutos",a.tiempo_gracia_minutos.toString(),"Tiempo de gracia en minutos"),a.propina_sugerida&&await et("propina_sugerida",JSON.stringify(a.propina_sugerida),"Porcentajes sugeridos para propinas")}if(e.system){let{system:a}=e;void 0!==a.notificaciones_email&&await et("notificaciones_email",a.notificaciones_email.toString(),"Habilitar notificaciones por email"),void 0!==a.notificaciones_sms&&await et("notificaciones_sms",a.notificaciones_sms.toString(),"Habilitar notificaciones por SMS"),void 0!==a.backup_automatico&&await et("backup_automatico",a.backup_automatico.toString(),"Habilitar respaldo autom\xe1tico"),void 0!==a.retencion_datos_dias&&await et("retencion_datos_dias",a.retencion_datos_dias.toString(),"D\xedas de retenci\xf3n de datos"),void 0!==a.impresora_tickets&&await et("impresora_tickets",a.impresora_tickets,"Impresora para tickets"),void 0!==a.formato_fecha&&await et("formato_fecha",a.formato_fecha,"Formato de fecha del sistema"),void 0!==a.idioma&&await et("idioma",a.idioma,"Idioma del sistema"),void 0!==a.tema_oscuro&&await et("tema_oscuro",a.tema_oscuro.toString(),"Habilitar tema oscuro")}}catch(e){throw console.error("Error actualizando configuraciones:",e),e}}async function ec(){return await ei(["nombre_empresa","telefono_contacto","email_contacto","direccion_empresa","horario_atencion"])}}};
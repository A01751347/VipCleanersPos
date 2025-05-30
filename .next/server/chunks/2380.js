exports.id=2380,exports.ids=[2380],exports.modules={7699:(e,t,o)=>{"use strict";o.d(t,{N:()=>d});var a=o(13581),i=o(7462),r=o(85663);async function n(e){try{let t=e.toLowerCase().trim(),o=`
      SELECT 
        u.usuario_id, 
        u.email, 
        u.password, 
        u.rol, 
        u.activo,
        e.nombre,
        e.apellidos
      FROM usuarios u
      LEFT JOIN empleados e ON u.usuario_id = e.usuario_id
      WHERE u.email = ? AND u.activo = TRUE
    `,a=await (0,i.eW)({query:o,values:[t]});if(0===a.length)return null;return a[0]}catch(e){return console.error("Error al obtener usuario por email:",e),null}}async function s(e,t){try{return await (0,r.UD)(e,t)}catch(e){return console.error("Error al verificar la contrase\xf1a:",e),!1}}let d={providers:[(0,a.A)({name:"Credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;try{let t=await n(e.email);if(!t||!await s(e.password,t.password))return null;return{id:t.usuario_id.toString(),name:t.nombre?`${t.nombre} ${t.apellidos||""}`.trim():t.email,email:t.email,role:t.rol}}catch(e){return console.error("\uD83D\uDCA5 Error en autorizaci\xf3n:",e),null}}})],pages:{signIn:"/admin/login",error:"/admin/login"},session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:t})=>(t&&(e.role=t.role,e.id=t.id),e),session:async({session:e,token:t})=>(e.user&&(e.user.role=t.role,e.user.id=t.id),e),redirect:async({url:e,baseUrl:t})=>e.includes("/admin/login")||e===t?`${t}/admin`:e.startsWith("/")?`${t}${e}`:e.startsWith(t)?e:`${t}/admin`},debug:!1,secret:"genera_un_secreto_aleatorio_largo"}},78335:()=>{},91090:(e,t,o)=>{"use strict";o.d(t,{Gp:()=>c,Rz:()=>l});var a=o(49526),i=o(7462);let r=()=>{switch(process.env.EMAIL_PROVIDER||"smtp"){case"smtp.gmail.com":return a.oO({service:"gmail",auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}});case"sendgrid":return a.oO({host:"smtp.sendgrid.net",port:587,secure:!1,auth:{user:"apikey",pass:process.env.SENDGRID_API_KEY}});case"mailgun":return a.oO({host:"smtp.mailgun.org",port:587,secure:!1,auth:{user:process.env.MAILGUN_SMTP_USER,pass:process.env.MAILGUN_SMTP_PASSWORD}});default:return a.oO({host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT||"587",10),secure:"true"===process.env.SMTP_SECURE,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}})}},n=e=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2}).format(e||0),s=e=>e?new Date(e).toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}):"No especificada",d=(e,t,o)=>{let a=e.servicios?.map(e=>`
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${e.servicio_nombre}</strong>
        ${e.marca&&e.modelo?`<br><small style="color: #666;">${e.marca} ${e.modelo}</small>`:""}
        ${e.descripcion_calzado?`<br><small style="color: #666;">${e.descripcion_calzado}</small>`:""}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${e.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${n(e.precio_unitario)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${n(e.subtotal)}</td>
    </tr>
  `).join("")||"",i=e.productos?.map(e=>`
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${e.producto_nombre}</strong>
        ${e.descripcion?`<br><small style="color: #666;">${e.descripcion}</small>`:""}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${e.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${n(e.precio_unitario)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${n(e.subtotal)}</td>
    </tr>
  `).join("")||"",r={recibido:"#fbbf24",en_proceso:"#3b82f6",listo:"#10b981",entregado:"#059669",cancelado:"#ef4444"}[e.color_estado?.toLowerCase()]||"#6b7280";return`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket de Servicio - ${e.codigo_orden}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .ticket-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #78f3d3, #4de0c0);
          color: #313D52;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 16px;
          opacity: 0.8;
        }
        .content {
          padding: 30px;
        }
        .info-section {
          margin-bottom: 25px;
        }
        .info-section h3 {
          color: #313D52;
          border-bottom: 2px solid #78f3d3;
          padding-bottom: 8px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        .info-item strong {
          color: #313D52;
          display: block;
          margin-bottom: 5px;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
          background-color: ${r};
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .items-table th {
          background: #313D52;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
        }
        .items-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .totals-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .total-row.final {
          border-top: 2px solid #313D52;
          padding-top: 10px;
          margin-top: 10px;
          font-size: 18px;
          font-weight: bold;
          color: #313D52;
        }
        .custom-message {
          background: #e0f7f0;
          border-left: 4px solid #78f3d3;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background: #313D52;
          color: white;
          padding: 20px 30px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
        .contact-info {
          margin-top: 15px;
          font-size: 14px;
          opacity: 0.9;
        }
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          .items-table {
            font-size: 14px;
          }
          .items-table th,
          .items-table td {
            padding: 6px 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <!-- Header -->
        <div class="header">
          <h1>${t.nombre_empresa||"VipCleaners"}</h1>
          <p>Ticket de Servicio</p>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Informaci\xf3n del Ticket -->
          <div class="info-section">
            <h3>Informaci\xf3n del Ticket</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>C\xf3digo de Orden:</strong>
                ${e.codigo_orden}
              </div>
              <div class="info-item">
                <strong>Estado:</strong>
                <span class="status-badge">${e.estado_servicio}</span>
              </div>
              <div class="info-item">
                <strong>Fecha de Recepci\xf3n:</strong>
                ${s(e.fecha_recepcion)}
              </div>
              <div class="info-item">
                <strong>Fecha de Entrega Estimada:</strong>
                ${s(e.fecha_entrega_estimada)}
              </div>
            </div>
          </div>

          <!-- Informaci\xf3n del Cliente -->
          <div class="info-section">
            <h3>Informaci\xf3n del Cliente</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Nombre:</strong>
                ${e.cliente_nombre} ${e.cliente_apellidos||""}
              </div>
              <div class="info-item">
                <strong>Tel\xe9fono:</strong>
                ${e.cliente_telefono}
              </div>
              <div class="info-item">
                <strong>Email:</strong>
                ${e.cliente_email}
              </div>
              ${e.cliente_direccion?`
              <div class="info-item">
                <strong>Direcci\xf3n:</strong>
                ${e.cliente_direccion}
              </div>
              `:""}
            </div>
          </div>

          <!-- Servicios -->
          ${a?`
          <div class="info-section">
            <h3>Servicios Solicitados</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Descripci\xf3n</th>
                  <th style="text-align: center; width: 80px;">Cant.</th>
                  <th style="text-align: right; width: 100px;">Precio Unit.</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${a}
              </tbody>
            </table>
          </div>
          `:""}

          <!-- Productos -->
          ${i?`
          <div class="info-section">
            <h3>Productos Adquiridos</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center; width: 80px;">Cant.</th>
                  <th style="text-align: right; width: 100px;">Precio Unit.</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${i}
              </tbody>
            </table>
          </div>
          `:""}

          <!-- Mensaje Personalizado -->
          ${o?`
          <div class="custom-message">
            <strong>Mensaje de la empresa:</strong><br>
            ${o}
          </div>
          `:""}

          <!-- Totales -->
          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${n(e.subtotal)}</span>
            </div>
            <div class="total-row">
              <span>IVA (16%):</span>
              <span>${n(e.impuestos)}</span>
            </div>
            ${e.descuento>0?`
            <div class="total-row">
              <span>Descuento:</span>
              <span>-${n(e.descuento)}</span>
            </div>
            `:""}
            <div class="total-row final">
              <span>Total:</span>
              <span>${n(e.total)}</span>
            </div>
          </div>

          <!-- Notas -->
          ${e.notas?`
          <div class="info-section">
            <h3>Notas Adicionales</h3>
            <div class="info-item">
              ${e.notas}
            </div>
          </div>
          `:""}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>\xa1Gracias por confiar en nosotros!</strong></p>
          <div class="contact-info">
            ${t.telefono_contacto?`<p>📞 ${t.telefono_contacto}</p>`:""}
            ${t.email_contacto?`<p>✉️ ${t.email_contacto}</p>`:""}
            ${t.direccion_empresa?`<p>📍 ${t.direccion_empresa}</p>`:""}
            ${t.website_empresa?`<p>🌐 ${t.website_empresa}</p>`:""}
          </div>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            Este es un documento generado autom\xe1ticamente. Por favor conserve este ticket para cualquier consulta.
          </p>
        </div>
      </div>
    </body>
    </html>
  `};async function l({order:e,includeImages:t=!1,customMessage:o=null,sendCopy:a=!1,copyEmail:l=null}){try{let t=await (0,i.f2)(),c=r(),p=d(e,t,o||void 0),m={from:{name:t.nombre_empresa||"VipCleaners",address:process.env.SMTP_FROM_EMAIL||process.env.SMTP_USER||"noreply@vipcleaner.com"},to:e.cliente_email,subject:`Ticket de Servicio - ${e.codigo_orden}`,html:p,text:`
        Ticket de Servicio
        C\xf3digo de Orden: ${e.codigo_orden}
        Cliente: ${e.cliente_nombre} ${e.cliente_apellidos||""}
        Estado: ${e.estado_servicio}
        
        
        Fecha de Recepci\xf3n: ${s(e.fecha_recepcion)}
        Fecha de Entrega Estimada: ${s(e.fecha_entrega_estimada)}
        
        Total: ${n(e.total)}
        
        ${o?`
Mensaje: ${o}`:""}
        
        Gracias por confiar en ${t.nombre_empresa||"VipCleaners"}
      `,attachments:[]};a&&l&&(m.cc=l),console.log("Enviando email a:",e.cliente_email),console.log("Asunto:",m.subject);let g=await c.sendMail(m);return console.log("Email enviado exitosamente:",g.messageId),{success:!0,emailId:g.messageId,message:`Ticket enviado exitosamente a ${e.cliente_email}`}}catch(e){return console.error("Error enviando ticket por email:",e),{success:!1,error:e instanceof Error?e.message:"Error desconocido al enviar email"}}}async function c({originalMessage:e,replyMessage:t,includeOriginalMessage:o=!0,employeeName:a="Equipo de Soporte",replyId:n=null}){try{let n=await (0,i.f2)(),s=r(),d=process.env.SMTP_FROM_EMAIL||process.env.SMTP_USER||"noreply@vipcleaner.com",l=n.nombre_empresa||"VipCleaners";if(!d||!d.includes("@"))throw Error("Email FROM no configurado correctamente en variables de entorno");let c=function(e,t,o,a,i){new Date().toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});let r=new Date(e.created_at).toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});return`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Respuesta a tu mensaje - ${a.nombre_empresa||"VipCleaners"}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .email-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #78f3d3, #4de0c0);
          color: #313D52;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 16px;
          opacity: 0.8;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #313D52;
          margin-bottom: 20px;
        }
        .reply-message {
          background: #f8f9fa;
          border-left: 4px solid #78f3d3;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .reply-message p {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.7;
        }
        .original-message {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e0e6e5;
        }
        .original-message h3 {
          color: #6c7a89;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }
        .original-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
          color: #6c7a89;
        }
        .original-content {
          background: #f1f3f4;
          padding: 15px;
          border-radius: 8px;
          font-style: italic;
          color: #313D52;
        }
        .signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e6e5;
        }
        .signature-name {
          font-weight: bold;
          color: #313D52;
        }
        .signature-company {
          color: #6c7a89;
          font-size: 14px;
        }
        .footer {
          background: #313D52;
          color: white;
          padding: 20px 30px;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
          font-size: 14px;
        }
        .contact-info {
          margin-top: 15px;
          font-size: 13px;
          opacity: 0.9;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .content {
            padding: 20px;
          }
          .header {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>${a.nombre_empresa||"VipCleaners"}</h1>
          <p>Respuesta a tu mensaje</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">
            Hola ${e.name},
          </div>

          <p>Gracias por contactarnos. Hemos recibido tu mensaje y queremos responderte:</p>

          <!-- Reply Message -->
          <div class="reply-message">
            <p>${t.replace(/\n/g,"<br>")}</p>
          </div>

          ${o?`
          <!-- Original Message -->
          <div class="original-message">
            <h3>Tu mensaje original:</h3>
            
            <div class="original-info">
              <strong>De:</strong> ${e.name} &lt;${e.email}&gt;<br>
              <strong>Asunto:</strong> ${e.subject}<br>
              <strong>Fecha:</strong> ${r}
            </div>
            
            <div class="original-content">
              ${e.message.replace(/\n/g,"<br>")}
            </div>
          </div>
          `:""}

          <!-- Signature -->
          <div class="signature">
            <div class="signature-name">${i}</div>
            <div class="signature-company">${a.nombre_empresa||"VipCleaners"}</div>
          </div>

          <p style="margin-top: 20px; color: #6c7a89; font-size: 14px;">
            Si tienes m\xe1s preguntas, no dudes en responder a este email o contactarnos directamente.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>\xa1Gracias por contactarnos!</strong></p>
          <div class="contact-info">
            ${a.telefono_contacto?`<p>📞 ${a.telefono_contacto}</p>`:""}
            ${a.email_contacto?`<p>✉️ ${a.email_contacto}</p>`:""}
            ${a.direccion_empresa?`<p>📍 ${a.direccion_empresa}</p>`:""}
            ${a.website_empresa?`<p>🌐 ${a.website_empresa}</p>`:""}
          </div>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            Este email es una respuesta a tu mensaje de contacto del ${r}
          </p>
        </div>
      </div>
    </body>
    </html>
  `}(e,t,o,n,a),p=function(e,t,o,a,i){new Date().toLocaleDateString("es-MX");let r=new Date(e.created_at).toLocaleDateString("es-MX"),n=`
Hola ${e.name},

Gracias por contactarnos. Hemos recibido tu mensaje y queremos responderte:

${t}

`;return o&&(n+=`

--- Tu mensaje original ---
De: ${e.name} <${e.email}>
Asunto: ${e.subject}
Fecha: ${r}

${e.message}

`),n}(e,t,o,0,0);console.log("\uD83D\uDCE7 Configuraci\xf3n de email para respuesta:",{from:d,fromName:l,to:e.email,subject:`Re: ${e.subject}`});let m={from:{name:l,address:d},to:e.email,subject:`Re: ${e.subject}`,html:c,text:p,replyTo:d};console.log("\uD83D\uDCE4 Enviando respuesta por email a:",e.email),console.log("\uD83D\uDCCB Asunto:",m.subject);let g=await s.sendMail(m);return console.log("✅ Respuesta enviada exitosamente:",g.messageId),{success:!0,emailId:g.messageId,message:`Respuesta enviada exitosamente a ${e.email}`}}catch(t){console.error("❌ Error enviando respuesta por email:",t);let e="Error desconocido al enviar respuesta";return t instanceof Error&&((e=t.message).includes("Invalid login")||e.includes("authentication")?e="Credenciales de email incorrectas. Verifica GMAIL_USER y GMAIL_APP_PASSWORD":e.includes("Invalid")&&e.includes("address")?e="Email FROM inv\xe1lido. Verifica SMTP_FROM_EMAIL en las variables de entorno":e.includes("connection")?e="Error de conexi\xf3n con el servidor SMTP":e.includes("timeout")&&(e="Timeout al conectar con el servidor SMTP")),{success:!1,error:e}}}},96487:()=>{}};
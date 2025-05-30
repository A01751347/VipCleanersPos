(()=>{var e={};e.id=314,e.ids=[314],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3498:e=>{"use strict";e.exports=require("mysql2/promise")},7699:(e,r,t)=>{"use strict";t.d(r,{N:()=>d});var s=t(13581),o=t(7462),a=t(85663);async function i(e){try{let r=e.toLowerCase().trim(),t=`
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
    `,s=await (0,o.eW)({query:t,values:[r]});if(0===s.length)return null;return s[0]}catch(e){return console.error("Error al obtener usuario por email:",e),null}}async function n(e,r){try{return await (0,a.UD)(e,r)}catch(e){return console.error("Error al verificar la contrase\xf1a:",e),!1}}let d={providers:[(0,s.A)({name:"Credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;try{let r=await i(e.email);if(!r||!await n(e.password,r.password))return null;return{id:r.usuario_id.toString(),name:r.nombre?`${r.nombre} ${r.apellidos||""}`.trim():r.email,email:r.email,role:r.rol}}catch(e){return console.error("\uD83D\uDCA5 Error en autorizaci\xf3n:",e),null}}})],pages:{signIn:"/admin/login",error:"/admin/login"},session:{strategy:"jwt",maxAge:2592e3},callbacks:{jwt:async({token:e,user:r})=>(r&&(e.role=r.role,e.id=r.id),e),session:async({session:e,token:r})=>(e.user&&(e.user.role=r.role,e.user.id=r.id),e),redirect:async({url:e,baseUrl:r})=>e.includes("/admin/login")||e===r?`${r}/admin`:e.startsWith("/")?`${r}${e}`:e.startsWith(r)?e:`${r}/admin`},debug:!1,secret:"genera_un_secreto_aleatorio_largo"}},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11723:e=>{"use strict";e.exports=require("querystring")},12412:e=>{"use strict";e.exports=require("assert")},20643:(e,r,t)=>{"use strict";t.r(r),t.d(r,{patchFetch:()=>_,routeModule:()=>m,serverHooks:()=>g,workAsyncStorage:()=>h,workUnitAsyncStorage:()=>E});var s={};t.r(s),t.d(s,{PUT:()=>c});var o=t(96559),a=t(48088),i=t(37719),n=t(32190),d=t(35426),u=t(7699),l=t(7462);async function c(e,r){try{let t=await (0,d.getServerSession)(u.N);if(!t||"admin"!==t.user.role)return n.NextResponse.json({error:"No autorizado"},{status:401});let{id:s}=await r.params,o=parseInt(s,10);if(isNaN(o))return n.NextResponse.json({error:"ID de orden inv\xe1lido"},{status:400});let a=await e.json();if(console.log("Solicitud de cambio de estado recibida:",{ordenId:o,data:a,sessionUser:t.user}),!a.estadoId)return n.NextResponse.json({error:"ID de estado es obligatorio"},{status:400});let i=t.user.id?parseInt(t.user.id,10):null;console.log("Par\xe1metros para cambio de estado:",{ordenId:o,estadoId:a.estadoId,empleadoId:i,comentario:a.comentario});let l=await p(o,a.estadoId,i,a.comentario??null);return n.NextResponse.json({success:!0,message:"Estado actualizado correctamente",data:l},{status:200})}catch(t){console.error("Error al actualizar estado de orden:",t);let e="Error al procesar la solicitud",r=500;return t instanceof Error&&(t.message.includes("no existe")?r=404:t.message.includes("mismo estado")&&(r=400),e=t.message),n.NextResponse.json({error:e},{status:r})}}async function p(e,r,t,s){try{console.log("Ejecutando cambio de estado:",{ordenId:e,estadoId:r,empleadoId:t,comentario:s});let o=await (0,l.eW)({query:"SELECT orden_id, estado_actual_id FROM ordenes WHERE orden_id = ?",values:[e]});if(0===o.length)throw Error(`Orden ${e} no encontrada`);console.log("Orden encontrada:",o[0]);let a=await (0,l.eW)({query:"SELECT estado_id, nombre FROM estados_servicio WHERE estado_id = ?",values:[r]});if(0===a.length)throw Error(`Estado ${r} no encontrado`);console.log("Estado a aplicar:",a[0]);let i=await (0,l.eW)({query:"CALL CambiarEstadoOrden(?, ?, ?, ?)",values:[e,r,t,s]});console.log("Resultado del procedimiento almacenado:",i);let n=await (0,l.eW)({query:`
        SELECT 
          h.historial_id,
          h.orden_id, 
          h.estado_id,
          h.empleado_id, 
          h.comentario,
          h.fecha_cambio,
          e.nombre as estado_nombre,
          emp.nombre as empleado_nombre
        FROM historial_estados h 
        JOIN estados_servicio e ON h.estado_id = e.estado_id 
        LEFT JOIN empleados emp ON h.empleado_id = emp.empleado_id
        WHERE h.orden_id = ? 
        ORDER BY h.fecha_cambio DESC 
        LIMIT 1
      `,values:[e]});console.log("\xdaltimo registro en historial:",n[0]);let d=await (0,l.eW)({query:`
        SELECT 
          o.orden_id,
          o.estado_actual_id,
          e.nombre as estado_actual_nombre
        FROM ordenes o
        JOIN estados_servicio e ON o.estado_actual_id = e.estado_id
        WHERE o.orden_id = ?
      `,values:[e]});if(console.log("Estado actual de la orden:",d[0]),0===n.length)throw Error("No se pudo registrar el cambio de estado en el historial");if(0===d.length||d[0].estado_actual_id!==r)throw Error("No se pudo actualizar el estado de la orden");return{historial:n[0],orden:d[0]}}catch(e){throw console.error("Error en changeOrderStatus:",e),e}}let m=new o.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/admin/orders/[id]/status/route",pathname:"/api/admin/orders/[id]/status",filename:"route",bundlePath:"app/api/admin/orders/[id]/status/route"},resolvedPagePath:"/Users/santiserrano/Documents/GitHub/VipCleanersPos/app/api/admin/orders/[id]/status/route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:h,workUnitAsyncStorage:E,serverHooks:g}=m;function _(){return(0,i.patchFetch)({workAsyncStorage:h,workUnitAsyncStorage:E})}},28354:e=>{"use strict";e.exports=require("util")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{}};var r=require("../../../../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[4243,3104,580,7462],()=>t(20643));module.exports=s})();
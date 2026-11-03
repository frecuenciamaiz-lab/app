// Edge Function "admin-upload"
// Entrega una URL firmada para subir archivos al bucket público "media".
// Tres modos:
//   - admin   : requiere la clave del panel (admin_check)
//   - brief   : público, solo imágenes, carpeta briefs/
//   - negocio : requiere id + PIN del local (negocio_get), solo imágenes, carpeta negocios/
// Desplegar con verify_jwt = false.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const IMG = ["image/png","image/jpeg","image/webp","image/gif","image/heic","image/heif"];
const MEDIA = [...IMG, "video/mp4","video/quicktime","video/webm","audio/mpeg","audio/mp3","audio/mp4","audio/x-m4a","audio/aac","audio/ogg","audio/wav","audio/x-wav","audio/webm"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método" }, 405);
  try {
    const { key, filename, contentType, modo, id, pin } = await req.json();
    if (!filename) return json({ error: "faltan datos" }, 400);
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service, { auth: { persistSession: false } });
    let folder = "";
    if (modo === "brief") {
      if (!IMG.includes(contentType)) return json({ error: "Solo se permiten fotos" }, 400);
      folder = "briefs/";
    } else if (modo === "negocio") {
      const { data: d, error: ep } = await admin.rpc("negocio_get", { p_id: id, p_pin: pin });
      if (ep || !d || !d.local) return json({ error: d && d.error === "bloqueado" ? "Demasiados intentos. Espere 15 minutos." : "PIN incorrecto" }, 401);
      if (!IMG.includes(contentType)) return json({ error: "Solo se permiten fotos" }, 400);
      folder = "negocios/";
    } else {
      if (!key) return json({ error: "faltan datos" }, 400);
      const { data: ok, error: e1 } = await admin.rpc("admin_check", { p_key: key });
      if (e1 || !ok) return json({ error: "clave incorrecta" }, 401);
      if (contentType && !MEDIA.includes(contentType)) return json({ error: "tipo de archivo no permitido" }, 400);
    }
    const clean = String(filename).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9._-]+/g, "-").slice(-80);
    const path = `${folder}${new Date().toISOString().slice(0,10)}/${crypto.randomUUID().slice(0,8)}-${clean}`;
    const { data, error } = await admin.storage.from("media").createSignedUploadUrl(path);
    if (error) return json({ error: error.message }, 500);
    const pub = admin.storage.from("media").getPublicUrl(path).data.publicUrl;
    return json({ path, token: data.token, signedUrl: data.signedUrl, publicUrl: pub });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

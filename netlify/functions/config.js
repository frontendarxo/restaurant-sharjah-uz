// Netlify Function: serves /assets/config.js (see netlify.toml) from environment variables,
// so no keys live in the repository. Set in Netlify → Site configuration → Environment variables:
//   SUPABASE_URL, SUPABASE_ANON_KEY  (Supabase → Project Settings → API; the anon/publishable key is meant for browsers)
//   GOOGLE_MAPS_KEY                  (browser key restricted to your domain)
exports.handler = async function () {
  var cfg = {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    googleMapsKey: process.env.GOOGLE_MAPS_KEY || ""
  };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=60" },
    body: "window.SM_CONFIG = " + JSON.stringify(cfg) + ";\n"
  };
};

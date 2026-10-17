// Vercel serverless function: serves /assets/config.js (see vercel.json) from environment variables,
// so no keys live in the repository. Set these in Vercel → Project → Settings → Environment Variables:
//   SUPABASE_URL, SUPABASE_ANON_KEY  (Supabase → Project Settings → API; the anon/publishable key is meant for browsers)
//   GOOGLE_MAPS_KEY                  (browser key restricted to your domain)
module.exports = function handler(req, res) {
  var cfg = {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    googleMapsKey: process.env.GOOGLE_MAPS_KEY || ""
  };
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.end("window.SM_CONFIG = " + JSON.stringify(cfg) + ";\n");
};

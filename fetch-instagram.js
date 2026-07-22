// fetch-instagram.js
// Este script consulta la Instagram Graph API y guarda las publicaciones
// más recientes en un archivo JSON público (feed.json).
//
// Variables de entorno necesarias (se pasan como GitHub Secrets):
//   IG_ACCESS_TOKEN  -> token de página de larga duración
//   IG_USER_ID       -> id de la cuenta de Instagram Business (17841437184020158)

const fs = require("fs");

const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const LIMIT = 24; // cuántas publicaciones traer

const FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "children{media_type,media_url,thumbnail_url}",
].join(",");

async function main() {
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    console.error("Faltan IG_ACCESS_TOKEN o IG_USER_ID en las variables de entorno.");
    process.exit(1);
  }

  const url = `https://graph.facebook.com/v21.0/${IG_USER_ID}/media?fields=${encodeURIComponent(
    FIELDS
  )}&limit=${LIMIT}&access_token=${IG_ACCESS_TOKEN}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.error) {
    console.error("Error de la API de Instagram:", JSON.stringify(json.error, null, 2));
    process.exit(1);
  }

  const posts = (json.data || []).map((post) => ({
    id: post.id,
    caption: post.caption || "",
    media_type: post.media_type, // IMAGE | VIDEO | CAROUSEL_ALBUM
    media_url: post.media_url,
    thumbnail_url: post.thumbnail_url || post.media_url,
    timestamp: post.timestamp,
    children:
      post.media_type === "CAROUSEL_ALBUM" && post.children
        ? post.children.data.map((child) => ({
            media_type: child.media_type,
            media_url: child.media_url,
            thumbnail_url: child.thumbnail_url || child.media_url,
          }))
        : [],
  }));

  const output = {
    updated_at: new Date().toISOString(),
    posts,
  };

  fs.writeFileSync("feed.json", JSON.stringify(output, null, 2));
  console.log(`Listo: ${posts.length} publicaciones guardadas en feed.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Parse FRAME_PRESETS directly from file
const presetCode = fs.readFileSync("src/data/framePresets.ts", "utf8");
const jsonStr = presetCode.slice(
  presetCode.indexOf("= [") + 2,
  presetCode.lastIndexOf("];") + 1
);
const FRAME_PRESETS = JSON.parse(jsonStr);

const env = fs.readFileSync(".env.local", "utf8");
let url = "";
let key = "";
for (const line of env.split("\n")) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) url = line.split("=")[1].trim();
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) key = line.split("=")[1].trim();
}

if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  console.log("Checking existing templates in Supabase...");
  const { data: existing, error: fetchErr } = await supabase
    .from("frame_templates")
    .select("id, name, creator_name");

  if (fetchErr) {
    console.error("Error fetching templates:", fetchErr);
    process.exit(1);
  }

  const existingNames = new Set((existing || []).map((t) => t.name.toLowerCase()));

  for (const preset of FRAME_PRESETS) {
    if (existingNames.has(preset.name.toLowerCase())) {
      console.log(`⏩ Skip "${preset.name}" (already in DB)`);
      continue;
    }

    const row = {
      creator_name: "Posean Official",
      creator_avatar: "/logo.png",
      name: preset.name,
      description: `${preset.description} (${preset.cols} kolom × ${preset.rows} baris · ${preset.total} foto)`,
      type: preset.type,
      frames: preset.total,
      aspect_ratio: preset.cols > 1 ? "1/1" : "4/3",
      bg_color: preset.bg_color,
      text_color: preset.text_color,
      caption: preset.name === "Birthday" ? "Happy Birthday" : preset.name.toUpperCase(),
      default_filter: "none",
      stickers: [
        {
          type: "__frame_meta__",
          image_url: preset.image,
          frame_mode: "overlay",
          badge: preset.badge,
          frame_aspect_ratio: preset.aspectRatio,
          custom_slots: preset.slots,
          holes: preset.holes,
          cols: preset.cols,
          rows: preset.rows,
        },
      ],
      is_public: true,
      uses_count: Math.floor(180 + Math.random() * 150),
    };

    const { data, error } = await supabase.from("frame_templates").insert(row).select();
    if (error) {
      console.error(`❌ Failed to insert "${preset.name}":`, error);
    } else {
      console.log(`✔ Inserted "${preset.name}" into frame_templates (id: ${data[0].id})`);
    }
  }

  console.log("\n🎉 Database seeding finished!");
}

seed();

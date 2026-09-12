import fs from "node:fs"; import path from "node:path";
// Depo kökü betiğin kendi konumundan türer — klasör adı değişse de çalışır
const DEPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
// Varsayılan: tüm depo (docs/ aynası atlanır). Yol verilirse sadece orası taranır —
// örn. İngilizce taraf için:  node scripts/capa-denetle.mjs docs/eng
const KOK = process.argv[2] ? path.resolve(DEPO, process.argv[2]) : DEPO;
const js = fs.readFileSync(path.join(DEPO, "docs/assets/konular.js"), "utf8");
const slug = eval("(" + js.match(/function slug\(s\)\s*\{[\s\S]*?\n\s*\}/)[0] + ")");
const basliklar = (d) => {
  const set = new Set(), say = {}; let kod = false;
  for (const s of fs.readFileSync(d, "utf8").split("\n")) {
    if (/^\s*(```|~~~)/.test(s)) { kod = !kod; continue; } if (kod) continue;
    const h = s.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/); if (!h) continue;
    let g = slug(h[2].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[`*]/g, ""));
    if (say[g] !== undefined) { say[g]++; g += "-" + say[g]; } else say[g] = 0;
    set.add(g);
  } return set;
};
const dosyalar = [];
(function gez(d) { for (const e of fs.readdirSync(d, {withFileTypes:true})) {
  if (e.name === ".git" || (e.name === "docs" && d === DEPO) || e.name === "node_modules") continue;
  const f = path.join(d, e.name);
  if (e.isDirectory()) gez(f); else if (e.name.endsWith(".md")) dosyalar.push(f); } })(KOK);
let toplam = 0, kirik = 0;
for (const d of dosyalar) {
  let kod = false;
  fs.readFileSync(d, "utf8").split("\n").forEach((satir, i) => {
    if (/^\s*(```|~~~)/.test(satir)) { kod = !kod; return; } if (kod) return;
    for (const l of satir.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      const href = l[2]; if (/^(https?:|mailto:|#?$)/.test(href)) continue;
      const [yolK, capa] = href.split("#");
      const hedef = yolK ? path.normalize(path.join(path.dirname(d), decodeURIComponent(yolK))) : d;
      toplam++;
      let hata = null;
      if (!fs.existsSync(hedef)) hata = "DOSYA YOK → " + path.relative(KOK, hedef);
      else if (capa) { const c = decodeURIComponent(capa); if (!basliklar(hedef).has(c)) hata = "ÇAPA YOK → #" + c + "  (" + path.relative(KOK, hedef) + ")"; }
      if (hata) { kirik++; console.log("✗ " + path.relative(KOK, d) + ":" + (i+1) + "  " + hata); }
    }
  });
}
console.log(`\n[${path.relative(DEPO, KOK) || "depo kökü"}]  Taranan: ${dosyalar.length} md dosyası · ${toplam} bağlantı · KIRIK: ${kirik}`);

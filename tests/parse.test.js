// Tests unitaires de l'heuristique d'extraction utilisée dans public/scan.html
// (même logique que parseReceiptText côté client). Ne nécessite pas de réseau.

function parseReceiptText(text) {
  const amountMatch = text.match(/(\d{1,4}[.,]\d{2})\s*(?:€|EUR)?/g);
  let amount = "";
  if (amountMatch) {
    const nums = amountMatch.map((s) => parseFloat(s.replace(",", ".").replace(/[^\d.]/g, "")));
    amount = Math.max(...nums).toFixed(2);
  }
  const dateMatch = text.match(/(\d{2}[\/\-.]\d{2}[\/\-.]\d{2,4})/);
  let date = "";
  if (dateMatch) {
    const parts = dateMatch[1].split(/[\/\-.]/);
    if (parts[2] && parts[2].length === 2) parts[2] = "20" + parts[2];
    if (parts.length === 3) date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const vendor = lines.length ? lines[0].slice(0, 40) : "";
  return { amount, date, vendor };
}

const cases = [
  {
    name: "Reçu supermarché simple",
    text: "SUPERMARCHE BIO\nDate: 15/07/2026\nTotal: 45.30 EUR\nMerci de votre visite",
    expect: { amount: "45.30", date: "2026-07-15", vendor: "SUPERMARCHE BIO" },
  },
  {
    name: "Facture fournisseur avec virgule décimale",
    text: "ETS MARTIN & FILS\nFacture du 03/01/26\nSous-total 120,00\nTVA 24,00\nTotal 144,00 €",
    expect: { amount: "144.00", date: "2026-01-03", vendor: "ETS MARTIN & FILS" },
  },
  {
    name: "Reçu essence",
    text: "TOTAL ENERGIE STATION\n10-07-2026\nCarburant 45.30€",
    expect: { amount: "45.30", date: "2026-07-10", vendor: "TOTAL ENERGIE STATION" },
  },
  {
    name: "Texte bruité / OCR imparfait",
    text: "C4F3 D3 PARIS\n22/06/2026\nmontant  9.50 EUR\nTVA incl.",
    expect: { amount: "9.50", date: "2026-06-22", vendor: "C4F3 D3 PARIS" },
  },
];

let pass = 0;
for (const c of cases) {
  const result = parseReceiptText(c.text);
  const ok = result.amount === c.expect.amount && result.date === c.expect.date && result.vendor === c.expect.vendor;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${c.name}`);
  if (!ok) {
    console.log("  attendu :", JSON.stringify(c.expect));
    console.log("  obtenu  :", JSON.stringify(result));
  }
  if (ok) pass++;
}
console.log(`\n${pass}/${cases.length} cas réussis`);
process.exit(pass === cases.length ? 0 : 1);

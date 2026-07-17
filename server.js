const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "data", "db.json");
const UPLOAD_DIR = path.join(__dirname, "data", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ expenses: [], invoices: [], waitlist: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

const upload = multer({ dest: UPLOAD_DIR });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

// ---- Expenses ----
app.get("/api/expenses", (req, res) => {
  const db = readDB();
  res.json(db.expenses);
});

app.post("/api/expenses", upload.single("receipt"), (req, res) => {
  const db = readDB();
  const { vendor, amount, date, category } = req.body;
  const expense = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    vendor: vendor || "Inconnu",
    amount: parseFloat(amount) || 0,
    date: date || new Date().toISOString().slice(0, 10),
    category: category || "Autre",
    receiptFile: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date().toISOString(),
  };
  db.expenses.push(expense);
  writeDB(db);
  res.status(201).json(expense);
});

app.delete("/api/expenses/:id", (req, res) => {
  const db = readDB();
  db.expenses = db.expenses.filter((e) => e.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ---- Invoices ----
app.get("/api/invoices", (req, res) => {
  const db = readDB();
  res.json(db.invoices);
});

app.post("/api/invoices", (req, res) => {
  const db = readDB();
  const { client, items, dueDate } = req.body;
  const lineItems = Array.isArray(items) ? items : [];
  const total = lineItems.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
  const invoice = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    number: "INV-" + (db.invoices.length + 1001),
    client: client || "Client",
    items: lineItems,
    total: Math.round(total * 100) / 100,
    status: "en attente",
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
  };
  db.invoices.push(invoice);
  writeDB(db);
  res.status(201).json(invoice);
});

app.patch("/api/invoices/:id", (req, res) => {
  const db = readDB();
  const inv = db.invoices.find((i) => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: "not found" });
  if (req.body.status) inv.status = req.body.status;
  writeDB(db);
  res.json(inv);
});

app.delete("/api/invoices/:id", (req, res) => {
  const db = readDB();
  db.invoices = db.invoices.filter((i) => i.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ---- Waitlist (Phase 1 validation) ----
app.post("/api/waitlist", (req, res) => {
  const db = readDB();
  const { email, role } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "email invalide" });
  }
  if (!db.waitlist.find((w) => w.email === email)) {
    db.waitlist.push({ email, role: role || "", createdAt: new Date().toISOString() });
    writeDB(db);
  }
  res.status(201).json({ ok: true, count: db.waitlist.length });
});

app.get("/api/waitlist", (req, res) => {
  const db = readDB();
  res.json({ count: db.waitlist.length, entries: db.waitlist });
});

// ---- CSV export (dashboard) ----
app.get("/api/export/csv", (req, res) => {
  const db = readDB();
  const rows = [["type", "date", "libelle", "montant", "categorie_ou_statut"]];
  db.expenses.forEach((e) => rows.push(["depense", e.date, e.vendor, e.amount, e.category]));
  db.invoices.forEach((i) => rows.push(["facture", i.createdAt.slice(0, 10), i.client, i.total, i.status]));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=factureia_export.csv");
  res.send(csv);
});

// ---- Metrics (Phase 6 growth monitoring) ----
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const totalExpenses = db.expenses.reduce((s, e) => s + e.amount, 0);
  const totalInvoiced = db.invoices.reduce((s, i) => s + i.total, 0);
  const paidInvoices = db.invoices.filter((i) => i.status === "payée");
  res.json({
    waitlistCount: db.waitlist.length,
    expensesCount: db.expenses.length,
    invoicesCount: db.invoices.length,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
    paidInvoicesCount: paidInvoices.length,
    conversionProxy: db.waitlist.length ? Math.round((db.invoices.length / db.waitlist.length) * 1000) / 10 : 0,
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`FactureIA MVP en écoute sur http://localhost:${PORT}`));

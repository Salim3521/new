# FactureIA — MVP

Scan de reçus par IA (OCR), génération de factures, tableau de bord de dépenses. Voir `TECH_SPEC.md` pour l'architecture et `QA_REPORT.md` pour les résultats de test.

## Lancer en local — version prête à l'emploi (`factureia-app-prete.zip`)

Ce zip contient déjà les dépendances installées. Aucune commande `npm install` requise :

```bash
unzip factureia-app-prete.zip
cd factureia-app
node server.js
```

Puis ouvrez http://localhost:4000 dans votre navigateur. Testé et vérifié fonctionnel de bout en bout (page d'accueil, scan, factures, tableau de bord, API) juste avant livraison.

## Lancer depuis le code source (`factureia-app.zip`)

```bash
npm install
npm start
```

Puis ouvrez http://localhost:4000 dans votre navigateur.

Aucune clé API n'est requise pour le MVP : l'OCR (Tesseract.js) et la génération de PDF (jsPDF) tournent entièrement dans le navigateur via des CDN publics. Le stockage se fait dans `data/db.json` (fichier local) — suffisant pour valider le concept, à remplacer par une vraie base de données (Postgres/Supabase) avant un lancement public avec plusieurs utilisateurs.

## Lancer les tests

```bash
npm test
```

Vérifie la logique d'extraction (montant/date/fournisseur) sur 4 cas représentatifs de texte OCR.

## Déployer en ligne

Ce projet est une app Node/Express classique, déployable en une commande sur n'importe quel hébergeur (ex. Render, Railway, Fly.io, un VPS). Exemple avec Render ou Railway :

1. Poussez ce dossier vers un dépôt Git (GitHub/GitLab).
2. Connectez le dépôt à votre compte Render/Railway.
3. Build command : `npm install` — Start command : `npm start`.
4. Ajoutez un volume persistant pour `data/` si vous voulez conserver les données entre redéploiements (sinon, migrez vers une vraie base de données).

Trois options prêtes à l'emploi selon l'hébergeur choisi :
- **Render** : `render.yaml` déjà configuré (détection automatique).
- **Railway/Heroku** : `Procfile` déjà présent (`web: npm start`).
- **Docker (VPS, Fly.io, etc.)** : `docker build -t factureia-app . && docker run -p 4000:4000 factureia-app`.

**Ce que je n'ai pas pu faire à votre place :** créer un compte d'hébergement, acheter un nom de domaine, ou créer un compte Stripe en votre nom — ces étapes nécessitent vos propres identifiants et informations de paiement. Le code est prêt à être déployé dès que vous avez choisi votre hébergeur.

## Structure

```
server.js          → API Express (dépenses, factures, liste d'attente, export CSV)
public/             → Frontend (pages HTML + JS, aucun build nécessaire)
  index.html        → Landing page + liste d'attente (kit de validation)
  scan.html         → Scan de reçu + extraction OCR
  invoices.html     → Création de factures + génération PDF
  dashboard.html    → Vue d'ensemble + export CSV
data/db.json        → Stockage des données (fichier JSON local)
tests/parse.test.js → Tests de la logique d'extraction OCR
```

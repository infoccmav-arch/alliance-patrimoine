// Rapport mensuel — génère un HTML puis ouvre la fenêtre d'impression/PDF

const fmtCAD = v => Math.round(v).toLocaleString('fr-CA');

export function genererRapportPDF({ membres, capital, proprietes, franchises, transactions }) {
  const now  = new Date();
  const mois = now.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  const moisStr = now.toISOString().substring(0, 7);

  const cotisationMensuelle = membres.filter(m => m.actif).reduce((s, m) => s + m.cotisation, 0);
  const valeurP = proprietes.reduce((s, p) => s + (+p.valeurActuelle || +p.prixAchat || 0), 0);
  const hypo    = proprietes.reduce((s, p) => s + (+p.hypotheque || 0), 0);
  const cashflow = proprietes.reduce((s, p) => s + (+p.cashflow || 0), 0);
  const valNette = valeurP - hypo;
  const totalPort = capital + valNette;

  const txMois = transactions.filter(t => t.date?.startsWith(moisStr));
  const entreesMois = txMois.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0);
  const sortiesMois = txMois.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0);

  // Cotisations this month
  const cotsMois = transactions.filter(t =>
    t.categorie === 'Cotisation' && t.date?.startsWith(moisStr) && t.membreId
  );
  const paidIds = cotsMois.map(t => t.membreId);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Rapport ${mois} — Alliance Patrimoine Inc.</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #fff; color: #111; padding: 40px 48px; font-size: 13px; }
  h1 { font-size: 26px; font-weight: 900; color: #000; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; margin-bottom: 12px; margin-top: 28px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #000; }
  .logo-box { display: flex; align-items: center; gap: 12px; }
  .logo-name { font-size: 17px; font-weight: 900; color: #000; }
  .logo-sub  { font-size: 9px; font-weight: 800; letter-spacing: 0.3em; color: #aaa; }
  .date-box  { text-align: right; }
  .date-box p { font-size: 11px; color: #888; }
  .date-box .mois { font-size: 16px; font-weight: 800; color: #000; text-transform: capitalize; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .kpi { background: #f9f9f9; border: 1px solid #eee; border-radius: 12px; padding: 16px; }
  .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; margin-bottom: 6px; }
  .kpi-val   { font-size: 20px; font-weight: 900; color: #000; font-variant-numeric: tabular-nums; }
  .kpi-sub   { font-size: 10px; color: #aaa; margin-top: 3px; }
  .green  { color: #00a865; }
  .red    { color: #e53e3e; }
  .amber  { color: #d97706; }
  table  { width: 100%; border-collapse: collapse; }
  thead  { background: #000; color: #fff; }
  thead th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  tbody tr:nth-child(even) { background: #f9f9f9; }
  tbody td { padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
  .badge-green { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .badge-gray  { background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10px; color: #ccc; }
  @media print {
    body { padding: 20px 28px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo-box">
    <div style="width:48px;height:48px;background:#000;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#f59e0b;font-weight:900;font-size:18px;">A</div>
    <div>
      <div class="logo-name">Alliance Patrimoine</div>
      <div class="logo-sub">INC.</div>
    </div>
  </div>
  <div class="date-box">
    <p>Rapport mensuel</p>
    <p class="mois">${mois}</p>
    <p>Généré le ${now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
</div>

<h2>Vue d'ensemble</h2>
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">Valeur nette totale</div>
    <div class="kpi-val">${fmtCAD(totalPort)} $</div>
    <div class="kpi-sub">Capital + immobilier</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Capital liquide</div>
    <div class="kpi-val green">${fmtCAD(capital)} $</div>
    <div class="kpi-sub">Disponible</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Cashflow mensuel</div>
    <div class="kpi-val ${cashflow >= 0 ? 'green' : 'red'}">${cashflow >= 0 ? '+' : ''}${fmtCAD(cashflow)} $</div>
    <div class="kpi-sub">Toutes propriétés</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Cotisations/mois</div>
    <div class="kpi-val amber">${fmtCAD(cotisationMensuelle)} $</div>
    <div class="kpi-sub">${membres.filter(m => m.actif).length} membres actifs</div>
  </div>
</div>

<div class="kpi-grid" style="margin-top:8px;">
  <div class="kpi">
    <div class="kpi-label">Propriétés</div>
    <div class="kpi-val">${proprietes.length}</div>
    <div class="kpi-sub">Actifs immobiliers</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Valeur immobilière</div>
    <div class="kpi-val">${fmtCAD(valeurP)} $</div>
    <div class="kpi-sub">Valeur marchande</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Dette hypothécaire</div>
    <div class="kpi-val red">${fmtCAD(hypo)} $</div>
    <div class="kpi-sub">Total hypothèques</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Équité nette</div>
    <div class="kpi-val green">${fmtCAD(valNette)} $</div>
    <div class="kpi-sub">Valeur − dettes</div>
  </div>
</div>

<h2>Cotisations — ${mois}</h2>
<table>
  <thead>
    <tr><th>Membre</th><th>Cotisation mensuelle</th><th>Statut ${mois}</th><th>Total versé</th></tr>
  </thead>
  <tbody>
    ${membres.filter(m => m.actif).map(m => {
      const paid = paidIds.includes(m.id);
      const totalVerse = transactions
        .filter(t => t.membreId === m.id && t.categorie === 'Cotisation')
        .reduce((s, t) => s + t.montant, 0);
      return `<tr>
        <td><strong>${m.nom}</strong></td>
        <td>${fmtCAD(m.cotisation)} $</td>
        <td><span class="${paid ? 'badge-green' : 'badge-gray'}">${paid ? '✓ Payé' : 'En attente'}</span></td>
        <td>${fmtCAD(totalVerse)} $</td>
      </tr>`;
    }).join('')}
    <tr style="border-top: 2px solid #000; font-weight: 800;">
      <td>TOTAL</td>
      <td>${fmtCAD(cotisationMensuelle)} $/mois</td>
      <td>${paidIds.length}/${membres.filter(m => m.actif).length} payés</td>
      <td>${fmtCAD(transactions.filter(t => t.categorie === 'Cotisation').reduce((s, t) => s + t.montant, 0))} $</td>
    </tr>
  </tbody>
</table>

${proprietes.length > 0 ? `
<h2>Portefeuille immobilier</h2>
<table>
  <thead>
    <tr><th>Propriété</th><th>Prix d'achat</th><th>Valeur actuelle</th><th>Hypothèque</th><th>Cashflow/m</th><th>Statut</th></tr>
  </thead>
  <tbody>
    ${proprietes.map(p => {
      const va = +p.valeurActuelle || +p.prixAchat || 0;
      const pa = +p.prixAchat || 0;
      const cf = +p.cashflow || 0;
      return `<tr>
        <td><strong>${p.adresse || 'N/A'}</strong><br/><span style="color:#888;font-size:11px">${p.ville || ''}</span></td>
        <td>${fmtCAD(pa)} $</td>
        <td>${fmtCAD(va)} $</td>
        <td>${fmtCAD(+p.hypotheque || 0)} $</td>
        <td class="${cf >= 0 ? 'green' : 'red'}">${cf >= 0 ? '+' : ''}${fmtCAD(cf)} $</td>
        <td>${p.status || '—'}</td>
      </tr>`;
    }).join('')}
  </tbody>
</table>
` : ''}

${txMois.length > 0 ? `
<h2>Transactions — ${mois}</h2>
<table>
  <thead>
    <tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Montant</th></tr>
  </thead>
  <tbody>
    ${txMois.map(t => `<tr>
      <td>${t.date}</td>
      <td>${t.description || t.categorie}</td>
      <td>${t.categorie}</td>
      <td class="${t.type === 'entree' ? 'green' : 'red'}">${t.type === 'entree' ? '+' : '-'}${fmtCAD(t.montant)} $</td>
    </tr>`).join('')}
    <tr style="font-weight:800; border-top: 2px solid #000;">
      <td colspan="3">Flux net du mois</td>
      <td class="${entreesMois - sortiesMois >= 0 ? 'green' : 'red'}">${entreesMois - sortiesMois >= 0 ? '+' : ''}${fmtCAD(entreesMois - sortiesMois)} $</td>
    </tr>
  </tbody>
</table>
` : ''}

<div class="footer">
  <span>Alliance Patrimoine Inc. — Rapport confidentiel</span>
  <span>Généré automatiquement · ${now.toLocaleDateString('fr-CA')}</span>
</div>

<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

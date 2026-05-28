import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const planData = [
  {
    phase: 'PHASE 1', titre: 'Lancer le Groupe 1', mois: 'Mois 1–6 (22 ans)', color: 'blue',
    taches: [
      { id: 'p1t1', label: 'Recruter 7 membres sérieux', detail: 'Personnes fiables, motivées — qualité > quantité' },
      { id: 'p1t2', label: 'Cotisation 1 000$/membre/mois', detail: '7 membres = 7 000$/mois → 84 000$/an de capital' },
      { id: 'p1t3', label: 'Ouvrir compte bancaire Desjardins conjoint', detail: 'Tous les membres signataires' },
      { id: 'p1t4', label: 'Vérifier la cote de crédit de chaque membre', detail: 'Borrowell.com gratuit — viser 680+ pour les signataires hypothécaires' },
      { id: 'p1t5', label: 'Rencontrer un courtier hypothécaire', detail: 'Desjardins ou courtier indépendant — comprendre votre capacité d\'emprunt' },
      { id: 'p1t6', label: 'Ouvrir compte contracteur Home Depot / Rona', detail: 'Rabais matériaux avec tes gars de construction' },
      { id: 'p1t7', label: 'Définir les rôles du groupe', detail: 'Toi = Président/Gestionnaire, Trésorier, Secrétaire' },
      { id: 'p1t8', label: 'Entente écrite entre membres (notaire)', detail: '~1 500$ — Protège tout le monde si quelqu\'un veut sortir' },
    ]
  },
  {
    phase: 'PHASE 2', titre: '1ère Maison à Flipper', mois: 'Mois 7–10 (22–23 ans)', color: 'orange',
    taches: [
      { id: 'p2t1', label: 'Chercher maison à rénover sur Rive-Sud ou Rive-Nord', detail: 'Longueuil, Brossard, Terrebonne, Repentigny — appréciation forte' },
      { id: 'p2t2', label: 'Budget achat: 200 000–280 000$', detail: 'Maison cheap qui a besoin de travaux — personne d\'autre en veut' },
      { id: 'p2t3', label: 'Mise de fonds 20%: ~45 000$', detail: 'Tiré des cotisations accumulées' },
      { id: 'p2t4', label: 'Tes gars rénovent: cuisine, sdb, planchers, façade', detail: 'Coût matériaux ~25 000$ — main d\'œuvre = gratuit!' },
      { id: 'p2t5', label: 'Revendre +60 000–80 000$ de profit', detail: 'Valeur après réno: 340 000–380 000$' },
      { id: 'p2t6', label: 'Profit réinvesti dans la mise de fonds du triplex', detail: 'Ne pas distribuer — garder pour accélérer' },
    ]
  },
  {
    phase: 'PHASE 3', titre: '1er Triplex — Stratégie Résidentielle', mois: 'Mois 8–12 (23 ans)', color: 'purple',
    taches: [
      { id: 'p3t1', label: 'Chercher triplex à rénover Rive-Sud/Rive-Nord', detail: 'Budget 380 000–480 000$ — besoin de travaux = moins cher' },
      { id: 'p3t2', label: 'Un membre habite dans le logement principal', detail: 'Mise de fonds 5% au lieu de 20% → économise 60 000$!' },
      { id: 'p3t3', label: 'Mise de fonds 5%: ~20 000$', detail: 'Financement résidentiel = meilleur taux' },
      { id: 'p3t4', label: 'Tes gars rénovent les 2 logements locatifs', detail: 'Loyers augmentés après réno' },
      { id: 'p3t5', label: '2 loyers encaissés: ~2 600–3 200$/mois', detail: 'Couvre l\'hypothèque + génère cashflow' },
      { id: 'p3t6', label: 'Membre renouvelle après 12 mois', detail: 'Peut déménager après 1 an — taux résidentiel conservé' },
    ]
  },
  {
    phase: 'PHASE 4', titre: 'Refinancement BRRRR', mois: 'An 2 (23–24 ans)', color: 'emerald',
    taches: [
      { id: 'p4t1', label: 'Faire évaluer le triplex après rénovations', detail: '~400$ — nouvelle valeur 500 000–550 000$' },
      { id: 'p4t2', label: 'Refinancement à 80% de la nouvelle valeur', detail: 'Récupère 60 000–80 000$ → ta mise de fonds revient!' },
      { id: 'p4t3', label: 'Utiliser l\'argent récupéré pour 2e triplex', detail: 'Le cycle BRRRR recommence — argent infini théoriquement' },
      { id: 'p4t4', label: 'Répéter pour chaque propriété du groupe', detail: 'Chaque membre peut habiter dans son propre triplex' },
    ]
  },
  {
    phase: 'PHASE 5', titre: 'Incorporation + 3–4 Propriétés', mois: 'An 2–3 (24–25 ans)', color: 'teal',
    taches: [
      { id: 'p5t1', label: 'Incorporer Alliance Patrimoine Inc.', detail: 'Quand vous avez 2+ propriétés ou 100k$+ revenus — avocat corporatif ~2 500$' },
      { id: 'p5t2', label: 'Toi: 20% des parts comme gestionnaire', detail: 'Juste compensation pour organiser le groupe' },
      { id: 'p5t3', label: '2e triplex acheté et rénové', detail: 'Même stratégie — autre membre y habite' },
      { id: 'p5t4', label: '3e propriété ou maison à flipper', detail: 'Alterner flip + garder pour maximiser cash et patrimoine' },
      { id: 'p5t5', label: 'Cashflow combiné 4 000–6 000$/mois', detail: 'Reste dans la compagnie pour financer la suite' },
      { id: 'p5t6', label: 'CPA consulté chaque trimestre', detail: 'Taux corporatif ~12% au Québec vs 37% personnel' },
    ]
  },
  {
    phase: 'PHASE 6', titre: 'Lancer le Groupe 2', mois: 'An 3–4 (25–26 ans)', color: 'yellow',
    taches: [
      { id: 'p6t1', label: 'Recruter 7 nouveaux membres pour Groupe 2', detail: 'Utilise l\'app pour gérer 2 groupes séparément' },
      { id: 'p6t2', label: 'Même modèle: 1 000$/mois × 7 membres', detail: '+ 84 000$/an de capital additionnel' },
      { id: 'p6t3', label: 'Toi = gestionnaire des 2 groupes', detail: 'Frais de gestion sur les 2 = double revenu pour toi' },
      { id: 'p6t4', label: 'Portefeuille combiné: 6–8 propriétés', detail: 'Valeur 2.5–3.5M$' },
      { id: 'p6t5', label: 'Les 2 groupes partagent tes gars de construction', detail: 'Économies d\'échelle maximales' },
    ]
  },
  {
    phase: 'PHASE 7', titre: 'Immeuble à revenus', mois: 'An 4–6 (26–28 ans)', color: 'blue',
    taches: [
      { id: 'p7t1', label: 'Accumuler 200 000–300 000$ pour mise de fonds', detail: 'Refinancements + cotisations des 2 groupes' },
      { id: 'p7t2', label: 'Acheter immeuble 6–10 logements', detail: 'Financement commercial — moins dépendant du crédit personnel' },
      { id: 'p7t3', label: 'Tes gars rénovent l\'immeuble entier', detail: 'Valeur ajoutée massive — refinancement possible' },
      { id: 'p7t4', label: 'Cashflow 6 000–10 000$/mois net', detail: 'Machine à cash automatique' },
      { id: 'p7t5', label: 'Engager un gestionnaire immobilier', detail: '8–10% des loyers — tu te libères du temps' },
    ]
  },
  {
    phase: 'PHASE 8', titre: 'Franchise + Liberté', mois: 'An 6–8 (28–30 ans)', color: 'purple',
    taches: [
      { id: 'p8t1', label: 'Franchise dans la construction/rénovation', detail: 'Capitalise sur tes gars — exemple: franchise nettoyage ou réno' },
      { id: 'p8t2', label: 'Ou franchise service (restauration rapide)', detail: 'Cash flow immédiat, financement BDC disponible' },
      { id: 'p8t3', label: 'Ouvrir FRANCHISE INC. sous Alliance Patrimoine', detail: 'Structure légale isolée — protège tes biens' },
      { id: 'p8t4', label: 'Revenus franchise: 150 000–300 000$/an', detail: 'S\'ajoute aux loyers immobiliers' },
    ]
  },
  {
    phase: 'PHASE 9', titre: 'Retraite à 35 ans 🎯', mois: 'An 10–13 (32–35 ans)', color: 'red',
    taches: [
      { id: 'p9t1', label: '10–14 propriétés dans le portefeuille', detail: 'Valeur totale 4–6M$ avec les 2 groupes' },
      { id: 'p9t2', label: 'Cashflow net 15 000–25 000$/mois total', detail: 'Loyers + franchise + dividendes' },
      { id: 'p9t3', label: 'Ta part (20%+): 3 000–6 000$/mois passif', detail: 'Tu travailles plus si tu veux' },
      { id: 'p9t4', label: 'Valeur nette personnelle: 1–2M$', detail: 'Millionnaire avant 35 ans ✓' },
      { id: 'p9t5', label: 'Lancer Groupe 3 ou vendre tes parts', detail: 'Ou prendre ta retraite complète — ton choix' },
    ]
  },
];

const colorMap = {
  blue: { border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-400', dot: 'bg-blue-500' },
  purple: { border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-500' },
  orange: { border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-500' },
  emerald: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
  teal: { border: 'border-teal-500/30', badge: 'bg-teal-500/20 text-teal-400', dot: 'bg-teal-500' },
  yellow: { border: 'border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' },
  red: { border: 'border-red-500/30', badge: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' },
};

export default function PlanAction({ checklist, setChecklist }) {
  const [expanded, setExpanded] = useState({ 0: true });

  const toggle = (id) => setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  const togglePhase = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const totalTaches = planData.reduce((s, p) => s + p.taches.length, 0);
  const tachesFaites = planData.reduce((s, p) => s + p.taches.filter(t => checklist[t.id]).length, 0);
  const progression = Math.round((tachesFaites / totalTaches) * 100);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Plan d'action</h2>
        <p className="text-slate-400 text-sm mt-1">Cochez chaque étape accomplie</p>
      </div>

      {/* Progression globale */}
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">Progression globale</span>
          <span className="text-white font-bold">{tachesFaites}/{totalTaches} tâches</span>
        </div>
        <div className="w-full bg-[#1a1a1a] rounded-full h-3 mb-2">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-3 rounded-full transition-all duration-700" style={{ width: `${progression}%` }} />
        </div>
        <p className="text-slate-400 text-sm">{progression}% complété — {totalTaches - tachesFaites} tâches restantes</p>
      </div>

      {/* Phases */}
      {planData.map((phase, i) => {
        const colors = colorMap[phase.color] || colorMap.blue;
        const done = phase.taches.filter(t => checklist[t.id]).length;
        const isOpen = expanded[i];
        return (
          <div key={i} className={`bg-[#0a0a0a] border ${colors.border} rounded-2xl overflow-hidden`}>
            <button className="w-full p-4 flex items-center justify-between" onClick={() => togglePhase(i)}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${colors.dot} flex-shrink-0`} />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>{phase.phase}</span>
                    <span className="text-white font-semibold">{phase.titre}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{phase.mois} — {done}/{phase.taches.length} tâches</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {done === phase.taches.length && (
                  <span className="text-emerald-400 text-xs font-medium">✓ Complété</span>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-white/[0.06] p-4 space-y-2">
                {phase.taches.map(t => (
                  <button key={t.id} onClick={() => toggle(t.id)} className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-[#0a0a0a] transition text-left">
                    {checklist[t.id]
                      ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-sm font-medium ${checklist[t.id] ? 'line-through text-slate-500' : 'text-white'}`}>{t.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{t.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Règles d'or */}
      <div className="bg-[#0a0a0a] border border-yellow-500/30 rounded-2xl p-4">
        <h3 className="text-yellow-400 font-semibold mb-4">⚡ Les 10 commandements du groupe</h3>
        <div className="space-y-2">
          {[
            'Les cotisations 1 000$/mois ne s\'arrêtent JAMAIS',
            'Acheter seulement cheap — besoin de rénovations = profit',
            'Tes gars de construction = ton avantage #1',
            'Un membre habite dans chaque triplex → mise de fonds 5%',
            'Refinancement après chaque rénovation — récupère ton argent',
            'Garder les propriétés, ne JAMAIS vendre trop tôt',
            'Tout cashflow reste dans la compagnie jusqu\'à An 5',
            'Acheter proche Montréal — l\'appréciation fait la richesse',
            'Réunion mensuelle obligatoire — tous présents',
            'Réserve d\'urgence 20 000$ toujours en banque',
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-yellow-400 font-bold text-sm flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-slate-300 text-sm">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

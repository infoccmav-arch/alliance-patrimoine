import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const planData = [
  {
    phase: 'PHASE 1', titre: 'Structure légale', mois: 'Mois 1–3', color: 'blue',
    taches: [
      { id: 'p1t1', label: 'Réunion officielle des 10 membres', detail: 'Choisir les rôles : Gestionnaire, Trésorier, Chef chantier, Secrétaire' },
      { id: 'p1t2', label: 'Créer la Holding Inc.', detail: 'Avocat corporatif ~2 000$ — Convention actionnaires signée' },
      { id: 'p1t3', label: 'Ouvrir compte bancaire Desjardins entreprise', detail: 'Carte de crédit d\'entreprise également' },
      { id: 'p1t4', label: 'Rencontrer un comptable CPA', detail: 'Structure fiscale optimale' },
      { id: 'p1t5', label: 'Rencontrer un courtier hypothécaire commercial', detail: 'Comprendre vos options de financement' },
      { id: 'p1t6', label: 'Ouvrir compte Home Depot / Rona contracteur', detail: 'Rabais sur les matériaux' },
      { id: 'p1t7', label: 'Vérifier la cote de crédit de chaque membre', detail: 'Borrowell.com — gratuit' },
      { id: 'p1t8', label: 'Commencer les cotisations mensuelles', detail: '750$/membre/mois minimum' },
    ]
  },
  {
    phase: 'PHASE 2', titre: 'Trouver la 1ère propriété', mois: 'Mois 4–12', color: 'purple',
    taches: [
      { id: 'p2t1', label: 'Visiter 40–60 propriétés ensemble', detail: 'Repentigny, Terrebonne, Mascouche, Saint-Jérôme' },
      { id: 'p2t2', label: 'Obtenir une pré-autorisation hypothécaire', detail: 'Terme 2 ANS (pas 5 ans)' },
      { id: 'p2t3', label: 'Analyser les chiffres de chaque propriété', detail: 'Prix, revenus, dépenses, cashflow net' },
      { id: 'p2t4', label: 'Faire des offres agressives', detail: '10–15% sous le prix demandé' },
      { id: 'p2t5', label: 'Acheter la 1ère propriété', detail: 'Mise de fonds 25%, réserve 15 000$ gardée' },
    ]
  },
  {
    phase: 'PHASE 3', titre: 'Rénovation DIY', mois: 'Mois 10–16', color: 'orange',
    taches: [
      { id: 'p3t1', label: 'Faire évaluer par électricien (obligatoire)', detail: 'Licence obligatoire au Québec' },
      { id: 'p3t2', label: 'Faire évaluer par plombier', detail: 'Licence obligatoire au Québec' },
      { id: 'p3t3', label: 'Budget matériaux max 25 000$', detail: 'Peinture, planchers, cuisine, salle de bain' },
      { id: 'p3t4', label: 'Organiser les fins de semaine de chantier', detail: 'Samedi 8h–17h, Dimanche 8h–15h' },
      { id: 'p3t5', label: 'Démolition → Drywall → Peinture → Planchers', detail: 'Dans cet ordre' },
      { id: 'p3t6', label: 'Photos de progression chaque semaine', detail: 'Instagram/TikTok optionnel' },
      { id: 'p3t7', label: 'Cuisine et salle de bain finaux', detail: 'Valeur ajoutée maximale' },
    ]
  },
  {
    phase: 'PHASE 4', titre: 'Refinancement BRRRR', mois: 'Mois 16–17', color: 'emerald',
    taches: [
      { id: 'p4t1', label: 'Demander une évaluation bancaire', detail: '~400$ — Nouvelle valeur après réno' },
      { id: 'p4t2', label: 'Soumettre demande de refinancement à 80%', detail: 'Récupérer le capital investi' },
      { id: 'p4t3', label: 'Recevoir les fonds dans le compte', detail: '30–45 jours après approbation' },
      { id: 'p4t4', label: 'Réinvestir dans la 2e propriété', detail: 'RÉPÉTER le cycle BRRRR' },
    ]
  },
  {
    phase: 'PHASE 5', titre: 'BRRRR × 3 propriétés', mois: 'An 2–3', color: 'teal',
    taches: [
      { id: 'p5t1', label: '2ème propriété achetée et rénovée', detail: 'Même stratégie BRRRR' },
      { id: 'p5t2', label: '3ème propriété — duplex ou triplex', detail: 'Budget 500 000–650 000$' },
      { id: 'p5t3', label: 'Cashflow combiné 4 000–5 500$/mois', detail: 'Argent reste dans la compagnie' },
    ]
  },
  {
    phase: 'PHASE 6', titre: 'Immeuble à revenus', mois: 'An 4–5', color: 'blue',
    taches: [
      { id: 'p6t1', label: 'Accumuler 200 000–300 000$ de mise de fonds', detail: 'Refinancements + cotisations + cashflow' },
      { id: 'p6t2', label: 'Acheter immeuble 6–10 logements', detail: 'Prix 800 000–1 200 000$' },
      { id: 'p6t3', label: 'Cashflow 5 000–8 000$/mois net', detail: 'Automatisé avec gestionnaire si besoin' },
    ]
  },
  {
    phase: 'PHASE 7', titre: 'Première franchise', mois: 'An 5–6', color: 'yellow',
    taches: [
      { id: 'p7t1', label: 'Rencontrer 3–5 franchiseurs différents', detail: 'Jan-Pro, Kumon ou Subway recommandés' },
      { id: 'p7t2', label: 'Parler à des franchisés existants', detail: 'Comprendre la réalité du business' },
      { id: 'p7t3', label: 'Financement via BDC', detail: 'Banque de Développement du Canada' },
      { id: 'p7t4', label: 'Ouvrir FRANCHISE INC. sous la Holding', detail: 'Protection légale isolée' },
      { id: 'p7t5', label: 'Formation du franchiseur complétée', detail: '4–8 semaines' },
      { id: 'p7t6', label: 'Ouverture officielle', detail: 'Revenus 150 000–300 000$/an' },
    ]
  },
  {
    phase: 'PHASE 8', titre: 'Empire 10M$+', mois: 'An 7–10', color: 'red',
    taches: [
      { id: 'p8t1', label: '8–12 propriétés dans le portefeuille', detail: 'Valeur 8–12M$' },
      { id: 'p8t2', label: '4–5 franchises opérationnelles', detail: 'Revenus 500 000$+/an' },
      { id: 'p8t3', label: 'Cashflow 60 000–80 000$/mois', detail: '6 000–8 000$/membre/mois' },
      { id: 'p8t4', label: 'Valeur nette 1 200 000$+ par membre', detail: 'Liberté financière atteinte' },
    ]
  }
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
            'Les cotisations ne s\'arrêtent JAMAIS',
            'Terme hypothécaire toujours 1–2 ans',
            'Acheter seulement si les chiffres fonctionnent',
            'Rénover DIY = économiser 50 000$+ par propriété',
            'Garder les propriétés, ne jamais vendre',
            'Tout cashflow reste dans la compagnie jusqu\'à An 5',
            'Réunion mensuelle obligatoire pour tous',
            'CPA consulté chaque trimestre',
            'Réserve d\'urgence 15 000$ toujours en banque',
            'Décisions par vote majoritaire seulement',
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

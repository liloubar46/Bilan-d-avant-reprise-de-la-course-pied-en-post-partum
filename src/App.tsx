/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Activity, 
  ShieldCheck, 
  Wind, 
  Dna, 
  Dumbbell, 
  Footprints, 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  FileText, 
  AlertCircle,
  Clock,
  LayoutDashboard,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

interface FormData {
  // Identity & Terrain
  nom: string;
  age: string;
  delaiPostPartum: string;
  modeAccouchement: string;
  allaitement: 'Oui' | 'Non' | '';
  fatigue: number;
  poids: string;
  taille: string;
  imc: string;
  poidsAvantGrossesse: string;
  episiotomie: boolean;
  dechirureGrade: number;

  // Symptoms
  incontinenceUrinaire: boolean;
  incontinenceAnale: boolean;
  urgenceUrinaire: boolean;
  urgenceFecale: boolean;
  lourdeurPelvienne: boolean;
  dyspareunie: boolean;
  diastasisSymptome: boolean;
  douleursPelviennes: boolean;
  saignements: boolean;

  // Pelvic Floor
  cMax: number;
  cRapides: number;
  contractionSubMax: boolean;
  mmtScore: number;
  popDistance: number;
  synergieRespiratoire: 'Coordonnée' | 'Paradoxale' | '';

  // Abdominal Wall
  diastasisDetecte: boolean;
  ecartementDra: string;
  gestionPression: 'MAÎTRISÉE' | 'DÉFICIENTE' | '';

  // Muscle Strength (Testing /5)
  abducteurs: number;
  adducteurs: number;
  flechisseurs: number;
  extenseurs: number;
  rotateursLateraux: number;
  rotateursMediaux: number;

  // Resistance Tests
  elevationsMollets: number;
  pontFessier: number;
  squatUnipodal: number;
  abductionHanche: number;

  // Functional Validation (Load & Impact Management)
  testOk: {
    marcheRapide: boolean;
    equilibreUnipodal: boolean;
    squatsUnilateraux: boolean;
    joggingPlace: boolean;
    sautsPlace: boolean;
    hommeQuiCourt: boolean;
  };
  testObservations: {
    marcheRapide: string;
    equilibreUnipodal: string;
    squatsUnilateraux: string;
    joggingPlace: string;
    sautsPlace: string;
    hommeQuiCourt: string;
  };

  // Biopsychosocial
  anamneseSportive: string;
  qualiteSommeil: string;
  etatEdimbourg: number;
  etatReds: string;
  mobilisationCicatrices: string;
  vetementsSoutien: string;
}

const initialData: FormData = {
  nom: '',
  age: '',
  delaiPostPartum: '',
  modeAccouchement: 'Voie basse',
  allaitement: '',
  fatigue: 5,
  poids: '',
  taille: '',
  imc: '',
  poidsAvantGrossesse: '',
  episiotomie: false,
  dechirureGrade: 0,
  incontinenceUrinaire: false,
  incontinenceAnale: false,
  urgenceUrinaire: false,
  urgenceFecale: false,
  lourdeurPelvienne: false,
  dyspareunie: false,
  diastasisSymptome: false,
  douleursPelviennes: false,
  saignements: false,
  cMax: 0,
  cRapides: 0,
  contractionSubMax: false,
  mmtScore: 3,
  popDistance: 0.0,
  synergieRespiratoire: '',
  diastasisDetecte: false,
  ecartementDra: '',
  gestionPression: '',
  abducteurs: 5,
  adducteurs: 5,
  flechisseurs: 5,
  extenseurs: 5,
  rotateursLateraux: 5,
  rotateursMediaux: 5,
  elevationsMollets: 0,
  pontFessier: 0,
  squatUnipodal: 0,
  abductionHanche: 0,
  testOk: {
    marcheRapide: false,
    equilibreUnipodal: false,
    squatsUnilateraux: false,
    joggingPlace: false,
    sautsPlace: false,
    hommeQuiCourt: false,
  },
  testObservations: {
    marcheRapide: '',
    equilibreUnipodal: '',
    squatsUnilateraux: '',
    joggingPlace: '',
    sautsPlace: '',
    hommeQuiCourt: '',
  },
  anamneseSportive: '',
  qualiteSommeil: '',
  etatEdimbourg: 0,
  etatReds: '',
  mobilisationCicatrices: '',
  vetementsSoutien: ''
};

// --- Helper Components ---

const SectionTitle = ({ icon: Icon, children }: { icon: any, children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{children}</h2>
  </div>
);

const FormField = ({ label, children, info }: { label: string, children: React.ReactNode, info?: string }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
      {label}
      {info && <Info className="w-3 h-3 text-slate-300 cursor-help" title={info} />}
    </label>
    {children}
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [data, setData] = useState<FormData>(initialData);
  const [currentSection, setCurrentSection] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const sections = [
    { title: "Identité & Terrain", icon: User },
    { title: "Symptômes", icon: AlertCircle },
    { title: "Plancher Pelvien", icon: ShieldCheck },
    { title: "Paroi Abdominale", icon: Wind },
    { title: "Force Globale", icon: Dumbbell },
    { title: "Résistance", icon: Activity },
    { title: "Gestion Charges/Impacts", icon: Footprints },
    { title: "Biopsychosocial", icon: Brain }
  ];

  const updateField = (field: keyof FormData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const calculateIMC = useMemo(() => {
    const p = parseFloat(data.poids);
    const t = parseFloat(data.taille) / 100; // Assuming cm input
    if (p > 0 && t > 0) { 
      const imc = p / (t * t);
      return imc.toFixed(1);
    }
    return "-";
  }, [data.poids, data.taille]);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      const prompt = `En tant qu'expert en rééducation post-partum, analyse les données suivantes et propose un compte-rendu structuré (Points forts, Points de vigilance, Recommandations pour la reprise du sport). Les données sont issues d'un bilan clinique : ${JSON.stringify(data)}. Réponds en français de manière professionnelle et concise.`;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setAiAnalysis(result.text || "Erreur de génération du résumé.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Impossible de générer l'analyse pour le moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={User}>Identité & Terrain</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nom complet">
                <input 
                  type="text" 
                  value={data.nom} 
                  onChange={(e) => updateField('nom', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  placeholder="Ex: Sophie Martin"
                />
              </FormField>
              <FormField label="Âge">
                <input 
                  type="number" 
                  value={data.age} 
                  onChange={(e) => updateField('age', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </FormField>
              <FormField label="Délai Post-Partum">
                <input 
                  type="number" 
                  value={data.delaiPostPartum} 
                  onChange={(e) => updateField('delaiPostPartum', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </FormField>
              <FormField label="Mode d'accouchement">
                <select 
                  value={data.modeAccouchement} 
                  onChange={(e) => updateField('modeAccouchement', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  <option>Voie basse</option>
                  <option>Césarienne</option>
                  <option>Voie basse instrumentale</option>
                </select>
              </FormField>
              <FormField label="Allaitement">
                <div className="flex gap-4">
                  {['Oui', 'Non'].map((v) => (
                    <button
                      key={v}
                      onClick={() => updateField('allaitement', v)}
                      className={`px-4 py-2 rounded-lg border transition-all flex-1 text-sm font-medium ${data.allaitement === v ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label={`Fatigue (0-10): ${data.fatigue}`}>
                <input 
                  type="range" 
                  min="0" max="10" 
                  value={data.fatigue} 
                  onChange={(e) => updateField('fatigue', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </FormField>
              <FormField label="Poids actuel (kg)">
                <input 
                  type="number" 
                  value={data.poids} 
                  onChange={(e) => updateField('poids', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </FormField>
              <FormField label="Taille (cm)">
                <input 
                  type="number" 
                  value={data.taille} 
                  onChange={(e) => updateField('taille', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </FormField>
              <FormField label="Poids avant grossesse (kg)">
                <input 
                  type="number" 
                  value={data.poidsAvantGrossesse} 
                  onChange={(e) => updateField('poidsAvantGrossesse', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </FormField>
              <FormField label="IMC actuel">
                 <div className="w-full px-4 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                    {calculateIMC}
                 </div>
              </FormField>
            </div>
            
            <div className="pt-4 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cicatrices & Lésions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="episiotomie"
                    checked={data.episiotomie}
                    onChange={(e) => updateField('episiotomie', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="episiotomie" className="text-slate-700 font-medium text-sm">Épisiotomie</label>
                </div>
                <FormField label="Grade de déchirure">
                  <select 
                    value={data.dechirureGrade} 
                    onChange={(e) => updateField('dechirureGrade', parseInt(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                  >
                    {[0,1,2,3,4].map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </FormField>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <SectionTitle icon={AlertCircle}>Screening des Symptômes (Dépistage DFP)</SectionTitle>
            
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Incontinences & Urgences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'incontinenceUrinaire', label: 'Incontinence Urinaire' },
                  { id: 'incontinenceAnale', label: 'Incontinence Anale' },
                  { id: 'urgenceUrinaire', label: 'Urgence Urinaire' },
                  { id: 'urgenceFecale', label: 'Urgence Fécale' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateField(item.id as keyof FormData, !data[item.id as keyof FormData])}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-xs ${data[item.id as keyof FormData] ? 'bg-rose-50 border-rose-100 text-rose-600 font-bold' : 'bg-white border-slate-100 text-slate-500'}`}
                  >
                    <span>{item.label}</span>
                    {data[item.id as keyof FormData] ? <span className="uppercase text-[10px]">Signalé</span> : <span className="uppercase text-[9px] text-slate-300">Néant</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Autres manifestations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'lourdeurPelvienne', label: 'Lourdeur / Pression pelvienne' },
                  { id: 'dyspareunie', label: 'Dyspareunie' },
                  { id: 'diastasisSymptome', label: 'Faiblesse abdominale (Diastasis)' },
                  { id: 'douleursPelviennes', label: 'Douleurs pelviennes / MSQ' },
                  { id: 'saignements', label: 'Saignements (> 8 semaines)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateField(item.id as keyof FormData, !data[item.id as keyof FormData])}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-xs ${data[item.id as keyof FormData] ? 'bg-amber-50 border-amber-100 text-amber-600 font-bold' : 'bg-white border-slate-100 text-slate-500'}`}
                  >
                    <span>{item.label}</span>
                    {data[item.id as keyof FormData] ? <span className="uppercase text-[10px]">Signalé</span> : <span className="uppercase text-[9px] text-slate-300">Néant</span>}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={ShieldCheck}>Bilan du Plancher Pelvien & Respiration</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label={`Contraction Max (6-8s): ${data.cMax}`} info="Objectif : 8-12 répétitions maintenues">
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" max="30" 
                    value={data.cMax} 
                    onChange={(e) => updateField('cMax', parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 ${
                      data.cMax >= 8 ? 'accent-emerald-500' : 
                      data.cMax >= 5 ? 'accent-amber-500' : 'accent-rose-500'
                    }`}
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest px-1">
                    <span className="text-slate-400">0</span>
                    <span className={data.cMax >= 8 ? "text-emerald-500" : "text-amber-500"}>Objectif (8-12)</span>
                    <span className="text-slate-300">30+</span>
                  </div>
                </div>
              </FormField>
              <FormField label={`Contractions Rapides: ${data.cRapides}`} info="Objectif : au moins 10">
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" max="50" 
                    value={data.cRapides} 
                    onChange={(e) => updateField('cRapides', parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 ${
                      data.cRapides >= 10 ? 'accent-emerald-500' : 
                      data.cRapides >= 6 ? 'accent-amber-500' : 'accent-rose-500'
                    }`}
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest px-1">
                    <span className="text-slate-400">0</span>
                    <span className={data.cRapides >= 10 ? "text-emerald-500" : "text-amber-500"}>Objectif (10+)</span>
                    <span className="text-slate-300">50+</span>
                  </div>
                </div>
              </FormField>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100 md:col-span-2">
                <input 
                  type="checkbox" 
                  id="submax"
                  checked={data.contractionSubMax}
                  onChange={(e) => updateField('contractionSubMax', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="submax" className="text-emerald-800 font-medium text-xs">
                  Contraction sub-maximale (30-50%) Maintenue 60s
                </label>
              </div>
              <FormField label="Échelle MMT (Score / 5)" info="Seuil de sécurité ≥ 3">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateField('mmtScore', s)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm transition-all ${data.mmtScore === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'} ${s < 3 && data.mmtScore === s ? 'bg-amber-500 border-amber-500' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {data.mmtScore < 3 && <p className="text-[10px] text-amber-600 font-bold mt-1">Vigilance : Seuil de sécurité non atteint</p>}
              </FormField>
              <FormField label={`Risque de POP (GH+PB): ${data.popDistance} cm`} info="Seuil critique ≥ 7 cm">
                <div className="space-y-2">
                  <input 
                    type="range" 
                    min="0" max="12" step="0.5"
                    value={data.popDistance} 
                    onChange={(e) => updateField('popDistance', parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${data.popDistance >= 7 ? 'accent-rose-500' : 'accent-indigo-600'} bg-slate-200`}
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest px-1">
                    <span className="text-emerald-500">Normal</span>
                    <span className={data.popDistance >= 7 ? "text-rose-500" : "text-slate-300"}>Critique (7cm)</span>
                  </div>
                </div>
              </FormField>
              <FormField label="Synergie Respiratoire">
                <select 
                  value={data.synergieRespiratoire} 
                  onChange={(e) => updateField('synergieRespiratoire', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none text-sm font-medium"
                >
                  <option value="">Sélectionner</option>
                  <option>Coordonnée</option>
                  <option>Paradoxale</option>
                </select>
              </FormField>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={Wind}>Paroi Abdominale</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Diastasis (DRA)</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Écartement des grands droits</p>
                  </div>
                  <button
                    onClick={() => updateField('diastasisDetecte', !data.diastasisDetecte)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${data.diastasisDetecte ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {data.diastasisDetecte ? 'DÉTECTÉ' : 'SAIN'}
                  </button>
                </div>
                {data.diastasisDetecte && (
                  <FormField label="Mesure de l'écartement (cm)">
                    <input 
                      type="text" 
                      value={data.ecartementDra} 
                      onChange={(e) => updateField('ecartementDra', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none text-sm font-medium"
                      placeholder="Ex: 3cm sous-ombilical"
                    />
                  </FormField>
                )}
              </div>
              <FormField label="Gestion des Pressions">
                <div className="flex gap-3">
                  {['MAÎTRISÉE', 'DÉFICIENTE'].map((v) => (
                    <button
                      key={v}
                      onClick={() => updateField('gestionPression', v)}
                      className={`px-4 py-2.5 rounded-lg border text-[10px] font-bold tracking-widest transition-all flex-1 ${data.gestionPression === v ? (v === 'MAÎTRISÉE' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-rose-500 text-white border-rose-500') : 'bg-white text-slate-400 border-slate-100'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={Dumbbell}>Force Musculaire Globale</SectionTitle>
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center gap-3">
               <Info className="w-4 h-4 text-indigo-400" />
               <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest">
                Évaluation force motrice sur 5 (Testing musculaire)
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'abducteurs', label: 'Abducteurs de hanche' },
                { id: 'adducteurs', label: 'Adducteurs de hanche' },
                { id: 'flechisseurs', label: 'Fléchisseurs de hanche' },
                { id: 'extenseurs', label: 'Extenseurs / Fessiers' },
                { id: 'rotateursLateraux', label: 'Rotateurs latéraux' },
                { id: 'rotateursMediaux', label: 'Rotateurs médiaux' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-50 shadow-sm">
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                  <div className="flex gap-1">
                    {[0,1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        onClick={() => updateField(item.id as keyof FormData, s)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all ${data[item.id as keyof FormData] === s ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300 hover:text-slate-500'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={Activity}>Tests de Résistance</SectionTitle>
            <div className="bg-slate-900 p-4 rounded-xl mb-6">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest text-center">Objectif : 20 répétitions propres (Unipodal)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'elevationsMollets', label: 'Mollets' },
                { id: 'pontFessier', label: 'Pont fessier' },
                { id: 'squatUnipodal', label: 'Squat' },
                { id: 'abductionHanche', label: 'Abduction' }
              ].map((item) => (
                <div key={item.id}>
                  <FormField label={item.label}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={data[item.id as keyof FormData]} 
                        onChange={(e) => updateField(item.id as keyof FormData, parseInt(e.target.value))}
                        className="w-16 px-3 py-1.5 rounded-lg border border-slate-100 outline-none text-sm font-bold text-indigo-600 bg-slate-50"
                      />
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((data[item.id as keyof FormData] as number / 20) * 100, 100)}%` }}
                          className={`h-full ${(data[item.id as keyof FormData] as number) >= 20 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                      {(data[item.id as keyof FormData] as number) >= 20 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </FormField>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={Footprints}>Évaluation de la gestion des charges et des impacts</SectionTitle>
            <div className="grid grid-cols-1 gap-6">
              {[
                { id: 'marcheRapide', label: 'Marche rapide (30 min)' },
                { id: 'equilibreUnipodal', label: 'Équilibre unipodal (10 s)' },
                { id: 'squatsUnilateraux', label: 'Squats unilatéraux (10 rep)' },
                { id: 'joggingPlace', label: 'Jogging sur place (1 min)' },
                { id: 'sautsPlace', label: 'Sauts sur place (10 rep / jambe)' },
                { id: 'hommeQuiCourt', label: 'Exercice « homme qui court »' }
              ].map((item) => (
                <div key={item.id} className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">{item.label}</h3>
                    <button
                      onClick={() => setData(prev => ({
                        ...prev,
                        testOk: { ...prev.testOk, [item.id]: !prev.testOk[item.id as keyof typeof prev.testOk] }
                      }))}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${data.testOk[item.id as keyof typeof data.testOk] ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {data.testOk[item.id as keyof typeof data.testOk] ? 'VALIDE' : 'À TESTER'}
                    </button>
                  </div>
                  <textarea 
                    value={data.testObservations[item.id as keyof typeof data.testObservations]} 
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      testObservations: { ...prev.testObservations, [item.id]: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px] text-sm bg-slate-50/50"
                    placeholder="Observations cliniques (ex: durée réelle, douleurs, fuites...)"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <SectionTitle icon={Brain}>Facteurs Biopsychosociaux</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Condition physique générale (Anamnèse)">
                <textarea 
                  value={data.anamneseSportive} 
                  onChange={(e) => updateField('anamneseSportive', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[100px]"
                />
              </FormField>
              <FormField label="Qualité du sommeil (Ressenti)">
                <textarea 
                  value={data.qualiteSommeil} 
                  onChange={(e) => updateField('qualiteSommeil', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[100px]"
                />
              </FormField>
              <FormField label={`État psychologique (Édimbourg): ${data.etatEdimbourg}`}>
                <div className="space-y-3">
                  <input 
                    type="range" 
                    min="0" max="30" 
                    value={data.etatEdimbourg} 
                    onChange={(e) => updateField('etatEdimbourg', parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      data.etatEdimbourg >= 13 ? 'accent-rose-500' : 
                      data.etatEdimbourg >= 10 ? 'accent-amber-500' : 'accent-emerald-500'
                    } bg-slate-200`}
                  />
                  <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                    {data.etatEdimbourg >= 13 ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Seuil critique / suspicion
                      </span>
                    ) : data.etatEdimbourg >= 10 ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Vigilance
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> RAS / Faible probabilité
                      </span>
                    )}
                    <span className="text-slate-400 font-mono">{data.etatEdimbourg} / 30</span>
                  </div>
                </div>
              </FormField>
              <FormField label="État RED-S (Relativ Energy Deficiency)">
                <input 
                  type="text" 
                  value={data.etatReds} 
                  onChange={(e) => updateField('etatReds', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </FormField>
              <FormField label="Mobilisation des cicatrices">
                <input 
                  type="text" 
                  value={data.mobilisationCicatrices} 
                  onChange={(e) => updateField('mobilisationCicatrices', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </FormField>
              <FormField label="Vêtements de soutien">
                <input 
                  type="text" 
                  value={data.vetementsSoutien} 
                  onChange={(e) => updateField('vetementsSoutien', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200"
                />
              </FormField>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center gap-6">
              <button
                onClick={generateSummary}
                disabled={isGenerating}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                   <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Générer l'Analyse Clinique
              </button>

              {aiAnalysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner"
                >
                  <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
                    <Brain className="w-3.5 h-3.5" />
                    Interprétation IA
                  </div>
                  <div className="prose prose-slate prose-xs max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
                    {aiAnalysis}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 flex items-center px-8 justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
             <Stethoscope className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Bilan Clinique</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              ÉVALUATION POST-PARTUM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
              <FileText className="w-4 h-4" />
              Exporter PDF
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all">
              <Save className="w-4 h-4" />
              Enregistrer
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto pt-28 px-4 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 space-y-1.5 hidden md:block">
          <div className="px-4 mb-4">
            <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Navigation</h3>
          </div>
          {sections.map((section, idx) => (
            <button
              key={section.title}
              onClick={() => setCurrentSection(idx)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${currentSection === idx ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <section.icon className={`w-4 h-4 ${currentSection === idx ? 'text-indigo-500' : 'text-slate-300 group-hover:text-slate-400'}`} />
              <span className="font-bold text-[11px] uppercase tracking-wider">{section.title}</span>
              {currentSection === idx && <motion.div layoutId="activeDot" className="w-1 h-1 rounded-full bg-indigo-500 ml-auto" />}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="min-h-[600px] flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {renderSection()}
              </AnimatePresence>
            </div>

            {/* Footer Navigation Buttons */}
            <div className="mt-12 flex justify-between pt-6 border-t border-slate-100">
               <button
                  disabled={currentSection === 0}
                  onClick={() => setCurrentSection(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-30"
               >
                  <ChevronLeft className="w-5 h-5" />
                  Précédent
               </button>
               
               <div className="flex items-center gap-1.5">
                  {sections.map((_, idx) => (
                    <div key={idx} className={`w-1 h-1 rounded-full transition-all ${currentSection === idx ? 'bg-indigo-500 w-3' : 'bg-slate-200'}`} />
                  ))}
               </div>

               <button
                  disabled={currentSection === sections.length - 1}
                  onClick={() => setCurrentSection(s => s + 1)}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-900 border border-slate-800 text-white text-[11px] uppercase tracking-widest font-bold rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all disabled:opacity-30"
               >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </Card>
        </div>
      </main>

      {/* Mobile Modal-like Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-50 overflow-x-auto shadow-2xl">
        <div className="flex gap-4">
          {sections.map((section, idx) => (
            <button
              key={section.title}
              onClick={() => setCurrentSection(idx)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[70px] ${currentSection === idx ? 'text-indigo-600' : 'text-slate-300'}`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full text-center">{section.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

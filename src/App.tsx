import React, { useState } from 'react';
import { 
  FlaskConical, 
  ShieldAlert, 
  Search, 
  Activity, 
  Thermometer, 
  Droplets, 
  Layers, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Loader2,
  FileText,
  Wind,
  Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeChemical, ChemicalAnalysis, getChemicalSuggestions } from './services/geminiService';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PropertyRow = ({ label, value, icon: Icon, delay = 0 }: { label: string; value: string; icon: any; delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex items-start gap-4 p-4 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
  >
    <div className="mt-0.5 p-2 rounded-lg bg-zinc-100 text-zinc-600">
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-zinc-900 break-words">{value || "Not available"}</p>
    </div>
  </motion.div>
);

const ToxicityBadge = ({ level }: { level: ChemicalAnalysis['toxicityLevel'] }) => {
  const colors = {
    "Low": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Moderate": "bg-amber-100 text-amber-700 border-amber-200",
    "High": "bg-orange-100 text-orange-700 border-orange-200",
    "Very High": "bg-red-100 text-red-700 border-red-200",
  };
  
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-tighter", colors[level])}>
      {level}
    </span>
  );
};

export default function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChemicalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Suggestions logic
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2 && !loading) {
        const list = await getChemicalSuggestions(query);
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (e?: React.FormEvent, selectedName?: string) => {
    if (e) e.preventDefault();
    const nameToSearch = selectedName || query;
    if (!nameToSearch.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);
    
    try {
      const data = await analyzeChemical(nameToSearch);
      if (data) {
        setResult(data);
        setQuery(data.chemicalName);
      } else {
        setError(`No chemical found with the name "${nameToSearch}". Please check the spelling or try a different name.`);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while analyzing the chemical. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
              <FlaskConical size={20} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">ChemSafe <span className="text-zinc-400 font-medium">Analyzer</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldAlert size={14} /> Safety First</span>
            <span className="flex items-center gap-1.5"><Info size={14} /> Expert Data</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Search Section */}
        <section className="max-w-2xl mx-auto mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">Chemical Analysis & Safety</h2>
            <p className="text-zinc-500 mb-8 text-lg">Enter a chemical name to receive a comprehensive material safety data sheet and toxicity analysis.</p>
            
            <div className="relative group">
              <form onSubmit={(e) => handleSearch(e)} className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.length >= 2 && setShowSuggestions(suggestions.length > 0)}
                  placeholder="e.g. Sodium Cyanide, Benzene, Ethanol..."
                  className="w-full h-14 pl-12 pr-32 rounded-2xl border border-zinc-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-lg"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Analyze"}
                  {!loading && <ChevronRight size={18} />}
                </button>
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden text-left"
                  >
                    {suggestions.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(name);
                          handleSearch(undefined, name);
                        }}
                        className="w-full px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-3 transition-colors border-b border-zinc-50 last:border-0"
                      >
                        <FlaskConical size={14} className="text-zinc-400" />
                        {name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center gap-3 mb-8"
            >
              <AlertTriangle size={20} />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-zinc-100 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-t-zinc-900 rounded-full absolute top-0 animate-spin"></div>
              </div>
              <p className="text-zinc-500 font-medium animate-pulse">Consulting material science database...</p>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Data Table */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                      <FileText size={18} className="text-zinc-400" />
                      Chemical Specifications
                    </h3>
                    <div className="text-xs font-mono text-zinc-400 bg-white px-2 py-1 rounded border border-zinc-100">
                      ID: {result.chemicalName.toUpperCase().replace(/\s+/g, '_')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <PropertyRow label="Chemical Name" value={result.chemicalName} icon={FlaskConical} delay={0.05} />
                    <PropertyRow label="Molecular Formula" value={result.molecularFormula} icon={Activity} delay={0.1} />
                    <PropertyRow label="Molar Mass" value={result.molarMass} icon={Layers} delay={0.15} />
                    <PropertyRow label="Physical State (25°C)" value={result.physicalState} icon={Wind} delay={0.2} />
                    <PropertyRow label="Solubility in Water" value={result.solubility} icon={Droplets} delay={0.25} />
                    <PropertyRow label="Melting Point" value={result.meltingPoint} icon={Thermometer} delay={0.3} />
                    <PropertyRow label="Boiling Point" value={result.boilingPoint} icon={Thermometer} delay={0.35} />
                    <PropertyRow label="Density" value={result.density} icon={Layers} delay={0.4} />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 space-y-8">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity size={16} /> Properties & Reactivity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Chemical Properties</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result.chemicalProperties}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Reactivity & Stability</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result.reactivityStability}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  <div>
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldAlert size={16} /> Hazards & Safety
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Health Hazards</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result.healthHazards}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Environmental Hazards</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result.environmentalHazards}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Safety Precautions</p>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result.safetyPrecautions}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">GHS Classification</p>
                        <p className="text-sm text-zinc-600 leading-relaxed font-mono bg-zinc-50 p-2 rounded border border-zinc-100">{result.ghsClassification}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Toxicity & Summary */}
              <div className="space-y-8">
                <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-xl shadow-zinc-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Skull size={120} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-xl">Toxicity Profile</h3>
                      <ToxicityBadge level={result.toxicityLevel} />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Toxicity Data</p>
                        <p className="text-sm font-medium leading-relaxed">{result.toxicityData}</p>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Why this level?</p>
                        <p className="text-sm text-zinc-300 leading-relaxed italic">"{result.toxicityExplanation}"</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <AlertTriangle size={14} className="text-amber-400" /> Primary Human Risk
                        </p>
                        <p className="text-sm font-semibold text-white leading-relaxed">{result.mainHumanRisk}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Info size={18} className="text-zinc-400" />
                    Common Uses
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {result.commonUses}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 flex flex-col items-center text-center">
              <ShieldAlert size={32} className="mb-4" />
              <h4 className="font-bold text-sm mb-1">Safety Protocols</h4>
              <p className="text-xs">Standardized safety data for lab environments.</p>
            </div>
            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 flex flex-col items-center text-center">
              <Activity size={32} className="mb-4" />
              <h4 className="font-bold text-sm mb-1">Material Science</h4>
              <p className="text-xs">Physical and chemical property analysis.</p>
            </div>
            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 flex flex-col items-center text-center">
              <Skull size={32} className="mb-4" />
              <h4 className="font-bold text-sm mb-1">Toxicity Mapping</h4>
              <p className="text-xs">Detailed human and environmental risk profiling.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

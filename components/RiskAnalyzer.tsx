import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { RiskAnalysisResult, Classification } from '../types';
import { ShieldAlert, FileText, CheckCircle, AlertTriangle, Lock, BookOpen } from 'lucide-react';

const RiskAnalyzer: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);

  const handleScan = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    const data = await GeminiService.analyzeRisk(inputText);
    setResult(data);
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 70) return 'text-yellow-400';
    return 'text-red-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Input Section */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-400" />
          Ad-Hoc Risk Scanner
        </h2>
        <p className="text-slate-400 mb-4 text-sm">
          Paste content or drag & drop files to instantly detect PII, sensitivity, and ISO 27002 compliance gaps.
        </p>
        <textarea
          className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
          placeholder="Paste text here to analyze..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleScan}
            disabled={loading || !inputText}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              loading || !inputText
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {loading ? 'Scanning...' : 'Analyze Risk'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
        {!result && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 flex-col">
            <Lock className="w-16 h-16 mb-4 opacity-20" />
            <p>Ready to analyze content</p>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in h-full overflow-y-auto pr-2">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Governance Score</h3>
                <p className="text-xs text-slate-400">0 = Safe, 100 = Critical Risk</p>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Classification</span>
                <div className="mt-1 flex items-center gap-2">
                    {result.classification === Classification.Public && <CheckCircle className="w-4 h-4 text-green-500"/>}
                    {result.classification === Classification.Restricted && <AlertTriangle className="w-4 h-4 text-red-500"/>}
                    <span className="text-lg font-medium text-white">{result.classification}</span>
                </div>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-xs uppercase tracking-wider">PII Detected</span>
                <div className="mt-1 text-lg font-medium text-white">
                    {result.pii_detected.length > 0 ? result.pii_detected.length : 'None'}
                </div>
              </div>
            </div>

            {/* ISO 27002 Controls Section */}
            {result.iso_controls && result.iso_controls.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                    <h4 className="text-blue-300 text-sm font-semibold mb-2 flex items-center gap-2">
                        <BookOpen size={14} /> Relevant ISO 27002 Controls
                    </h4>
                    <ul className="space-y-1">
                        {result.iso_controls.map((control, idx) => (
                            <li key={idx} className="text-xs text-blue-200 flex items-start gap-2">
                                <span className="mt-1 w-1 h-1 bg-blue-400 rounded-full"></span>
                                {control}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {result.pii_detected.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                    <h4 className="text-red-400 text-sm font-semibold mb-2">Sensitive Entities Found</h4>
                    <div className="flex flex-wrap gap-2">
                        {result.pii_detected.map((pii, idx) => (
                            <span key={idx} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded">
                                {pii}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h4 className="text-slate-300 text-sm font-semibold mb-2">AI Reasoning</h4>
                <p className="text-slate-400 text-sm leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-700/50">
                    {result.reasoning}
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAnalyzer;
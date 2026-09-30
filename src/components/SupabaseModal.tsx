import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection, getSqlSetupScript } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
  isCurrentlyConnected: boolean;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  isCurrentlyConnected,
}) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, preencha tanto a URL do Supabase quanto a Anon Public Key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      saveSupabaseCredentials(url.trim(), anonKey.trim());
      onConnected();
    }
  };

  const handleClear = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Configurações do Supabase removidas. O sistema continuará em modo local.',
    });
    onConnected();
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(getSqlSetupScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Banco de Dados Supabase</h3>
              <p className="text-xs text-slate-400">
                Conecte seu banco de dados na nuvem para sincronização em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Conexão & Credenciais
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-medium border-b-2 cursor-pointer transition-colors ${
              activeTab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Script SQL das Tabelas
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'config' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-slate-100">
                  <span className={`w-2.5 h-2.5 rounded-full ${isCurrentlyConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  Status Atual: {isCurrentlyConnected ? 'Conectado ao Supabase na nuvem' : 'Modo Local (Offline)'}
                </div>
                <p className="text-slate-400">
                  Os dados são salvos localmente enquanto você configura o Supabase. Ao conectar, eles serão lidos e gravados nas tabelas PostgreSQL do seu projeto.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://seu-projeto.supabase.co"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Encontrado em: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supabase Anon (Public) Key
                </label>
                <input
                  type="password"
                  required
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Encontrado em: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon/public)
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-rose-400 underline cursor-pointer"
                >
                  Restaurar Modo Local
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testando Conexão...' : 'Conectar e Salvar'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Execute este código no <strong>SQL Editor</strong> do seu Supabase para criar as tabelas <code className="text-emerald-400">categorias</code> e <code className="text-emerald-400">itens_estoque</code>:
                </span>
                <button
                  onClick={copySqlToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                {getSqlSetupScript()}
              </pre>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Passo a passo: Dashboard &gt; SQL Editor &gt; Novo Query &gt; Colar &gt; Run</span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <span>Abrir Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

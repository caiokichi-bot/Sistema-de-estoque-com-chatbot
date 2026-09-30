import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Key, 
  Settings, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  RefreshCcw, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { EstoqueItem, Categoria, ChatMessage } from '../types';
import { 
  getGroqSettings, 
  saveGroqSettings, 
  AVAILABLE_GROQ_MODELS, 
  fetchLiveGroqModels,
  testGroqConnection, 
  askGroqChatbot 
} from '../lib/groq';

interface FloatingChatbotProps {
  items: EstoqueItem[];
  categories: Categoria[];
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ items, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [groqSettings, setGroqSettingsState] = useState(getGroqSettings());
  
  // Settings form states
  const [apiKeyInput, setApiKeyInput] = useState(groqSettings.apiKey);
  const [selectedModel, setSelectedModel] = useState(
    groqSettings.model === 'llama-3.3-70b-versatile' ? 'llama-3.1-8b-instant' : groqSettings.model
  );
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>(AVAILABLE_GROQ_MODELS);
  const [keyValidation, setKeyValidation] = useState<{ success: boolean; message: string } | null>(null);
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  // Chat states
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-initial',
        role: 'assistant',
        content: `Olá! Sou o **StockBot Groq**, seu agente de inteligência artificial para o estoque.\n\nEstou conectado aos seus dados em tempo real e pronto para tirar dúvidas sobre quantidades, itens acabando, valores ou sugestões de reposição. O que você gostaria de saber?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Carregar lista de modelos ao abrir configurações se tiver chave
  useEffect(() => {
    if (showSettings && apiKeyInput && apiKeyInput.startsWith('gsk_')) {
      fetchLiveGroqModels(apiKeyInput).then((models) => {
        if (models && models.length > 0) {
          setAvailableModels(models);
        }
      });
    }
  }, [showSettings, apiKeyInput]);

  // Checar se a chave está configurada
  const hasApiKey = Boolean(groqSettings.apiKey && groqSettings.apiKey.startsWith('gsk_'));

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      saveGroqSettings('', selectedModel);
      setGroqSettingsState(getGroqSettings());
      setKeyValidation({ success: false, message: 'Chave removida. O chatbot requer uma chave Groq.' });
      return;
    }

    setIsValidatingKey(true);
    setKeyValidation(null);

    const test = await testGroqConnection(apiKeyInput.trim(), selectedModel);
    setIsValidatingKey(false);
    setKeyValidation(test);

    if (test.success) {
      saveGroqSettings(apiKeyInput.trim(), selectedModel);
      setGroqSettingsState(getGroqSettings());
      // Buscar modelos ativos desta conta
      const live = await fetchLiveGroqModels(apiKeyInput.trim());
      setAvailableModels(live);
      setTimeout(() => setShowSettings(false), 800);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || isLoading) return;

    if (!hasApiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { reply, usedModel } = await askGroqChatbot({
        messages: chatHistory,
        items,
        categories,
      });

      // Sincronizar caso o modelo tenha sido auto-ajustado por fallback
      const currentSettings = getGroqSettings();
      setGroqSettingsState({ ...currentSettings, model: usedModel });
      setSelectedModel(usedModel);

      const botMessage: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      let errorMessage = 'Não foi possível consultar a API Groq. ';
      if (err.message === 'CONFIG_KEY_REQUIRED') {
        errorMessage = 'Por favor, insira sua chave da API Groq nas configurações para conversar.';
        setShowSettings(true);
      } else {
        errorMessage += err.message || 'Verifique sua conexão e chave de API.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Aviso:** ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    '⚠️ Quais itens estão acabando ou com estoque baixo?',
    '💰 Qual o valor total do nosso inventário?',
    '📦 Resumo dos itens da categoria Eletrônicos',
    '🛒 O que precisamos pedir de reposição urgente?',
  ];

  return (
    <>
      {/* Botão Flutuante (Floating Trigger) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 cursor-pointer group ${
            isOpen
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95'
          }`}
          title="Abrir Chatbot do Estoque (Groq AI)"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            {!hasApiKey && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-slate-900" />
            )}
            {hasApiKey && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            )}
          </div>
          <span className="text-xs tracking-tight">
            {isOpen ? 'Fechar Assistente' : 'Assistente Groq AI'}
          </span>
        </button>
      </div>

      {/* Painel do Chatbot Flutuante */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[440px] h-[580px] max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header do Chat */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-xs text-white">StockBot Groq</h3>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                    {(groqSettings.model || 'Groq AI').replace('-versatile', '').replace('-instant', '')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Sincronizado: {items.length} itens do estoque</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  showSettings ? 'bg-slate-800 text-orange-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Configurar chave Groq e Modelo"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: 'msg-reset',
                      role: 'assistant',
                      content: 'Conversa reiniciada. Como posso ajudar com seu estoque?',
                      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                title="Limpar histórico"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer de Configurações da Groq */}
          {showSettings && (
            <div className="bg-slate-950/95 border-b border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-400" /> Configuração da API Groq
                </span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-orange-400 hover:underline"
                >
                  Obter chave grátis &rarr;
                </a>
              </div>

              {keyValidation && (
                <div
                  className={`p-2 rounded text-[11px] flex items-start gap-1.5 ${
                    keyValidation.success
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {keyValidation.success ? <Check className="w-3 h-3 shrink-0 mt-0.5" /> : <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />}
                  <span>{keyValidation.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Chave de API (gsk_...)
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500/60 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Modelo Groq
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    {availableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={isValidatingKey}
                    className="px-3 py-1 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-slate-950 font-semibold rounded transition-colors cursor-pointer"
                  >
                    {isValidatingKey ? 'Validando...' : 'Salvar Chave'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Aviso se a chave não estiver configurada */}
          {!hasApiKey && !showSettings && (
            <div className="bg-orange-950/40 border-b border-orange-800/40 px-4 py-2.5 flex items-center justify-between text-xs text-orange-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Insira sua chave Groq para ativar respostas da IA.</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-medium rounded text-[11px] shrink-0 cursor-pointer"
              >
                Configurar
              </button>
            </div>
          )}

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isBot = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                      isBot
                        ? 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/60 shadow-xs'
                        : 'bg-emerald-500 text-slate-950 font-medium rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 w-fit">
                <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
                <span className="text-xs">Groq AI pensando...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas de Perguntas */}
          {messages.length <= 3 && (
            <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto scrollbar-none">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white rounded-full text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input de Mensagem */}
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={hasApiKey ? 'Pergunte sobre produtos, estoque baixo, valores...' : 'Configure a chave da Groq acima...'}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 active:bg-emerald-500 text-slate-950 rounded-xl transition-colors cursor-pointer shadow-xs"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

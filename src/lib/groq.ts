import { EstoqueItem, Categoria, GroqSettings } from '../types';

const STORAGE_KEYS = {
  GROQ_API_KEY: 'stockmaster_groq_api_key',
  GROQ_MODEL: 'stockmaster_groq_model',
};

// Modelos conhecidos da Groq como base inicial
export const DEFAULT_GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B (8192)' },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B (8192)' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
  { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B' },
  { id: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B Preview' },
  { id: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B Preview' },
];

export const AVAILABLE_GROQ_MODELS = DEFAULT_GROQ_MODELS;

let memoryCachedModels: string[] | null = null;

export function getGroqSettings(): GroqSettings {
  const envKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
  const storedKey = localStorage.getItem(STORAGE_KEYS.GROQ_API_KEY) || '';
  const storedModel = localStorage.getItem(STORAGE_KEYS.GROQ_MODEL) || '';

  return {
    apiKey: storedKey || envKey,
    model: storedModel,
    temperature: 0.3,
  };
}

export function saveGroqSettings(apiKey: string, model: string) {
  if (apiKey.trim()) {
    localStorage.setItem(STORAGE_KEYS.GROQ_API_KEY, apiKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.GROQ_API_KEY);
  }

  if (model.trim()) {
    localStorage.setItem(STORAGE_KEYS.GROQ_MODEL, model.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.GROQ_MODEL);
  }
}

/**
 * Consulta a API da Groq em tempo real (/openai/v1/models) para obter os modelos
 * que a chave do usuário realmente tem permissão de usar.
 */
export async function fetchLiveGroqModels(apiKey: string): Promise<{ id: string; name: string }[]> {
  if (!apiKey || !apiKey.startsWith('gsk_')) return DEFAULT_GROQ_MODELS;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.data)) {
        // Filtrar apenas modelos de chat utilizáveis (exclui whisper/áudio e guardrails)
        const models = data.data
          .map((m: any) => m.id as string)
          .filter((id: string) => !id.includes('whisper') && !id.includes('guard') && !id.includes('vision'))
          .map((id: string) => ({ id, name: id }));

        if (models.length > 0) {
          memoryCachedModels = models.map((m: { id: string; name: string }) => m.id);
          return models;
        }
      }
    }
  } catch (e) {
    console.warn('Não foi possível obter lista dinâmica de modelos da Groq:', e);
  }

  return DEFAULT_GROQ_MODELS;
}

export async function testGroqConnection(apiKey: string, requestedModel?: string): Promise<{ success: boolean; message: string; activeModel?: string }> {
  if (!apiKey || !apiKey.startsWith('gsk_')) {
    return {
      success: false,
      message: 'A chave da API Groq deve começar com "gsk_". Obtenha gratuitamente em console.groq.com/keys',
    };
  }

  // 1. Obter modelos reais da conta
  const liveModels = await fetchLiveGroqModels(apiKey);
  const candidateModels: string[] = [];

  if (requestedModel) candidateModels.push(requestedModel);
  liveModels.forEach((m) => {
    if (!candidateModels.includes(m.id)) candidateModels.push(m.id);
  });
  DEFAULT_GROQ_MODELS.forEach((m) => {
    if (!candidateModels.includes(m.id)) candidateModels.push(m.id);
  });

  // 2. Testar o primeiro modelo que responder OK
  for (const modelToTest of candidateModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToTest,
          messages: [{ role: 'user', content: 'Responda apenas: OK' }],
          max_tokens: 5,
        }),
      });

      if (response.ok) {
        saveGroqSettings(apiKey, modelToTest);
        return { 
          success: true, 
          message: `Conexão bem sucedida com o modelo "${modelToTest}"!`,
          activeModel: modelToTest,
        };
      }
    } catch {
      // continua para o próximo candidato
    }
  }

  return {
    success: false,
    message: 'A chave foi aceita mas nenhum modelo de chat respondeu. Verifique se a chave em console.groq.com possui limites ativos.',
  };
}

export function buildSystemPrompt(items: EstoqueItem[], categories: Categoria[]): string {
  const totalItems = items.length;
  const totalValue = items.reduce((acc, item) => acc + item.quantidade * item.preco, 0);
  const lowStockItems = items.filter((item) => item.quantidade <= item.estoque_minimo && item.quantidade > 0);
  const zeroStockItems = items.filter((item) => item.quantidade === 0);

  const formattedItems = items.map((i) => {
    const status = i.quantidade === 0 ? 'ZERADO' : i.quantidade <= i.estoque_minimo ? 'BAIXO' : 'OK';
    const totalItemValue = (i.quantidade * i.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const unitPrice = i.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return `- ${i.nome} | Categoria: ${i.categoria} | Qtd: ${i.quantidade} ${i.unidade} (Mín: ${i.estoque_minimo}) | Preço Un: ${unitPrice} | Total: ${totalItemValue} | Status: [${status}]${i.sku ? ` | SKU: ${i.sku}` : ''}${i.observacoes ? ` | Obs: ${i.observacoes}` : ''}`;
  }).join('\n');

  const categoriesList = categories.map((c) => c.nome).join(', ');

  return `Você é o "StockBot Groq", o agente inteligente de gestão de estoque do StockMaster.
Seu objetivo é responder dúvidas do usuário com precisão cirúrgica sobre os produtos, categorias, quantidades, valores e reposição de estoque.

INFORMAÇÕES ATUAIS DO ESTOQUE (DADOS EM TEMPO REAL):
- Quantidade total de tipos de itens cadastrados: ${totalItems}
- Valor total avaliado em estoque: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
- Itens com estoque baixo (alerta de reposição): ${lowStockItems.length} (${lowStockItems.map((i) => i.nome).join(', ') || 'Nenhum'})
- Itens com estoque esgotado/zerado: ${zeroStockItems.length} (${zeroStockItems.map((i) => i.nome).join(', ') || 'Nenhum'})
- Categorias disponíveis: ${categoriesList}

LISTA COMPLETA DOS PRODUTOS NO ESTOQUE:
${formattedItems || 'Nenhum produto cadastrado no momento.'}

DIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil com tom profissional, prestativo e direto.
2. Quando o usuário perguntar sobre um produto específico, informe imediatamente a quantidade disponível, se está abaixo do mínimo, o preço unitário e a categoria.
3. Se perguntar sobre itens acabando ou compras necessárias, destaque com clareza os itens zerados e os com estoque baixo, calculando a sugestão de reposição (ao menos para atingir o estoque mínimo).
4. Se perguntar sobre uma categoria, liste apenas os itens pertencentes a ela e a soma dos itens/valores.
5. Use formatação Markdown elegante (negrito, listas e tabelas se conveniente) para facilitar a leitura rápida.
6. Nunca invente produtos que não constem na lista do estoque acima. Se o produto não existir, informe educadamente que ele não está cadastrado e sugira cadastrá-lo.`;
}

async function executeGroqChat(apiKey: string, model: string, payloadMessages: any[]): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: payloadMessages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error?.message || `Erro HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('Nenhuma resposta retornada pela API da Groq.');
  }

  return reply;
}

export async function askGroqChatbot({
  messages,
  items,
  categories,
}: {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  items: EstoqueItem[];
  categories: Categoria[];
}): Promise<{ reply: string; usedModel: string }> {
  const settings = getGroqSettings();

  if (!settings.apiKey) {
    throw new Error('CONFIG_KEY_REQUIRED');
  }

  const systemMessage = {
    role: 'system',
    content: buildSystemPrompt(items, categories),
  };

  const payloadMessages = [systemMessage, ...messages.slice(-10)];

  // Obter lista dinâmica de modelos disponíveis na conta do usuário
  let liveModels = memoryCachedModels;
  if (!liveModels || liveModels.length === 0) {
    const fetched = await fetchLiveGroqModels(settings.apiKey);
    liveModels = fetched.map((m) => m.id);
  }

  // Montar lista de prioridade de modelos para tentar
  const modelsToTry: string[] = [];
  if (settings.model) modelsToTry.push(settings.model);
  liveModels.forEach((m) => {
    if (!modelsToTry.includes(m)) modelsToTry.push(m);
  });
  DEFAULT_GROQ_MODELS.forEach((m) => {
    if (!modelsToTry.includes(m.id)) modelsToTry.push(m.id);
  });

  let lastErrorMsg = '';

  for (const modelCandidate of modelsToTry) {
    try {
      const reply = await executeGroqChat(settings.apiKey, modelCandidate, payloadMessages);
      // Salva o modelo que teve sucesso para que as próximas chamadas sejam diretas e instantâneas
      if (modelCandidate !== settings.model) {
        saveGroqSettings(settings.apiKey, modelCandidate);
      }
      return { reply, usedModel: modelCandidate };
    } catch (err: any) {
      lastErrorMsg = err?.message || '';
      console.warn(`Tentativa com modelo Groq '${modelCandidate}' falhou: ${lastErrorMsg}`);
      // Se não for erro de modelo inexistente (ex: erro de chave inválida ou cota zerada), não adianta tentar outros
      if (lastErrorMsg.includes('Invalid API Key') || lastErrorMsg.includes('quota') || lastErrorMsg.includes('Unauthorized')) {
        throw err;
      }
    }
  }

  throw new Error(`Nenhum dos modelos disponíveis na sua conta Groq respondeu. Erro retornado: ${lastErrorMsg}`);
}

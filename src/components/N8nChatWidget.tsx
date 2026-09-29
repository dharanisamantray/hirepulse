import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Minimize2,
  Maximize2,
  Bot,
  User,
  LayoutTemplate,
} from 'lucide-react';

const N8N_WEBHOOK_URL =
  'https://dharanisamantray.app.n8n.cloud/webhook/3e197a3c-17cb-44b0-8331-97fb48db03c4/chat';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Which internships are available?',
  'What is the highest paying job?',
  'Show me 100% Remote roles',
  'Jobs matching React & TypeScript',
];

function createSessionId(): string {
  const existing = sessionStorage.getItem('hirepulse_n8n_session_id');
  if (existing) return existing;
  const generated =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem('hirepulse_n8n_session_id', generated);
  return generated;
}

function parseN8nResponseText(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return 'Received an empty response from the assistant.';
  }

  // 1. Try parsing as standard JSON object or array
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') return parsed;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0];
      return (
        first?.output ||
        first?.text ||
        first?.response ||
        first?.message ||
        first?.content ||
        JSON.stringify(first)
      );
    }
    if (parsed && typeof parsed === 'object') {
      return (
        parsed.output ||
        parsed.text ||
        parsed.response ||
        parsed.message ||
        parsed.content ||
        parsed.data ||
        JSON.stringify(parsed)
      );
    }
  } catch {
    // 2. Handle n8n streaming NDJSON format (e.g. {"type":"item","content":"..."})
    const lines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 1) {
      let combinedContent = '';
      let matchedNdjson = false;
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if (item && typeof item === 'object') {
            if (typeof item.content === 'string') {
              combinedContent += item.content;
              matchedNdjson = true;
            } else if (typeof item.output === 'string') {
              combinedContent += item.output;
              matchedNdjson = true;
            } else if (typeof item.text === 'string') {
              combinedContent += item.text;
              matchedNdjson = true;
            }
          }
        } catch {
          // ignore non-JSON line
        }
      }
      if (matchedNdjson && combinedContent.trim()) {
        return combinedContent.trim();
      }
    }
  }

  return trimmed;
}

export const N8nChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'native' | 'iframe'>('native');
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Hi! I am the HirePulse AI Assistant powered by n8n. Ask me about open full-time roles, summer internships, salaries, or skill requirements!',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && viewMode === 'native') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading, viewMode]);

  const handleResetSession = () => {
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('hirepulse_n8n_session_id', newId);
    setSessionId(newId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          'Started a fresh conversation! How can I help you explore jobs or internships on HirePulse?',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}?action=sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId,
          chatInput: trimmed,
        }),
      });

      const rawText = await response.text();
      if (!response.ok) {
        throw new Error(
          `Webhook returned status ${response.status}: ${rawText.slice(0, 140)}`
        );
      }

      const replyContent = parseN8nResponseText(rawText);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : 'Could not reach the n8n chat webhook.';
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Connection notice: ${errMsg}. Make sure your n8n workflow is Active (or click the "Hosted View" icon in the chat header if using n8n Hosted Chat).`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-4 pr-5 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl border border-blue-500 transition-all cursor-pointer group"
          aria-label="Open HirePulse AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight">
            Ask Career AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-[540px] h-[82vh] rounded-2xl'
              : 'bottom-5 right-5 w-[calc(100vw-2.5rem)] sm:w-[400px] h-[580px] max-h-[84vh] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold font-display truncate">
                    HirePulse Career Agent
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Powered by n8n AI Workflow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setViewMode(viewMode === 'native' ? 'iframe' : 'native')
                }
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'iframe'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={
                  viewMode === 'native'
                    ? 'Switch to n8n Hosted Embed View'
                    : 'Switch to Native Chat UI'
                }
              >
                <LayoutTemplate className="w-4 h-4" />
              </button>

              {viewMode === 'native' && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Reset Conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={isExpanded ? 'Compact Size' : 'Expand Size'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'iframe' ? (
            <iframe
              src={N8N_WEBHOOK_URL}
              title="HirePulse n8n Chatbot"
              className="w-full flex-1 border-0 bg-slate-50"
              allow="microphone; clipboard-write"
            />
          ) : (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-blue-400'
                        }`}
                      >
                        {isUser ? (
                          <User className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                        <div
                          className={`text-[10px] mt-1.5 ${
                            isUser ? 'text-blue-200 text-right' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Strip (shown when conversation is short) */}
              {messages.length <= 2 && !isLoading && (
                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleSubmit}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about jobs, internships, salaries..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-blue-600 focus:bg-white outline-none text-slate-900 placeholder:text-slate-400 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

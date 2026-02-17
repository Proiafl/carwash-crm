import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import AiMessage from "./AiMessage";
import AiActionCard, { type ActionProposal } from "./AiActionCard";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    actions?: ActionProposal[];
}

const STORAGE_KEY = "carwash-ai-chat-history";

function loadHistory(): ChatMessage[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveHistory(messages: ChatMessage[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch { /* ignore */ }
}

interface AiChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AiChatPanel({ isOpen, onClose }: AiChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: ChatMessage = { role: "user", content: trimmed };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        saveHistory(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            // Build conversation history for context (only text, no actions)
            const conversationHistory = updatedMessages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            const { data, error } = await supabase.functions.invoke("ai-assistant", {
                body: {
                    message: trimmed,
                    conversation_history: conversationHistory.slice(0, -1), // exclude current message
                },
            });

            if (error) throw error;

            const aiMsg: ChatMessage = {
                role: "assistant",
                content: data.response || data.error || "Sin respuesta",
                actions: data.actions,
            };

            const withResponse = [...updatedMessages, aiMsg];
            setMessages(withResponse);
            saveHistory(withResponse);
        } catch (err: any) {
            const errorMsg: ChatMessage = {
                role: "assistant",
                content: `⚠️ Error: ${err.message || "No pude conectar con el asistente. Verificá la conexión."}`,
            };
            const withError = [...updatedMessages, errorMsg];
            setMessages(withError);
            saveHistory(withError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = () => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleRetry = (index: number) => {
        // Find the last user message before this error
        const relevantHistory = messages.slice(0, index);
        const lastUserMsg = relevantHistory.reverse().find(m => m.role === "user");
        if (lastUserMsg) {
            // Remove the error message
            const pruned = messages.slice(0, index);
            setMessages(pruned);
            saveHistory(pruned);

            // Repopulate input
            setInput(lastUserMsg.content);
            setTimeout(() => {
                textareaRef.current?.focus();
                // Optional: Auto-scroll to bottom
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    const handleExecuteAction = async (action: ActionProposal) => {
        const { data, error } = await supabase.functions.invoke("ai-assistant", {
            body: { execute_action: action },
        });
        if (error) throw error;
        if (data && !data.success) throw new Error(data.message);

        // Add result message
        const resultMsg: ChatMessage = {
            role: "assistant",
            content: data.message || "✅ Acción ejecutada correctamente",
        };
        const updated = [...messages, resultMsg];
        setMessages(updated);
        saveHistory(updated);
    };

    // Quick suggestions
    const suggestions = [
        "¿Cómo estuvo el día?",
        "¿Qué clientes debería contactar?",
        "Haceme una promo",
        "¿Hay algo que necesite atención?",
    ];

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]" onClick={onClose} />
            )}

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-500/10 to-blue-500/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Asistente IA</h3>
                            <p className="text-[10px] text-muted-foreground">Gemini 2.0 Flash</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleReset}
                            title="Nueva conversación"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-violet-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">¡Hola! 👋</h3>
                                <p className="text-sm text-muted-foreground max-w-[250px]">
                                    Soy tu asistente IA. Puedo ayudarte con datos del negocio, seguimiento de clientes y marketing.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setInput(s); setTimeout(() => textareaRef.current?.focus(), 0); }}
                                        className="text-xs text-left p-2.5 rounded-xl border border-border/60 hover:bg-muted/50 hover:border-primary/30 transition-colors text-muted-foreground"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-2">
                            <AiMessage
                                role={msg.role}
                                content={msg.content}
                                onRetry={msg.content.startsWith("⚠️ Error") ? () => handleRetry(i) : undefined}
                            />
                            {msg.actions && msg.actions.map((action, j) => (
                                <div key={j} className="ml-9">
                                    <AiActionCard action={action} onConfirm={handleExecuteAction} />
                                </div>
                            ))}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-2 items-start">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                            </div>
                            <div className="bg-muted/80 rounded-2xl rounded-bl-md px-3.5 py-2.5 border border-border/50">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-3 bg-background/80 backdrop-blur-sm">
                    <div className="flex gap-2 items-end">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Preguntá algo..."
                            className="min-h-[40px] max-h-[120px] resize-none text-sm"
                            rows={1}
                        />
                        <Button
                            size="icon"
                            className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

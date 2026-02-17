import { Bot, User } from "lucide-react";

interface AiMessageProps {
    role: "user" | "assistant";
    content: string;
    onRetry?: () => void;
}

export default function AiMessage({ role, content, onRetry }: AiMessageProps) {
    const isUser = role === "user";

    // Simple markdown-like rendering: bold, line breaks, bullet points
    const renderContent = (text: string) => {
        return text.split("\n").map((line, i) => {
            // Bold
            let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic
            processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Code
            processed = processed.replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>');

            // Bullet points
            if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                return (
                    <li key={i} className="ml-4 list-disc text-sm" dangerouslySetInnerHTML={{ __html: processed.replace(/^[\s]*[-•]\s/, '') }} />
                );
            }
            // Numbered lists
            const numMatch = line.match(/^\s*(\d+)\.\s/);
            if (numMatch) {
                return (
                    <li key={i} className="ml-4 list-decimal text-sm" dangerouslySetInnerHTML={{ __html: processed.replace(/^\s*\d+\.\s/, '') }} />
                );
            }

            if (line.trim() === "") return <br key={i} />;

            return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
        });
    };

    return (
        <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
                }`}>
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-1 ${isUser
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/80 text-foreground rounded-bl-md border border-border/50"
                }`}>
                {renderContent(content)}
                {!isUser && onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-xs text-red-500 hover:underline mt-2 block"
                    >
                        🔄 Reintentar
                    </button>
                )}
            </div>
        </div>
    );
}

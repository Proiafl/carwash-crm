import { useState } from "react";
import { Bot } from "lucide-react";
import AiChatPanel from "./AiChatPanel";

export default function AiChatButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen
                        ? "bg-muted text-muted-foreground rotate-180"
                        : "bg-gradient-to-br from-violet-500 to-blue-500 text-white animate-pulse hover:animate-none"
                    }`}
                title="Asistente IA"
            >
                <Bot className="h-6 w-6" />
            </button>

            {/* Chat panel */}
            <AiChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

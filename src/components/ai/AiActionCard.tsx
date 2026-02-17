import { useState } from "react";
import { Check, X, Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionClient {
    id: string;
    name: string;
    phone: string;
}

export interface ActionProposal {
    type: "send_whatsapp" | "send_bulk_whatsapp";
    label: string;
    description: string;
    params: {
        clients: ActionClient[];
        message: string;
    };
}

interface AiActionCardProps {
    action: ActionProposal;
    onConfirm: (action: ActionProposal) => Promise<void>;
}

export default function AiActionCard({ action, onConfirm }: AiActionCardProps) {
    const [status, setStatus] = useState<"pending" | "executing" | "done" | "error">("pending");
    const [result, setResult] = useState<string>("");
    const [showPreview, setShowPreview] = useState(false);

    const handleConfirm = async () => {
        setStatus("executing");
        try {
            await onConfirm(action);
            setStatus("done");
            setResult("Acción ejecutada correctamente");
        } catch (err: any) {
            setStatus("error");
            setResult(err.message || "Error al ejecutar");
        }
    };

    return (
        <div className={`rounded-xl border-2 p-3 space-y-2 transition-all ${status === "done"
                ? "border-emerald-500/40 bg-emerald-500/5"
                : status === "error"
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-amber-500/40 bg-amber-500/5"
            }`}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === "done" ? "bg-emerald-500/20" : "bg-amber-500/20"
                    }`}>
                    {action.type.includes("whatsapp") ? (
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <Send className="h-4 w-4 text-amber-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
            </div>

            {/* Recipients preview */}
            {action.params.clients && action.params.clients.length > 0 && (
                <div className="text-xs text-muted-foreground">
                    📱 {action.params.clients.length} destinatario(s): {action.params.clients.map(c => c.name).join(", ")}
                </div>
            )}

            {/* Message preview toggle */}
            {action.params.message && (
                <div>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs text-primary hover:underline"
                    >
                        {showPreview ? "Ocultar" : "Ver"} mensaje
                    </button>
                    {showPreview && (
                        <div className="mt-1 p-2 bg-background/50 rounded-lg text-xs whitespace-pre-wrap border border-border/50">
                            {action.params.message}
                        </div>
                    )}
                </div>
            )}

            {/* Result message */}
            {result && (
                <p className={`text-xs font-medium ${status === "done" ? "text-emerald-600" : "text-red-500"}`}>
                    {result}
                </p>
            )}

            {/* Action buttons */}
            {status === "pending" && (
                <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleConfirm}
                    >
                        <Check className="h-3 w-3 mr-1" /> Confirmar
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => { setStatus("error"); setResult("Cancelado"); }}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {status === "executing" && (
                <div className="flex items-center justify-center gap-2 py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="text-xs text-muted-foreground">Ejecutando...</span>
                </div>
            )}
        </div>
    );
}

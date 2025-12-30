import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Aceita GET pra você poder “digitar no navegador”
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // Proteção mínima por token (recomendado)
    const token = String(req.query.token ?? "");
    const required = process.env.RESET_TOKEN ?? "";

    if (!required) {
        return res.status(500).json({
            message: "RESET_TOKEN não configurado nas variáveis de ambiente.",
        });
    }

    if (token !== required) {
        return res.status(401).json({ message: "Token inválido." });
    }

    // Zera a lista: apaga a chave do SET
    await kv.del("chosen_items");

    // (Opcional) se você também quiser zerar escolhas locais dos usuários,
    // isso só dá pra fazer no navegador (LocalStorage). Aqui é apenas global.
    return res.status(200).json({ ok: true, message: "Lista zerada com sucesso." });
}

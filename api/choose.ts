import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

    try {
        const { itemId } = req.body ?? {};
        const id = Number(itemId);

        if (!Number.isFinite(id) || id < 1) {
            return res.status(400).json({ message: "itemId inválido" });
        }

        // trava simples contra corrida: se já existe, recusa
        const already = await kv.sismember("chosen_items", id);
        if (already) return res.status(409).json({ message: "Esse item já foi escolhido." });

        await kv.sadd("chosen_items", id);
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(500).json({ message: "Erro interno" });
    }
}

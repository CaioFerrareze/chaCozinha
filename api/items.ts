import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(405).json({ message: "Method not allowed" });
    }

    const chosen = (await kv.smembers("chosen_items")) as number[];

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ chosen: chosen ?? [] });
}

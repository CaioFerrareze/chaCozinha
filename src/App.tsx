import { useEffect, useMemo, useState } from "react";

type Item = { id: number; name: string };

const ITEMS: Item[] = [
  { id: 1, name: "Conjunto de colheres de silicone" },
  { id: 2, name: "Espátula" },
  { id: 3, name: "Concha" },
  { id: 4, name: "Escumadeira" },
  { id: 5, name: "Pegador de alimentos" },
  { id: 6, name: "Batedor de arame (fouet)" },
  { id: 7, name: "Abridor de latas" },
  { id: 8, name: "Abridor de garrafas" },
  { id: 9, name: "Descascador de legumes" },
  { id: 10, name: "Ralador" },
  { id: 11, name: "Jogo de facas" },
  { id: 12, name: "Tábua de corte" },
  { id: 13, name: "Tesoura de cozinha" },
  { id: 14, name: "Peneira" },
  { id: 15, name: "Amassador de alho" },
  { id: 16, name: "Panela média" },
  { id: 17, name: "Panela pequena" },
  { id: 18, name: "Frigideira antiaderente" },
  { id: 19, name: "Forma para bolo" },
  { id: 20, name: "Assadeira" },
  { id: 21, name: "Potes plásticos ou de vidro (kit)" },
  { id: 22, name: "Porta-temperos" },
  { id: 23, name: "Saleiro" },
  { id: 24, name: "Açucareiro" },
  { id: 25, name: "Porta-mantimentos" },
  { id: 26, name: "Jogo de pratos" },
  { id: 27, name: "Jogo de copos" },
  { id: 28, name: "Jogo de talheres" },
  { id: 29, name: "Canecas" },
  { id: 30, name: "Jarra de suco" },
  { id: 31, name: "Escorredor de louça" },
  { id: 32, name: "Panos de prato" },
  { id: 33, name: "Luva térmica" },
  { id: 34, name: "Tapete de pia" },
  { id: 35, name: "Porta-detergente com esponja" },
];

const LS_KEY = "cha_cozinha_my_choice";

export default function App() {
  const [chosenByAll, setChosenByAll] = useState<Record<number, boolean>>({});
  const [myChoice, setMyChoice] = useState<number | null>(null);

  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const locked = myChoice !== null;

  const myChoiceName = useMemo(() => {
    if (!myChoice) return null;
    return ITEMS.find((i) => i.id === myChoice)?.name ?? null;
  }, [myChoice]);

  async function refresh() {
    const res = await fetch("/api/items", { cache: "no-store" });
    const data = (await res.json()) as { chosen: number[] };

    const map: Record<number, boolean> = {};
    for (const id of data.chosen) map[id] = true;
    setChosenByAll(map);
  }

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setMyChoice(Number(saved));
    refresh();

    // “quase realtime” pros outros verem mudanças
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function openConfirm(item: Item) {
    if (locked) {
      setToast("Você já escolheu um item. Obrigado! 😊");
      return;
    }
    if (chosenByAll[item.id]) {
      setToast("Esse item já foi escolhido por outra pessoa.");
      return;
    }
    setModalItem(item);
  }

  async function confirmChoose() {
    if (!modalItem) return;
    setLoading(true);
    try {
      const res = await fetch("/api/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: modalItem.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Não foi possível reservar esse item.");
      }

      localStorage.setItem(LS_KEY, String(modalItem.id));
      setMyChoice(modalItem.id);
      setModalItem(null);
      setToast("Escolha confirmada! ✅");
      await refresh();
    } catch (e: any) {
      setToast(e?.message || "Erro ao confirmar.");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    if (loading) return;
    setModalItem(null);
  }

  return (
    <div className="bg">
      <div className="container">
        <header className="header">
          <div>
            <h1>Chá de Cozinha • Lista Colaborativa</h1>
            <p>
              Escolha <b>apenas 1 item</b>. Itens escolhidos ficam bloqueados para todos.
            </p>
          </div>

          <div className={`badge ${locked ? "locked" : "free"}`}>
            {locked ? (
              <>
                <div>Você já escolheu:</div>
                <div className="badgeStrong">{myChoiceName}</div>
              </>
            ) : (
              <>Você ainda não escolheu um item.</>
            )}
          </div>
        </header>

        <main className="grid">
          {ITEMS.map((item) => {
            const isTaken = !!chosenByAll[item.id];
            const isMine = myChoice === item.id;

            return (
              <button
                key={item.id}
                className={[
                  "card",
                  isTaken ? "taken" : "",
                  isMine ? "mine" : "",
                  locked && !isMine ? "lockedCard" : "",
                ].join(" ")}
                disabled={loading || locked || isTaken}
                onClick={() => openConfirm(item)}
              >
                <div className="cardTop">
                  <span className="itemName">{item.name}</span>
                  <span className={`tag ${isMine ? "tagMine" : isTaken ? "tagTaken" : "tagFree"}`}>
                    {isMine ? "Seu item" : isTaken ? "Escolhido" : "Disponível"}
                  </span>
                </div>
                <div className="hint">
                  {isMine
                    ? "Obrigado! Você já fez sua escolha."
                    : isTaken
                      ? "Este item já foi escolhido."
                      : locked
                        ? "Você já escolheu outro item."
                        : "Clique para escolher"}
                </div>
              </button>
            );
          })}
        </main>

        <footer className="footer">
          <small>
            Dica: abra em outro celular para ver a atualização (pode levar até 4s pelo refresh automático).
          </small>
        </footer>
      </div>

      {/* Modal */}
      {modalItem && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmar escolha</h2>
            <p>
              Você quer escolher: <b>{modalItem.name}</b>?
            </p>
            <p className="warn">
              Ao confirmar, você não poderá escolher outro item neste dispositivo.
            </p>

            <div className="modalActions">
              <button className="btn ghost" onClick={closeModal} disabled={loading}>
                Cancelar
              </button>
              <button className="btn primary" onClick={confirmChoose} disabled={loading}>
                {loading ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

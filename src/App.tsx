import { useEffect, useMemo, useState } from "react";
import { ITEMS, type Item } from "./data/items";

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

    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
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
    <div className="page">
      <div className="shell">
        <header className="top">
          <div className="titleBox">
            <div className="pill">Chá de Cozinha</div>
            <h1>Caio e Giovana</h1>
            <p>

              Escolha apenas <b>1 item</b>. Quando alguém escolhe, o item fica bloqueado para todos.

            </p>
          </div>

          <div className={`statusCard ${locked ? "isLocked" : "isFree"}`}>
            {locked ? (
              <>
                <div className="statusLabel">Sua escolha</div>
                <div className="statusValue">{myChoiceName}</div>
                <div className="statusHint">Obrigado! ❤️</div>
              </>
            ) : (
              <>
                <div className="statusLabel">Você ainda não escolheu</div>
                <div className="statusValue">Selecione um item abaixo</div>
                <div className="statusHint">Depois de confirmar, não dá para escolher outro.</div>
              </>
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
                    ? "Você já escolheu este item."
                    : isTaken
                      ? "Já escolhido por outra pessoa."
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
            Atualiza automaticamente (até 4s). Se quiser, abra em outro celular para ver os itens marcados.
          </small>
        </footer>
      </div>

      {/* Modal */}
      {modalItem && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <h2>Confirmar escolha</h2>
              <button className="iconBtn" onClick={closeModal} disabled={loading} aria-label="Fechar">
                ✕
              </button>
            </div>

            <p className="modalText">
              Você quer escolher: <b>{modalItem.name}</b>?
            </p>

            <div className="alert">
              Ao confirmar, você não poderá escolher outro item neste dispositivo.
            </div>

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

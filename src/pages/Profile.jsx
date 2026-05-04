import { useRef } from "react";
import { useSoonStore } from "../store/useSoonStore.js";

export default function Profile({ onBack }) {
  const fileInputRef = useRef(null);

  const exportPack = useSoonStore((state) => state.exportPack);
  const importPack = useSoonStore((state) => state.importPack);
  const resetPack = useSoonStore((state) => state.resetPack);

  function handleExport() {
    const data = exportPack();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "soon-arene.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const data = JSON.parse(text);

    importPack(data);
    event.target.value = "";
  }

  function handleReset() {
    const ok = window.confirm("Réinitialiser l’arène Soon ?");
    if (!ok) return;

    resetPack();
  }

  return (
    <main className="profile-screen">
      <section className="profile-card">
        <p className="kicker">Soon•° profil</p>

        <h1>Garder trace de l’arène</h1>

        <p className="profile-lead">
          Sauvegarde ton paysage, recharge une traversée ou reviens au jardin sonore initial.
        </p>

        <div className="profile-actions">
          <button className="secondary-btn" type="button" onClick={handleExport}>
            Exporter le paysage
          </button>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Importer un paysage
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />

          <button className="danger-btn" type="button" onClick={handleReset}>
            Revenir au paysage initial
          </button>
        </div>

        <button className="primary-btn" type="button" onClick={onBack}>
          Retour à l’arène
        </button>
      </section>
    </main>
  );
}

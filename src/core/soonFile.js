export function exportSoonFile(state) {
  const payload = {
    format: "soon.local.v1",
    exportedAt: new Date().toISOString(),
    title: "Arène Soon locale",
    data: {
      mode: state.mode,
      bubbles: state.bubbles,
      fish: {
        x: state.fish?.x || 0,
        y: state.fish?.y || 0,
        targetX: state.fish?.targetX || 0,
        targetY: state.fish?.targetY || 0,
        angle: state.fish?.angle || -Math.PI / 2,
      },
      traceCircuit: state.traceCircuit,
      path: state.path,
      resonanceNotes: state.resonanceNotes,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const filename = `soon-arene-${new Date().toISOString().slice(0, 10)}.soon`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function readSoonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);

        if (payload?.format !== "soon.local.v1") {
          reject(new Error("Format .soon non reconnu."));
          return;
        }

        resolve(payload.data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

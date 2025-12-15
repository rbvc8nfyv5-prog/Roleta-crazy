(function () {
  /* ================= CONFIG ================= */

  const track = [32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26, 0];
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  const terminais = {
    0: [0, 10, 20, 30], 1: [1, 11, 21, 31], 2: [2, 12, 22, 32], 3: [3, 13, 23, 33],
    4: [4, 14, 24, 34], 5: [5, 15, 25, 35], 6: [6, 16, 26, 36],
    7: [7, 17, 27], 8: [8, 18, 28], 9: [9, 19, 29]
  };

  const coresT = {
    0: "#00e5ff", 1: "#ff1744", 2: "#00e676", 3: "#ff9100", 4: "#d500f9",
    5: "#ffee58", 6: "#2979ff", 7: "#ff4081", 8: "#76ff03", 9: "#8d6e63"
  };

  // Pares candidatos (você pode editar depois se quiser mais/menos)
  // Mantive vários pra ter chance de achar padrão.
  const paresCandidatos = [];
  for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) paresCandidatos.push([a, b]);

  let hist = [];

  /* ================= FUNÇÕES ================= */

  function corNum(n) {
    if (n === 0) return "#0f0";
    return reds.includes(n) ? "#e74c3c" : "#000";
  }

  function coverT(t) {
    const s = new Set();
    terminais[t].forEach((n) => {
      const i = track.indexOf(n);
      s.add(n);
      s.add(track[(i + 36) % 37]);
      s.add(track[(i + 1) % 37]);
    });
    return s;
  }

  // Converte últimos N números (globais) em sequência A/B/X para um par
  function seqABXParaPar(ultimosNums, ca, cb) {
    return ultimosNums.map((n) => (ca.has(n) ? "A" : cb.has(n) ? "B" : "X"));
  }

  // Detecta padrões SOMENTE nos últimos N números globais:
  // ABA nos últimos 3, ABBABB nos últimos 6.
  // OBS: Eu considero as 2 orientações: ABA e BAB (porque depende de quem é "A" no par).
  function detectarPadroesGlobais() {
    const res = []; // {par:[a,b], tipo:"ABA"|"ABBABB", orient:"ABA"|"BAB"|"ABBABB"|"B A A B A A"?}

    const last3 = hist.slice(-3);
    const last6 = hist.slice(-6);

    if (last3.length < 3 && last6.length < 6) return res;

    for (const [a, b] of paresCandidatos) {
      const ca = coverT(a);
      const cb = coverT(b);

      // --- ABA (últimos 3 números globais) ---
      if (last3.length === 3) {
        const s3 = seqABXParaPar(last3, ca, cb).join("");
        // Só vale se NÃO tiver X
        if (s3 === "ABA") res.push({ par: [a, b], tipo: "ABA", orient: "A-B-A" });
        else if (s3 === "BAB") res.push({ par: [a, b], tipo: "ABA", orient: "B-A-B" });
      }

      // --- ABBABB (últimos 6 números globais) ---
      if (last6.length === 6) {
        const s6 = seqABXParaPar(last6, ca, cb).join("");
        if (s6 === "ABBABB") res.push({ par: [a, b], tipo: "ABBABB", orient: "A-B-B-A-B-B" });
        else if (s6 === "BAABAA") res.push({ par: [a, b], tipo: "ABBABB", orient: "B-A-A-B-A-A" });
      }
    }

    return res;
  }

  // Melhores pares por “força” nos últimos 14 números globais:
  // conta quantos caem no par (cobertura terminal+1 vizinho).
  function melhoresPares(qtd = 5) {
    const ult14 = hist.slice(-14);
    const scores = paresCandidatos.map(([a, b]) => {
      const ca = coverT(a), cb = coverT(b);
      let c = 0;
      for (const n of ult14) if (ca.has(n) || cb.has(n)) c++;
      return { par: [a, b], score: c };
    });
    scores.sort((x, y) => y.score - x.score);
    return scores.slice(0, qtd).map((x) => x.par);
  }

  /* ================= UI ================= */

  document.body.innerHTML = `
  <div style="padding:14px;max-width:1100px;margin:auto">
    <h2 style="text-align:center">Roleta — Padrões no Último Inserido</h2>

    <div id="alertaPadrao" style="
      border:1px solid #444;background:#141414;border-radius:8px;
      padding:10px;margin:10px 0;display:none;font-size:14px;line-height:1.35"></div>

    <div id="linhas"></div>

    <div id="botoes" style="
      display:grid;grid-template-columns:repeat(9,1fr);
      gap:4px;max-width:520px;margin:12px auto"></div>

    <div style="text-align:center;margin-top:8px;opacity:.8;font-size:12px">
      Dica: clique num número na <b>1ª linha</b> para remover ele do histórico (remove de tudo).
    </div>
  </div>
  `;

  const linhas = document.getElementById("linhas");
  const botoes = document.getElementById("botoes");
  const alertaPadrao = document.getElementById("alertaPadrao");

  // botões 0–36
  for (let n = 0; n <= 36; n++) {
    const b = document.createElement("button");
    b.textContent = n;
    b.onclick = () => { hist.push(n); render(); };
    botoes.appendChild(b);
  }

  // cria 5 linhas
  for (let i = 0; i < 5; i++) {
    const box = document.createElement("div");
    box.innerHTML = `
      <div id="hist${i}" style="
        border:1px solid #666;background:#222;border-radius:6px;
        padding:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center"></div>
      <div id="info${i}" style="text-align:center;font-size:13px;margin-bottom:12px"></div>
    `;
    linhas.appendChild(box);
  }

  /* ================= RENDER ================= */

  function render() {
    const ult14 = hist.slice(-14).reverse();

    // 1) Detecta padrões pelos ÚLTIMOS 3 e ÚLTIMOS 6 números globais
    const padroes = detectarPadroesGlobais();

    // Mostra alerta se tiver padrão, senão esconde
    if (padroes.length) {
      // Se tiver vários, mostra todos (ou você pode limitar)
      const linhasTxt = padroes.map((p) => {
        const [a, b] = p.par;
        const tipoTxt = (p.tipo === "ABA") ? "ABA (últimos 3)" : "ABBABB (últimos 6)";
        return `• <b>T${a} & T${b}</b> → <b>${tipoTxt}</b> (${p.orient})`;
      }).join("<br>");
      alertaPadrao.style.display = "block";
      alertaPadrao.innerHTML = `<b>🎯 PADRÃO DETECTADO AGORA (baseado nos últimos números inseridos)</b><br>${linhasTxt}`;
    } else {
      alertaPadrao.style.display = "none";
      alertaPadrao.innerHTML = "";
    }

    // 2) Linhas do tempo SEMPRE rodam com melhores pares
    const lista = melhoresPares(5);

    for (let i = 0; i < 5; i++) {
      const h = document.getElementById("hist" + i);
      const info = document.getElementById("info" + i);
      h.innerHTML = "";
      info.innerHTML = "";

      const par = lista[i];
      if (!par) continue;

      const [a, b] = par;
      const ca = coverT(a), cb = coverT(b);

      // título pequeno da linha (sem score)
      info.innerHTML = `<span style="opacity:.9">Par: <b>T${a}</b> & <b>T${b}</b></span>`;

      ult14.forEach((n, idx) => {
        const w = document.createElement("div");
        w.style = "display:flex;flex-direction:column;align-items:center";

        const d = document.createElement("div");
        d.textContent = n;
        d.style = `padding:6px 8px;border-radius:6px;font-size:20px;
          background:${corNum(n)};
          color:${corNum(n) === "#000" ? "#fff" : "#000"}`;

        // Remover global: somente na 1ª linha
        if (i === 0) {
          d.style.cursor = "pointer";
          d.onclick = () => {
            // idx é relativo ao ult14 (reverso). Traduz para índice real no hist.
            const realIndex = hist.length - 1 - idx;
            if (realIndex >= 0) hist.splice(realIndex, 1);
            render();
          };
        }

        w.appendChild(d);

        if (ca.has(n) || cb.has(n)) {
          const t = ca.has(n) ? a : b;
          const lbl = document.createElement("div");
          lbl.textContent = "T" + t;
          lbl.style = `font-size:12px;font-weight:bold;color:${coresT[t]}`;
          w.appendChild(lbl);
        }

        h.appendChild(w);
      });
    }
  }

  render();
})();

javascript:(function () {

  // ================= CONFIG BASE =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];

  // ================= ESTADO =================
  let hist = [];

  // ================= CSS =================
  const style = document.createElement("style");
  style.innerHTML = `
    #painelRoleta {
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 280px;
      background: #111;
      color: #fff;
      font-family: Arial, sans-serif;
      font-size: 12px;
      border: 1px solid #444;
      padding: 6px;
      z-index: 999999;
    }
    #histBox {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    .histItem {
      width: 28px;
      text-align: center;
      background: #222;
      border: 1px solid #333;
      padding: 2px 0;
    }
    textarea {
      width: 100%;
      height: 60px;
      font-size: 12px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      margin-top: 4px;
      cursor: pointer;
    }
    input {
      width: 100%;
      margin-top: 4px;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);

  // ================= HTML =================
  const painel = document.createElement("div");
  painel.id = "painelRoleta";
  painel.innerHTML = `
    <div><b>Linha do Tempo</b></div>

    <textarea id="pasteHist" placeholder="Cole o histórico aqui"></textarea>
    <button id="btnPasteHist">Colar histórico</button>

    <input id="numInput" type="number" min="0" max="36" placeholder="Inserir número manualmente" />
    <button id="btnAdd">Adicionar número</button>

    <div id="histBox"></div>
  `;
  document.body.appendChild(painel);

  const histBox = document.getElementById("histBox");

  // ================= FUNÇÕES =================
  function renderHist() {
    histBox.innerHTML = "";

    // EXIBE SOMENTE OS ÚLTIMOS 14
    hist.slice(-14).forEach(n => {
      const d = document.createElement("div");
      d.className = "histItem";
      d.textContent = n;
      histBox.appendChild(d);
    });
  }

  function addNumero(n) {
    if (n < 0 || n > 36 || isNaN(n)) return;
    hist.push(n);
    renderHist();
  }

  // ================= EVENTOS =================
  document.getElementById("btnAdd").onclick = () => {
    const n = parseInt(document.getElementById("numInput").value, 10);
    document.getElementById("numInput").value = "";
    addNumero(n);
  };

  document.getElementById("btnPasteHist").onclick = () => {
    const txt = document.getElementById("pasteHist").value;
    if (!txt.trim()) return;

    const nums = txt
      .split(/[\s,;]+/)
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= 36);

    nums.forEach(n => hist.push(n));

    document.getElementById("pasteHist").value = "";
    renderHist();
  };

})();

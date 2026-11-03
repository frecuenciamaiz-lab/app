/* Carta de precios y cotizador en tiempo real · Estudio Maíz */
window.COTIZADOR = function (el) {
  const esc = MZ.esc;
  const P = PRECIOS();
  const sel = {}; const ext = {}; const des = {};
  const cats = [...new Set(P.estudio.map(s => s.cat))];
  let cat = "Todo";
  el.innerHTML = `<div class="cz">
    <div class="cz-main">
      <div class="seg cz-tabs" id="czTabs">${["Todo"].concat(cats).map(c => `<button data-c="${esc(c)}" class="${c === cat ? "on" : ""}">${esc(c)}</button>`).join("")}</div>
      <div class="cz-grid" id="czGrid"></div>
      <div class="cz-extra glass"><b>Extras</b><div class="chips" id="czExt">${P.extras.map(x => `<button type="button" class="chip" data-x="${x.id}">${esc(x.nombre)} · ${x.tipo === "porc" ? "+" + x.valor + "%" : "+" + money(x.valor)}</button>`).join("")}</div>
        <b style="display:block;margin-top:12px">Descuentos</b><div class="chips" id="czDes">${P.descuentos.map(x => `<button type="button" class="chip" data-d="${x.id}">${esc(x.nombre)} · −${x.porc}%</button>`).join("")}</div>
        <p class="tiny muted" style="margin-top:10px">${esc(P.nota || "")}</p></div>
    </div>
    <aside class="cz-sum glass" id="czSum"></aside>
  </div>`;
  const grid = el.querySelector("#czGrid"), sum = el.querySelector("#czSum");
  function drawGrid() {
    const L = P.estudio.filter(s => cat === "Todo" || s.cat === cat);
    grid.innerHTML = L.map(s => {
      const q = sel[s.id] || 0;
      return `<div class="cz-card ${q ? "on" : ""} ${s.destacado ? "hot" : ""}" data-id="${s.id}">
        ${s.destacado ? '<span class="tag y cz-badge">⭐ Popular</span>' : ""}
        <div class="tiny muted">${esc(s.cat)}</div><b>${esc(s.nombre)}</b><p class="small muted">${esc(s.desc)}</p>
        <div class="cz-foot"><span class="cz-price">${money(s.precio)}<small> ${esc(s.unidad)}</small></span>
          ${s.cantidad ? `<div class="cz-q"><button type="button" data-q="-1" aria-label="Menos">−</button><span>${q}</span><button type="button" data-q="1" aria-label="Más">+</button></div>`
            : `<button type="button" class="btn btn-sm ${q ? "btn-primary" : "btn-ghost"}" data-t>${q ? "✓ Agregado" : "Agregar"}</button>`}</div></div>`;
    }).join("");
    grid.querySelectorAll(".cz-card").forEach(c => {
      const id = c.dataset.id;
      c.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { sel[id] = Math.max(0, (sel[id] || 0) + +b.dataset.q); if (!sel[id]) delete sel[id]; drawGrid(); drawSum(); });
      const t = c.querySelector("[data-t]"); if (t) t.onclick = () => { sel[id] ? delete sel[id] : sel[id] = 1; drawGrid(); drawSum(); };
    });
  }
  function calc() {
    let unico = 0, mensual = 0; const lines = [];
    Object.entries(sel).forEach(([id, q]) => { const s = P.estudio.find(x => x.id === id); if (!s) return; const v = s.precio * q;
      (s.unidad === "/mes" ? (mensual += v) : (unico += v)); lines.push([`${q > 1 ? q + " × " : ""}${s.nombre}`, v, s.unidad === "/mes"]); });
    let base = unico + mensual;
    P.extras.forEach(x => { if (!ext[x.id] || !base) return;
      if (x.tipo === "porc") { const vu = unico * x.valor / 100, vm = mensual * x.valor / 100; unico += vu; mensual += vm; lines.push([x.nombre + " (+" + x.valor + "%)", vu + vm, false]); }
      else { unico += x.valor; lines.push([x.nombre, x.valor, false]); } });
    let pd = 0; P.descuentos.forEach(d => { if (des[d.id]) pd += d.porc; });
    pd = Math.min(pd, 30);
    const dU = unico * pd / 100, dM = mensual * pd / 100;
    return { lines, unico: unico - dU, mensual: mensual - dM, pd, ahorro: dU + dM };
  }
  function drawSum() {
    const c = calc(), empty = !c.lines.length;
    sum.innerHTML = `<div class="row between"><b>Su cotización</b>${empty ? "" : '<button class="btn btn-ghost btn-sm" id="czClr">Limpiar</button>'}</div>
      ${empty ? '<p class="small muted" style="margin:10px 0">Agregue servicios para ver el total al instante.</p>' :
      `<div class="cz-lines">${c.lines.map(l => `<div><span>${esc(l[0])}</span><b>${money(l[1])}${l[2] ? "/mes" : ""}</b></div>`).join("")}</div>
       ${c.pd ? `<div class="cz-save">Descuento ${c.pd}% · ahorra ${money(c.ahorro)}</div>` : ""}
       <div class="cz-total">${c.unico ? `<div><span>Pago único</span><b class="cz-num">${money(c.unico)}</b></div>` : ""}${c.mensual ? `<div><span>Mensual</span><b class="cz-num">${money(c.mensual)}<small>/mes</small></b></div>` : ""}</div>
       <a class="btn btn-wa btn-block" id="czWa" target="_blank" rel="noopener">${MZ.I.wa} Enviar cotización por WhatsApp</a>
       <a class="btn btn-accent btn-block" style="margin-top:8px" href="/brief?s=${encodeURIComponent(c.lines.map(l => l[0]).join(", ").slice(0, 110))}">Agendar con el brief</a>`}
      <p class="tiny muted" style="margin-top:10px">Precio estimado; la propuesta final se confirma después del brief.</p>`;
    const clr = sum.querySelector("#czClr"); if (clr) clr.onclick = () => { Object.keys(sel).forEach(k => delete sel[k]); drawGrid(); drawSum(); };
    const wa = sum.querySelector("#czWa");
    if (wa) { const txt = "Hola Estudio Maíz, quiero esta cotización:\n" + c.lines.map(l => `• ${l[0]}: ${money(l[1])}${l[2] ? "/mes" : ""}`).join("\n") +
      (c.pd ? `\nDescuento: ${c.pd}%` : "") + (c.unico ? `\nPago único: ${money(c.unico)}` : "") + (c.mensual ? `\nMensual: ${money(c.mensual)}/mes` : "");
      wa.href = MZ.waLink(txt); wa.onclick = () => MZ.track("whatsapp"); }
    const bar = document.getElementById("czBar");
    if (bar) { bar.classList.toggle("show", !empty); bar.querySelector("b").textContent = (c.unico ? money(c.unico) : "") + (c.unico && c.mensual ? " + " : "") + (c.mensual ? money(c.mensual) + "/mes" : ""); }
  }
  el.querySelector("#czTabs").onclick = e => { const b = e.target.closest("button"); if (!b) return; cat = b.dataset.c; el.querySelectorAll("#czTabs button").forEach(x => x.classList.toggle("on", x === b)); drawGrid(); };
  el.querySelector("#czExt").onclick = e => { const b = e.target.closest("[data-x]"); if (!b) return; ext[b.dataset.x] = !ext[b.dataset.x]; b.classList.toggle("on", ext[b.dataset.x]); drawSum(); };
  el.querySelector("#czDes").onclick = e => { const b = e.target.closest("[data-d]"); if (!b) return; des[b.dataset.d] = !des[b.dataset.d]; b.classList.toggle("on", des[b.dataset.d]); drawSum(); };
  // barra flotante en celular
  const bar = document.createElement("button"); bar.id = "czBar"; bar.className = "cz-bar glass"; bar.innerHTML = `<span>Su cotización</span><b></b><span>Ver ›</span>`;
  bar.onclick = () => sum.scrollIntoView({ behavior: "smooth", block: "center" }); document.body.appendChild(bar);
  drawGrid(); drawSum();
};

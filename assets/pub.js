/* Utilidades de páginas públicas */
window.PUB = (function () {
  const { esc } = MZ;
  function init(active, waMsg) {
    MZ.aurora(); MZ.track("vista");
    if (active !== "home") MZ.dock(active);
    MZ.waFab(waMsg);
    const y = document.getElementById("yr"); if (y) y.textContent = new Date().getFullYear();
    MZ.reveal();
  }
  function team(el) {
    const eq = MZ.CFG().equipo || [];
    el.innerHTML = eq.map(m => `<article class="member glass reveal in"><div class="ph" style="${m.foto ? `background-image:url('${esc(m.foto)}')` : ""}">${m.foto ? "" : MZ.mascot(120)}</div>
      <div><h3>${esc(m.nombre)}</h3><div class="rol">${esc(m.rol)}</div></div><p>${esc(m.bio)}</p></article>`).join("");
  }
  function embed(url) {
    const u = url || "";
    let m;
    if ((m = u.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/))) return `<iframe src="https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1" allow="autoplay;encrypted-media" allowfullscreen></iframe>`;
    if ((m = u.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/))) return `<iframe src="https://www.instagram.com/reel/${m[1]}/embed" allowfullscreen></iframe>`;
    if ((m = u.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/))) return `<iframe src="https://www.tiktok.com/embed/v2/${m[1]}" allowfullscreen></iframe>`;
    if (/facebook\.com/.test(u)) return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false" allowfullscreen></iframe>`;
    if (/\.(mp4|mov|webm)(\?|$)/i.test(u) || /supabase\.co\/storage/.test(u)) return `<video src="${esc(u)}" controls autoplay playsinline></video>`;
    return null;
  }
  async function portafolio(el) {
    if (!document.getElementById("pfCss")) { const st = document.createElement("style"); st.id = "pfCss"; st.textContent = ".pcard.live>img{position:absolute;inset:0}.pcard .pv{position:absolute;inset:0;pointer-events:none;overflow:hidden}.pcard .pv iframe,.pcard .pv video{position:absolute;inset:0;width:100%;height:100%;border:0;object-fit:cover}.pcard .pv iframe.ig{height:calc(100% + 120px);top:-54px}.pcard .ov{z-index:2;pointer-events:none}.pcard .ov .red{display:inline-block;margin-top:6px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.22);backdrop-filter:blur(8px);font-weight:650;opacity:1!important}"; document.head.appendChild(st); }
    let L = [];
    try { L = await MZ.sbSelect("portafolio", "select=*&order=orden.asc,created_at.desc"); } catch (e) {}
    if (!L.length) {
      el.innerHTML = [1, 2, 3].map(i => `<div class="pcard empty"><div>${MZ.mascot(70)}<p class="small" style="margin-top:8px">Próximamente: nuevos trabajos</p></div></div>`).join("");
      return;
    }
    // vista previa que se reproduce sola y sin sonido; al tocar se abre la publicación en la red social
    const muda = u => {
      let m; u = u || "";
      if ((m = u.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/))) return `<iframe src="https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}&controls=0&playsinline=1&modestbranding=1" allow="autoplay;encrypted-media" loading="lazy" tabindex="-1"></iframe>`;
      if ((m = u.match(/tiktok\.com\/@[\w.]+\/(?:video|photo)\/(\d+)/))) return `<iframe src="https://www.tiktok.com/player/v1/${m[1]}?autoplay=1&muted=1&loop=1&controls=0&progress_bar=0&play_button=0&volume_control=0&fullscreen_button=0&music_info=0&description=0&rel=0" allow="autoplay" loading="lazy" tabindex="-1"></iframe>`;
      if ((m = u.match(/instagram\.com\/(?:reels?|p|tv)\/([\w-]+)/))) return `<iframe class="ig" src="https://www.instagram.com/p/${m[1]}/embed" loading="lazy" tabindex="-1" scrolling="no"></iframe>`;
      if (/facebook\.com|fb\.watch/.test(u)) return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false&autoplay=true&mute=true&loop=true" allow="autoplay;encrypted-media" loading="lazy" tabindex="-1"></iframe>`;
      if (/\.(mp4|mov|webm)(\?|$)/i.test(u) || /supabase\.co\/storage/.test(u)) return `<video src="${esc(u)}" muted autoplay loop playsinline preload="metadata"></video>`;
      return null;
    };
    const red = u => /tiktok/.test(u) ? "TikTok" : /instagram/.test(u) ? "Instagram" : /facebook|fb\.watch/.test(u) ? "Facebook" : /youtu/.test(u) ? "YouTube" : "";
    el.innerHTML = L.map((p, i) => {
      const enlace = p.red_url || p.video_url || "", nombreRed = red(enlace);
      return `<div class="pcard live" data-i="${i}" role="link" tabindex="0" aria-label="Ver ${esc(p.titulo)}${nombreRed ? " en " + nombreRed : ""}">
        ${p.poster_url ? `<img src="${esc(p.poster_url)}" alt="" loading="lazy">` : ""}<div class="pv" data-u="${esc(p.video_url || p.red_url || "")}"></div>
        <div class="ov"><b>${esc(p.titulo)}</b><span>${esc([p.cliente, p.rubro].filter(Boolean).join(" · "))}</span>${nombreRed ? `<span class="red">Ver en ${nombreRed} ↗</span>` : ""}</div></div>`;
    }).join("");
    const cargar = c => { const pv = c.querySelector(".pv"); if (pv.dataset.ok) return; pv.dataset.ok = 1; const h = muda(pv.dataset.u); if (h) { pv.innerHTML = h; const v = pv.querySelector("video"); if (v) { v.muted = true; v.play().catch(() => {}); } } };
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); cargar(e.target); } }), { rootMargin: "300px" }) : null;
    el.querySelectorAll(".pcard").forEach(c => {
      io ? io.observe(c) : cargar(c);
      const abrir = () => {
        const p = L[+c.dataset.i], enlace = p.red_url || p.video_url;
        if (enlace && !/supabase\.co\/storage|\.(mp4|mov|webm)(\?|$)/i.test(enlace)) return window.open(enlace, "_blank", "noopener");
        const e = embed(p.video_url); if (!e) return;
        const lb = document.createElement("div"); lb.className = "lightbox";
        lb.innerHTML = `<button class="icon-btn x" aria-label="Cerrar">×</button><div class="box">${e}</div>`;
        lb.onclick = ev => { if (ev.target === lb || ev.target.classList.contains("x")) lb.remove(); };
        document.body.appendChild(lb);
      };
      c.onclick = abrir; c.onkeydown = e => { if (e.key === "Enter") abrir(); };
    });
  }
  return { init, team, portafolio, embed };
})();

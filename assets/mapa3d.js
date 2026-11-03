/* Vista 3D gratuita tipo Google Earth: MapLibre GL + satélite Esri + relieve real (AWS Terrain Tiles).
   Se usa cuando Google 3D no está disponible o se alcanzó el límite mensual. */
(function () {
  const ML = "https://unpkg.com/maplibre-gl@4.7.1/dist/";
  let cargando = null;
  function cargar() {
    if (window.maplibregl) return Promise.resolve();
    return cargando = cargando || new Promise((res, rej) => {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = ML + "maplibre-gl.css"; document.head.appendChild(l);
      const s = document.createElement("script"); s.src = ML + "maplibre-gl.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  const ESTILO = {
    version: 8,
    sources: {
      sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18, attribution: "© Esri, Maxar, Earthstar Geographics" },
      dem: { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], tileSize: 256, encoding: "terrarium", maxzoom: 14, attribution: "Relieve: Mapzen / AWS Terrain Tiles" },
      lbl: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18 }
    },
    layers: [
      { id: "fondo", type: "background", paint: { "background-color": "#0b1a2a" } },
      { id: "sat", type: "raster", source: "sat" },
      { id: "sombras", type: "hillshade", source: "dem", paint: { "hillshade-exaggeration": 0.25, "hillshade-shadow-color": "#2a1a11" } },
      { id: "lbl", type: "raster", source: "lbl", paint: { "raster-opacity": 0.85 } }
    ],
    terrain: { source: "dem", exaggeration: 1.35 },
    sky: { "sky-color": "#7fb6e6", "horizon-color": "#f5e6c8", "fog-color": "#f5f0e8", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.4 }
  };
  // [nombre, lat, lng, zoom, pitch]
  const LUGARES = [["Volcán de Santa Ana", 13.853, -89.630, 13.2, 72], ["Lago de Coatepeque", 13.865, -89.548, 12.4, 66], ["Volcán de Izalco", 13.813, -89.633, 13.4, 74],
    ["Laguna Verde · Apaneca", 13.893, -89.787, 14, 68], ["Juayúa", 13.842, -89.745, 14.2, 64], ["Cerro El Águila", 13.898, -89.717, 13.6, 70]];

  async function abrir(opts) {
    opts = opts || {};
    const ov = document.createElement("div"); ov.className = "r3d";
    ov.innerHTML = `<div id="m3d" style="position:absolute;inset:0"></div>
      <div class="r3d-top"><button class="icon-btn glass" data-x aria-label="Cerrar">×</button><b class="glass">🌍 ${opts.titulo || "Reserva Apaneca-Ilamatepec en 3D"}</b></div>
      <div class="r3d-bar glass"><button data-tour>▶ Recorrido</button>${opts.lugar ? `<button data-l>📍 ${MZ.esc(opts.lugar.nombre)}</button>` : ""}${LUGARES.map((x, i) => `<button data-i="${i}">${x[0]}</button>`).join("")}</div>`;
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    let tourOn = false, m = null, giro = null;
    const close = () => { tourOn = false; cancelAnimationFrame(giro); if (m) m.remove(); ov.remove(); document.body.style.overflow = ""; };
    ov.querySelector("[data-x]").onclick = close;
    try { await cargar(); } catch (e) { close(); return MZ.toast("No se pudo cargar la vista 3D. Revise su conexión.", 3500); }
    m = new maplibregl.Map({ container: ov.querySelector("#m3d"), style: ESTILO, center: [-88.9, 13.75], zoom: 6, pitch: 0, bearing: 0, maxPitch: 85, attributionControl: { compact: true } });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    m.on("error", () => {});
    (opts.puntos || []).filter(p => p.lat).forEach(p => {
      const el = document.createElement("div"); el.className = "m3d-pin"; el.innerHTML = `<span>${MZ.esc(p.nombre)}</span>`;
      new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(m);
    });
    const orbitar = () => { cancelAnimationFrame(giro); let t0 = null; const f = t => { if (t0 == null) t0 = t; m.setBearing(m.getBearing() + 0.06); if (t - t0 < 14000) giro = requestAnimationFrame(f); }; giro = requestAnimationFrame(f); };
    m.on("mousedown", () => cancelAnimationFrame(giro)); m.on("touchstart", () => cancelAnimationFrame(giro));
    const volar = (lat, lng, zoom, pitch, ms, vuelta) => new Promise(res => {
      cancelAnimationFrame(giro);
      m.flyTo({ center: [lng, lat], zoom, pitch, bearing: (Math.random() * 120) - 60, duration: ms || 5000, curve: 1.6, essential: true });
      m.once("moveend", () => { if (vuelta) orbitar(); res(); });
    });
    ov.querySelector(".r3d-bar").onclick = async e => {
      const b = e.target.closest("button"); if (!b) return;
      ov.querySelectorAll(".r3d-bar button").forEach(x => x.classList.toggle("on", x === b)); tourOn = false;
      if (b.dataset.l != null) return volar(opts.lugar.lat, opts.lugar.lng, 15.5, 70, 4000, true);
      if (b.dataset.i != null) { const x = LUGARES[+b.dataset.i]; return volar(x[1], x[2], x[3], x[4], 4500, true); }
      tourOn = true;
      for (const x of LUGARES) { if (!tourOn) break; await volar(x[1], x[2], x[3], x[4], 5000, false); if (!tourOn) break; await new Promise(r => setTimeout(r, 1800)); }
    };
    m.once("load", () => setTimeout(() => opts.lugar ? volar(opts.lugar.lat, opts.lugar.lng, 15.5, 70, 6500, true) : volar(13.85, -89.68, 11.4, 62, 6500, true), 500));
  }
  window.MAPA3D = { abrir };
})();

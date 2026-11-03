/* =========================================================
   Mapas con Google Maps (con respaldo automático a OpenStreetMap)
   Ofrece la misma interfaz "L" que usan brief.js, ruta.js y panel.js,
   pero dibuja con Google Maps. La clave se toma de Panel → Sitio → Mapa.
   ========================================================= */
(function () {
  const DEFAULT_KEY = "AIzaSyBxpNShM0jqFa20y-4RN9Obk5xdulYh7W0";
  const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/";

  // Proveedor recordado en este dispositivo. Por defecto: mapa gratuito (OpenStreetMap), sin pedir nada a Google.
  const PROV = localStorage.getItem("maiz_mapa_prov") || "osm";
  let USE_LEAFLET = !!window.L; // respaldo ya cargado (OpenStreetMap)
  if (!USE_LEAFLET && (PROV !== "google" || sessionStorage.getItem("maiz_osm") || +(localStorage.getItem("maiz_osm_hasta") || 0) > Date.now())) {
    document.write('<link rel="stylesheet" href="' + LEAFLET + 'leaflet.css"><script src="' + LEAFLET + 'leaflet.js"><\/script>');
    USE_LEAFLET = true;
  }
  // si en el panel se elige Google, este dispositivo lo usa desde la siguiente carga
  (MZ.cfgReady || Promise.resolve()).then(C => { const p = ((C && C.mapa) || {}).proveedor === "google" ? "google" : "osm"; try { localStorage.setItem("maiz_mapa_prov", p); } catch (e) {} });
  function fallback(recordar) {
    if (recordar) try { localStorage.setItem("maiz_osm_hasta", String(Date.now() + 24 * 3600e3)); } catch (e) {}
    if (sessionStorage.getItem("maiz_osm")) return;
    sessionStorage.setItem("maiz_osm", "1");
    location.reload();
  }
  window.MZ_MAPA_FALLO = () => fallback(true);
  if (!USE_LEAFLET) {
  window.gm_authFailure = () => fallback(true);
  // Google no avisa por gm_authFailure cuando falta la facturación: escuchamos sus errores
  const ERR = /BillingNotEnabledMapError|ApiNotActivatedMapError|ApiTargetBlockedMapError|InvalidKeyMapError|RefererNotAllowedMapError|ExpiredKeyMapError|OverQuotaMapError/;
  const ce = console.error.bind(console);
  console.error = function () { try { if (ERR.test([...arguments].join(" "))) fallback(true); } catch (e) {} return ce.apply(console, arguments); };
  const vigila = setInterval(() => { if (document.querySelector(".gm-err-container, .gm-err-message")) { clearInterval(vigila); fallback(true); } }, 1200);
  setTimeout(() => clearInterval(vigila), 30000);

  // ---------- Carga de Google ----------
  let ready = false; const queue = [];
  const whenReady = fn => ready ? fn() : queue.push(fn);
  window.__maizGmReady = () => { ready = true; queue.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } }); };
  (MZ.cfgReady || Promise.resolve()).then(C => {
    const m = (C && C.mapa) || {};
    if (m.proveedor !== "google") { try { localStorage.setItem("maiz_mapa_prov", "osm"); } catch (e) {} sessionStorage.setItem("maiz_osm", "1"); location.reload(); return; }
    const key = (m.googleKey || DEFAULT_KEY).trim();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=es&region=SV&loading=async&callback=__maizGmReady`;
    s.async = true; s.onerror = fallback;
    document.head.appendChild(s);
    setTimeout(() => { if (!ready) fallback(); }, 15000);
  });

  // ---------- Estilo de la marca ----------
  const STYLE = [
    { elementType: "geometry", stylers: [{ color: "#f3ede3" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#6e4a33" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#fbf8f2" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfdcdf" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e7eedb" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d4e3c1" }] },
    { featureType: "poi.business", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fbe3a0" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9c76a" }] },
    { featureType: "transit", stylers: [{ visibility: "simplified" }] }
  ];

  const ll = a => Array.isArray(a) ? { lat: +a[0], lng: +a[1] } : (a && a.lat != null ? { lat: +a.lat, lng: +a.lng } : a);
  const toArr = p => [p.lat, p.lng];

  // ---------- Capas ----------
  class Layer {
    addTo(t) { (t instanceof Group) ? t._add(this) : this._attach(t); return this; }
    on(ev, fn) { (this._h = this._h || {})[ev] = fn; whenReady(() => this._bind && this._bind(ev, fn)); return this; }
    remove() { this._detach && this._detach(); return this; }
  }
  class Group extends Layer {
    constructor() { super(); this.items = []; this.map = null; }
    _add(l) { this.items.push(l); if (this.map) l._attach(this.map); }
    _attach(m) { this.map = m; this.items.forEach(l => l._attach(m)); }
    _detach() { this.items.forEach(l => l._detach && l._detach()); }
    clearLayers() { this.items.forEach(l => l._detach && l._detach()); this.items = []; return this; }
  }
  class Tile extends Layer { _attach() {} }

  class Marker extends Layer {
    constructor(pos, opts) { super(); this.pos = ll(pos); this.opts = opts || {}; this.obj = null; }
    getLatLng() { return Object.assign({}, this.pos); }
    setLatLng(p) { this.pos = ll(p); whenReady(() => { if (!this.obj) return; this.obj.setPosition ? this.obj.setPosition(this.pos) : this.obj.draw(); }); return this; }
    _attach(m) {
      this.map = m;
      whenReady(() => {
        if (this.obj) return;
        const g = google.maps, icon = this.opts.icon;
        if (icon && icon.html != null && !this.opts.draggable) {
          const self = this;
          const Ov = class extends g.OverlayView {
            onAdd() { this.div = document.createElement("div"); this.div.style.position = "absolute"; this.div.style.cursor = "pointer"; this.div.innerHTML = icon.html;
              this.div.addEventListener("click", e => { e.stopPropagation(); self._h && self._h.click && self._h.click({ target: self, latlng: self.getLatLng() }); });
              this.getPanes().overlayMouseTarget.appendChild(this.div); }
            draw() { const p = this.getProjection(); if (!p || !this.div) return; const pt = p.fromLatLngToDivPixel(new g.LatLng(self.pos.lat, self.pos.lng)); this.div.style.left = pt.x + "px"; this.div.style.top = pt.y + "px"; }
            onRemove() { this.div && this.div.remove(); this.div = null; }
          };
          this.obj = new Ov(); this.obj.setMap(m.g);
        } else {
          this.obj = new g.Marker({ position: this.pos, map: m.g, draggable: !!this.opts.draggable });
          if (this._h) Object.keys(this._h).forEach(ev => this._bind(ev, this._h[ev]));
        }
      });
    }
    _bind(ev, fn) {
      if (!this.obj || !this.obj.addListener || this.obj instanceof google.maps.OverlayView) return;
      if (this["_b_" + ev]) return; this["_b_" + ev] = 1;
      this.obj.addListener(ev, e => { if (e && e.latLng) this.pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }; fn({ target: this, latlng: this.getLatLng() }); });
    }
    _detach() { if (this.obj) this.obj.setMap(null); this.obj = null; }
  }

  class Circle extends Layer {
    constructor(pos, o) { super(); this.pos = ll(pos); this.o = o || {}; }
    _attach(m) { whenReady(() => { const g = google.maps; this.obj = new g.Marker({ position: this.pos, map: m.g, clickable: false,
      icon: { path: g.SymbolPath.CIRCLE, scale: this.o.radius || 8, fillColor: this.o.fillColor || "#2f7de1", fillOpacity: this.o.fillOpacity ?? 1, strokeColor: this.o.color || "#fff", strokeWeight: this.o.weight || 3 } }); }); }
    _detach() { this.obj && this.obj.setMap(null); this.obj = null; }
  }

  class Line extends Layer {
    constructor(pts, o) { super(); this.pts = pts.map(ll); this.o = o || {}; }
    _attach(m) { whenReady(() => { const g = google.maps, dash = !!this.o.dashArray;
      this.obj = new g.Polyline({ path: this.pts, map: m.g, strokeColor: this.o.color || "#8A5A3B", strokeOpacity: dash ? 0 : (this.o.opacity ?? 1), strokeWeight: this.o.weight || 4,
        icons: dash ? [{ icon: { path: "M 0,-1 0,1", strokeOpacity: this.o.opacity ?? 1, strokeColor: this.o.color || "#8A5A3B", scale: this.o.weight || 4 }, offset: "0", repeat: "16px" }] : [] }); }); }
    _detach() { this.obj && this.obj.setMap(null); this.obj = null; }
  }

  class Poly extends Layer {
    constructor(pts, o) { super(); this.pts = pts.map(ll); this.o = o || {}; }
    _attach(m) { whenReady(() => { const o = this.o; this.obj = new google.maps.Polygon({ paths: this.pts, map: m.g, clickable: false,
      strokeColor: o.color || "#2f7d4f", strokeWeight: o.weight ?? 1.5, strokeOpacity: o.opacity ?? .9, fillColor: o.fillColor || o.color || "#2f7d4f", fillOpacity: o.fillOpacity ?? .25 }); }); }
    _detach() { this.obj && this.obj.setMap(null); this.obj = null; }
  }

  class Bounds {
    constructor(pts) { this.pts = (pts || []).map(ll); this.p = 0; }
    pad(x) { const b = new Bounds(this.pts); b.p = x; return b; }
    isValid() { return this.pts.length > 0; }
  }

  // ---------- Mapa ----------
  class MapW {
    constructor(el, o) {
      this.el = typeof el === "string" ? document.getElementById(el) : el;
      this.o = o || {}; this.center = { lat: 13.86, lng: -89.78 }; this.zoom = 10; this.h = [];
      this.el.style.background = this.el.style.background || "#efe7da";
      whenReady(() => {
        const g = google.maps;
        this.g = new g.Map(this.el, {
          center: this.center, zoom: this.zoom, styles: STYLE, gestureHandling: this.o.dragging === false ? "none" : "greedy",
          clickableIcons: false, zoomControl: this.o.zoomControl !== false, fullscreenControl: this.o.dragging !== false,
          streetViewControl: this.o.dragging !== false, mapTypeControl: this.o.dragging !== false && this.o.typeControl !== false,
          mapTypeControlOptions: { style: g.MapTypeControlStyle.HORIZONTAL_BAR, position: g.ControlPosition.LEFT_BOTTOM, mapTypeIds: ["roadmap", "hybrid", "terrain"] },
          streetViewControlOptions: { position: g.ControlPosition.RIGHT_CENTER },
          zoomControlOptions: { position: g.ControlPosition.RIGHT_CENTER },
          fullscreenControlOptions: { position: g.ControlPosition.RIGHT_TOP }
        });
        this.g.addListener("zoom_changed", () => { this.zoom = this.g.getZoom(); });
        this.h.forEach(([ev, fn]) => this._bind(ev, fn));
        if (this._fit) this.fitBounds(this._fit);
      });
    }
    _bind(ev, fn) { if (ev === "click") this.g.addListener("click", e => fn({ latlng: { lat: e.latLng.lat(), lng: e.latLng.lng() } })); }
    on(ev, fn) { this.h.push([ev, fn]); if (this.g) this._bind(ev, fn); return this; }
    setView(c, z) { this.center = ll(c); if (z != null) this.zoom = z; whenReady(() => { this.g.setCenter(this.center); if (z != null) this.g.setZoom(z); }); return this; }
    panTo(c) { this.center = ll(c); whenReady(() => this.g.panTo(this.center)); return this; }
    setType(t) { whenReady(() => { this.g.setMapTypeId(t); this.g.setTilt(t === "satellite" || t === "hybrid" ? 45 : 0); }); return this; }
    getCenter() { if (this.g) { const c = this.g.getCenter(); return { lat: c.lat(), lng: c.lng() }; } return this.center; }
    getZoom() { return this.g ? this.g.getZoom() : this.zoom; }
    fitBounds(b) {
      if (!b || !b.pts || !b.pts.length) return this;
      if (!this.g) { this._fit = b; return this; }
      this._fit = null;
      if (b.pts.length === 1) { this.setView(b.pts[0], 15); return this; }
      const gb = new google.maps.LatLngBounds(); b.pts.forEach(p => gb.extend(p));
      this.g.fitBounds(gb, 40 + Math.round((b.p || 0) * 120));
      return this;
    }
    distance(a, b) { a = ll(a); b = ll(b); const R = 6371000, r = x => x * Math.PI / 180;
      const d = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(d)); }
    invalidateSize() { return this; }
    remove() { this.h = []; this.g = null; if (this.el) this.el.innerHTML = ""; }
  }

  window.L = {
    map: (el, o) => new MapW(el, o),
    tileLayer: () => new Tile(),
    layerGroup: () => new Group(),
    marker: (p, o) => new Marker(p, o),
    circleMarker: (p, o) => new Circle(p, o),
    polyline: (pts, o) => new Line(pts, o),
    polygon: (pts, o) => new Poly(pts, o),
    divIcon: o => ({ html: (o && o.html) || "" }),
    latLngBounds: pts => new Bounds(pts),
    _google: true
  };
  } // fin Google

  // ---------- Panel: sección "Mapa" dentro de Sitio ----------
  if (location.pathname.startsWith("/panel")) {
    const inject = () => {
      if (location.hash !== "#sitio") return;
      const view = document.getElementById("view"); if (!view || view.querySelector("#mapSec")) return;
      const secs = view.querySelectorAll(".ed-sec"); if (!secs.length) return;
      const m = (MZ.CFG().mapa) || {};
      const sec = document.createElement("div"); sec.className = "ed-sec glass"; sec.id = "mapSec";
      sec.innerHTML = `<h3>🗺️ Mapa</h3><p class="small muted" style="margin-bottom:12px">Google Maps se usa en el brief, en las fichas y en Ruta Maíz. Si la clave falla, el sitio muestra OpenStreetMap automáticamente.</p>
        <div class="field"><label class="lbl">Proveedor</label><select class="input" id="mpProv"><option value="google" ${m.proveedor !== "osm" ? "selected" : ""}>Google Maps (recomendado)</option><option value="osm" ${m.proveedor === "osm" ? "selected" : ""}>OpenStreetMap (gratis, sin clave)</option></select></div>
        <div class="field"><label class="lbl">Clave de API de Google Maps</label><input class="input" id="mpKey" value="${MZ.esc(m.googleKey || DEFAULT_KEY)}" autocomplete="off" spellcheck="false"><span class="hint">Empieza con AIza… Debe tener restricción de sitios web.</span></div>
        <button class="btn btn-primary btn-sm" id="mpSave">Guardar mapa</button>`;
      secs[1] ? secs[1].after(sec) : secs[0].after(sec);
      sec.querySelector("#mpSave").onclick = async () => {
        const key = sec.querySelector("#mpKey").value.trim(), prov = sec.querySelector("#mpProv").value;
        if (prov === "google" && !/^AIza[\w-]{30,}$/.test(key)) return MZ.toast("La clave no parece válida (debe empezar con AIza…)", 4000);
        try {
          await MZ.rpc("admin_set_config", { p_key: sessionStorage.getItem("maiz_key"), p_data: { mapa: { proveedor: prov, googleKey: key } } });
          sessionStorage.removeItem("maiz_cfg"); sessionStorage.removeItem("maiz_osm"); localStorage.removeItem("maiz_osm_hasta"); localStorage.setItem("maiz_mapa_prov", prov);
          MZ.toast("Mapa guardado ✓");
        } catch (e) { MZ.toast("No se pudo guardar"); }
      };
    };
    new MutationObserver(inject).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

/* Proyecto Maíz · idiomas (español, inglés, francés, alemán) */
(function () {
  const LANGS = { es: "Español", en: "English", fr: "Français", de: "Deutsch" };
  const D = {
    // ---- generales ----
    inicio: ["Inicio", "Home", "Accueil", "Start"],
    cerrar: ["Cerrar", "Close", "Fermer", "Schließen"],
    buscar: ["Buscar", "Search", "Rechercher", "Suchen"],
    todo: ["Todo", "All", "Tout", "Alle"],
    ver_mas: ["Ver más", "See more", "Voir plus", "Mehr anzeigen"],
    idioma: ["Idioma", "Language", "Langue", "Sprache"],
    cargando: ["Cargando…", "Loading…", "Chargement…", "Wird geladen…"],
    guardar: ["Guardar", "Save", "Enregistrer", "Speichern"],
    escribanos: ["Escríbanos", "Message us", "Écrivez-nous", "Schreiben Sie uns"],
    // ---- bitácora / pokédex ----
    bitacora: ["Bitácora de la reserva", "Reserve field guide", "Carnet de la réserve", "Reservat-Logbuch"],
    reserva: ["Reserva de Biosfera Apaneca-Ilamatepec", "Apaneca-Ilamatepec Biosphere Reserve", "Réserve de biosphère Apaneca-Ilamatepec", "Biosphärenreservat Apaneca-Ilamatepec"],
    vista_foto: ["Fotos", "Photos", "Photos", "Fotos"],
    vista_lista: ["Lista", "List", "Liste", "Liste"],
    sin_foto_aun: ["Buscando fotos…", "Finding photos…", "Recherche de photos…", "Fotos werden gesucht…"],
    sub_bitacora: ["Flora y fauna verificada de la Reserva de Biosfera Apaneca-Ilamatepec", "Verified flora and fauna of the Apaneca-Ilamatepec Biosphere Reserve", "Faune et flore vérifiées de la Réserve de biosphère Apaneca-Ilamatepec", "Geprüfte Flora und Fauna des Biosphärenreservats Apaneca-Ilamatepec"],
    cerca: ["Cerca de mí", "Near me", "Près de moi", "In meiner Nähe"],
    pokedex: ["Bitácora", "Field guide", "Carnet", "Logbuch"],
    explorar: ["Explorar y capturar", "Explore & catch", "Explorer et capturer", "Erkunden & fangen"],
    ranking: ["Ranking", "Leaderboard", "Classement", "Rangliste"],
    especies: ["especies", "species", "espèces", "Arten"],
    capturadas: ["capturadas", "caught", "capturées", "gefangen"],
    vistas: ["vistas", "seen", "vues", "gesehen"],
    registradas_aqui: ["especies registradas aquí", "species recorded here", "espèces recensées ici", "hier erfasste Arten"],
    esta_en: ["Usted está en", "You are in", "Vous êtes à", "Sie befinden sich in"],
    mas_cercana: ["Área protegida más cercana", "Nearest protected area", "Aire protégée la plus proche", "Nächstes Schutzgebiet"],
    a_km: ["a {n} km", "{n} km away", "à {n} km", "{n} km entfernt"],
    sin_ubicacion: ["Active su ubicación para ver qué especies viven donde usted está, o elija un área:", "Turn on your location to see which species live where you are, or pick an area:", "Activez votre position pour voir les espèces autour de vous, ou choisissez une aire :", "Aktivieren Sie Ihren Standort, um die Arten in Ihrer Nähe zu sehen, oder wählen Sie ein Gebiet:"],
    usar_ubicacion: ["Usar mi ubicación", "Use my location", "Utiliser ma position", "Meinen Standort verwenden"],
    escuchar: ["Escuchar", "Listen", "Écouter", "Anhören"],
    detener: ["Detener", "Stop", "Arrêter", "Stopp"],
    guia_voz: ["Guía por voz", "Voice guide", "Guide vocal", "Sprachführer"],
    ver_3d: ["Ver en 3D", "View in 3D", "Voir en 3D", "In 3D ansehen"],
    donde_vive: ["Dónde vive", "Where it lives", "Où elle vit", "Wo sie lebt"],
    descripcion: ["Descripción", "Description", "Description", "Beschreibung"],
    importancia: ["Por qué es importante", "Why it matters", "Pourquoi c'est important", "Warum sie wichtig ist"],
    sabia: ["¿Sabía que…?", "Did you know…?", "Le saviez-vous… ?", "Wussten Sie…?"],
    fuentes: ["Fuentes verificadas", "Verified sources", "Sources vérifiées", "Geprüfte Quellen"],
    texto_original: ["Texto original del inventario (español)", "Original inventory text (Spanish)", "Texte original de l'inventaire (espagnol)", "Originaltext des Inventars (Spanisch)"],
    foto: ["Foto", "Photo", "Photo", "Foto"],
    no_capturada: ["Aún no la captura. Búsquela en:", "Not caught yet. Look for it in:", "Pas encore capturée. Cherchez-la à :", "Noch nicht gefangen. Suchen Sie sie in:"],
    capturada_el: ["Capturada el {d}", "Caught on {d}", "Capturée le {d}", "Gefangen am {d}"],
    sin_modelo: ["Aún no hay un modelo 3D para esta especie. Mostramos la foto.", "No 3D model yet for this species. Showing the photo.", "Pas encore de modèle 3D pour cette espèce. Voici la photo.", "Noch kein 3D-Modell für diese Art. Wir zeigen das Foto."],
    modelo_ref: ["Modelo 3D de referencia · gire con el dedo", "Reference 3D model · drag to rotate", "Modèle 3D de référence · faites glisser pour tourner", "3D-Referenzmodell · zum Drehen ziehen"],
    otros_modelos: ["Otros modelos", "Other models", "Autres modèles", "Andere Modelle"],
    acerquese: ["Acérquese: está a {n} m", "Get closer: it's {n} m away", "Approchez-vous : à {n} m", "Gehen Sie näher: {n} m entfernt"],
    lanzar: ["¡Lanzar mazorca!", "Throw the corn!", "Lancer l'épi !", "Maiskolben werfen!"],
    toque_aro: ["Toque cuando el aro amarillo esté pequeño", "Tap when the yellow ring is small", "Touchez quand l'anneau jaune est petit", "Tippen Sie, wenn der gelbe Ring klein ist"],
    capturado: ["¡Capturada!", "Caught!", "Capturée !", "Gefangen!"],
    escapo: ["Se escapó… intente otra vez", "It got away… try again", "Elle s'est échappée… réessayez", "Entkommen… nochmal versuchen"],
    huyo: ["Se fue a esconder. Volverá pronto.", "It went into hiding. It will be back soon.", "Elle s'est cachée. Elle reviendra bientôt.", "Sie hat sich versteckt. Sie kommt bald zurück."],
    intentos: ["Intentos: {n}", "Tries: {n}", "Essais : {n}", "Versuche: {n}"],
    puntos: ["puntos", "points", "points", "Punkte"],
    fuera_reserva: ["Usted está fuera de la reserva. Las especies aparecen dentro de las áreas protegidas y en los locales de Ruta Maíz.", "You are outside the reserve. Species appear inside the protected areas and at Ruta Maíz places.", "Vous êtes hors de la réserve. Les espèces apparaissent dans les aires protégées et chez les lieux Ruta Maíz.", "Sie sind außerhalb des Reservats. Arten erscheinen in den Schutzgebieten und an Ruta-Maíz-Orten."],
    ir_area: ["Ir a la más cercana", "Go to the nearest", "Aller à la plus proche", "Zum nächsten"],
    alias: ["Su nombre de explorador", "Your explorer name", "Votre nom d'explorateur", "Ihr Entdeckername"],
    guardar_puntaje: ["Guardar mi puntaje", "Save my score", "Enregistrer mon score", "Punktestand speichern"],
    su_puesto: ["Su puesto: #{n}", "Your rank: #{n}", "Votre rang : #{n}", "Ihr Rang: #{n}"],
    presumir: ["Compartir mis capturas", "Share my catches", "Partager mes captures", "Meine Fänge teilen"],
    rareza_comun: ["Común", "Common", "Commune", "Häufig"],
    rareza_rara: ["Rara", "Rare", "Rare", "Selten"],
    rareza_legendaria: ["Legendaria", "Legendary", "Légendaire", "Legendär"],
    filtros_capt: ["Solo capturadas", "Caught only", "Capturées seulement", "Nur gefangene"],
    entro_area: ["Entró a {a}. Aquí viven {n} especies registradas.", "You entered {a}. {n} species are recorded here.", "Vous êtes entré dans {a}. {n} espèces y sont recensées.", "Sie haben {a} betreten. Hier sind {n} Arten erfasst."],
    simular: ["Simular que estoy en…", "Pretend I'm at…", "Simuler que je suis à…", "Simulieren, dass ich hier bin…"],
    premios: ["Premios", "Rewards", "Récompenses", "Belohnungen"],
    // grupos
    g_Mamífero: ["Mamíferos", "Mammals", "Mammifères", "Säugetiere"],
    g_Ave: ["Aves", "Birds", "Oiseaux", "Vögel"],
    g_Reptil: ["Reptiles", "Reptiles", "Reptiles", "Reptilien"],
    g_Anfibio: ["Anfibios", "Amphibians", "Amphibiens", "Amphibien"],
    g_Invertebrado: ["Invertebrados", "Invertebrates", "Invertébrés", "Wirbellose"],
    g_Planta: ["Plantas", "Plants", "Plantes", "Pflanzen"],
    g_Lugar: ["Lugares", "Places", "Lieux", "Orte"],
    g_Cultura: ["Cultura", "Culture", "Culture", "Kultur"],
    // estados
    "e_En peligro": ["En peligro", "Endangered", "En danger", "Stark gefährdet"],
    e_Amenazada: ["Amenazada", "Threatened", "Menacée", "Bedroht"],
    "e_Preocupación menor": ["Preocupación menor", "Least concern", "Préoccupation mineure", "Nicht gefährdet"],
    "e_No evaluada": ["No evaluada", "Not evaluated", "Non évaluée", "Nicht bewertet"],
    e_Introducida: ["Introducida", "Introduced", "Introduite", "Eingeführt"],
    "e_Especie nueva para la ciencia": ["Especie nueva para la ciencia", "New to science", "Nouvelle pour la science", "Neu für die Wissenschaft"]
  };
  const IDX = { es: 0, en: 1, fr: 2, de: 3 };
  let lang = (() => {
    const q = new URLSearchParams(location.search).get("lang"); if (q && IDX[q] != null) { localStorage.setItem("maiz_lang", q); return q; }
    const s = localStorage.getItem("maiz_lang"); if (s && IDX[s] != null) return s;
    const n = (navigator.language || "es").slice(0, 2); return IDX[n] != null ? n : "es";
  })();
  document.documentElement.lang = lang;
  function t(k, vars) {
    const r = D[k]; let s = r ? (r[IDX[lang]] || r[0]) : k;
    if (vars) for (const v in vars) s = s.replace("{" + v + "}", vars[v]);
    return s;
  }
  function setLang(l) { if (IDX[l] == null) return; localStorage.setItem("maiz_lang", l); location.reload(); }
  function picker() {
    return `<label class="lang-pick glass" title="${t("idioma")}"><span>🌐</span><select aria-label="${t("idioma")}" onchange="I18N.setLang(this.value)">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
  }
  // traduce elementos marcados con data-i18n="clave"
  function apply(root) { (root || document).querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); }); }
  window.I18N = { t, lang: () => lang, setLang, picker, apply, LANGS, add: (obj) => Object.assign(D, obj) };
})();

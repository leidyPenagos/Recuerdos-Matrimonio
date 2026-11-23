(() => {
  const cfg = window.APP_CONFIG || {};
  const ready = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("TU-PROYECTO") && !cfg.SUPABASE_ANON_KEY.includes("TU_CLAVE");
  const client = ready ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const bucket = "recuerdos";
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("files");
  const preview = document.getElementById("preview");
  const status = document.getElementById("status");
  const submit = document.getElementById("submitButton");
  let selected = [];

  const say = (message, kind="") => { status.textContent = message; status.className = `status ${kind}`; };
  const safeName = name => name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]/g,"-").slice(-100);

  fileInput.addEventListener("change", () => {
    selected = Array.from(fileInput.files || []);
    preview.innerHTML = "";
    document.getElementById("fileCount").textContent = selected.length ? `${selected.length} archivo(s) seleccionado(s)` : "Puedes seleccionar varios archivos.";
    selected.forEach((file, i) => {
      const item = document.createElement("div");
      item.className = "preview-item";
      const name = document.createElement("span");
      name.textContent = `${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`;
      const remove = document.createElement("button");
      remove.type = "button"; remove.textContent = "Quitar";
      remove.addEventListener("click", () => {
        selected.splice(i,1);
        const dt = new DataTransfer(); selected.forEach(f => dt.items.add(f)); fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event("change"));
      });
      item.append(name,remove); preview.append(item);
    });
  });

form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!client) {
    return say("Configura Supabase en config.js.", "error");
  }

  const guest = document.getElementById("guestName").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!guest) return say("Escribe tu nombre.", "error");

  if (!selected.length) {
    return say("Selecciona tus fotografías y videos.", "error");
  }

  if (selected.length > 20) {
    return say("Puedes seleccionar máximo 20 archivos por envío.", "error");
  }

  const invalid = selected.find(file =>
    !/^image\/(jpeg|png|webp)$|^video\/(mp4|quicktime)$/.test(file.type) ||
    file.size > 50 * 1024 * 1024
  );

  if (invalid) {
    return say(`Archivo no válido: ${invalid.name}. Máximo 50 MB.`, "error");
  }

  submit.disabled = true;
  fileInput.disabled = true;
  submit.textContent = `Subiendo ${selected.length} archivos...`;

  const filesToUpload = [...selected];

  try {
    say(`Subiendo ${filesToUpload.length} archivos. Espera un momento...`);

    // 1. Subir todos los archivos simultáneamente.
    const results = await Promise.all(
      filesToUpload.map(async file => {

        const path =
          `${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;

        const { error } = await client.storage
          .from(bucket)
          .upload(path, file, {
            upsert: false,
            contentType: file.type
          });

        if (error) {
          throw new Error(`${file.name}: ${error.message}`);
        }

        const { data } = client.storage
          .from(bucket)
          .getPublicUrl(path);

        return {
          nombre: guest,
          mensaje: message,
          archivo_url: data.publicUrl,
          archivo_nombre: file.name,
          tipo: file.type.startsWith("video/")
            ? "video"
            : "imagen"
        };
      })
    );

    // 2. Guardar todos los registros juntos en MongoDB no:
    // se guardan en Supabase, mediante una sola inserción SQL.
    const { error: dbError } = await client
      .from("recuerdos")
      .insert(results);

    if (dbError) throw dbError;

    // 3. Mostrar confirmación.
    say(
      `¡Perfecto! Se subieron ${results.length} archivos correctamente. ♡`,
      "success"
    );

    // 4. Limpiar formulario.
    form.reset();
    selected = [];
    preview.innerHTML = "";

    document.getElementById("fileCount").textContent =
      "Puedes seleccionar varias fotografías y videos a la vez.";

    // 5. Actualizar galería.
    await loadGallery();

  } catch (error) {
    console.error("ERROR DE CARGA:", error);

    say(
      `No se pudo completar el envío: ${error.message}`,
      "error"
    );

  } finally {
    submit.disabled = false;
    fileInput.disabled = false;
    submit.textContent = "Enviar todos mis recuerdos ♡";
  }
});

  async function loadGallery() {
    const gallery = document.getElementById("gallery");
    if (!client) { gallery.innerHTML = '<p class="muted">Configura Supabase para activar la galería.</p>'; return; }
    gallery.innerHTML = '<p class="muted">Cargando recuerdos...</p>';
    const { data, error } = await client.from("recuerdos").select("*").order("created_at",{ascending:false}).limit(100);
    if (error) { gallery.textContent = "No fue posible cargar la galería."; console.error(error); return; }
    gallery.innerHTML = "";
    if (!data.length) { gallery.innerHTML = '<p class="muted">Todavía no hay recuerdos. ¡Sé el primero en compartir uno!</p>'; return; }
    data.forEach(item => {
      const card = document.createElement("article"); card.className="gallery-card";
      let media;
      if (item.tipo === "video") { media=document.createElement("video"); media.controls=true; media.preload="metadata"; }
      else { media=document.createElement("img"); media.loading="lazy"; media.alt="Fotografía compartida en la boda"; }
      media.src=item.archivo_url;
      const meta=document.createElement("div"); meta.className="gallery-meta";
      const strong=document.createElement("strong"); strong.textContent=item.nombre || "Invitado";
      const note=document.createElement("span"); note.textContent=item.mensaje || "Un recuerdo de nuestra boda";
      meta.append(strong,note); card.append(media,meta); gallery.append(card);
    });
  }
  document.getElementById("refreshGallery").addEventListener("click",loadGallery);
  document.getElementById("shareButton").addEventListener("click",async()=>{
    const shareData={title:"Leidy & Daniel",text:"Comparte tus fotografías y videos de nuestra boda.",url:location.href};
    if(navigator.share){try{await navigator.share(shareData)}catch(e){}}
    else {try{await navigator.clipboard.writeText(location.href);alert("¡Enlace copiado!")}catch(e){alert(location.href)}}
  });
  const wa=document.getElementById("whatsappButton");
  const number=(cfg.WHATSAPP_NUMBER||"").replace(/\D/g,"");
  wa.href=`https://wa.me/${number}?text=${encodeURIComponent("¡Hola! Te comparto la página de recuerdos de la boda de Leidy y Daniel: "+location.href)}`;
  if(!number || number.includes("XXXXXXXX")) wa.addEventListener("click",e=>{e.preventDefault();alert("Configura tu número de WhatsApp en config.js para activar este botón.")});
  loadGallery();
})();

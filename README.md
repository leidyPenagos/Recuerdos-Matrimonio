# Boda Leidy & Daniel

Sitio estático para compartir fotos y videos de la boda del 5 de diciembre de 2026. Usa Supabase (base de datos + Storage) y se puede publicar gratis en Netlify.

## Importante sobre privacidad
Esta versión inicial tiene galería pública: cualquier persona que tenga el enlace puede ver los recuerdos. Las políticas permiten a visitantes anónimos subir archivos y consultar la galería. No almacenes documentos sensibles. Para una galería privada se debe añadir autenticación y cambiar las políticas RLS.

## 1. Crear Supabase
1. Crea un proyecto en https://supabase.com/ (plan Free).
2. En Storage crea un bucket llamado `recuerdos` y déjalo como **Public bucket**.
3. Abre SQL Editor y ejecuta todo el contenido de `supabase.sql`.
4. En Project Settings > API copia Project URL y la clave `anon` / publishable. Nunca uses `service_role` en el navegador.

## 2. Configurar la web
1. Copia `config.example.js` y renombra la copia a `config.js`.
2. Completa:
   - `SUPABASE_URL`: Project URL.
   - `SUPABASE_ANON_KEY`: clave pública anon/publishable.
   - `WHATSAPP_NUMBER`: número con indicativo. Para Colombia, 57 + número, sin +, espacios ni guiones.
3. Abre `index.html` con Live Server para probar.

No subas secretos al repositorio. La clave anon está diseñada para usarse en el navegador; la seguridad depende de las políticas RLS.

## 3. Publicar gratis en Netlify
1. Sube la carpeta a un repositorio GitHub (incluye `config.js` solo si aceptas que sus valores públicos queden visibles; la clave anon no es secreta, pero evita publicar configuraciones privadas).
2. En https://app.netlify.com/ crea un sitio desde GitHub.
3. No necesitas comando de build ni directorio de publicación especial: publica la carpeta raíz.
4. Copia el enlace público y pruébalo desde otro teléfono.

También puedes arrastrar la carpeta al despliegue manual de Netlify Drop.

## 4. Límites y WhatsApp
- Supabase Free tiene límites de almacenamiento, transferencia y tamaño por archivo que pueden cambiar. La web limita cada archivo a 50 MB; comprueba los límites vigentes de tu proyecto antes del evento.
- Los servicios gratuitos pueden cambiar sus condiciones y cuotas. Mantén una copia descargada de los recuerdos.
- El botón de WhatsApp comparte el enlace de la página con un mensaje preparado. No envía automáticamente las fotos/videos al WhatsApp de los novios. Para eso se necesita una integración oficial de WhatsApp Business Platform, que puede tener cargos y requisitos.
- La galería es pública en esta versión: no compartas el enlace fuera de tus invitados si no quieres que más personas la vean.

## 5. Recomendaciones antes de la boda
- Haz pruebas con imágenes y videos reales desde Android y iPhone.
- Descarga una copia de los archivos importantes.
- Revisa el espacio disponible en Supabase antes del evento.
- No publiques la clave `service_role` ni contraseñas.

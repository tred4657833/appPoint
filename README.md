# Centro de Aplicaciones (Electron + Ubuntu)

Tienda y gestor de aplicaciones que funciona contra el sistema real: detecta el equipo,
lee su carga en vivo, busca en los catálogos oficiales de Flathub, Snap Store y APT,
instala de verdad, maneja extensiones de GNOME Shell y tiene una sección de apps web
de oficina (Trello, Notion, etc.) más la suite de oficina instalada en tu sistema.

## Cómo ejecutarlo

```bash
cd appPoint
npm install          # descarga Electron
npm start
```

### Si ves el error del sandbox de Chromium

```
FATAL setuid_sandbox_host.cc(158) ... chrome-sandbox ... owned by root and has mode 4755
```

Ocurre porque Electron necesita que su binario de sandbox sea de root. Dos salidas:

```bash
# opción A: arreglar permisos (hay que repetirlo tras cada npm install)
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
npm start

# opción B: arrancar sin sandbox (más simple en desarrollo)
npx electron . --no-sandbox
```

Para dejar la opción B fija, cambia en `package.json`:
```json
"scripts": { "start": "electron . --no-sandbox" }
```

Para generar un `.deb` y un `.AppImage` (ahí el sandbox ya viene bien configurado):

```bash
npm run dist
```

## Qué es real aquí

| Parte de la interfaz | De dónde sale |
|---|---|
| Nombre y tipo de equipo | `/sys/devices/virtual/dmi/id/*` (fabricante, modelo, placa, chasis) |
| Sistema, kernel, escritorio | `/etc/os-release`, `os.release()`, `XDG_CURRENT_DESKTOP` |
| CPU / RAM / disco / batería | `/proc/stat`, `/proc/meminfo`, `df`, `/sys/class/power_supply` — se refrescan cada 3 s |
| Catálogo de la tienda | `flathub.org/api/v2`, `api.snapcraft.io/v2/snaps/find`, `apt-cache search`, con caché en memoria (4–10 min) para que la navegación sea instantánea |
| Feed infinito de "Tienda" | recorre colecciones reales de Flathub (`popular`, `recently-updated`, `recently-added`) y categorías reales de Snap, cargando una sección al llegar al final del scroll — nunca se agota |
| Apps web | Trello, Notion, Reddit, Gmail, GitHub… y **cualquier sitio**: se instalan como accesos `.desktop` propios que abren en su propia ventana (`--app=` de Chrome/Chromium/Brave/Edge, lo que tengas instalado). Viven en la **Tienda** (no hay pestaña aparte) |
| Búsqueda de apps web | al buscar en la Tienda se ofrecen las páginas conocidas que coinciden y variaciones de dominio (`reddit.com`, `.org`, `.fun`, `.site`…) que **de verdad resuelven por DNS**; tú eliges cuál instalar |
| Dev y Oficina | paquetes reales de Flathub (categoría *Development* / *Office*), Snap (`development` / `productivity`) y APT (lista curada), mezclados por turnos, más sus apps web |
| Suite de oficina de Ubuntu | se detecta leyendo la categoría `Office` de los `.desktop` ya instalados (LibreOffice, etc.) |
| Vista previa de una app | botón "Ver página" abre una `BrowserWindow` nueva con la ficha real (Flathub, Snapcraft, packages.ubuntu.com o el sitio de la webapp) |
| Aplicaciones instaladas | archivos `.desktop` de todas las rutas XDG + `flatpak list` + `snap list` |
| Iconos | tema local (`/usr/share/icons`, `hicolor`, `pixmaps`) para apps del sistema; URL directa de Flathub/Snap con un tamaño alterno de respaldo si el primero falla, y favicon real de Google para las apps web |
| Instalación | `flatpak install --user`, `pkexec snap install`, `pkexec apt-get install` con progreso real |
| Extensiones | `extensions.gnome.org` + `gnome-extensions install/enable` |
| Actualizaciones | `flatpak remote-ls --updates`, `snap refresh --list`, `apt list --upgradable` |

## Cómo se usa la interfaz

- **Clic en cualquier app**: abre un modal con icono, descripción, publicador, versión/tamaño y
  tres acciones: *Instalar*, *Ver página* (abre una ventana nueva con la ficha real) y *Cancelar*.
  Si la app ya está instalada, el botón cambia a *Abrir*.
- **Al instalar**: aparece abajo a la izquierda el panel flotante de descarga con el porcentaje real
  del instalador. *Cancelar* mata el proceso.
- **Con la app minimizada o en segundo plano**: si hay una instalación en curso y minimizas appPoint (o te
  cambias a otra aplicación), aparece una mini ventana —como la de carga— en la esquina inferior derecha con el
  progreso real, *Cancelar* y *Ver appPoint*. Al volver a appPoint se cierra sola. Si estorba, el botón redondo
  de arriba la minimiza (queda en la barra de tareas) y no vuelve a molestar hasta la próxima vez que salgas de
  la app; cuando la instalación termina o falla se restaura sola un momento para avisarte.
- **Configuración → Apariencia**: modo **Oscuro** (predeterminado) o **Claro**, y la barra lateral a la
  **Izquierda** (predeterminado) o a la **Derecha**. Los cambios se aplican al instante y se guardan
  (`localStorage`, igual que el idioma), así que se conservan al cerrar y abrir la app. La mini ventana de
  instalación también sigue el tema. En ventanas muy angostas (< 760 px) el menú sigue saliendo desde la izquierda.
- **Recomendadas y Selección de expertos**: carruseles horizontales de 20 apps cada uno, con flechas ‹ › (o
  trackpad / Shift + rueda). El tamaño de cada sección se cambia en `SECTION_SIZES` de `src/renderer.js`.
- **Al terminar**: sale por unos segundos el panel flotante de la derecha con la app recién
  instalada y el botón *Abrir*, que la lanza de verdad.
- **Tienda**: al hacer scroll hasta el final carga sola la siguiente sección de apps reales — es
  un feed prácticamente ilimitado que va recorriendo categorías de Flathub y Snap.
- **Carga**: cada sección muestra placeholders animados y la página no pinta las tarjetas hasta que sus
  iconos terminaron de cargar (con un tope de 7 s para que una red lenta no la deje colgada).
- **Apps web en la Tienda**: bajo *Recomendadas* hay una sección de apps web populares. Al buscar
  (por ejemplo `reddit`) aparece arriba el bloque *Apps web para “reddit”* con las variaciones que existen;
  *Ver página* abre la dirección para comprobarla y *Instalar* crea la app. También acepta direcciones
  completas (`https://algo.org/ruta`).
- **Oficina** y **Dev**: apps nativas (Flatpak, Snap, APT) y apps web; Oficina además muestra tu suite
  ya instalada (LibreOffice).
- **Lupa**: despliega la barra de búsqueda (también con `Ctrl+F`). Busca en los tres catálogos a la
  vez, con retardo de 420 ms. `Esc` la cierra.
- **Instaladas**: un clic abre la aplicación (`gio launch` sobre su `.desktop`), clic derecho abre el
  modal con la opción de desinstalar. Tiene su propia barra de búsqueda (nombre, descripción u origen,
  sin distinguir mayúsculas ni acentos; `Ctrl+F` la enfoca; `Esc` la limpia).
- **Orígenes**: las tres casillas de la barra lateral filtran Flatpak / Snap / APT; se desactivan
  solas si ese backend no está en el equipo.
- **Controles de ventana**: los tres puntos de arriba a la izquierda minimizan, maximizan y cierran
  de verdad; doble clic en la franja superior también maximiza.

## Permisos

Flatpak se instala en el ámbito del usuario, así que no pide contraseña. Snap y APT sí requieren
privilegios: la app llama a `pkexec`, de modo que Polkit muestra el diálogo del sistema. Si `pkexec`
no está disponible, instala `policykit-1`.

## Limitaciones conocidas

- Snap y APT no exponen un porcentaje tan fino como Flatpak; mientras no llega un porcentaje real la
  barra se muestra indeterminada y el texto refleja la etapa que reporta el instalador.
- Las extensiones de GNOME pueden necesitar cerrar sesión para aparecer en la barra superior.
- La búsqueda de APT usa `apt-cache`, que no trae iconos: esas tarjetas usan un mosaico con la inicial.

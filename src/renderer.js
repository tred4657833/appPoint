'use strict';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* ─────────────────────────── i18n ─────────────────────────── */

const STRINGS = {
  en: {
    'app.title': 'appPoint',
    'status.loading': 'loading', 'stat.disk': 'Disk', 'device.detecting': 'Detecting device…',
    'nav.store': 'Store', 'nav.installed': 'Installed', 'nav.extensions': 'Extensions',
    'nav.office': 'Office', 'nav.dev': 'Dev', 'nav.updates': 'Updates', 'nav.thisDevice': 'This device', 'nav.settings': 'Settings',
    'sources.label': 'Sources',
    'store.webTitle': 'Web apps', 'store.webHint': 'Install any website as its own app: it opens in its own window, no browser tabs.',
    'store.webResultsTitle': 'Web apps for “{q}”', 'store.webResultsHint': 'Pick the address you want. “View page” lets you check it before installing.',
    'store.checkingWeb': 'Checking web addresses…',
    'webapp.generated': 'Website {host}, installed as a standalone app.',
    'installed.searchPlaceholder': 'Search installed apps…', 'installed.noMatches': 'No installed app matches your search.',
    'dev.nativeTitle': 'Developer apps', 'dev.nativeHint': 'Flatpak, Snap and APT packages for programming.',
    'office.nativeTitle': 'Office apps', 'office.nativeHint': 'Flatpak, Snap and APT packages for documents, mail and PDFs.',
    'store.recommendedFor': 'Recommended for', 'store.allApps': 'All apps',
    'store.topRank': 'Top apps', 'store.expertsPicks': "Our experts' picks: apps",
    'store.searchPlaceholder': 'Search an app: gimp, obs, vscode…', 'action.search': 'Search',
    'store.noResults': 'No results. Try another name.', 'store.loadingMore': 'Loading more apps…',
    'store.allCatalog': 'Full catalog', 'store.resultsFor': 'Results for “{q}”',
    'store.loadingCatalog': 'Loading catalog…', 'store.searching': 'Searching “{q}”…',
    'office.title': 'Office web apps',
    'office.hint': 'Installed as standalone shortcuts: they open in their own window, no browser tabs.',
    'office.suiteTitle': 'Ubuntu office suite', 'office.suiteSearching': 'Looking for LibreOffice and installed office tools…',
    'office.suiteReady': 'Already installed on your system — one click opens them.',
    'office.suiteMissing': 'No LibreOffice or other office suite detected. Install it from the Store.',
    'office.findLibreOffice': 'Find LibreOffice in the Store',
    'installed.title': 'Apps on this device',
    'installed.hint': 'Click to open. Use the trash icon to uninstall any app — Flatpak, Snap, APT or web app.',
    'installed.empty': 'No apps with a shortcut on this device yet.',
    'ext.title': 'GNOME Shell Extensions', 'ext.querying': 'Querying extensions.gnome.org…',
    'ext.notGnome': 'Your desktop is not GNOME Shell, so extensions can\u2019t be installed here.',
    'ext.readyInfo': 'GNOME Shell {version} · installs for your user and enables itself.',
    'ext.noMatches': 'No extensions match.', 'ext.catalogError': 'Could not query the catalog: {msg}',
    'ext.installed': 'Installed',
    'updates.title': 'Available updates', 'action.refresh': 'Check again',
    'updates.checking': 'Checking sources…', 'updates.upToDate': 'Everything is up to date.',
    'updates.packages': '{source} · {n} package{plural}', 'action.update': 'Update', 'action.updating': 'Updating…',
    'updates.applied': '{source} updated', 'updates.failed': 'The update didn\u2019t finish cleanly',
    'action.open': 'Open', 'action.viewPage': 'View page', 'action.cancel': 'Cancel',
    'action.uninstall': 'Uninstall', 'action.close': 'Close', 'action.install': 'Install',
    'action.confirmUninstall': 'Uninstall {name}? This removes the package from your device.',
    'sheet.noDescription': 'No description available.', 'sheet.webapp': 'Web app', 'sheet.extension': 'GNOME extension',
    'download.downloading': 'Downloading', 'download.installingExtension': 'Installing extension', 'download.creatingShortcut': 'Creating shortcut',
    'stage.preparing': 'Preparing', 'stage.starting': 'Starting', 'stage.searching-browser': 'Looking for a browser',
    'stage.downloading-icon': 'Downloading icon', 'stage.creating-shortcut': 'Creating shortcut', 'stage.ready': 'Done',
    'stage.downloading': 'Downloading', 'stage.installing': 'Installing', 'stage.cancelling': 'Cancelling…',
    'install.finished': 'Installation finished', 'install.readyNote': 'Source {source} · ready to use',
    'toast.opening': 'Opening {name}', 'toast.cantOpen': 'Couldn\u2019t open it', 'toast.uninstalling': 'Uninstalling {name}…',
    'toast.uninstalled': '{name} was uninstalled', 'toast.uninstallFailed': 'Couldn\u2019t uninstall',
    'toast.alreadyInstalled': '{name} is already installed on this device', 'toast.installCancelled': 'Install of {name} cancelled',
    'toast.installFailed': 'Couldn\u2019t install {name}', 'toast.catalogError': 'Could not query the catalog: {msg}',
    'toast.feedError': 'Could not load more of the catalog: {msg}', 'toast.startupError': 'Startup error: {msg}',
    'toast.previewFailed': 'Couldn\u2019t open the preview', 'toast.searchInInstalled': 'Find the app under Installed',
    'toast.launchOpenLater': 'Look for it under Installed once ready',
    'spec.device': 'Device', 'spec.type': 'Type', 'spec.system': 'System', 'spec.kernel': 'Kernel',
    'spec.desktop': 'Desktop', 'spec.processor': 'Processor', 'spec.graphics': 'Graphics', 'spec.memory': 'Memory',
    'spec.storage': 'Storage', 'spec.battery': 'Battery', 'spec.user': 'User', 'spec.uptimeSince': 'Powered on for',
    'spec.board': ' · board {board}', 'spec.threads': 'threads', 'spec.total': 'total', 'spec.available': 'available',
    'spec.free': 'free', 'spec.pluggedIn': 'Plugged into power', 'spec.notDetected': 'None detected',
    'formFactor.Desktop': 'Desktop', 'formFactor.Tower': 'Tower', 'formFactor.Laptop': 'Laptop',
    'formFactor.Tablet': 'Tablet', 'formFactor.Convertible': 'Convertible', 'formFactor.Device': 'Device',
    'desktop.unknown': 'Unknown', 'desktop.over': ' over {session}',
    'battery.Charging': 'charging', 'battery.Discharging': 'on battery', 'battery.AC': 'Plugged in', 'battery.Unknown': 'unknown',
    'flag.installed': 'installed', 'flag.web': 'web',
    'status.ready': 'ready', 'status.noFlathub': 'no Flathub', 'status.notInstalled': 'not installed', 'status.notAvailable': 'not available',
    'settings.title': 'Settings', 'settings.language': 'Store language',
    'settings.languageNote': 'Changes the Store\u2019s interface language. English is the default.',
    'settings.appearance': 'Appearance', 'settings.themeDark': 'Dark', 'settings.themeLight': 'Light',
    'settings.sidebar': 'Sidebar position', 'settings.sideLeft': 'Left', 'settings.sideRight': 'Right',
    'settings.appearanceNote': 'Your choices are saved and restored the next time you open the Store.',
    'banner.editorsPick': "Editor\u2019s pick", 'banner.trending': 'Trending now', 'banner.newThisWeek': 'New this week',
    'banner.staffFavorite': 'Staff favorite', 'banner.viewApp': 'View',
    'hero.free': 'Free', 'hero.install': 'Install',
    'cb.views': 'Views',
    'err.no-preview-page': 'No page available for this app', 'err.flatpak-missing': 'Flatpak isn\u2019t installed. Install it with: sudo apt install flatpak',
    'err.snap-missing': 'Snap isn\u2019t available on this device', 'err.apt-missing': 'APT isn\u2019t available',
    'err.unknown-source': 'Unknown source', 'err.installer-exit-code': 'The installer exited with code {code}',
    'err.not-gnome': 'This desktop isn\u2019t GNOME, extensions don\u2019t apply', 'err.extension-incompatible': 'This extension has no version compatible with your GNOME',
    'err.download-failed': 'Couldn\u2019t download: {msg}', 'err.extension-install-failed': 'gnome-extensions install failed',
    'err.invalid-server-response': 'Invalid response from the server', 'err.timeout': 'Timed out',
    'err.no-launch-method': 'Couldn\u2019t find a way to open this app',
    'err.remove-failed': 'Couldn\u2019t remove the shortcut',
    'note.added-as-app': 'Added as a standalone app under Installed', 'note.opens-in-browser': 'Will open with your default browser',
    'note.may-need-logout': 'May need a logout to activate',
    'webapp.summary.trello': 'Kanban boards to organize projects and team tasks.',
    'webapp.summary.notion': 'Notes, docs, wikis and databases in one place.',
    'webapp.summary.google-docs': 'Collaborative word processor in the cloud.',
    'webapp.summary.google-sheets': 'Collaborative spreadsheets in the cloud.',
    'webapp.summary.outlook': 'Mail, calendar and contacts from Microsoft 365.',
    'download.queued': '{n} queued',
    'win.close': 'Close', 'win.minimize': 'Minimize', 'win.maximize': 'Maximize',
    'mini.showApp': 'Show appPoint',
    'webapp.summary.slack': 'Team messaging and channels.',
    'dev.title': 'Developer tools', 'dev.hint': 'Installed as standalone shortcuts: they open in their own window, no browser tabs.',
  },
  es: {
    'app.title': 'appPoint',
    'win.close': 'Cerrar', 'win.minimize': 'Minimizar', 'win.maximize': 'Maximizar',
    'status.loading': 'cargando', 'stat.disk': 'Disco', 'device.detecting': 'Detectando equipo…',
    'nav.store': 'Tienda', 'nav.installed': 'Instaladas', 'nav.extensions': 'Extensiones',
    'nav.office': 'Oficina', 'nav.dev': 'Dev', 'nav.updates': 'Actualizaciones', 'nav.thisDevice': 'Este equipo', 'nav.settings': 'Configuración',
    'sources.label': 'Orígenes',
    'store.webTitle': 'Apps web', 'store.webHint': 'Instala cualquier sitio web como app propia: abre en su propia ventana, sin pestañas de navegador.',
    'store.webResultsTitle': 'Apps web para “{q}”', 'store.webResultsHint': 'Elige la dirección que quieres. “Ver página” te deja revisarla antes de instalar.',
    'store.checkingWeb': 'Comprobando direcciones web…',
    'webapp.generated': 'Sitio {host}, instalado como app independiente.',
    'installed.searchPlaceholder': 'Buscar en instaladas…', 'installed.noMatches': 'Ninguna app instalada coincide con tu búsqueda.',
    'dev.nativeTitle': 'Apps para desarrollo', 'dev.nativeHint': 'Paquetes Flatpak, Snap y APT para programar.',
    'office.nativeTitle': 'Apps de oficina', 'office.nativeHint': 'Paquetes Flatpak, Snap y APT para documentos, correo y PDF.',
    'store.recommendedFor': 'Recomendadas para', 'store.allApps': 'Todas las aplicaciones',
    'store.topRank': 'Aplicaciones más populares', 'store.expertsPicks': 'Selección de nuestros expertos: aplicaciones',
    'store.searchPlaceholder': 'Busca una app: gimp, obs, vscode…', 'action.search': 'Buscar',
    'store.noResults': 'Sin resultados. Prueba con otro nombre.', 'store.loadingMore': 'Cargando más aplicaciones…',
    'store.allCatalog': 'Todo el catálogo', 'store.resultsFor': 'Resultados para “{q}”',
    'store.loadingCatalog': 'Cargando catálogo…', 'store.searching': 'Buscando “{q}”…',
    'office.title': 'Apps web de oficina',
    'office.hint': 'Se instalan como accesos directos independientes: abren en su propia ventana, sin pestañas de navegador.',
    'office.suiteTitle': 'Suite de oficina de Ubuntu', 'office.suiteSearching': 'Buscando LibreOffice y utilidades de oficina instaladas…',
    'office.suiteReady': 'Ya instaladas en tu sistema — un clic las abre.',
    'office.suiteMissing': 'No se detectó LibreOffice ni otra suite de oficina. Instálala desde la Tienda.',
    'office.findLibreOffice': 'Buscar LibreOffice en la Tienda',
    'installed.title': 'Aplicaciones de este equipo',
    'installed.hint': 'Un clic abre la aplicación. Usa el ícono de basura para desinstalar cualquier app: Flatpak, Snap, APT o web app.',
    'installed.empty': 'Todavía no hay aplicaciones con acceso directo en este equipo.',
    'ext.title': 'Extensiones de GNOME Shell', 'ext.querying': 'Consultando extensions.gnome.org…',
    'ext.notGnome': 'Tu escritorio no es GNOME Shell, así que las extensiones no se pueden instalar aquí.',
    'ext.readyInfo': 'GNOME Shell {version} · se instalan para tu usuario y se activan solas.',
    'ext.noMatches': 'Sin extensiones que coincidan.', 'ext.catalogError': 'No se pudo consultar el catálogo: {msg}',
    'ext.installed': 'Instalada',
    'updates.title': 'Actualizaciones disponibles', 'action.refresh': 'Buscar de nuevo',
    'updates.checking': 'Revisando orígenes…', 'updates.upToDate': 'Todo está al día.',
    'updates.packages': '{source} · {n} paquete{plural}', 'action.update': 'Actualizar', 'action.updating': 'Actualizando…',
    'updates.applied': '{source} actualizado', 'updates.failed': 'La actualización no terminó bien',
    'action.open': 'Abrir', 'action.viewPage': 'Ver página', 'action.cancel': 'Cancelar',
    'action.uninstall': 'Desinstalar', 'action.close': 'Cerrar', 'action.install': 'Instalar',
    'action.confirmUninstall': '¿Desinstalar {name}? Esto elimina el paquete de tu equipo.',
    'sheet.noDescription': 'Sin descripción disponible.', 'sheet.webapp': 'App web', 'sheet.extension': 'Extensión de GNOME',
    'download.downloading': 'Descargando', 'download.installingExtension': 'Instalando extensión', 'download.creatingShortcut': 'Creando acceso',
    'stage.preparing': 'Preparando', 'stage.starting': 'Iniciando', 'stage.searching-browser': 'Buscando navegador',
    'stage.downloading-icon': 'Descargando icono', 'stage.creating-shortcut': 'Creando acceso directo', 'stage.ready': 'Lista',
    'stage.downloading': 'Descargando', 'stage.installing': 'Instalando', 'stage.cancelling': 'Cancelando…',
    'install.finished': 'Instalación terminada', 'install.readyNote': 'Origen {source} · lista para usarse',
    'toast.opening': 'Abriendo {name}', 'toast.cantOpen': 'No se pudo abrir', 'toast.uninstalling': 'Desinstalando {name}…',
    'toast.uninstalled': '{name} se desinstaló', 'toast.uninstallFailed': 'No se pudo desinstalar',
    'toast.alreadyInstalled': '{name} ya está instalada en este equipo', 'toast.installCancelled': 'Instalación de {name} cancelada',
    'toast.installFailed': 'No se pudo instalar {name}', 'toast.catalogError': 'No se pudo consultar el catálogo: {msg}',
    'toast.feedError': 'No se pudo cargar más catálogo: {msg}', 'toast.startupError': 'Error al iniciar: {msg}',
    'toast.previewFailed': 'No se pudo abrir la vista previa', 'toast.searchInInstalled': 'Busca la app en Instaladas',
    'toast.launchOpenLater': 'Búscala en Instaladas cuando esté lista',
    'spec.device': 'Equipo', 'spec.type': 'Tipo', 'spec.system': 'Sistema', 'spec.kernel': 'Núcleo',
    'spec.desktop': 'Escritorio', 'spec.processor': 'Procesador', 'spec.graphics': 'Gráficos', 'spec.memory': 'Memoria',
    'spec.storage': 'Almacenamiento', 'spec.battery': 'Batería', 'spec.user': 'Usuario', 'spec.uptimeSince': 'Encendido desde hace',
    'spec.board': ' · placa {board}', 'spec.threads': 'hilos', 'spec.total': 'totales', 'spec.available': 'disponibles',
    'spec.free': 'libres', 'spec.pluggedIn': 'Conectado a la corriente', 'spec.notDetected': 'No detectados',
    'formFactor.Desktop': 'Escritorio', 'formFactor.Tower': 'Torre', 'formFactor.Laptop': 'Portátil',
    'formFactor.Tablet': 'Tablet', 'formFactor.Convertible': 'Convertible', 'formFactor.Device': 'Equipo',
    'desktop.unknown': 'Desconocido', 'desktop.over': ' sobre {session}',
    'battery.Charging': 'cargando', 'battery.Discharging': 'en batería', 'battery.AC': 'Corriente alterna', 'battery.Unknown': 'desconocido',
    'flag.installed': 'instalada', 'flag.web': 'web',
    'status.ready': 'listo', 'status.noFlathub': 'sin flathub', 'status.notInstalled': 'no instalado', 'status.notAvailable': 'no disponible',
    'settings.title': 'Configuración', 'settings.language': 'Idioma de la tienda',
    'settings.languageNote': 'Cambia el idioma de la interfaz de la Tienda. El inglés es el predeterminado.',
    'settings.appearance': 'Apariencia', 'settings.themeDark': 'Oscuro', 'settings.themeLight': 'Claro',
    'settings.sidebar': 'Posición de la barra lateral', 'settings.sideLeft': 'Izquierda', 'settings.sideRight': 'Derecha',
    'settings.appearanceNote': 'Tus cambios se guardan y se conservan la próxima vez que abras la Tienda.',
    'banner.editorsPick': 'Selección del editor', 'banner.trending': 'Tendencia ahora', 'banner.newThisWeek': 'Nuevo esta semana',
    'banner.staffFavorite': 'Favorita del equipo', 'banner.viewApp': 'Ver',
    'hero.free': 'Gratis', 'hero.install': 'Instalar',
    'cb.views': 'Vistas',
    'err.no-preview-page': 'No hay una página disponible para esta app', 'err.flatpak-missing': 'Flatpak no está instalado. Instálalo con: sudo apt install flatpak',
    'err.snap-missing': 'Snap no está disponible en este equipo', 'err.apt-missing': 'APT no está disponible',
    'err.unknown-source': 'Origen desconocido', 'err.installer-exit-code': 'El instalador terminó con código {code}',
    'err.not-gnome': 'Este escritorio no es GNOME, las extensiones no aplican', 'err.extension-incompatible': 'La extensión no tiene versión compatible con tu GNOME',
    'err.download-failed': 'No se pudo descargar: {msg}', 'err.extension-install-failed': 'gnome-extensions install falló',
    'err.invalid-server-response': 'Respuesta no válida del servidor', 'err.timeout': 'Tiempo de espera agotado',
    'err.no-launch-method': 'No se encontró forma de abrir esta aplicación',
    'err.remove-failed': 'No se pudo eliminar el acceso directo',
    'note.added-as-app': 'Se agregó como app independiente en Instaladas', 'note.opens-in-browser': 'Se abrirá con tu navegador predeterminado',
    'note.may-need-logout': 'Puede requerir cerrar sesión para activarse',
    'webapp.summary.trello': 'Tableros Kanban para organizar proyectos y tareas en equipo.',
    'webapp.summary.notion': 'Notas, documentos, wikis y bases de datos en un solo lugar.',
    'webapp.summary.google-docs': 'Procesador de textos colaborativo en la nube.',
    'webapp.summary.google-sheets': 'Hojas de cálculo colaborativas en la nube.',
    'webapp.summary.outlook': 'Correo, calendario y contactos de Microsoft 365.',
    'webapp.summary.slack': 'Mensajería y canales de equipo.',
    'download.queued': '{n} en cola',
    'mini.showApp': 'Ver appPoint',
    'dev.title': 'Herramientas para desarrolladores', 'dev.hint': 'Se instalan como accesos directos independientes: abren en su propia ventana, sin pestañas de navegador.',
  },
  de: {
    'app.title': 'appPoint',
    'win.close': 'Schließen', 'win.minimize': 'Minimieren', 'win.maximize': 'Maximieren',
    'status.loading': 'lädt', 'stat.disk': 'Speicher', 'device.detecting': 'Gerät wird erkannt…',
    'nav.store': 'Store', 'nav.installed': 'Installiert', 'nav.extensions': 'Erweiterungen',
    'nav.office': 'Büro', 'nav.dev': 'Dev', 'nav.updates': 'Updates', 'nav.thisDevice': 'Dieses Gerät', 'nav.settings': 'Einstellungen',
    'sources.label': 'Quellen',
    'store.webTitle': 'Web-Apps', 'store.webHint': 'Installiere jede Website als eigene App: Sie öffnet sich in einem eigenen Fenster, ohne Browser-Tabs.',
    'store.webResultsTitle': 'Web-Apps für „{q}“', 'store.webResultsHint': 'Wähle die gewünschte Adresse. Mit „Seite ansehen“ kannst du sie vor der Installation prüfen.',
    'store.checkingWeb': 'Webadressen werden geprüft…',
    'webapp.generated': 'Website {host}, als eigenständige App installiert.',
    'installed.searchPlaceholder': 'Installierte Apps durchsuchen…', 'installed.noMatches': 'Keine installierte App passt zu deiner Suche.',
    'dev.nativeTitle': 'Entwickler-Apps', 'dev.nativeHint': 'Flatpak-, Snap- und APT-Pakete zum Programmieren.',
    'office.nativeTitle': 'Büro-Apps', 'office.nativeHint': 'Flatpak-, Snap- und APT-Pakete für Dokumente, Mail und PDFs.',
    'store.recommendedFor': 'Empfohlen für', 'store.allApps': 'Alle Apps',
    'store.topRank': 'Top-Apps', 'store.expertsPicks': 'Auswahl unserer Experten: Apps',
    'store.searchPlaceholder': 'App suchen: gimp, obs, vscode…', 'action.search': 'Suchen',
    'store.noResults': 'Keine Ergebnisse. Versuch einen anderen Namen.', 'store.loadingMore': 'Weitere Apps werden geladen…',
    'store.allCatalog': 'Gesamter Katalog', 'store.resultsFor': 'Ergebnisse für „{q}“',
    'store.loadingCatalog': 'Katalog wird geladen…', 'store.searching': 'Suche nach „{q}“…',
    'office.title': 'Büro-Web-Apps',
    'office.hint': 'Werden als eigenständige Verknüpfungen installiert: Sie öffnen sich in einem eigenen Fenster, ohne Browser-Tabs.',
    'office.suiteTitle': 'Ubuntu-Büropaket', 'office.suiteSearching': 'Suche nach LibreOffice und installierten Büro-Tools…',
    'office.suiteReady': 'Bereits auf deinem System installiert — ein Klick öffnet sie.',
    'office.suiteMissing': 'Kein LibreOffice oder anderes Büropaket gefunden. Installiere es über den Store.',
    'office.findLibreOffice': 'LibreOffice im Store suchen',
    'installed.title': 'Apps auf diesem Gerät',
    'installed.hint': 'Klicken zum Öffnen. Mit dem Papierkorb-Symbol jede App deinstallieren — Flatpak, Snap, APT oder Web-App.',
    'installed.empty': 'Noch keine Apps mit Verknüpfung auf diesem Gerät.',
    'ext.title': 'GNOME-Shell-Erweiterungen', 'ext.querying': 'Anfrage an extensions.gnome.org…',
    'ext.notGnome': 'Dein Desktop ist nicht GNOME Shell, Erweiterungen lassen sich hier nicht installieren.',
    'ext.readyInfo': 'GNOME Shell {version} · wird für deinen Benutzer installiert und aktiviert sich selbst.',
    'ext.noMatches': 'Keine passenden Erweiterungen.', 'ext.catalogError': 'Katalog konnte nicht abgefragt werden: {msg}',
    'ext.installed': 'Installiert',
    'updates.title': 'Verfügbare Updates', 'action.refresh': 'Erneut prüfen',
    'updates.checking': 'Quellen werden geprüft…', 'updates.upToDate': 'Alles ist aktuell.',
    'updates.packages': '{source} · {n} Paket{plural}', 'action.update': 'Aktualisieren', 'action.updating': 'Wird aktualisiert…',
    'updates.applied': '{source} aktualisiert', 'updates.failed': 'Das Update wurde nicht sauber abgeschlossen',
    'action.open': 'Öffnen', 'action.viewPage': 'Seite ansehen', 'action.cancel': 'Abbrechen',
    'action.uninstall': 'Deinstallieren', 'action.close': 'Schließen', 'action.install': 'Installieren',
    'action.confirmUninstall': '{name} deinstallieren? Dadurch wird das Paket vom Gerät entfernt.',
    'sheet.noDescription': 'Keine Beschreibung verfügbar.', 'sheet.webapp': 'Web-App', 'sheet.extension': 'GNOME-Erweiterung',
    'download.downloading': 'Wird heruntergeladen', 'download.installingExtension': 'Erweiterung wird installiert', 'download.creatingShortcut': 'Verknüpfung wird erstellt',
    'stage.preparing': 'Wird vorbereitet', 'stage.starting': 'Wird gestartet', 'stage.searching-browser': 'Browser wird gesucht',
    'stage.downloading-icon': 'Symbol wird geladen', 'stage.creating-shortcut': 'Verknüpfung wird erstellt', 'stage.ready': 'Fertig',
    'stage.downloading': 'Wird heruntergeladen', 'stage.installing': 'Wird installiert', 'stage.cancelling': 'Wird abgebrochen…',
    'install.finished': 'Installation abgeschlossen', 'install.readyNote': 'Quelle {source} · einsatzbereit',
    'toast.opening': '{name} wird geöffnet', 'toast.cantOpen': 'Konnte nicht geöffnet werden', 'toast.uninstalling': '{name} wird deinstalliert…',
    'toast.uninstalled': '{name} wurde deinstalliert', 'toast.uninstallFailed': 'Deinstallation fehlgeschlagen',
    'toast.alreadyInstalled': '{name} ist bereits auf diesem Gerät installiert', 'toast.installCancelled': 'Installation von {name} abgebrochen',
    'toast.installFailed': '{name} konnte nicht installiert werden', 'toast.catalogError': 'Katalog konnte nicht abgefragt werden: {msg}',
    'toast.feedError': 'Weiterer Katalog konnte nicht geladen werden: {msg}', 'toast.startupError': 'Startfehler: {msg}',
    'toast.previewFailed': 'Vorschau konnte nicht geöffnet werden', 'toast.searchInInstalled': 'Suche die App unter Installiert',
    'toast.launchOpenLater': 'Sobald bereit unter Installiert suchen',
    'spec.device': 'Gerät', 'spec.type': 'Typ', 'spec.system': 'System', 'spec.kernel': 'Kernel',
    'spec.desktop': 'Desktop', 'spec.processor': 'Prozessor', 'spec.graphics': 'Grafik', 'spec.memory': 'Arbeitsspeicher',
    'spec.storage': 'Speicherplatz', 'spec.battery': 'Akku', 'spec.user': 'Benutzer', 'spec.uptimeSince': 'Eingeschaltet seit',
    'spec.board': ' · Board {board}', 'spec.threads': 'Threads', 'spec.total': 'gesamt', 'spec.available': 'verfügbar',
    'spec.free': 'frei', 'spec.pluggedIn': 'Am Netzteil angeschlossen', 'spec.notDetected': 'Nicht erkannt',
    'formFactor.Desktop': 'Desktop', 'formFactor.Tower': 'Tower', 'formFactor.Laptop': 'Laptop',
    'formFactor.Tablet': 'Tablet', 'formFactor.Convertible': 'Convertible', 'formFactor.Device': 'Gerät',
    'desktop.unknown': 'Unbekannt', 'desktop.over': ' über {session}',
    'battery.Charging': 'lädt', 'battery.Discharging': 'im Akkubetrieb', 'battery.AC': 'Am Netzteil', 'battery.Unknown': 'unbekannt',
    'flag.installed': 'installiert', 'flag.web': 'Web',
    'status.ready': 'bereit', 'status.noFlathub': 'kein Flathub', 'status.notInstalled': 'nicht installiert', 'status.notAvailable': 'nicht verfügbar',
    'settings.title': 'Einstellungen', 'settings.language': 'Store-Sprache',
    'settings.languageNote': 'Ändert die Oberflächensprache des Stores. Englisch ist die Standardeinstellung.',
    'settings.appearance': 'Darstellung', 'settings.themeDark': 'Dunkel', 'settings.themeLight': 'Hell',
    'settings.sidebar': 'Position der Seitenleiste', 'settings.sideLeft': 'Links', 'settings.sideRight': 'Rechts',
    'settings.appearanceNote': 'Deine Auswahl wird gespeichert und beim nächsten Öffnen des Stores wiederhergestellt.',
    'hero.free': 'Kostenlos', 'hero.install': 'Installieren',
    'cb.views': 'Aufrufe',
    'banner.editorsPick': 'Redaktionstipp', 'banner.trending': 'Gerade angesagt', 'banner.newThisWeek': 'Neu diese Woche',
    'banner.staffFavorite': 'Team-Favorit', 'banner.viewApp': 'Ansehen',
    'err.no-preview-page': 'Für diese App ist keine Seite verfügbar', 'err.flatpak-missing': 'Flatpak ist nicht installiert. Installiere es mit: sudo apt install flatpak',
    'err.snap-missing': 'Snap ist auf diesem Gerät nicht verfügbar', 'err.apt-missing': 'APT ist nicht verfügbar',
    'err.unknown-source': 'Unbekannte Quelle', 'err.installer-exit-code': 'Der Installer wurde mit Code {code} beendet',
    'err.not-gnome': 'Dieser Desktop ist nicht GNOME, Erweiterungen gelten hier nicht', 'err.extension-incompatible': 'Diese Erweiterung hat keine mit deinem GNOME kompatible Version',
    'err.download-failed': 'Download fehlgeschlagen: {msg}', 'err.extension-install-failed': 'gnome-extensions install ist fehlgeschlagen',
    'err.invalid-server-response': 'Ungültige Antwort vom Server', 'err.timeout': 'Zeitüberschreitung',
    'err.no-launch-method': 'Es wurde keine Möglichkeit gefunden, diese App zu öffnen',
    'err.remove-failed': 'Verknüpfung konnte nicht entfernt werden',
    'note.added-as-app': 'Als eigenständige App unter Installiert hinzugefügt', 'note.opens-in-browser': 'Öffnet sich mit deinem Standardbrowser',
    'note.may-need-logout': 'Eventuell ist ein Abmelden zur Aktivierung nötig',
    'webapp.summary.trello': 'Kanban-Boards zur Organisation von Projekten und Teamaufgaben.',
    'webapp.summary.notion': 'Notizen, Dokumente, Wikis und Datenbanken an einem Ort.',
    'webapp.summary.google-docs': 'Kollaborative Textverarbeitung in der Cloud.',
    'webapp.summary.google-sheets': 'Kollaborative Tabellen in der Cloud.',
    'webapp.summary.outlook': 'E-Mail, Kalender und Kontakte aus Microsoft 365.',
    'webapp.summary.slack': 'Team-Messaging und Kanäle.',
    'download.queued': '{n} in Warteschlange',
    'mini.showApp': 'appPoint anzeigen',
    'dev.title': 'Entwickler-Tools', 'dev.hint': 'Werden als eigenständige Verknüpfungen installiert: Sie öffnen sich in einem eigenen Fenster, ohne Browser-Tabs.',
  }
};

const SUPPORTED_LANGS = ['en', 'es', 'de'];

// Preferencias de apariencia guardadas en localStorage (junto con el idioma).
function readPref(key, allowed, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    if (allowed.includes(v)) return v;
  } catch { /* localStorage unavailable */ }
  return fallback;
}

function savePref(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* ignoramos si no hay storage */ }
}

// Pinta tema y posición del sidebar en el documento y marca los botones de Ajustes.
function applyAppearance() {
  const root = document.documentElement;
  root.setAttribute('data-theme', state.theme);
  root.setAttribute('data-side', state.side);
  document.querySelectorAll('[data-theme-opt]').forEach((b) => b.classList.toggle('active', b.dataset.themeOpt === state.theme));
  document.querySelectorAll('[data-side-opt]').forEach((b) => b.classList.toggle('active', b.dataset.sideOpt === state.side));
}

function setTheme(theme) {
  if (!['dark', 'light'].includes(theme)) return;
  state.theme = theme;
  savePref('appcenter:theme', theme);
  applyAppearance();
  if (miniState.data.phase !== 'idle') pushMini({}); // la mini ventana también sigue el tema
}

function setSide(side) {
  if (!['left', 'right'].includes(side)) return;
  state.side = side;
  savePref('appcenter:side', side);
  applyAppearance();
}

function detectInitialLang() {
  try {
    const saved = window.localStorage.getItem('appcenter:lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch { /* localStorage unavailable */ }
  return 'en'; // La tienda es en inglés por defecto.
}

function t(key, vars) {
  const dict = STRINGS[state.lang] || STRINGS.en;
  let str = dict[key] != null ? dict[key] : (STRINGS.en[key] != null ? STRINGS.en[key] : key);
  if (vars) for (const k in vars) str = str.replace(`{${k}}`, vars[k]);
  return str;
}

// Traduce cadenas dinámicas ya etiquetadas por el proceso principal, p. ej. "stage:ready" o "err:timeout".
function tPrefixed(raw, prefix) {
  if (typeof raw !== 'string' || !raw.startsWith(`${prefix}:`)) return raw;
  const rest = raw.slice(prefix.length + 1);
  const [code, ...extra] = rest.split(':');
  const key = `${prefix}.${code}`;
  const dict = STRINGS[state.lang] || STRINGS.en;
  if (dict[key] == null && STRINGS.en[key] == null) return rest; // sin traducción conocida, mostramos el texto tal cual
  return t(key, { code: extra.join(':'), msg: extra.join(':') });
}

function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  state.lang = lang;
  try { window.localStorage.setItem('appcenter:lang', lang); } catch { /* ignoramos si no hay storage */ }
  applyStaticI18n();
  document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  refreshDynamicText();
}

// Vuelve a pintar los textos que ya se generaron en JS (no cubiertos por data-i18n) tras un cambio de idioma.
function refreshDynamicText() {
  if (state.device) renderSpecs(state.device);
  const active = document.querySelector('.nav-item.active');
  const view = active ? active.dataset.view : 'explorar';
  if (view === 'explorar') {
    if (state.searchQuery) { renderCatalog(state.searchQuery); renderWebResults(); }
    else { $('store-grid').innerHTML = ''; $('featured-row').innerHTML = ''; $('top-rank-row').innerHTML = ''; $('experts-row').innerHTML = ''; $('hero-carousel').innerHTML = ''; state.usedSectionKeys = new Set(); renderFeedIncrement(state.feed.items); renderPopularWeb(); }
  }
  if (view === 'oficina') loadOffice();
  if (view === 'dev') loadDev();
  if (view === 'instaladas') loadInstalled();
  if (view === 'extensiones') loadExtensions($('search-input').value.trim());
  if (view === 'actualizaciones') loadUpdates();
  applyBackendStatusLabels();
}

/* ─────────────────────────── estado ─────────────────────────── */

const state = {
  backends: null,
  device: null,
  catalog: [],
  installed: [],
  systemApps: [],
  installedIds: new Set(),
  desktopIds: new Set(), // ids derivados de archivos .desktop (incluye webapps)
  sources: { flatpak: true, snap: true, apt: true },
  queue: [],
  current: null,
  coffeeTimer: null,
  feed: { items: [], cursor: null, loading: false, exhausted: false },
  feedActive: false,
  searchQuery: '',
  updates: null,
  searchSeq: 0,          // invalida respuestas viejas cuando cambia la búsqueda
  nativePending: false,
  webPending: false,
  webResults: [],        // apps web (conocidas + variaciones de dominio) de la búsqueda actual
  webPopular: [],
  dev: null,
  office: null,
  installedReady: null,
  lang: detectInitialLang(),
  theme: readPref('appcenter:theme', ['dark', 'light'], 'dark'),   // tema: oscuro por defecto
  side: readPref('appcenter:side', ['left', 'right'], 'left'),     // barra lateral: izquierda por defecto
  usedSectionKeys: new Set() // apps ya mostradas en secciones especiales (top/recomendadas/expertos/carrusel), para no repetirlas en el resto de la tienda
};

/* ───────── helpers de presentación ───────── */

function fmtBytes(n) {
  if (!n) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

function fmtUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d ? `${d} d` : null, h ? `${h} h` : null, `${m} min`].filter(Boolean).join(' ');
}

function hue(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

// Avatar de respaldo: un cuadro con bordes redondeados y la inicial del nombre.
// Recibe la(s) clase(s) de contexto (p. ej. "sheet-icon") para que el CSS de ese
// contexto (tamaño fijo) se aplique directamente y el cuadro nunca colapse a 0.
function fallbackNode(item, cls) {
  const extraCls = cls && cls !== 'app-icon-img' ? ` ${cls}` : '';
  const d = el('div', `fallback-icon${extraCls}`, (item.name || '?').trim()[0].toUpperCase());
  const h = hue(item.name || item.id || '?');
  d.style.background = `linear-gradient(150deg, hsl(${h} 70% 55%), hsl(${(h + 40) % 360} 70% 42%))`;
  return d;
}

// Cadena de respaldo: icono principal -> icono alterno (si existe) -> avatar con inicial.
function iconNode(item, cls = 'app-icon-img') {
  if (!item.icon) return fallbackNode(item, cls);
  const img = el('img', cls);
  img.src = item.icon;
  img.alt = item.name || '';
  img.loading = 'lazy';
  img.decoding = 'async';
  let triedAlt = false;
  img.onerror = () => {
    if (!triedAlt && item.iconAlt) {
      triedAlt = true;
      img.src = item.iconAlt;
      return;
    }
    img.replaceWith(fallbackNode(item, cls));
  };
  return img;
}

// ── Carga de iconos: la página muestra placeholders hasta que los iconos remotos están listos ──
const isRemote = (u) => typeof u === 'string' && /^https?:/i.test(u);

function preloadOne(item) {
  const urls = [item.icon, item.iconAlt].filter(isRemote);
  if (!urls.length) return Promise.resolve();
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) { item.icon = null; item.iconAlt = null; resolve(); return; } // sin icono: tarjeta con inicial
      const url = urls[i++];
      const img = new Image();
      img.onload = () => { item.icon = url; item.iconAlt = null; resolve(); };
      img.onerror = next;
      img.src = url;
    };
    next();
  });
}

// Espera a que carguen (o fallen) los iconos; con tope de tiempo para que una red lenta no deje la página colgada.
function preloadIcons(items, timeoutMs = 7000) {
  const jobs = (items || []).filter(Boolean).map(preloadOne);
  return Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, timeoutMs))]);
}

function showSkeleton(container, n = 18) {
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const card = el('div', 'app skeleton');
    card.append(el('div', 'sk-icon'), el('div', 'sk-line'));
    container.append(card);
  }
}

const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

function localizeWeb(w) {
  const summary = w.generated ? t('webapp.generated', { host: w.host || w.name }) : (webappSummary(w) || w.summary);
  return { ...w, summary };
}

function toast(message, isError = false) {
  const el2 = $('toast');
  el2.textContent = message;
  el2.classList.toggle('error', isError);
  el2.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el2.classList.add('hidden'), 4200);
}

function unwrap(result) {
  if (result && result.__error) throw new Error(result.__error);
  return result;
}

function errText(e) {
  return tPrefixed(e && e.message ? e.message : String(e), 'err');
}

function isInstalled(item) {
  return item.installed === true
    || state.installedIds.has(`${item.source}:${item.id}`)
    || state.desktopIds.has(item.id);
}

/* ───────── dispositivo ───────── */

async function loadDevice() {
  const d = unwrap(await window.sys.device());
  state.device = d;
  $('device-name').textContent = d.model || d.hostname;
  $('device-distro').textContent = `${d.distro} · ${t(`formFactor.${d.formFactor}`) !== `formFactor.${d.formFactor}` ? t(`formFactor.${d.formFactor}`) : d.formFactor}`;
  $('distro-inline').textContent = d.distro.split(' ').slice(0, 2).join(' ');
  document.title = `${t('app.title')} — ${d.hostname}`;
  renderSpecs(d);
}

function formFactorLabel(ff) {
  const key = `formFactor.${ff}`;
  const dict = STRINGS[state.lang] || STRINGS.en;
  return dict[key] || STRINGS.en[key] || ff;
}

function desktopLabel(d) {
  const base = d.desktop === 'Unknown' ? t('desktop.unknown') : d.desktop;
  return base + (d.sessionType ? t('desktop.over', { session: d.sessionType }) : '');
}

function batteryStatusLabel(status) {
  const key = `battery.${status}`;
  const dict = STRINGS[state.lang] || STRINGS.en;
  return dict[key] || STRINGS.en[key] || status;
}

function renderSpecs(d) {
  const mem = d.memory || {};
  const specs = [
    [t('spec.device'), d.model || d.hostname],
    [t('spec.type'), `${formFactorLabel(d.formFactor)}${d.board ? t('spec.board', { board: d.board }) : ''}`],
    [t('spec.system'), `${d.distro}${d.codename ? ` (${d.codename})` : ''}`],
    [t('spec.kernel'), `Linux ${d.kernel} · ${d.arch}`],
    [t('spec.desktop'), desktopLabel(d)],
    [t('spec.processor'), `${d.cpu} · ${d.cores} ${t('spec.threads')}${d.cpuMhz ? ` · ${(d.cpuMhz / 1000).toFixed(2)} GHz` : ''}`],
    [t('spec.graphics'), d.gpu.length ? d.gpu.join(' · ') : t('spec.notDetected')],
    [t('spec.memory'), `${fmtBytes(mem.total)} ${t('spec.total')} · ${fmtBytes(mem.available)} ${t('spec.available')}`],
    [t('spec.storage'), d.disk ? `${fmtBytes(d.disk.total)} · ${fmtBytes(d.disk.free)} ${t('spec.free')}` : '—'],
    [t('spec.battery'), d.battery.present ? `${d.battery.percent}% · ${batteryStatusLabel(d.battery.status)}` : t('spec.pluggedIn')],
    [t('spec.user'), `${d.user}@${d.hostname}`],
    [t('spec.uptimeSince'), fmtUptime(d.uptime)]
  ];
  const wrap = $('specs');
  wrap.innerHTML = '';
  for (const [label, value] of specs) {
    const card = el('div', 'spec');
    card.append(el('h4', null, label), el('p', null, value));
    wrap.append(card);
  }
}

const LOCALE_MAP = { en: 'en-US', es: 'es-MX', de: 'de-DE' };

async function tickStats() {
  try {
    const s = unwrap(await window.sys.stats());
    const now = new Date();
    const locale = LOCALE_MAP[state.lang] || 'en-US';
    $('clock').textContent = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    $('date').textContent = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();

    const ramPct = Math.round((s.memory.used / s.memory.total) * 100);
    $('cpu-pct').textContent = `${s.cpu}%`;
    $('cpu-bar').style.width = `${s.cpu}%`;
    $('ram-pct').textContent = `${ramPct}%`;
    $('ram-bar').style.width = `${ramPct}%`;
    if (s.disk) {
      $('disk-pct').textContent = `${s.disk.percent}%`;
      $('disk-bar').style.width = `${s.disk.percent}%`;
    }
    $('batt-fill').style.width = `${s.battery.percent}%`;
    $('batt-fill').style.background = s.battery.percent < 20 ? 'var(--red)' : 'var(--green)';
    $('batt-text').textContent = s.battery.present
      ? `${s.battery.percent}% · ${batteryStatusLabel(s.battery.status)}`
      : t('battery.AC');

    if (state.device) {
      state.device.uptime = s.uptime;
      state.device.memory = s.memory;
      state.device.disk = s.disk;
      state.device.battery = s.battery;
    }
  } catch { /* la siguiente lectura lo corrige */ }
}

/* ───────── catálogo, feed infinito, banners y rejillas ───────── */

function visible(list) {
  return list.filter((a) => a.source === 'gnome-extension' || a.source === 'webapp' || state.sources[a.source] !== false);
}

function rankItem(item, index, { installed = false } = {}) {
  const row = el('div', 'rank-item' + (installed ? ' installed' : ''));
  row.append(el('span', 'rank-num', String(index + 1)));
  const wrap = el('div', 'icon-wrap');
  wrap.append(iconNode(item));
  row.append(wrap);
  const info = el('div', 'rank-info');
  info.append(el('div', 'rank-name', item.name));
  const flagText = item.source === 'sistema' ? t('flag.installed') : item.source === 'webapp' ? t('flag.web') : item.source;
  info.append(el('div', 'rank-sub', item.summary || flagText));
  row.append(info);
  row.title = item.summary ? `${item.name} — ${item.summary}` : item.name;
  return row;
}

function appCard(item, { installed = false, hasUpdate = false } = {}) {
  const card = el('div', 'app' + (installed ? ' installed' : ''));
  const wrap = el('div', 'icon-wrap');
  wrap.append(iconNode(item));
  wrap.append(el('span', 'update-dot' + (hasUpdate ? '' : ' hidden'), null));
  card.append(wrap);
  card.append(el('span', null, item.name));
  const flagText = item.source === 'sistema' ? t('flag.installed') : item.source === 'webapp' ? t('flag.web') : item.source;
  card.append(el('span', 'src-flag', flagText));
  card.title = item.summary ? `${item.name} — ${item.summary}` : item.name;
  return card;
}

// Coincidencia app-de-escritorio -> paquete gestionable, para poder desinstalarla.
// Se compara por id (con y sin sufijo .desktop) y, si no hay coincidencia exacta, por nombre.
function findPkgForApp(appItem) {
  const appId = (appItem.id || '').replace(/\.desktop$/, '').toLowerCase();
  const appName = (appItem.name || '').toLowerCase();
  return state.installed.find((p) => {
    const pid = (p.id || '').toLowerCase();
    const pname = (p.name || '').toLowerCase();
    if (pid && appId && (pid === appId || appId.endsWith(`.${pid}`) || pid.endsWith(`.${appId}`) || appId.includes(pid) || pid.includes(appId))) return true;
    return !!(appName && pname && (appName.includes(pname) || pname.includes(appName)));
  });
}

function hasPendingUpdate(pkg) {
  if (!pkg || !state.updates) return false;
  const list = state.updates[pkg.source] || [];
  return list.some((u) => u.id === pkg.id);
}

function applyUpdateBadges() {
  if (!state.updates) return;
  document.querySelectorAll('#installed-grid .app').forEach((card) => {
    const dot = card.querySelector('.update-dot');
    if (!dot) return;
    const source = card.dataset.pkgSource;
    const id = card.dataset.pkgId;
    const pending = source && id && (state.updates[source] || []).some((u) => u.id === id);
    dot.classList.toggle('hidden', !pending);
  });
}

/* ---- Carrusel destacado: 5 tarjetas grandes hasta arriba, antes de "Recomendadas" ---- */

const HERO_THEMES = [
  { grad: 'linear-gradient(135deg,#1f5fa8,#0b2a4a)', key: 'banner.editorsPick' },
  { grad: 'linear-gradient(135deg,#7b2ff7,#2b0b4a)', key: 'banner.trending' },
  { grad: 'linear-gradient(135deg,#0f9b8e,#0a3b35)', key: 'banner.newThisWeek' },
  { grad: 'linear-gradient(135deg,#d1495b,#4a0f18)', key: 'banner.staffFavorite' },
  { grad: 'linear-gradient(135deg,#e08a1e,#4a2c05)', key: 'banner.editorsPick' }
];

function heroCard(item, theme) {
  const card = el('div', 'hero-card');

  const art = el('div', 'hero-art');
  art.style.background = theme.grad;
  const watermark = el('div', 'hero-watermark');
  watermark.append(iconNode(item, 'app-icon-img'));
  art.append(watermark);
  art.append(el('div', 'hero-badge', t(theme.key)));
  art.append(el('div', 'hero-tagline', item.summary || item.publisher || item.name));

  const footer = el('div', 'hero-footer');
  footer.append(iconNode(item, 'hero-icon'));
  const info = el('div', 'hero-info');
  info.append(el('div', 'hero-name', item.name));
  const flagText = item.source === 'sistema' ? t('flag.installed') : item.source === 'webapp' ? t('flag.web') : item.source;
  info.append(el('div', 'hero-sub', [item.publisher, flagText].filter(Boolean).join(' · ')));
  footer.append(info);

  const priceWrap = el('div', 'hero-price-wrap');
  priceWrap.append(el('span', 'hero-price', t('hero.free')));
  const cta = el('button', 'hero-cta', t('hero.install'));
  cta.onclick = (e) => { e.stopPropagation(); openActionModal(item); };
  priceWrap.append(cta);
  footer.append(priceWrap);

  card.append(art, footer);
  card.onclick = () => openActionModal(item);
  return card;
}

// Baraja Fisher-Yates: no muta el array de entrada.
function shuffled(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function renderHeroCarousel(items) {
  const wrap = $('hero-carousel-wrap');
  const track = $('hero-carousel');
  if (!wrap || !track) return;
  track.innerHTML = '';
  wrap.classList.toggle('hidden', items.length === 0);
  items.forEach((item, i) => track.append(heroCard(item, HERO_THEMES[i % HERO_THEMES.length])));
}

/* ---- Banners promocionales: tarjeta grande, ancho completo, en posición aleatoria ---- */

const BANNER_THEMES = [
  { grad: 'linear-gradient(120deg,#ff5f6d,#7b2ff7)', key: 'banner.editorsPick' },
  { grad: 'linear-gradient(120deg,#00c6ff,#0072ff)', key: 'banner.trending' },
  { grad: 'linear-gradient(120deg,#f7971e,#ffd200)', key: 'banner.newThisWeek' },
  { grad: 'linear-gradient(120deg,#11998e,#38ef7d)', key: 'banner.staffFavorite' },
  { grad: 'linear-gradient(120deg,#ee0979,#ff6a00)', key: 'banner.editorsPick' },
  { grad: 'linear-gradient(120deg,#4776e6,#8e54e9)', key: 'banner.trending' }
];

function bannerCard(item) {
  const theme = BANNER_THEMES[Math.floor(Math.random() * BANNER_THEMES.length)];
  const card = el('div', 'banner');
  card.style.gridColumn = '1 / -1';
  card.style.background = theme.grad;

  const copy = el('div', 'banner-copy');
  copy.append(el('div', 'banner-eyebrow', t(theme.key)));
  copy.append(el('div', 'banner-title', item.name));
  copy.append(el('div', 'banner-sub', item.summary || item.publisher || ''));
  const cta = el('button', 'banner-cta', t('banner.viewApp'));
  cta.onclick = (e) => { e.stopPropagation(); openActionModal(item); };
  copy.append(cta);

  const iconWrap = el('div', 'banner-icon-wrap');
  iconWrap.append(iconNode(item, 'banner-icon'));

  card.append(copy, iconWrap);
  card.onclick = () => openActionModal(item);
  return card;
}

function insertBannerRandomly(gridId = 'store-grid') {
  const grid = $(gridId);
  if (!grid || grid.querySelector('.banner')) return;
  const candidates = visible(state.feed.items.length ? state.feed.items : state.catalog).filter((i) => i.icon || i.summary);
  if (!candidates.length) return;
  const item = candidates[Math.floor(Math.random() * candidates.length)];
  const banner = bannerCard(item);
  const children = [...grid.children];
  const idx = children.length ? Math.floor(Math.random() * (children.length + 1)) : 0;
  grid.insertBefore(banner, children[idx] || null);
}

// Búsqueda: resultado finito de los tres orígenes a la vez + apps web (conocidas y variaciones
// de dominio). Cada bloque muestra placeholders hasta que sus datos e iconos están listos.
async function loadCatalog(query = '') {
  const seq = ++state.searchSeq;
  state.searchQuery = query;
  state.feedActive = !query;
  state.webResults = [];
  state.webPending = false;
  state.nativePending = false;
  const grid = $('store-grid');
  $('feed-sentinel').classList.toggle('hidden', !!query);
  $('store-empty').classList.add('hidden');
  $('web-results-block').classList.add('hidden');
  $('recommended-block').classList.toggle('hidden', !!query);
  $('top-rank-block').classList.toggle('hidden', !!query);
  $('experts-block').classList.toggle('hidden', !!query);
  $('web-popular-block').classList.toggle('hidden', !!query);

  if (!query) {
    state.feed = { items: [], cursor: null, loading: false, exhausted: false };
    state.usedSectionKeys = new Set();
    $('featured-row').innerHTML = '';
    $('top-rank-row').innerHTML = '';
    $('experts-row').innerHTML = '';
    $('hero-carousel').innerHTML = '';
    $('hero-carousel-wrap').classList.remove('hidden');
    $('grid-title').textContent = t('store.allCatalog');
    showSkeleton(grid, 24);
    loadPopularWeb();
    await loadFeedBatch(FEED_INITIAL_POOL); // primera sección (con apps de sobra para los carruseles); el resto llega al hacer scroll
    return;
  }

  $('hero-carousel-wrap').classList.add('hidden');
  $('grid-title').textContent = t('store.resultsFor', { q: query });
  showSkeleton(grid, 12);
  state.nativePending = true;
  state.webPending = true;
  renderWebResults();

  const nativeTask = (async () => {
    let list;
    try {
      list = unwrap(await window.sys.catalog(query));
      await preloadIcons(list);
    } catch (e) {
      if (seq !== state.searchSeq) return;
      state.nativePending = false;
      grid.innerHTML = '';
      grid.append(el('div', 'empty', t('toast.catalogError', { msg: errText(e) })));
      return;
    }
    if (seq !== state.searchSeq) return;
    state.nativePending = false;
    state.catalog = list;
    renderCatalog(query);
  })();

  const webTask = (async () => {
    let items = [];
    try {
      items = unwrap(await window.sys.searchWeb(query));
      await preloadIcons(items);
    } catch { items = []; }
    if (seq !== state.searchSeq) return;
    state.webPending = false;
    state.webResults = Array.isArray(items) ? items : [];
    renderWebResults();
    updateStoreEmpty();
  })();

  await Promise.all([nativeTask, webTask]);
}

function updateStoreEmpty() {
  if (!state.searchQuery) return;
  const empty = !state.nativePending && !state.webPending
    && visible(state.catalog).length === 0 && state.webResults.length === 0;
  $('store-empty').classList.toggle('hidden', !empty);
}

function renderCatalog(query = '') {
  if (state.nativePending) return; // hay una búsqueda en curso: no pintar resultados viejos
  const list = visible(state.catalog);
  $('featured-row').innerHTML = '';
  const grid = $('store-grid');
  grid.innerHTML = '';
  $('grid-title').textContent = query ? t('store.resultsFor', { q: query }) : t('store.allCatalog');
  for (const item of list) {
    const card = appCard(item, { installed: isInstalled(item) });
    card.onclick = () => openActionModal(item);
    grid.append(card);
  }
  updateStoreEmpty();
}

// Apps web de la búsqueda: coincidencias conocidas + variaciones de dominio que existen; el usuario elige cuál instalar.
function renderWebResults() {
  const block = $('web-results-block');
  const grid = $('web-results-grid');
  if (!state.searchQuery) { block.classList.add('hidden'); return; }
  $('web-results-title').textContent = t('store.webResultsTitle', { q: state.searchQuery });
  if (state.webPending) {
    $('web-results-hint').textContent = t('store.checkingWeb');
    showSkeleton(grid, 8);
    block.classList.remove('hidden');
    return;
  }
  grid.innerHTML = '';
  if (!state.webResults.length) { block.classList.add('hidden'); return; }
  $('web-results-hint').textContent = t('store.webResultsHint');
  for (const w of state.webResults) {
    const item = localizeWeb(w);
    const card = appCard(item, { installed: isInstalled(item) });
    card.onclick = () => openActionModal(item);
    grid.append(card);
  }
  block.classList.remove('hidden');
}

// Sección "Apps web" de la Tienda (páginas populares), sin búsqueda activa.
async function loadPopularWeb() {
  if (state.webPopular.length) { renderPopularWeb(); return; }
  showSkeleton($('web-popular-grid'), 16);
  let list = [];
  try { list = unwrap(await window.sys.webPopular()); } catch { list = []; }
  if (!Array.isArray(list)) list = [];
  await preloadIcons(list);
  state.webPopular = list;
  renderPopularWeb();
}

function renderPopularWeb() {
  if (state.searchQuery) return;
  const grid = $('web-popular-grid');
  grid.innerHTML = '';
  $('web-popular-block').classList.toggle('hidden', !state.webPopular.length);
  for (const w of state.webPopular) {
    const item = localizeWeb(w);
    const card = appCard(item, { installed: isInstalled(item) });
    card.onclick = () => openActionModal(item);
    grid.append(card);
  }
}

// Explorar sin búsqueda: primero carga una sección real (Flathub + Snap) y,
// al llegar al final del scroll, sigue cargando secciones nuevas sin límite
// (el cursor recorre categorías reales y da la vuelta cuando se agotan).
// Cada lote espera a que carguen sus iconos antes de pintarse.
async function loadFeedBatch(minPool = 0) {
  const feed = state.feed;
  const seq = state.searchSeq;
  if (feed.loading || !state.feedActive) return;
  feed.loading = true;
  $('feed-sentinel').classList.remove('hidden');
  const grid = $('store-grid');

  // Con minPool > 0 (arranque) seguimos pidiendo lotes hasta tener suficientes apps para llenar
  // las secciones destacadas (hasta 4 lotes); en el scroll normal basta con un lote.
  const seen = new Set(feed.items.map((i) => `${i.source}:${i.id}`));
  const fresh = [];
  let cursor = feed.cursor;
  let failure = null;
  for (let attempt = 0; attempt < (minPool ? 4 : 1); attempt++) {
    let batch;
    try {
      batch = unwrap(await window.sys.feed(cursor));
    } catch (e) { failure = e; break; }
    if (seq !== state.searchSeq || feed !== state.feed) { feed.loading = false; return; }
    cursor = batch.cursor;
    const newOnes = batch.items.filter((i) => {
      const key = `${i.source}:${i.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    await preloadIcons(newOnes);
    fresh.push(...newOnes);
    if (!minPool || visible(fresh).filter((i) => i.icon || i.summary).length >= minPool) break;
  }

  if (failure && !fresh.length) {
    feed.loading = false;
    if (seq !== state.searchSeq) return;
    if (!feed.items.length) grid.innerHTML = '';
    toast(t('toast.feedError', { msg: errText(failure) }), true);
    return;
  }

  // En el arranque también esperamos a saber qué apps ya están instaladas, para marcarlas bien.
  if (state.installedReady) await state.installedReady.catch(() => {});
  if (seq !== state.searchSeq || feed !== state.feed) { feed.loading = false; return; }

  feed.items.push(...fresh);
  feed.cursor = cursor;
  feed.loading = false;
  state.catalog = feed.items;

  grid.querySelectorAll('.skeleton').forEach((n) => n.remove());
  renderFeedIncrement(fresh);
}

// Cuántas apps lleva cada sección destacada de la Tienda.
const SECTION_SIZES = { top: 9, recommended: 20, experts: 20, hero: 5 };
const FEED_INITIAL_POOL = SECTION_SIZES.top + SECTION_SIZES.recommended + SECTION_SIZES.experts + SECTION_SIZES.hero + 6;

function renderFeedIncrement(freshItems) {
  const featured = $('featured-row');
  const topRank = $('top-rank-row');
  const experts = $('experts-row');
  const grid = $('store-grid');
  $('grid-title').textContent = t('store.allCatalog');

  const keyOf = (item) => `${item.source}:${item.id}`;

  // La primera vez repartimos un lote inicial, al azar y sin repetir, entre
  // las secciones destacadas: ranking numerado, recomendadas, selección de
  // expertos y carrusel. Cada app aparece como máximo en una sola sección.
  if (featured.childElementCount === 0 && topRank.childElementCount === 0 && state.feed.items.length) {
    const pool = shuffled(visible(state.feed.items).filter((i) => i.icon || i.summary));
    const used = state.usedSectionKeys;

    const take = (n) => {
      const picked = [];
      while (picked.length < n && pool.length) {
        const item = pool.shift();
        const key = keyOf(item);
        if (used.has(key)) continue;
        used.add(key);
        picked.push(item);
      }
      return picked;
    };

    const topPicks = take(SECTION_SIZES.top);
    topPicks.forEach((item, i) => {
      const row = rankItem(item, i, { installed: isInstalled(item) });
      row.dataset.key = keyOf(item);
      row.onclick = () => openActionModal(item);
      topRank.append(row);
    });

    const recommendedPicks = take(SECTION_SIZES.recommended);
    recommendedPicks.forEach((item) => {
      const card = appCard(item, { installed: isInstalled(item) });
      card.dataset.key = keyOf(item);
      card.onclick = () => openActionModal(item);
      featured.append(card);
    });

    const expertPicks = take(SECTION_SIZES.experts);
    expertPicks.forEach((item) => {
      const card = appCard(item, { installed: isInstalled(item) });
      card.dataset.key = keyOf(item);
      card.onclick = () => openActionModal(item);
      experts.append(card);
    });

    const heroPicks = take(SECTION_SIZES.hero);
    renderHeroCarousel(heroPicks);
  }

  const already = new Set([...grid.children].map((c) => c.dataset.key));
  for (const item of shuffled(visible(freshItems))) {
    const key = keyOf(item);
    if (already.has(key) || state.usedSectionKeys.has(key)) continue;
    state.usedSectionKeys.add(key);
    const card = appCard(item, { installed: isInstalled(item) });
    card.dataset.key = key;
    card.onclick = () => openActionModal(item);
    grid.append(card);
  }
  $('store-empty').classList.toggle('hidden', grid.childElementCount > 0 || featured.childElementCount > 0 || topRank.childElementCount > 0);
  if (!state.searchQuery) insertBannerRandomly('store-grid');
}

// Flechas ‹ › para los carruseles de Recomendadas y Selección de expertos (20 apps cada uno).
function setupRowArrows() {
  for (const [blockId, rowId] of [['recommended-block', 'featured-row'], ['experts-block', 'experts-row']]) {
    const block = $(blockId);
    const row = $(rowId);
    if (!block || !row) continue;
    const make = (dir) => {
      const btn = el('button', `row-arrow ${dir < 0 ? 'row-prev' : 'row-next'} hidden`);
      btn.type = 'button';
      btn.setAttribute('aria-label', dir < 0 ? 'Previous' : 'Next');
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${dir < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}"/></svg>`;
      btn.onclick = () => row.scrollBy({ left: dir * Math.max(240, row.clientWidth * 0.8), behavior: 'smooth' });
      block.append(btn);
      return btn;
    };
    const prev = make(-1);
    const next = make(1);
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      prev.classList.toggle('hidden', row.scrollLeft <= 2);
      next.classList.toggle('hidden', row.scrollLeft >= max - 2);
    };
    row.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(row);
    new MutationObserver(update).observe(row, { childList: true });
    update();
  }
}

function setupInfiniteScroll() {
  const sentinel = $('feed-sentinel');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && state.feedActive && !state.feed.loading) loadFeedBatch();
    }
  }, { root: $('main'), rootMargin: '400px 0px' });
  io.observe(sentinel);
}

async function loadInstalled() {
  if (!state.systemApps.length) showSkeleton($('installed-grid'), 14); // solo la primera vez
  const [pkgs, apps] = await Promise.all([window.sys.installedPackages(), window.sys.systemApps()]);
  state.installed = Array.isArray(pkgs) ? pkgs : [];
  state.systemApps = Array.isArray(apps) ? apps : [];
  state.installedIds = new Set(state.installed.map((p) => `${p.source}:${p.id}`));
  state.desktopIds = new Set([
    ...state.systemApps.map((a) => a.id),
    ...state.systemApps.map((a) => a.id.replace(/\.desktop$/, ''))
  ]);
  $('dot-installed').style.opacity = state.systemApps.length ? '1' : '.2';

  renderInstalledGrid();

  if (!state.searchQuery) renderFeedIncrement([]);
  else renderCatalog(state.searchQuery);
  // Las tarjetas de apps web ya pintadas se re-marcan como instaladas / no instaladas.
  renderWebResults();
  renderPopularWeb();
}

function renderInstalledGrid() {
  const grid = $('installed-grid');
  const q = norm($('installed-search-input').value.trim());
  const list = q
    ? state.systemApps.filter((a) => [a.name, a.summary, a.id, a.source].some((v) => norm(v).includes(q)))
    : state.systemApps;

  grid.innerHTML = '';
  for (const appItem of list) {
    const pkg = findPkgForApp(appItem);
    // Si no hay paquete flatpak/snap/apt que coincida, igual se puede eliminar de verdad:
    // "sistema" intenta resolver el paquete dpkg dueño del .desktop (apt remove con sudo/pkexec),
    // y "webapp" borra su acceso .desktop + icono. Ver removePackage() en el proceso principal.
    const removeTarget = pkg
      ? { id: pkg.id, source: pkg.source, name: pkg.name || appItem.name }
      : { id: appItem.id, source: appItem.source, name: appItem.name, desktopFile: appItem.desktopFile };

    const card = appCard(appItem, { installed: false, hasUpdate: hasPendingUpdate(pkg) });
    card.dataset.pkgSource = pkg ? pkg.source : '';
    card.dataset.pkgId = pkg ? pkg.id : '';
    const openModal = () => openActionModal(appItem, { installedPkg: removeTarget, launchable: true });
    card.onclick = openModal;
    card.oncontextmenu = (ev) => { ev.preventDefault(); openModal(); };

    // Botón visible de desinstalación (además del menú contextual y la hoja de acción).
    const trash = el('button', 'uninstall-badge', null);
    trash.title = t('action.uninstall');
    trash.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
    trash.onclick = async (ev) => {
      ev.stopPropagation();
      if (!confirm(t('action.confirmUninstall', { name: removeTarget.name }))) return;
      toast(t('toast.uninstalling', { name: removeTarget.name }));
      const r = unwrap(await window.sys.remove(removeTarget));
      toast(r.ok ? t('toast.uninstalled', { name: removeTarget.name }) : (r.error ? errText(r) : t('toast.uninstallFailed')), !r.ok);
      loadInstalled();
    };
    card.querySelector('.icon-wrap').append(trash);

    grid.append(card);
  }
  if (!state.systemApps.length) grid.append(el('div', 'empty', t('installed.empty')));
  else if (!list.length) grid.append(el('div', 'empty', t('installed.noMatches')));
  applyUpdateBadges();
}

$('installed-search-input').addEventListener('input', renderInstalledGrid);
$('installed-search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.target.value = ''; renderInstalledGrid(); }
});


/* ───────── modal de acción (instalar / ver página / cancelar) ───────── */

function openActionModal(item, { installedPkg = null, launchable = false } = {}) {
  const already = installedPkg || isInstalled(item);
  $('sheet-icon').replaceWith(Object.assign(iconNode(item, 'sheet-icon'), { id: 'sheet-icon' }));
  $('sheet-name').textContent = item.name;
  $('sheet-sub').textContent = item.source === 'webapp' ? t('sheet.webapp') : item.source === 'gnome-extension' ? t('sheet.extension') : item.source;
  $('sheet-desc').textContent = webappSummary(item) || item.summary || t('sheet.noDescription');

  const meta = $('sheet-meta');
  meta.innerHTML = '';
  const metaBits = [];
  if (item.publisher) metaBits.push(item.publisher);
  if (item.version) metaBits.push(`v${item.version}`);
  if (item.size) metaBits.push(fmtBytes(item.size));
  if (item.url) { try { metaBits.push(new URL(item.url).hostname); } catch { /* url no válida, se omite */ } }
  for (const b of metaBits) meta.append(el('span', null, b));

  const installBtn = $('sheet-install');
  const previewBtn = $('sheet-preview');
  const cancelBtn = $('sheet-cancel');

  const canPreview = item.source !== 'sistema' || !!item.url;
  previewBtn.classList.toggle('hidden', !canPreview);
  previewBtn.onclick = async () => {
    const r = unwrap(await window.sys.preview(item));
    if (!r.ok) toast(errText(r) || t('toast.previewFailed'), true);
  };

  if (already || launchable) {
    installBtn.textContent = t('action.open');
    installBtn.className = 'btn primary';
    installBtn.onclick = async () => {
      closeSheet();
      const r = unwrap(await window.sys.launch(item));
      toast(r.ok ? t('toast.opening', { name: item.name }) : (r.error ? errText(r) : t('toast.cantOpen')), !r.ok);
    };
    if (installedPkg) {
      cancelBtn.textContent = t('action.uninstall');
      cancelBtn.className = 'btn danger';
      cancelBtn.onclick = async () => {
        if (!confirm(t('action.confirmUninstall', { name: installedPkg.name }))) return;
        closeSheet();
        toast(t('toast.uninstalling', { name: installedPkg.name }));
        const r = unwrap(await window.sys.remove(installedPkg));
        toast(r.ok ? t('toast.uninstalled', { name: installedPkg.name }) : (r.error ? errText(r) : t('toast.uninstallFailed')), !r.ok);
        loadInstalled();
      };
    } else {
      cancelBtn.textContent = t('action.close');
      cancelBtn.className = 'btn ghost';
      cancelBtn.onclick = closeSheet;
    }
  } else {
    installBtn.textContent = t('action.install');
    installBtn.className = 'btn primary';
    installBtn.onclick = () => { closeSheet(); startInstall(item); };
    cancelBtn.textContent = t('action.cancel');
    cancelBtn.className = 'btn ghost';
    cancelBtn.onclick = closeSheet;
  }

  $('sheet').classList.remove('hidden');
}
function closeSheet() { $('sheet').classList.add('hidden'); }
$('sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
$('sheet-close').onclick = closeSheet;

// Las apps web de Oficina traen su resumen fijo; lo traducimos por id en vez de guardar tres copias en main.js.
function webappSummary(item) {
  if (item.source !== 'webapp') return null;
  return t(`webapp.summary.${item.id}`) !== `webapp.summary.${item.id}` ? t(`webapp.summary.${item.id}`) : item.summary;
}

/* ───────── instalación con panel flotante ───────── */

/* ── Mini ventana: el proceso principal la muestra solo si la app está minimizada o en segundo plano ── */
const miniState = { data: { phase: 'idle' } };

function miniLabels() {
  return {
    cancel: t('action.cancel'), cancelling: t('stage.cancelling'), open: t('action.open'),
    showApp: t('mini.showApp'), minimize: t('win.minimize')
  };
}

function pushMini(patch) {
  miniState.data = { ...miniState.data, ...patch };
  try { window.sys.miniUpdate({ ...miniState.data, theme: state.theme, labels: miniLabels() }); } catch { /* la mini ventana es opcional */ }
}

function queueLabel() {
  return state.queue.length ? t('download.queued', { n: state.queue.length }) : '';
}

function showDownloadPanel(item) {
  const panel = $('download-panel');
  const head = item.source === 'gnome-extension' ? t('download.installingExtension') : item.source === 'webapp' ? t('download.creatingShortcut') : t('download.downloading');
  $('dl-head-text').textContent = head;
  $('dl-name').textContent = item.name;
  $('dl-stage').textContent = t('stage.preparing');
  $('dl-pct').textContent = '0%';
  $('dl-fill').style.width = '0%';
  $('dl-fill').classList.add('indeterminate');
  const img = $('dl-icon');
  if (item.icon) { img.src = item.icon; img.style.display = 'block'; }
  else { img.removeAttribute('src'); img.style.display = 'none'; }
  panel.classList.remove('hidden');
  updateQueueLabel();
  pushMini({
    phase: 'progress', name: item.name, icon: item.icon || '', head,
    stage: t('stage.preparing'), message: '', percent: 0, indeterminate: true,
    key: `${item.source}:${item.id}`, launch: { id: item.id, source: item.source }, queue: queueLabel()
  });
}

function updateQueueLabel() {
  $('dl-queue').textContent = queueLabel();
  if (miniState.data.phase === 'progress') pushMini({ queue: queueLabel() });
}

function hideDownloadPanel() {
  $('download-panel').classList.add('hidden');
}

function showCoffee(item, note) {
  const panel = $('coffee-panel');
  const where = tPrefixed(note, 'note') !== note ? tPrefixed(note, 'note') : (note || t('install.readyNote', { source: item.source }));
  $('coffee-label').textContent = t('install.finished');
  $('coffee-title').textContent = item.name;
  $('coffee-loc').textContent = where;
  const img = $('coffee-img');
  if (item.icon) { img.src = item.icon; img.style.display = 'block'; }
  else { img.style.display = 'none'; }
  $('coffee-open').onclick = async () => {
    const r = unwrap(await window.sys.launch({ id: item.id, source: item.source }));
    toast(r.ok ? t('toast.opening', { name: item.name }) : t('toast.launchOpenLater'), !r.ok);
  };
  panel.classList.remove('hidden');
  clearTimeout(state.coffeeTimer);
  state.coffeeTimer = setTimeout(() => panel.classList.add('hidden'), 9000);
  pushMini({
    phase: 'done', name: item.name, icon: item.icon || '', head: t('install.finished'),
    message: where, percent: 100, indeterminate: false, queue: '',
    key: '', launch: { id: item.id, source: item.source }
  });
}

function startInstall(item) {
  if (isInstalled(item)) {
    toast(t('toast.alreadyInstalled', { name: item.name }));
    return;
  }
  if (state.current && state.current.key === `${item.source}:${item.id}`) return;
  if (state.queue.some((q) => `${q.source}:${q.id}` === `${item.source}:${item.id}`)) return;
  state.queue.push(item);
  updateQueueLabel();
  if (!state.current) runQueue();
}

async function runQueue() {
  const item = state.queue.shift();
  if (!item) { state.current = null; hideDownloadPanel(); return; }
  state.current = { ...item, key: `${item.source}:${item.id}` };
  showDownloadPanel(item);

  let result;
  try {
    result = item.source === 'gnome-extension' ? unwrap(await window.sys.installExtension(item))
      : item.source === 'webapp' ? unwrap(await window.sys.installWebApp(item))
      : unwrap(await window.sys.install(item));
  } catch (e) {
    result = { ok: false, error: e.message };
  }

  state.current = null;
  hideDownloadPanel();

  if (result.ok) {
    showCoffee(item, result.note);
    await loadInstalled();
  } else if (result.cancelled) {
    toast(t('toast.installCancelled', { name: item.name }));
    pushMini({ phase: 'idle' });
  } else {
    const failTitle = t('toast.installFailed', { name: item.name });
    const failMsg = result.error ? errText(result) : failTitle;
    toast(failMsg, true);
    pushMini({ phase: 'error', name: item.name, icon: item.icon || '', head: failTitle, message: result.error ? failMsg : '', percent: 0, indeterminate: false, queue: '', key: '', launch: null });
  }
  runQueue();
}

window.sys.onProgress((p) => {
  if (!state.current) return;
  const fill = $('dl-fill');
  if (typeof p.percent === 'number' && p.percent > 0) {
    fill.classList.remove('indeterminate');
    fill.style.width = `${p.percent}%`;
    $('dl-pct').textContent = `${p.percent}%`;
  }
  if (p.stage) $('dl-stage').textContent = tPrefixed(p.stage, 'stage');
  const patch = {};
  if (typeof p.percent === 'number' && p.percent > 0) { patch.percent = p.percent; patch.indeterminate = false; }
  if (p.stage) patch.stage = tPrefixed(p.stage, 'stage');
  if (Object.keys(patch).length) pushMini(patch);
});

$('dl-cancel').onclick = async () => {
  if (!state.current) return;
  await window.sys.cancel(state.current.key);
  $('dl-stage').textContent = t('stage.cancelling');
  pushMini({ stage: t('stage.cancelling'), indeterminate: true });
};

/* ───────── extensiones de GNOME ───────── */

async function loadExtensions(query = '') {
  const listNode = $('ext-list');
  const hint = $('ext-hint');
  listNode.innerHTML = '';
  if (!state.backends.gnomeExt) {
    hint.textContent = t('ext.notGnome');
    return;
  }
  hint.textContent = t('ext.readyInfo', { version: state.backends.shellVersion });
  listNode.append(el('div', 'empty', t('ext.querying')));

  let remote = [];
  let installedExt = [];
  try {
    [remote, installedExt] = await Promise.all([
      window.sys.searchExtensions(query).then(unwrap),
      window.sys.listExtensions().then(unwrap)
    ]);
  } catch (e) {
    listNode.innerHTML = '';
    listNode.append(el('div', 'empty', t('ext.catalogError', { msg: errText(e) })));
    return;
  }
  const installedIds = new Set(installedExt.map((x) => x.id));
  listNode.innerHTML = '';

  for (const ext of remote) {
    const row = el('div', 'row');
    row.append(iconNode(ext, 'row-icon'));
    const body = el('div', 'row-body');
    body.append(el('div', 'row-name', ext.name));
    body.append(el('div', 'row-sub', ext.summary || ext.publisher));
    row.append(body);
    const btn = el('button', 'btn' + (installedIds.has(ext.id) ? '' : ' primary'), installedIds.has(ext.id) ? t('ext.installed') : t('action.install'));
    btn.disabled = installedIds.has(ext.id);
    btn.onclick = (e) => { e.stopPropagation(); startInstall(ext); };
    row.append(btn);
    row.onclick = () => openActionModal(ext);
    listNode.append(row);
  }
  if (!remote.length) listNode.append(el('div', 'empty', t('ext.noMatches')));
}

/* ───────── Oficina y Dev: apps nativas (Flatpak/Snap/APT) + apps web ───────── */

function fillGrid(grid, items) {
  grid.innerHTML = '';
  for (const it of items) {
    const item = it.source === 'webapp' ? localizeWeb(it) : it;
    const card = appCard(item, { installed: isInstalled(item) });
    card.onclick = () => openActionModal(item);
    grid.append(card);
  }
}

function renderOfficeCatalog() {
  if (!state.office) return;
  fillGrid($('office-native-grid'), visible(state.office.packages || []));
  fillGrid($('webapps-grid'), state.office.webapps || []);
}

function renderOfficeSuite() {
  const suiteGrid = $('suite-grid');
  const suiteHint = $('suite-hint');
  suiteGrid.innerHTML = '';
  const suite = (state.office && state.office.suite) || [];

  if (suite.length) {
    suiteHint.textContent = t('office.suiteReady');
    for (const s of suite) {
      const card = appCard(s, { installed: true });
      card.onclick = async () => {
        const r = unwrap(await window.sys.launch(s));
        toast(r.ok ? t('toast.opening', { name: s.name }) : (r.error ? errText(r) : t('toast.cantOpen')), !r.ok);
      };
      suiteGrid.append(card);
    }
  } else {
    suiteHint.textContent = t('office.suiteMissing');
    const link = el('button', 'btn primary', t('office.findLibreOffice'));
    link.onclick = () => {
      switchView('explorar');
      searchWrap.classList.add('open');
      $('search-input').value = 'libreoffice';
      $('search-input').dispatchEvent(new Event('input'));
      $('search-input').focus();
    };
    suiteGrid.append(link);
  }
}

async function loadOffice() {
  if (state.office) { renderOfficeCatalog(); renderOfficeSuite(); }
  else { showSkeleton($('office-native-grid'), 16); showSkeleton($('webapps-grid'), 6); }

  let data;
  try { data = unwrap(await window.sys.office()); }
  catch (e) { $('webapps-grid').innerHTML = ''; $('office-native-grid').innerHTML = ''; $('webapps-grid').append(el('div', 'empty', errText(e))); return; }

  if (!state.office) {
    await preloadIcons([...(data.packages || []), ...(data.webapps || [])]);
    state.office = data;
    renderOfficeCatalog();
  } else {
    state.office.suite = data.suite; // lo único que cambia entre visitas es lo instalado
  }
  renderOfficeSuite();
}

function renderDev(data = state.dev) {
  if (!data) return;
  fillGrid($('dev-native-grid'), visible(data.packages || []));
  fillGrid($('dev-webapps-grid'), data.webapps || []);
}

async function loadDev() {
  if (state.dev) { renderDev(); return; }
  showSkeleton($('dev-native-grid'), 18);
  showSkeleton($('dev-webapps-grid'), 10);

  let data;
  try { data = unwrap(await window.sys.dev()); }
  catch (e) { $('dev-native-grid').innerHTML = ''; $('dev-webapps-grid').innerHTML = ''; $('dev-webapps-grid').append(el('div', 'empty', errText(e))); return; }

  await preloadIcons([...(data.packages || []), ...(data.webapps || [])]);
  if ((data.packages || []).length) state.dev = data; // si no hubo red no lo fijamos: se reintenta en la próxima visita
  renderDev(data);
}

/* ───────── actualizaciones ───────── */


async function loadUpdates(silent = false) {
  const listNode = $('updates-list');
  if (!silent) { listNode.innerHTML = ''; listNode.append(el('div', 'empty', t('updates.checking'))); }
  let data;
  try { data = unwrap(await window.sys.checkUpdates()); }
  catch (e) { listNode.innerHTML = ''; listNode.append(el('div', 'empty', errText(e))); return; }

  const total = data.flatpak.length + data.snap.length + data.apt.length;
  state.updates = data;
  $('dot-updates').classList.toggle('hidden', total === 0);
  applyUpdateBadges();
  if (silent) return;

  listNode.innerHTML = '';
  if (!total) { listNode.append(el('div', 'empty', t('updates.upToDate'))); return; }

  for (const source of ['flatpak', 'snap', 'apt']) {
    const items = data[source];
    if (!items.length) continue;
    const row = el('div', 'row');
    const body = el('div', 'row-body');
    body.append(el('div', 'row-name', t('updates.packages', { source: source.toUpperCase(), n: items.length, plural: items.length > 1 ? 's' : '' })));
    body.append(el('div', 'row-sub', items.map((i) => i.id).join(', ')));
    row.append(body);
    const btn = el('button', 'btn primary', t('action.update'));
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = t('action.updating');
      showDownloadPanel({ name: `${t('action.update')} ${source}`, source, icon: null, id: source });
      state.current = { key: `update:${source}`, name: source, source, id: source };
      const r = unwrap(await window.sys.applyUpdates(source));
      state.current = null;
      hideDownloadPanel();
      toast(r.ok ? t('updates.applied', { source }) : t('updates.failed'), !r.ok);
      loadUpdates();
      loadInstalled();
    };
    row.append(btn);
    listNode.append(row);
  }
}

/* ───────── ajustes ───────── */

function openSettings() {
  applyAppearance();
  document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === state.lang));
  $('settings-sheet').classList.remove('hidden');
}
function closeSettings() { $('settings-sheet').classList.add('hidden'); }
$('settings-close').onclick = closeSettings;
$('settings-sheet').addEventListener('click', (e) => { if (e.target.id === 'settings-sheet') closeSettings(); });
$('lang-options').addEventListener('click', (e) => {
  const btn = e.target.closest('.lang-btn');
  if (btn) setLang(btn.dataset.lang);
});
$('theme-options').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme-opt]');
  if (btn) setTheme(btn.dataset.themeOpt);
});
$('side-options').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-side-opt]');
  if (btn) setSide(btn.dataset.sideOpt);
});
$('open-settings').onclick = openSettings;

function applyBackendStatusLabels() {
  if (!state.backends) return;
  const b = state.backends;
  $('st-flatpak').textContent = b.flatpak ? (b.flathub ? t('status.ready') : t('status.noFlathub')) : t('status.notInstalled');
  $('st-snap').textContent = b.snap ? t('status.ready') : t('status.notInstalled');
  $('st-apt').textContent = b.apt ? t('status.ready') : t('status.notAvailable');
}

/* ───────── navegación, búsqueda y ventana ───────── */

function switchView(view) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('hidden', v.id !== `view-${view}`));
  $('main').scrollTop = 0;
  state.feedActive = view === 'explorar' && !state.searchQuery;
  if (view === 'extensiones') loadExtensions($('search-input').value.trim());
  if (view === 'actualizaciones') loadUpdates();
  if (view === 'instaladas') loadInstalled();
  if (view === 'oficina') loadOffice();
  if (view === 'dev') loadDev();
}

$('nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (btn) switchView(btn.dataset.view);
});

const searchWrap = $('store-search-wrap');
const searchSentinel = $('store-search-sentinel');

if (searchSentinel && searchWrap) {
  const searchObserver = new IntersectionObserver((entries) => {
    searchWrap.classList.toggle('floating', !entries[0].isIntersecting);
  }, { root: $('main'), threshold: 0 });
  searchObserver.observe(searchSentinel);
}

const searchIcon = $('search-ic');
const searchIconOpen = '<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"><path d=\"M6 6l12 12M18 6L6 18\"/></svg>';
const searchIconClosed = '<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M21 21l-4.3-4.3\"/></svg>';

function updateSearchIcon() {
  searchIcon.innerHTML = searchWrap.classList.contains('open') ? searchIconOpen : searchIconClosed;
  searchIcon.title = searchWrap.classList.contains('open') ? 'Close search' : 'Search';
}

searchIcon.onclick = () => {
  searchWrap.classList.toggle('open');
  updateSearchIcon();
  if (searchWrap.classList.contains('open')) $('search-input').focus();
  else { $('search-input').value = ''; loadCatalog(''); }
};
updateSearchIcon();

let searchTimer;
$('search-input').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const active = document.querySelector('.nav-item.active').dataset.view;
    if (active === 'extensiones') loadExtensions(q);
    else loadCatalog(q);
  }, 420);
});
$('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.target.value = ''; searchWrap.classList.remove('open'); loadCatalog(''); }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const active = document.querySelector('.nav-item.active');
    if (active && active.dataset.view === 'instaladas') { $('installed-search-input').focus(); return; }
    searchWrap.classList.add('open');
    $('search-input').focus();
  }
  if (e.key === 'Escape') { closeSheet(); closeSettings(); }
});

document.querySelectorAll('.tag-item input').forEach((box) => {
  box.addEventListener('change', () => {
    state.sources[box.dataset.src] = box.checked;
    if (state.searchQuery) renderCatalog(state.searchQuery);
    else { $('store-grid').innerHTML = ''; $('featured-row').innerHTML = ''; $('top-rank-row').innerHTML = ''; $('experts-row').innerHTML = ''; $('hero-carousel').innerHTML = ''; state.usedSectionKeys = new Set(); renderFeedIncrement(state.feed.items); }
    renderDev();
    renderOfficeCatalog();
  });
});

$('btn-refresh-updates').onclick = () => loadUpdates();

// Controles de ventana estilo macOS.
// Se asignan de forma directa y también con addEventListener para garantizar
// que los tres botones sigan funcionando aunque otros listeners fallen.
(function bindWindowControls() {
  const runWindowAction = (action) => {
    try {
      if (window.sys && typeof window.sys[action] === 'function') {
        window.sys[action]();
      }
    } catch (err) {
      console.error(`window ${action} failed`, err);
    }
  };

  // El HTML tiene los onclick reales. Aquí solo agregamos soporte de teclado
  // y doble clic en la barra superior sin reemplazar los onclick.
  for (const [id, action] of [
    ['win-close', 'close'],
    ['win-min', 'minimize'],
    ['win-max', 'maximize']
  ]) {
    const button = document.getElementById(id);
    if (!button) continue;
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        runWindowAction(action);
      }
    });
  }

  const dragStrip = document.querySelector('.drag-strip');
  if (dragStrip) {
    dragStrip.addEventListener('dblclick', () => runWindowAction('maximize'));
  }
})();

const mobileMenuBtn = $('mobile-menu-btn');
const sideEl = document.querySelector('.side');
if (mobileMenuBtn && sideEl) {
  mobileMenuBtn.addEventListener('click', () => {
    const open = sideEl.classList.toggle('mobile-open');
    document.querySelector('.window').classList.toggle('mobile-menu-open', open);
    mobileMenuBtn.classList.toggle('open', open);
    mobileMenuBtn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.nav-item, #open-settings').forEach((el) => {
    el.addEventListener('click', () => {
      sideEl.classList.remove('mobile-open');
      document.querySelector('.window').classList.remove('mobile-menu-open');
      mobileMenuBtn.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });
  document.querySelector('.window').addEventListener('click', (ev) => {
    if (window.innerWidth <= 760 && sideEl.classList.contains('mobile-open') && !sideEl.contains(ev.target) && ev.target !== mobileMenuBtn && !mobileMenuBtn.contains(ev.target)) {
      sideEl.classList.remove('mobile-open');
      document.querySelector('.window').classList.remove('mobile-menu-open');
      mobileMenuBtn.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ───────── arranque ───────── */

/* ---------- banner de cadenas (fuente externa: imbanner.json) ---------- */

const CHANNEL_BANNER_URL = 'https://raw.githubusercontent.com/tred4657833/info/refs/heads/main/imbanner.json';
const CB_ROTATE_MS = 6000;
const CB_FALLBACK_GRADIENTS = [
  'linear-gradient(120deg,#ff5f6d,#7b2ff7)',
  'linear-gradient(120deg,#00c6ff,#0072ff)',
  'linear-gradient(120deg,#f7971e,#ffd200)',
  'linear-gradient(120deg,#11998e,#38ef7d)',
  'linear-gradient(120deg,#ee0979,#ff6a00)',
  'linear-gradient(120deg,#4776e6,#8e54e9)'
];

const cbState = { items: [], index: 0, timer: null };

function cbOpen(url) {
  if (!url) return;
  if (window.sys && window.sys.openExternal) window.sys.openExternal(url);
  else window.open(url, '_blank');
}

function cbGoTo(i) {
  const { items } = cbState;
  if (!items.length) return;
  cbState.index = ((i % items.length) + items.length) % items.length;
  document.querySelectorAll('.cb-slide').forEach((n, idx) => n.classList.toggle('active', idx === cbState.index));
  document.querySelectorAll('.channel-banner-dots span').forEach((n, idx) => n.classList.toggle('active', idx === cbState.index));
}

function cbStartAutoplay() {
  clearInterval(cbState.timer);
  if (cbState.items.length > 1) cbState.timer = setInterval(() => cbGoTo(cbState.index + 1), CB_ROTATE_MS);
}

function renderChannelBanner(cadenas) {
  const wrap = $('channel-banner-wrap');
  const track = $('channel-banner');
  const dots = $('channel-banner-dots');
  if (!wrap || !track || !dots) return;
  track.innerHTML = '';
  dots.innerHTML = '';

  const items = (Array.isArray(cadenas) ? cadenas : [])
    .filter((c) => c && c.nombre)
    .map((c, i) => ({
      nombre: c.nombre,
      url: c.url || '',
      // "iman" trae el banner de fondo; si no es una URL usable, cae a un degradado.
      image: typeof c.iman === 'string' && /^https?:\/\//.test(c.iman) ? c.iman : null,
      fallback: CB_FALLBACK_GRADIENTS[i % CB_FALLBACK_GRADIENTS.length]
    }));

  cbState.items = items;
  wrap.classList.toggle('hidden', items.length === 0);
  if (!items.length) return;

  items.forEach((item, i) => {
    const slide = el('div', 'cb-slide' + (i === 0 ? ' active' : ''));
    if (item.image) slide.style.backgroundImage = `url("${item.image}")`;
    else slide.style.background = item.fallback;

    const body = el('div', 'cb-body');
    body.append(el('div', 'cb-title', item.nombre));
    const actions = el('div', 'cb-actions');

    const play = el('button', 'cb-play');
    play.textContent = t('cb.views');
    play.onclick = () => cbOpen(item.url);

    actions.append(play);
    body.append(actions);
    slide.append(body);
    track.append(slide);

    const dot = el('span');
    if (i === 0) dot.classList.add('active');
    dot.onclick = () => { cbGoTo(i); cbStartAutoplay(); };
    dots.append(dot);
  });

  cbState.index = 0;
  cbStartAutoplay();
}

async function loadChannelBanner() {
  try {
    const res = await fetch(CHANNEL_BANNER_URL, { cache: 'no-store' });
    const data = await res.json();
    renderChannelBanner(data && data.cadenas);
  } catch (err) {
    console.error('channel banner fetch failed', err);
    $('channel-banner-wrap') && $('channel-banner-wrap').classList.add('hidden');
  }
}

const cbPrevBtn = $('cb-prev');
const cbNextBtn = $('cb-next');
if (cbPrevBtn) cbPrevBtn.onclick = () => { cbGoTo(cbState.index - 1); cbStartAutoplay(); };
if (cbNextBtn) cbNextBtn.onclick = () => { cbGoTo(cbState.index + 1); cbStartAutoplay(); };

async function init() {
  applyAppearance();
  applyStaticI18n();
  document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === state.lang));

  await tickStats();
  setInterval(tickStats, 3000);

  await loadDevice();
  state.backends = unwrap(await window.sys.backends());
  const b = state.backends;
  applyBackendStatusLabels();
  for (const key of ['flatpak', 'snap', 'apt']) {
    if (!b[key]) {
      const box = document.querySelector(`.tag-item input[data-src="${key}"]`);
      box.checked = false;
      state.sources[key] = false;
    }
  }

  loadChannelBanner();
  setupInfiniteScroll();
  setupRowArrows();
  state.feedActive = true;
  state.installedReady = loadInstalled();
  await loadCatalog('');
  await state.installedReady;
  loadUpdates(true);
  setInterval(() => loadUpdates(true), 15 * 60 * 1000);
}

init().catch((e) => toast(t('toast.startupError', { msg: errText(e) }), true));

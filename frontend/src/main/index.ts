import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// ── Deep link: psidoc://nova-senha?token=... (link do e-mail de recuperação de senha) ──
const PROTOCOL = 'psidoc'
// Só estas "páginas" podem ser abertas por link externo.
const ALLOWED_DEEP_LINKS = new Set(['nova-senha'])

let win: BrowserWindow | null = null
let pendingRoute: string | null = null

/** Converte psidoc://nova-senha?token=abc em /nova-senha?token=abc (rota do HashRouter). */
function routeFromDeepLink(raw: string | undefined): string | null {
  if (!raw?.startsWith(`${PROTOCOL}://`)) return null
  try {
    const url = new URL(raw)
    if (!ALLOWED_DEEP_LINKS.has(url.hostname)) return null
    const token = url.searchParams.get('token') ?? ''
    if (!/^[\w.-]{1,512}$/.test(token)) return `/${url.hostname}`
    return `/${url.hostname}?token=${encodeURIComponent(token)}`
  } catch {
    return null
  }
}

function openRoute(route: string | null): void {
  if (!route) return
  if (!win || win.webContents.isLoading()) {
    pendingRoute = route // janela ainda abrindo: entrega quando carregar
    return
  }
  if (win.isMinimized()) win.restore()
  win.focus()
  win.webContents.send('deep-link', route)
}

if (process.defaultApp) {
  // Em desenvolvimento o Windows precisa saber qual script abrir.
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// Uma instância só: clicar no link com o app já aberto reaproveita a janela (Windows/Linux).
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => openRoute(routeFromDeepLink(argv.find((a) => a.startsWith(`${PROTOCOL}://`)))))
}
// macOS entrega o link por este evento.
app.on('open-url', (event, url) => {
  event.preventDefault()
  openRoute(routeFromDeepLink(url))
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win = mainWindow
  mainWindow.on('closed', () => (win = null))

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Entrega o link que chegou antes da tela terminar de carregar (app aberto pelo link).
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingRoute) {
      mainWindow.webContents.send('deep-link', pendingRoute)
      pendingRoute = null
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Windows/Linux: app aberto a frio pelo link recebe a URL em argv.
  pendingRoute = routeFromDeepLink(process.argv.find((a) => a.startsWith(`${PROTOCOL}://`)))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

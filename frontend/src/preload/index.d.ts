import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onDeepLink: (callback: (route: string) => void) => () => void
    }
  }
}

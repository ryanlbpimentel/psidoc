import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Psidoc</div>
      <div className="text">
        Sistema de Gestão para <span className="react">Psicólogos</span>
      </div>
    </>
  )
}

export default App

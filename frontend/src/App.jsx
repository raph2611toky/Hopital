import PetriEditor from "./components/PetriEditor"
import "./App.css"

function App() {
  const handleContextMenu = (event) => {
    event.preventDefault()
  }

  return (
    <div className="App" onContextMenu={handleContextMenu}>
      <PetriEditor />
    </div>
  )
}

export default App
"use client"
import "./ContextMenu.css"

const ContextMenu = ({
  visible,
  x,
  y,
  type,
  element,
  onClose,
  onAddPlace,
  onAddTransition,
  onDelete,
  onAddTokens,
  onRemoveTokens,
}) => {
  if (!visible) return null

  const handleAction = (action) => {
    action()
    onClose()
  }

  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div
        className="context-menu"
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, -10px)",
        }}
      >
        {type === "canvas" && (
          <>
            <div className="context-menu-header">Ajouter un élément</div>
            <button className="context-menu-item" onClick={() => handleAction(onAddPlace)}>
              <span className="menu-icon place-icon">●</span>
              Ajouter une Place
            </button>
            <button className="context-menu-item" onClick={() => handleAction(onAddTransition)}>
              <span className="menu-icon transition-icon">▬</span>
              Ajouter une Transition
            </button>
          </>
        )}

        
{/* 
        {type === "arc" && element && (
          <>
            <div className="context-menu-header">Arc (Poids: {element.weight})</div>
            <button className="context-menu-item danger" onClick={() => handleAction(onDelete)}>
              <span className="menu-icon">🗑</span>
              Supprimer
            </button>
          </>
        )} */}
      </div>
    </>
  )
}

export default ContextMenu

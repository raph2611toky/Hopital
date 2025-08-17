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
  onEditWeight,
  onToggleInhibitor,
  onToggleReset,
  canBeInhibitor,
}) => {
  if (!visible) return null

  const handleAction = (action) => {
    action()
    onClose()
  }

  const handleArcAction = (action, arcId) => {
    action(arcId)
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

        {type === "arc" && element && (
          <>
            <div className="context-menu-header">Arc (Poids: {element.weight})</div>
            <button className="context-menu-item" onClick={() => handleArcAction(onEditWeight, element.id)}>
              <span className="menu-icon">✏️</span>
              Modifier le poids ({element.weight})
            </button>
            <div className="menu-divider"></div>
            <button
              className={`context-menu-item ${!canBeInhibitor(element.id) ? "disabled" : ""}`}
              onClick={() => canBeInhibitor(element.id) && handleArcAction(onToggleInhibitor, element.id)}
              title={!canBeInhibitor(element.id) ? "Un arc Transition → Place ne peut pas être inhibiteur" : ""}
            >
              <span className="menu-icon">{element.is_inhibitor ? "✓" : "○"}</span>
              Arc inhibiteur
            </button>
            <button className="context-menu-item" onClick={() => handleArcAction(onToggleReset, element.id)}>
              <span className="menu-icon">{element.is_reset ? "✓" : "○"}</span>
              Arc de remise à zéro
            </button>
            <div className="menu-divider"></div>
            <button className="context-menu-item danger" onClick={() => handleAction(onDelete)}>
              <span className="menu-icon">🗑</span>
              Supprimer
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default ContextMenu

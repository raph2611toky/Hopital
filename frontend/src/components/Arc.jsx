"use client"

import { useState, useEffect } from "react"
import "./Arc.css"

const Arc = ({ arc, source, target, places, transitions, onSelect, onContextMenu, selected, onUpdate, onDelete }) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false)
  const [tempWeight, setTempWeight] = useState(arc.weight)
  const [showPropertiesMenu, setShowPropertiesMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  // Mettre à jour tempWeight seulement si arc.weight change depuis l'extérieur
  useEffect(() => {
    setTempWeight(arc.weight)
  }, [arc.weight])

  const calculateCurvedPath = () => {
    let start = { ...source.position }
    let end = { ...target.position }

    const isSourcePlace = places.some((place) => place.id === source.id)
    const isTargetPlace = places.some((place) => place.id === target.id)
    const isSourceTransition = transitions.some((transition) => transition.id === source.id)
    const isTargetTransition = transitions.some((transition) => transition.id === target.id)

    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const unitX = distance > 0 ? dx / distance : 0
    const unitY = distance > 0 ? dy / distance : 0

    // Ajuster départ
    if (isSourcePlace) {
      const radius = 30
      start = {
        x: source.position.x + unitX * radius,
        y: source.position.y + unitY * radius,
      }
    } else if (isSourceTransition) {
      const sourceTransition = transitions.find((t) => t.id === source.id)
      const isLandscape = sourceTransition?.orientation === "landscape"
      const halfWidth = isLandscape ? 25 : 15
      const halfHeight = isLandscape ? 15 : 25
      const tX = halfWidth / Math.abs(dx || 1)
      const tY = halfHeight / Math.abs(dy || 1)
      const t = Math.min(tX, tY)
      const intersectionX = dx * t
      const intersectionY = dy * t
      const magnitude = Math.sqrt(intersectionX * intersectionX + intersectionY * intersectionY)
      const scale = magnitude > 0 ? (halfWidth * halfHeight) / magnitude : 1
      start = {
        x: source.position.x + (intersectionX / magnitude) * scale * (dx > 0 ? 1 : -1),
        y: source.position.y + (intersectionY / magnitude) * scale * (dy > 0 ? 1 : -1),
      }
    }

    // Ajuster arrivée
    if (isTargetPlace) {
      const radius = 30
      end = {
        x: target.position.x - unitX * radius,
        y: target.position.y - unitY * radius,
      }
    } // Pas d'ajustement pour les transitions, on garde le centre

    const obstacles = [...places, ...transitions].filter(
      (element) => element.id !== source.id && element.id !== target.id,
    )

    let hasObstacle = false
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    obstacles.forEach((obstacle) => {
      const distToLine =
        Math.abs(
          (end.y - start.y) * obstacle.position.x -
            (end.x - start.x) * obstacle.position.y +
            end.x * start.y -
            end.y * start.x,
        ) / Math.sqrt(Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2))

      if (distToLine < 50) {
        hasObstacle = true
      }
    })

    if (hasObstacle) {
      const dxCurved = end.x - start.x
      const dyCurved = end.y - start.y
      const distanceCurved = Math.sqrt(dxCurved * dxCurved + dyCurved * dyCurved)
      const controlOffset = Math.min(distanceCurved * 0.35, 80)
      const perpX = (-dyCurved / distanceCurved) * controlOffset
      const perpY = (dxCurved / distanceCurved) * controlOffset
      const angle = Math.atan2(dyCurved, dxCurved)
      const offsetMultiplier = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))
      const controlX1 = start.x + dxCurved * 0.25 + perpX * 0.5 * offsetMultiplier
      const controlY1 = start.y + dyCurved * 0.25 + perpY * 0.5 * offsetMultiplier
      const controlX2 = start.x + dxCurved * 0.75 + perpX * 0.5 * offsetMultiplier
      const controlY2 = start.y + dyCurved * 0.75 + perpY * 0.5 * offsetMultiplier

      return {
        path: `M ${start.x} ${start.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${end.x} ${end.y}`,
        midPoint: {
          x: (start.x + controlX1 + controlX2 + end.x) / 4,
          y: (start.y + controlY1 + controlY2 + end.y) / 4,
        },
        isCurved: true,
        start,
        end,
      }
    } else {
      return {
        path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        midPoint: { x: midX, y: midY },
        isCurved: false,
        start,
        end,
      }
    }
  }

  const pathData = calculateCurvedPath()

  const calculateArrowAngle = () => {
    const dx = pathData.end.x - pathData.start.x
    const dy = pathData.end.y - pathData.start.y
    return (Math.atan2(dy, dx) * 180) / Math.PI
  }

  const arrowAngle = calculateArrowAngle()

  const handleWeightClick = (event) => {
    event.stopPropagation()
    setIsEditingWeight(true)
  }

  const handleWeightSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const newWeight = Math.max(1, Number.parseInt(tempWeight, 10) || 1)
    if (onUpdate && newWeight !== arc.weight) {
      onUpdate(arc.id, { weight: newWeight })
    }
    setIsEditingWeight(false)
  }

  const handleWeightCancel = (event) => {
    event.stopPropagation()
    setIsEditingWeight(false)
    setTempWeight(arc.weight) // on remet juste si cancel explicite
  }

  const canBeInhibitor = () => {
    // Rule: Transition → Place arc cannot be inhibitor
    const isSourceTransition = transitions.some((transition) => transition.id === source.id)
    const isTargetPlace = places.some((place) => place.id === target.id)
    return !(isSourceTransition && isTargetPlace)
  }

  const handlePropertyUpdate = (property, value) => {
    if (onUpdate) {
      onUpdate(arc.id, { [property]: value })
    }
    setShowPropertiesMenu(false)
  }

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setMenuPosition({ x: event.clientX, y: event.clientY })
    setShowPropertiesMenu(true)
    if (onContextMenu) {
      onContextMenu(event)
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (showPropertiesMenu && !event.target.closest(".arc-properties-menu")) {
        setShowPropertiesMenu(false)
      }
      if (isEditingWeight && !event.target.closest(".weight-form-container")) {
        setIsEditingWeight(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [isEditingWeight, showPropertiesMenu])

  return (
    <div className="arc-container">
      <svg className="arc-svg" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
        <defs>
          <marker
            id={`arrowhead-${arc.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9.5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {arc.is_inhibitor ? (
              <circle cx="5" cy="3" r="3" fill="none" stroke={selected ? "#3b82f6" : "#374151"} strokeWidth="2" />
            ) : arc.is_reset ? (
              <path d="M2,3 L5,0 L8,3 L5,6 z" fill="none" stroke={selected ? "#3b82f6" : "#374151"} strokeWidth="2" />
            ) : (
              <path d="M0,0 L0,6 L9,3 z" fill={selected ? "#3b82f6" : "#374151"} />
            )}
          </marker>
        </defs>

        <path
          d={pathData.path}
          stroke={selected ? "#3b82f6" : "#374151"}
          strokeWidth={selected ? "3" : "2"}
          fill="none"
          markerEnd={`url(#arrowhead-${arc.id})`}
          className="arc-line"
          onClick={onSelect}
          onContextMenu={handleContextMenu}
          style={{
            strokeDasharray: arc.is_inhibitor ? "5,5" : "none",
            cursor: "pointer",
          }}
        />
      </svg>

      {showPropertiesMenu && (
        <div
          className="arc-properties-menu"
          style={{
            position: "fixed",
            left: menuPosition.x,
            top: menuPosition.y,
            zIndex: 1000,
          }}
        >
          <div className="menu-item" onClick={() => setIsEditingWeight(true)}>
            Modifier le poids ({arc.weight})
          </div>
          <div className="menu-divider"></div>
          <div
            className={`menu-arc-item ${!canBeInhibitor() ? "disabled" : ""}`}
            onClick={() => canBeInhibitor() && handlePropertyUpdate("is_inhibitor", !arc.is_inhibitor)}
            title={!canBeInhibitor() ? "Un arc Transition → Place ne peut pas être inhibiteur" : ""}
          >
            {arc.is_inhibitor ? "✓" : ""} Arc inhibiteur
          </div>
          <div className="menu-arc-item" onClick={() => handlePropertyUpdate("is_reset", !arc.is_reset)}>
            {arc.is_reset ? "✓" : ""} Arc de remise à zéro
          </div>
          <div className="menu-arc-item" onClick={onDelete}>
            <button className="context-menu-item danger" onClick={onDelete}>
              <span className="menu-icon">🗑</span>
              Supprimer
            </button>
          </div>
        </div>
      )}

      <div
        className={`arc-weight ${selected ? "selected" : ""}`}
        style={{
          left: pathData.midPoint.x - 15,
          top: pathData.midPoint.y - 15,
        }}
        onClick={handleWeightClick}
      >
        {isEditingWeight ? (
          <div className="weight-form-container">
            <form onSubmit={handleWeightSubmit} className="weight-form">
              <input
                type="number"
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                autoFocus
                min="1"
                className="weight-input"
              />
              <div className="weight-form-buttons">
                <button type="submit" className="weight-form-button weight-form-save">
                  Save
                </button>
                <button type="button" onClick={handleWeightCancel} className="weight-form-button weight-form-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <span className="weight-value">{arc.weight}</span>
        )}
      </div>
    </div>
  )
}

export default Arc

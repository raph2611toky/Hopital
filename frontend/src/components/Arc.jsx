"use client"

import { useState } from "react"
import "./Arc.css"

const Arc = ({ arc, source, target, onSelect, onContextMenu, selected }) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false)
  const [tempWeight, setTempWeight] = useState(arc.weight)

  // Calculer les points de connexion
  const getConnectionPoint = (element, direction) => {
    const isPlace = element.tokens !== undefined
    const radius = isPlace ? 30 : 15
    const height = isPlace ? 30 : 25

    switch (direction) {
      case "top":
        return { x: element.position.x, y: element.position.y - height }
      case "right":
        return { x: element.position.x + radius, y: element.position.y }
      case "bottom":
        return { x: element.position.x, y: element.position.y + height }
      case "left":
        return { x: element.position.x - radius, y: element.position.y }
      default:
        return element.position
    }
  }

  // Trouver la meilleure direction de connexion
  const getBestConnectionPoints = () => {
    const dx = target.position.x - source.position.x
    const dy = target.position.y - source.position.y

    let sourceDir, targetDir

    if (Math.abs(dx) > Math.abs(dy)) {
      sourceDir = dx > 0 ? "right" : "left"
      targetDir = dx > 0 ? "left" : "right"
    } else {
      sourceDir = dy > 0 ? "bottom" : "top"
      targetDir = dy > 0 ? "top" : "bottom"
    }

    return {
      start: getConnectionPoint(source, sourceDir),
      end: getConnectionPoint(target, targetDir),
    }
  }

  const { start, end } = getBestConnectionPoints()

  // Calculer le point milieu pour le poids
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2

  // Calculer l'angle pour la flèche
  const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI

  const handleWeightClick = (event) => {
    event.stopPropagation()
    setIsEditingWeight(true)
    setTempWeight(arc.weight)
  }

  const handleWeightSubmit = (event) => {
    event.preventDefault()
    const newWeight = Number.parseInt(tempWeight) || 1
    // Ici vous pouvez appeler une fonction pour mettre à jour le poids
    setIsEditingWeight(false)
  }

  const handleWeightCancel = () => {
    setIsEditingWeight(false)
    setTempWeight(arc.weight)
  }

  return (
    <div className="arc-container">
      <svg className="arc-svg">
        <defs>
          <marker id={`arrowhead-${arc.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={selected ? "#3b82f6" : "#374151"} />
          </marker>
        </defs>

        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={selected ? "#3b82f6" : "#374151"}
          strokeWidth={selected ? "3" : "2"}
          markerEnd={`url(#arrowhead-${arc.id})`}
          className="arc-line"
          onClick={onSelect}
          onContextMenu={onContextMenu}
          style={{
            strokeDasharray: arc.isInhibitor ? "5,5" : "none",
            cursor: "pointer",
          }}
        />

        {arc.isReset && (
          <circle cx={midX} cy={midY} r="8" fill="none" stroke={selected ? "#3b82f6" : "#374151"} strokeWidth="2" />
        )}
      </svg>

      {/* Poids de l'arc */}
      <div
        className={`arc-weight ${selected ? "selected" : ""}`}
        style={{
          left: midX - 15,
          top: midY - 15,
        }}
        onClick={handleWeightClick}
      >
        {isEditingWeight ? (
          <form onSubmit={handleWeightSubmit} className="weight-form">
            <input
              type="number"
              value={tempWeight}
              onChange={(e) => setTempWeight(e.target.value)}
              onBlur={handleWeightCancel}
              autoFocus
              min="1"
              className="weight-input"
            />
          </form>
        ) : (
          <span className="weight-value">{arc.weight}</span>
        )}
      </div>
    </div>
  )
}

export default Arc

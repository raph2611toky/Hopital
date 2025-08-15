"use client"

import { useState } from "react"
import { EdgeLabelRenderer, getBezierPath } from "reactflow"
import "./CustomEdge.css"

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  style = {},
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [weight, setWeight] = useState(data.weight || 1)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleWeightChange = (e) => {
    const newWeight = Number.parseInt(e.target.value, 10) || 1
    setWeight(newWeight)
    if (data.onWeightChange) {
      data.onWeightChange(id, newWeight)
    }
  }

  const handleLabelClick = (e) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    data.weight = weight
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputBlur()
    }
    if (e.key === "Escape") {
      setWeight(data.weight || 1)
      setIsEditing(false)
    }
  }

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: selected ? "#3b82f6" : "#64748b",
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: data.isInhibitor ? "8,4" : "none",
        }}
        className={`custom-edge ${selected ? "selected" : ""} ${data.isInhibitor ? "inhibitor" : ""}`}
        d={edgePath}
        fill="none"
      />

      {/* Flèche */}
      <defs>
        <marker id={`arrowhead-${id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={selected ? "#3b82f6" : "#64748b"} />
        </marker>
      </defs>

      <path d={edgePath} fill="none" stroke="transparent" strokeWidth="20" markerEnd={`url(#arrowhead-${id})`} />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="edge-label-container"
        >
          {isEditing ? (
            <input
              type="number"
              value={weight}
              onChange={handleWeightChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="edge-weight-input"
              autoFocus
              min="1"
            />
          ) : (
            <div className={`edge-label ${weight > 1 ? "visible" : ""}`} onClick={handleLabelClick}>
              {weight > 1 && weight}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default CustomEdge

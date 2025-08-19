"use client"

import { useRef } from "react"
import "./Transition.css"

const Transition = ({
  transition,
  onLeftMouseDown,
  onLeftMouseUp,
  onRightClick,
  onLeftClick,
  selected,
  isConnecting,
  isDragged,
  isEnabled,
  isFiring,
  onUpdate,
  arcs = [], // Added arcs prop for dynamic label positioning
}) => {
  const transitionRef = useRef(null)

  const getLabelPosition = (transitionId, arcs) => {
    const incomingArcs = arcs.filter((arc) => arc.target_id === transitionId)
    const outgoingArcs = arcs.filter((arc) => arc.source_id === transitionId)

    if (outgoingArcs.length > 0 && incomingArcs.length === 0) {
      return { position: "above", className: "label-above" }
    } else if (incomingArcs.length > 0 && outgoingArcs.length === 0) {
      return { position: "below", className: "label-below" }
    } else if (incomingArcs.length > 0 || outgoingArcs.length > 0) {
      // Place to the side based on position
      const isLeft = transition.position.x > 300
      return { position: "side", className: isLeft ? "label-left" : "label-right" }
    } else {
      // Default position for transitions with no arcs
      return { position: "below", className: "label-below" }
    }
  }

  const handleMouseDown = (event) => {
    event.stopPropagation()

    if (event.button === 0) {
      onLeftMouseDown(event)
    }
  }

  const handleMouseUp = (event) => {
    if (event.button === 0) {
      onLeftMouseUp()
    } else if (event.button === 2) {
      onRightClick(event)
    }
  }

  const handleClick = (event) => {
    event.stopPropagation()
    onLeftClick && onLeftClick(event)
  }

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onRightClick(event)
  }

  const handleUpdate = (updates) => {
    console.log("handle update transition...")
    onUpdate(transition.id, updates, "transition")
  }

  // Adjust positioning based on orientation
  const isLandscape = transition.orientation === "landscape"
  const offsetX = isLandscape ? 28 : 18 // Half of 56px (landscape) or 36px (portrait)
  const offsetY = isLandscape ? 18 : 28 // Half of 36px (landscape) or 56px (portrait)

  const getTransitionClasses = () => {
    let classes = `transition petri-element ${selected ? "selected" : ""} ${isConnecting ? "connecting" : ""} ${isDragged ? "dragged" : ""} ${isLandscape ? "landscape" : "portrait"}`

    if (isEnabled) classes += " enabled"
    if (isFiring) classes += " firing"

    return classes
  }

  const labelPositioning = getLabelPosition(transition.id_in_net, arcs)

  return (
    <div
      ref={transitionRef}
      className={getTransitionClasses()}
      style={{
        left: transition.position.x - offsetX,
        top: transition.position.y - offsetY,
        cursor: isDragged ? "grabbing" : isConnecting ? "crosshair" : "pointer",
        zIndex: isDragged ? 1000 : 1, // Ensure dragged elements appear on top
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={transition.label}
    >
      <div className="transition-rect" onClick={() => handleUpdate({ type: "timed" })}>
        {transition.type === "timed" && <div className="transition-timer">⏱</div>}
      </div>
      <div
        className={`transition-label ${labelPositioning.className}`}
        style={{
          ...(labelPositioning.position === "side" && {
            left: labelPositioning.className === "label-left" ? "-40px" : "100%",
            transform: labelPositioning.className === "label-left" ? "translateX(-100%)" : "translateX(0)",
            top: isLandscape ? "43px" : "63px",
          }),
        }}
      >
        {transition.label}
      </div>
    </div>
  )
}

export default Transition

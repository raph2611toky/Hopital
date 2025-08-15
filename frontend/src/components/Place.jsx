"use client"

import { useRef } from "react"
import "./Place.css"

const Place = ({
  place,
  onLeftMouseDown,
  onLeftMouseUp,
  onRightClick,
  onLeftClick,
  selected,
  isConnecting,
  isDragged,
}) => {
  const placeRef = useRef(null)

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

  const renderTokens = () => {
    const tokenCount = place.tokens
    const maxVisibleTokens = 6
    const visibleTokens = Math.min(tokenCount, maxVisibleTokens)
    const hiddenTokens = Math.max(0, tokenCount - maxVisibleTokens)

    if (tokenCount === 0) return null

    const tokens = []
    const tokenColor = place.tokenColor || "#000000"

    if (visibleTokens === 1) {
      tokens.push(
        <div
          key="token-1"
          className="token"
          style={{
            backgroundColor: tokenColor,
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />,
      )
    } else if (visibleTokens === 2) {
      const positions = [
        { left: "35%", top: "50%", transform: "translate(-50%, -50%)" },
        { left: "65%", top: "50%", transform: "translate(-50%, -50%)" },
      ]
      for (let i = 0; i < visibleTokens; i++) {
        tokens.push(
          <div
            key={`token-${i}`}
            className="token"
            style={{
              ...positions[i],
              backgroundColor: tokenColor,
              position: "absolute",
            }}
          />,
        )
      }
    } else if (visibleTokens === 3) {
      const positions = [
        { left: "50%", top: "30%", transform: "translate(-50%, -50%)" },
        { left: "35%", top: "70%", transform: "translate(-50%, -50%)" },
        { left: "65%", top: "70%", transform: "translate(-50%, -50%)" },
      ]
      for (let i = 0; i < visibleTokens; i++) {
        tokens.push(
          <div
            key={`token-${i}`}
            className="token"
            style={{
              ...positions[i],
              backgroundColor: tokenColor,
              position: "absolute",
            }}
          />,
        )
      }
    } else if (visibleTokens === 4) {
      const positions = [
        { left: "35%", top: "35%", transform: "translate(-50%, -50%)" },
        { left: "65%", top: "35%", transform: "translate(-50%, -50%)" },
        { left: "35%", top: "65%", transform: "translate(-50%, -50%)" },
        { left: "65%", top: "65%", transform: "translate(-50%, -50%)" },
      ]
      for (let i = 0; i < visibleTokens; i++) {
        tokens.push(
          <div
            key={`token-${i}`}
            className="token"
            style={{
              ...positions[i],
              backgroundColor: tokenColor,
              position: "absolute",
            }}
          />,
        )
      }
    } else {
      // Affichage en cercle pour 5-6 jetons, mieux centré
      const angleStep = (2 * Math.PI) / visibleTokens
      for (let i = 0; i < visibleTokens; i++) {
        const angle = i * angleStep - Math.PI / 2
        const radius = 18
        const x = Math.cos(angle) * radius + 50
        const y = Math.sin(angle) * radius + 50

        tokens.push(
          <div
            key={`token-${i}`}
            className="token"
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: tokenColor,
            }}
          />,
        )
      }
    }

    if (hiddenTokens > 0) {
      tokens.push(
        <div
          key="hidden-count"
          className="hidden-token-count"
          style={{
            position: "absolute",
            bottom: "5px",
            right: "5px",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          +{hiddenTokens}
        </div>,
      )
    }

    return tokens
  }

  return (
    <div
      ref={placeRef}
      className={`place petri-element ${selected ? "selected" : ""} ${isConnecting ? "connecting" : ""} ${isDragged ? "dragged" : ""}`}
      style={{
        left: place.position.x - 33,
        top: place.position.y - 33,
        cursor: isDragged ? "grabbing" : isConnecting ? "crosshair" : "pointer",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={place.label}
    >
      <div className="place-circle">{renderTokens()}</div>
      <div className="place-label">{place.label}</div>
    </div>
  )
}

export default Place
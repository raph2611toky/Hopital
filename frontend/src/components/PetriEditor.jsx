"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Place from "./Place"
import Transition from "./Transition"
import Arc from "./Arc"
import PropertiesPanel from "./PropertiesPanel"
import SimulationControls from "./SimulationControls"
import ContextMenu from "./ContextMenu"
import { PetriNet } from "../models/PetriNet"
import "./PetriEditor.css"

const PetriEditor = () => {
  const canvasRef = useRef(null)
  const netRef = useRef(new PetriNet())

  const [places, setPlaces] = useState([])
  const [transitions, setTransitions] = useState([])
  const [arcs, setArcs] = useState([])
  const [selected, setSelected] = useState(null)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false, type: null })

  const [currentLayer, setCurrentLayer] = useState("All")
  const [validation, setValidation] = useState({ deadlock: false, concurrent: 0, bounded: true })

  // États pour le zoom et le pan
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [tempArc, setTempArc] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const [draggedElement, setDraggedElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [leftClickTimer, setLeftClickTimer] = useState(null)
  const [leftClickStart, setLeftClickStart] = useState(null)

  const checkValidation = useCallback(() => {
    const validationResult = netRef.current.getValidation()
    setValidation(validationResult)
  }, [])

  const exportJSON = useCallback(() => {
    const json = netRef.current.toJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "petri-net.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportPNG = useCallback(async () => {
    if (typeof window !== "undefined" && canvasRef.current) {
      try {
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(canvasRef.current)
        const url = canvas.toDataURL("image/png")
        const a = document.createElement("a")
        a.href = url
        a.download = "petri-net.png"
        a.click()
      } catch (error) {
        console.error("Export PNG failed:", error)
        alert("Export PNG nécessite l'installation de html2canvas")
      }
    }
  }, [])

  const duplicateElement = useCallback(
    (id, type) => {
      const element = type === "place" ? places.find((p) => p.id === id) : transitions.find((t) => t.id === id)
      if (element) {
        const newId = `${type[0]}${Date.now()}`
        const newElement = {
          ...element,
          id: newId,
          position: { x: element.position.x + 50, y: element.position.y + 50 },
          label: `${element.label} (copie)`,
        }
        if (type === "place") {
          setPlaces((prev) => [...prev, newElement])
          netRef.current.addPlace(newElement)
        } else {
          setTransitions((prev) => [...prev, newElement])
          netRef.current.addTransition(newElement)
        }
      }
    },
    [places, transitions],
  )

  const filteredPlaces = places.filter((p) => p.layer === currentLayer || currentLayer === "All")
  const filteredTransitions = transitions.filter((t) => t.layer === currentLayer || currentLayer === "All")
  const filteredArcs = arcs.filter((arc) => {
    const source = places.find((p) => p.id === arc.source) || transitions.find((t) => t.id === arc.source)
    const target = places.find((p) => p.id === arc.target) || transitions.find((t) => t.id === arc.target)
    return (
      (source?.layer === currentLayer || currentLayer === "All") &&
      (target?.layer === currentLayer || currentLayer === "All")
    )
  })

  // Gestion du clic droit sur le canvas
  const handleCanvasContextMenu = useCallback(
    (event) => {
      event.preventDefault()
      if (!event.target.closest(".petri-element")) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (event.clientX - rect.left - transform.x) / transform.scale
        const y = (event.clientY - rect.top - transform.y) / transform.scale

        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          visible: true,
          type: "canvas",
          position: { x, y },
        })
      }
    },
    [transform],
  )

  // Gestion du zoom avec la molette
  const handleWheel = useCallback(
    (event) => {
      event.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(3, transform.scale * delta))

      setTransform((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale,
      }))
    },
    [transform],
  )

  const handleMouseDown = useCallback(
    (event) => {
      if (event.button === 0 && !event.target.closest(".petri-element")) {
        setIsDragging(true)
        setDragStart({ x: event.clientX - transform.x, y: event.clientY - transform.y })
      }
    },
    [transform],
  )

  const handleMouseMove = useCallback(
    (event) => {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - transform.x) / transform.scale
      const y = (event.clientY - rect.top - transform.y) / transform.scale

      setMousePosition({ x, y })

      if (isDragging) {
        setTransform((prev) => ({
          ...prev,
          x: event.clientX - dragStart.x,
          y: event.clientY - dragStart.y,
        }))
      }

      if (draggedElement) {
        const newPosition = {
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        }

        if (draggedElement.tokens !== undefined) {
          // C'est une place
          setPlaces((prev) => prev.map((p) => (p.id === draggedElement.id ? { ...p, position: newPosition } : p)))
        } else {
          // C'est une transition
          setTransitions((prev) => prev.map((t) => (t.id === draggedElement.id ? { ...t, position: newPosition } : t)))
        }
      }

      // Mise à jour de l'arc temporaire pendant la connexion
      if (isConnecting && connectingFrom) {
        setTempArc({
          from: connectingFrom.position,
          to: { x, y },
        })
      }
    },
    [isDragging, dragStart, isConnecting, connectingFrom, transform, draggedElement, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedElement(null)
    if (leftClickTimer) {
      clearTimeout(leftClickTimer)
      setLeftClickTimer(null)
    }
    setLeftClickStart(null)

    if (isConnecting && !event.target.closest(".petri-element")) {
      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    }
  }, [isConnecting, leftClickTimer])

  const startArcCreation = useCallback((element) => {
    setIsConnecting(true)
    setConnectingFrom(element)
  }, [])

  const finishArcCreation = useCallback(
    (targetElement) => {
      if (connectingFrom && targetElement && connectingFrom.id !== targetElement.id) {
        const sourceType = connectingFrom.tokens !== undefined ? "place" : "transition"
        const targetType = targetElement.tokens !== undefined ? "place" : "transition"

        console.log("[v0] Arc creation attempt:", { sourceType, targetType, connectingFrom, targetElement })

        // Empêcher les connexions place-place et transition-transition
        if (sourceType !== targetType) {
          // Vérifier qu'un arc n'existe pas déjà entre ces éléments
          const existingArc = arcs.find(
            (arc) =>
              (arc.source === connectingFrom.id && arc.target === targetElement.id) ||
              (arc.source === targetElement.id && arc.target === connectingFrom.id),
          )

          if (!existingArc) {
            const newArc = {
              id: `a${Date.now()}`,
              source: connectingFrom.id,
              target: targetElement.id,
              weight: 1,
              isInhibitor: false,
              isReset: false,
            }

            console.log("[v0] Creating new arc:", newArc)
            setArcs((prev) => [...prev, newArc])
            netRef.current.addArc(newArc)
          } else {
            console.log("[v0] Arc already exists between these elements")
          }
        } else {
          console.log("[v0] Cannot create arc between same element types:", sourceType)
        }
      }

      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    },
    [connectingFrom, arcs],
  )

  const handleElementLeftClick = useCallback(
    (element) => {
      if (isConnecting && connectingFrom && connectingFrom.id !== element.id) {
        finishArcCreation(element)
      } else if (!isConnecting) {
        startArcCreation(element)
      }
    },
    [isConnecting, connectingFrom, startArcCreation, finishArcCreation],
  )

  const startElementLeftClick = useCallback(
    (element, event) => {
      const startTime = Date.now()
      setLeftClickStart(startTime)

      const timer = setTimeout(() => {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (event.clientX - rect.left - transform.x) / transform.scale
        const y = (event.clientY - rect.top - transform.y) / transform.scale

        setDraggedElement(element)
        setDragOffset({
          x: x - element.position.x,
          y: y - element.position.y,
        })
      }, 150)

      setLeftClickTimer(timer)
    },
    [transform],
  )

  const handleElementLeftUp = useCallback(
    (element) => {
      if (leftClickTimer) {
        clearTimeout(leftClickTimer)
        setLeftClickTimer(null)
      }

      // If it was a quick click (not a drag), handle arc creation
      if (leftClickStart && Date.now() - leftClickStart < 150) {
        handleElementLeftClick(element)
      }

      setLeftClickStart(null)
    },
    [leftClickTimer, leftClickStart, handleElementLeftClick],
  )

  const handleElementRightClick = useCallback((element, event) => {
    event.preventDefault()
    setSelected(element)
  }, [])

  // Fermer le menu contextuel
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  const playSimulation = useCallback(() => {
    if (!simulationInterval) {
      const interval = setInterval(() => {
        netRef.current.simulateStep(() => {
          setPlaces((prev) =>
            prev.map((p) => ({
              ...p,
              tokens: netRef.current.marking[p.id] || p.tokens,
            })),
          )
          checkValidation()
        })
      }, 1000)
      setSimulationInterval(interval)
    }
  }, [simulationInterval, checkValidation])

  const pauseSimulation = useCallback(() => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
    netRef.current.clearPendingTransitions()
  }, [simulationInterval])

  const stepSimulation = useCallback(() => {
    netRef.current.simulateStep(() => {
      setPlaces((prev) =>
        prev.map((p) => ({
          ...p,
          tokens: netRef.current.marking[p.id] || p.tokens,
        })),
      )
      checkValidation()
    })
  }, [checkValidation])

  const addPlace = useCallback(
    (position) => {
      const newPlace = {
        id: `p${Date.now()}`,
        position,
        tokens: 0,
        label: `Place ${places.length + 1}`,
        capacity: undefined, // Added capacity field
        tokenColor: "#000000",
        layer: currentLayer === "All" ? "Consultation" : currentLayer, // Added layer field
      }
      setPlaces((prev) => [...prev, newPlace])
      netRef.current.addPlace(newPlace)
    },
    [places.length, currentLayer],
  )

  const addTransition = useCallback(
    (position) => {
      const newTransition = {
        id: `t${Date.now()}`,
        position,
        label: `Transition ${transitions.length + 1}`,
        type: "immediate",
        delayMean: 1, // Added delayMean field
        priority: 1,
        orientation: "portrait",
        layer: currentLayer === "All" ? "Consultation" : currentLayer, // Added layer field
      }
      setTransitions((prev) => [...prev, newTransition])
      netRef.current.addTransition(newTransition)
    },
    [transitions.length, currentLayer],
  )

  const deleteElement = useCallback((id, type) => {
    if (type === "place") {
      setPlaces((prev) => prev.filter((p) => p.id !== id))
      netRef.current.removePlace(id)
    } else if (type === "transition") {
      setTransitions((prev) => prev.filter((t) => t.id !== id))
      netRef.current.removeTransition(id)
    } else if (type === "arc") {
      setArcs((prev) => prev.filter((a) => a.id !== id))
      netRef.current.removeArc(id)
    }
  }, [])

  const modifyTokens = useCallback((id, amount) => {
    setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, tokens: Math.max(0, p.tokens + amount) } : p)))
    netRef.current.modifyTokens(id, amount)
  }, [])

  const updateElement = useCallback(
    (id, updates) => {
      setPlaces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
      setTransitions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
      setArcs((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))

      const place = places.find((p) => p.id === id)
      const transition = transitions.find((t) => t.id === id)
      if (place) {
        netRef.current.places[id] = { ...netRef.current.places[id], ...updates }
        if (updates.tokens !== undefined) {
          netRef.current.marking[id] = updates.tokens
        }
      } else if (transition) {
        netRef.current.transitions[id] = { ...netRef.current.transitions[id], ...updates }
      }
    },
    [places, transitions],
  )

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false })
      canvas.addEventListener("mousedown", handleMouseDown)
      canvas.addEventListener("mousemove", handleMouseMove)
      canvas.addEventListener("mouseup", handleMouseUp)
      canvas.addEventListener("contextmenu", handleCanvasContextMenu)

      return () => {
        canvas.removeEventListener("wheel", handleWheel)
        canvas.removeEventListener("mousedown", handleMouseDown)
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseup", handleMouseUp)
        canvas.removeEventListener("contextmenu", handleCanvasContextMenu)
      }
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleCanvasContextMenu])

  return (
    <div className="petri-editor">
      <div className="editor-header">
        <h1>Éditeur de Réseaux de Petri - Modèle Hôpital</h1>
        <div className="header-controls">
          <div className="layer-selector">
            <label htmlFor="layer-select">Couche:</label>
            <select
              id="layer-select"
              value={currentLayer}
              onChange={(e) => setCurrentLayer(e.target.value)}
              className="layer-select"
            >
              <option value="All">Toutes</option>
              <option value="Consultation">Consultation</option>
              <option value="Maternité">Maternité</option>
              <option value="Chirurgie">Chirurgie</option>
              <option value="Gardes">Gardes</option>
            </select>
          </div>

          <button onClick={checkValidation} className="validate-button">
            Valider
          </button>
          <button onClick={exportJSON} className="export-button">
            Export JSON
          </button>
          <button onClick={exportPNG} className="export-button">
            Export PNG
          </button>

          <SimulationControls
            onPlay={playSimulation}
            onPause={pauseSimulation}
            onStep={stepSimulation}
            isPlaying={!!simulationInterval}
          />
        </div>
      </div>

      {(validation.deadlock || validation.concurrent > 0 || !validation.bounded) && (
        <div className="validation-status">
          {validation.deadlock && <div className="validation-error">⚠️ Deadlock détecté</div>}
          {validation.concurrent > 0 && (
            <div className="validation-info">🔄 Concurrence: {validation.concurrent} transitions</div>
          )}
          {!validation.bounded && <div className="validation-warning">📊 Réseau non borné</div>}
        </div>
      )}

      <div className="editor-content">
        <div ref={canvasRef} className="canvas-container" onClick={closeContextMenu}>
          <div
            className="canvas"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Grille de fond */}
            <div className="grid-background" />

            {filteredArcs.map((arc) => {
              const sourceElement =
                places.find((p) => p.id === arc.source) || transitions.find((t) => t.id === arc.source)
              const targetElement =
                places.find((p) => p.id === arc.target) || transitions.find((t) => t.id === arc.target)

              if (sourceElement && targetElement) {
                return (
                  <Arc
                    key={arc.id}
                    arc={arc}
                    source={sourceElement}
                    target={targetElement}
                    places={places}
                    transitions={transitions}
                    onSelect={() => setSelected(arc)}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      setContextMenu({
                        x: event.clientX,
                        y: event.clientY,
                        visible: true,
                        type: "arc",
                        element: arc,
                      })
                    }}
                    onUpdate={updateElement}
                    selected={selected?.id === arc.id}
                  />
                )
              }
              return null
            })}

            {/* Arc temporaire pendant la connexion */}
            {tempArc && (
              <svg
                className="temp-arc"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              >
                <line
                  x1={tempArc.from.x}
                  y1={tempArc.from.y}
                  x2={tempArc.to.x}
                  y2={tempArc.to.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}

            {filteredPlaces.map((place) => (
              <Place
                key={place.id}
                place={place}
                onLeftMouseDown={(event) => startElementLeftClick(place, event)}
                onLeftMouseUp={() => handleElementLeftUp(place)}
                onRightClick={(event) => handleElementRightClick(place, event)}
                onLeftClick={() => handleElementLeftClick(place)}
                selected={selected?.id === place.id}
                isConnecting={isConnecting}
                isDragged={draggedElement?.id === place.id}
              />
            ))}

            {filteredTransitions.map((transition) => (
              <Transition
                key={transition.id}
                transition={transition}
                onLeftMouseDown={(event) => startElementLeftClick(transition, event)}
                onLeftMouseUp={() => handleElementLeftUp(transition)}
                onRightClick={(event) => handleElementRightClick(transition, event)}
                onLeftClick={() => handleElementLeftClick(transition)}
                selected={selected?.id === transition.id}
                isConnecting={isConnecting}
                isDragged={draggedElement?.id === transition.id}
              />
            ))}
          </div>
        </div>

        <div className="sidebar">
          <PropertiesPanel
            selected={selected}
            onUpdate={updateElement}
            onDelete={(id, type) => {
              deleteElement(id, type)
              setSelected(null)
            }}
            onDuplicate={duplicateElement}
          />
        </div>
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        element={contextMenu.element}
        onClose={closeContextMenu}
        onAddPlace={() => addPlace(contextMenu.position)}
        onAddTransition={() => addTransition(contextMenu.position)}
        onDelete={() => {
          const element = contextMenu.element
          if (element && contextMenu.type === "arc") {
            deleteElement(element.id, "arc")
          }
        }}
        onDuplicate={() => {
          const element = contextMenu.element
          if (element) {
            const type = element.tokens !== undefined ? "place" : "transition"
            duplicateElement(element.id, type)
          }
        }}
      />
    </div>
  )
}

export default PetriEditor

"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Place from "./Place"
import Transition from "./Transition"
import Arc from "./Arc"
import PropertiesPanel from "./PropertiesPanel"
import SimulationControls from "./SimulationControls"
import ContextMenu from "./ContextMenu"
import ThemeSelector from "./ThemeSelector"
import NetworkManager from "./NetworkManager"
import LayerManager from "./LayerManager"
import api from "../Api"
import "./PetriEditor.css"

const PetriEditor = () => {
  const canvasRef = useRef(null)

  const [places, setPlaces] = useState([])
  const [transitions, setTransitions] = useState([])
  const [arcs, setArcs] = useState([])
  const [selected, setSelected] = useState(null)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false, type: null })

  const [selectedTheme, setSelectedTheme] = useState(null)
  const [themeData, setThemeData] = useState(null)
  const [layers, setLayers] = useState([])
  const [currentLayer, setCurrentLayer] = useState("All")
  const [petriNets, setPetriNets] = useState([])
  const [currentPetriNet, setCurrentPetriNet] = useState(null)
  const [validation, setValidation] = useState({ deadlock: false, concurrent: 0, bounded: true })

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [tempArc, setTempArc] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const [draggedElement, setDraggedElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleThemeLoad = useCallback((loadedThemeData) => {
    console.log("[v0] Loading theme data:", loadedThemeData)
    setThemeData(loadedThemeData)
    setLayers(loadedThemeData.layers || [])
    setPetriNets(loadedThemeData.petriNets || [])

    setPlaces(loadedThemeData.places || [])
    setTransitions(loadedThemeData.transitions || [])
    setArcs(loadedThemeData.arcs || [])

    if (loadedThemeData.petriNets && loadedThemeData.petriNets.length > 0) {
      setCurrentPetriNet(loadedThemeData.petriNets[0].id)
    }

    setCurrentLayer("All")
    setSelected(null)

    checkValidation()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme")
    const savedPetriNet = localStorage.getItem("currentPetriNet")
    const savedLayer = localStorage.getItem("currentLayer")

    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      setSelectedTheme(theme)
      api.get(`/themes/${theme.id}/`)
        .then((response) => {
          setThemeData(response.data)
          setLayers(response.data.layers || [])
          setPetriNets(response.data.petri_nets || [])
          setPlaces(response.data.places || [])
          setTransitions(response.data.transitions || [])
          setArcs(response.data.arcs || [])
        })
        .catch((err) => {
          console.error("[PetriEditor] Failed to load saved theme:", err)
          setThemeData({ theme, layers: [], petri_nets: [], places: [], transitions: [], arcs: [] })
        })
    }

    if (savedPetriNet) {
      setCurrentPetriNet(Number(savedPetriNet))
    }

    if (savedLayer) {
      setCurrentLayer(savedLayer === "All" ? "All" : Number(savedLayer))
    }
  }, [])

  useEffect(() => {
    if (selectedTheme) {
      localStorage.setItem("selectedTheme", JSON.stringify(selectedTheme))
    } else {
      localStorage.removeItem("selectedTheme")
    }
  }, [selectedTheme])
  
  useEffect(() => {
    if (currentPetriNet) {
      localStorage.setItem("currentPetriNet", currentPetriNet)
    } else {
      localStorage.removeItem("currentPetriNet")
    }
  }, [currentPetriNet])

  useEffect(() => {
    localStorage.setItem("currentLayer", currentLayer)
  }, [currentLayer])

  const checkValidation = useCallback(() => {
    setValidation({ deadlock: false, concurrent: 0, bounded: true })
  }, [])

  const exportJSON = useCallback(async () => {
    const data = {
      petri_net: currentPetriNet,
      places,
      transitions,
      arcs,
    }
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "petri-net.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [places, transitions, arcs, currentPetriNet])

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
    async (id, type) => {
      const element = type === "place" ? places.find((p) => p.id === id) : transitions.find((t) => t.id === id)
      if (element) {
        const newId = `${type[0]}${Date.now()}`
        const newElement = {
          ...element,
          id_in_net: newId,
          position: { x: element.position.x + 50, y: element.position.y + 50 },
          label: `${element.label} (copie)`,
          petri_net: currentPetriNet,
        }
        try {
          const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/${type}s/create/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newElement),
          })
          const createdElement = await response.data
          if (type === "place") {
            setPlaces((prev) => [...prev, createdElement])
          } else {
            setTransitions((prev) => [...prev, createdElement])
          }
        } catch (err) {
          console.error(`Erreur lors de la duplication de ${type}:`, err)
        }
      }
    },
    [places, transitions, currentPetriNet],
  )

  const filteredPlaces = places.filter(
    (p) => p.petri_net === currentPetriNet && (currentLayer === "All" || p.layer === currentLayer),
  )
  const filteredTransitions = transitions.filter(
    (t) => t.petri_net === currentPetriNet && (currentLayer === "All" || t.layer === currentLayer),
  )
  const filteredArcs = arcs.filter((arc) => {
    const source =
      places.find((p) => p.id_in_net === arc.source_id) || transitions.find((t) => t.id_in_net === arc.source_id)
    const target =
      places.find((p) => p.id_in_net === arc.target_id) || transitions.find((t) => t.id_in_net === arc.target_id)
    return (
      arc.petri_net === currentPetriNet &&
      (currentLayer === "All" || (source?.layer === currentLayer && target?.layer === currentLayer))
    )
  })

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

        const updateElement = async () => {
          try {
            const type = draggedElement.tokens !== undefined ? "place" : "transition"
            const response = await fetch(`http://127.0.0.1:8000/api/rdp/${type}s/${draggedElement.id}/update/`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ position: newPosition }),
            })
            const updatedElement = await response.json()
            if (type === "place") {
              setPlaces((prev) => prev.map((p) => (p.id === draggedElement.id ? updatedElement : p)))
            } else {
              setTransitions((prev) => prev.map((t) => (t.id === draggedElement.id ? updatedElement : t)))
            }
          } catch (err) {
            console.error("Erreur lors de la mise à jour de la position:", err)
          }
        }
        updateElement()
      }

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
    if (isConnecting && !event.target.closest(".petri-element")) {
      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    }
  }, [isConnecting])

  const startArcCreation = useCallback((element) => {
    setIsConnecting(true)
    setConnectingFrom(element)
  }, [])

  const finishArcCreation = useCallback(
    async (targetElement) => {
      if (connectingFrom && targetElement && connectingFrom.id !== targetElement.id) {
        const sourceType = connectingFrom.tokens !== undefined ? "place" : "transition"
        const targetType = targetElement.tokens !== undefined ? "place" : "transition"

        if (sourceType !== targetType) {
          const existingArc = arcs.find(
            (arc) =>
              (arc.source_id === connectingFrom.id_in_net && arc.target_id === targetElement.id_in_net) ||
              (arc.source_id === targetElement.id_in_net && arc.target_id === connectingFrom.id_in_net),
          )

          if (!existingArc) {
            const newArc = {
              petri_net: currentPetriNet,
              id_in_net: `a${Date.now()}`,
              source_id: connectingFrom.id_in_net,
              target_id: targetElement.id_in_net,
              weight: 1,
              is_inhibitor: false,
              is_reset: false,
            }

            try {
              const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/arcs/create/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newArc),
              })
              const createdArc = await response.json()
              setArcs((prev) => [...prev, createdArc])
            } catch (err) {
              console.error("Erreur lors de la création de l'arc:", err)
            }
          }
        }
      }

      setIsConnecting(false)
      setConnectingFrom(null)
      setTempArc(null)
    },
    [connectingFrom, arcs, currentPetriNet],
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
      event.stopPropagation()
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - transform.x) / transform.scale
      const y = (event.clientY - rect.top - transform.y) / transform.scale

      setDraggedElement(element)
      setDragOffset({
        x: x - element.position.x,
        y: y - element.position.y,
      })
    },
    [transform],
  )

  const handleElementLeftUp = useCallback((element) => {
    setDraggedElement(null)
  }, [])

  const handleElementRightClick = useCallback((element, event) => {
    event.preventDefault()
    setSelected(element)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
      type: element.tokens !== undefined ? "place" : "transition",
      element,
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  const playSimulation = useCallback(() => {
    if (!simulationInterval) {
      const interval = setInterval(() => {
        setPlaces((prev) =>
          prev.map((p) => ({
            ...p,
            tokens: Math.max(0, p.tokens + (Math.random() > 0.5 ? 1 : -1)),
          })),
        )
        checkValidation()
      }, 1000)
      setSimulationInterval(interval)
    }
  }, [simulationInterval, checkValidation])

  const pauseSimulation = useCallback(() => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
  }, [simulationInterval])

  const stepSimulation = useCallback(() => {
    setPlaces((prev) =>
      prev.map((p) => ({
        ...p,
        tokens: Math.max(0, p.tokens + (Math.random() > 0.5 ? 1 : -1)),
      })),
    )
    checkValidation()
  }, [checkValidation])

  const addPlace = useCallback(
    async (position) => {
      const newPlace = {
        petri_net: currentPetriNet,
        id_in_net: `p${Date.now()}`,
        label: `Place ${places.length + 1}`,
        position,
        tokens: 0,
        capacity: null,
        token_color: "#000000"
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/places/create/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPlace),
        })
        const createdPlace = await response.json()
        setPlaces((prev) => [...prev, createdPlace])
        checkValidation()
      } catch (err) {
        console.error("Erreur lors de l'ajout de la place:", err)
      }
    },
    [places.length, currentPetriNet, currentLayer, checkValidation],
  )

  const addTransition = useCallback(
    async (position) => {
      const newTransition = {
        petri_net: currentPetriNet,
        id_in_net: `t${Date.now()}`,
        label: `Transition ${transitions.length + 1}`,
        position,
        type: "immediate",
        delay_mean: 1.0,
        priority: 1,
        orientation: "portrait",
        layer: currentLayer,
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/transitions/create/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTransition),
        })
        const createdTransition = await response.json()
        setTransitions((prev) => [...prev, createdTransition])
        checkValidation()
      } catch (err) {
        console.error("Erreur lors de l'ajout de la transition:", err)
      }
    },
    [transitions.length, currentPetriNet, currentLayer, checkValidation],
  )

  const deleteElement = useCallback(
    async (id, type) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/rdp/${type}s/${id}/delete/`, {
          method: "DELETE",
        })
        if (response.ok) {
          if (type === "place") {
            setPlaces((prev) => prev.filter((p) => p.id !== id))
            setArcs((prev) => prev.filter((a) => a.source_id !== id && a.target_id !== id))
          } else if (type === "transition") {
            setTransitions((prev) => prev.filter((t) => t.id !== id))
            setArcs((prev) => prev.filter((a) => a.source_id !== id && a.target_id !== id))
          } else if (type === "arc") {
            setArcs((prev) => prev.filter((a) => a.id !== id))
          }
          checkValidation()
        }
      } catch (err) {
        console.error(`Erreur lors de la suppression de ${type}:`, err)
      }
    },
    [checkValidation],
  )

  const modifyTokens = useCallback(
    async (id, amount) => {
      try {
        const place = places.find((p) => p.id === id)
        const newTokens = Math.max(0, place.tokens + amount)
        const response = await fetch(`http://127.0.0.1:8000/api/rdp/places/${id}/update/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokens: newTokens }),
        })
        const updatedPlace = await response.json()
        setPlaces((prev) => prev.map((p) => (p.id === id ? updatedPlace : p)))
      } catch (err) {
        console.error("Erreur lors de la modification des jetons:", err)
      }
    },
    [places],
  )

  const updateElement = useCallback(
    async (id, updates) => {
      try {
        const type = places.find((p) => p.id === id)
          ? "place"
          : transitions.find((t) => t.id === id)
            ? "transition"
            : "arc"
        const response = await fetch(`http://127.0.0.1:8000/api/rdp/${type}s/${id}/update/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        const updatedElement = await response.json()
        if (type === "place") {
          setPlaces((prev) => prev.map((p) => (p.id === id ? updatedElement : p)))
        } else if (type === "transition") {
          setTransitions((prev) => prev.map((t) => (t.id === id ? updatedElement : t)))
        } else {
          setArcs((prev) => prev.map((a) => (a.id === id ? updatedElement : a)))
        }
        checkValidation()
      } catch (err) {
        console.error(`Erreur lors de la mise à jour de l'élément:`, err)
      }
    },
    [places, transitions, arcs, checkValidation],
  )

  const createNetwork = useCallback(async (networkData) => {
    try {
      const response = await api.post("/petri-nets/create/", networkData)
      const createdNetwork = await response.data
      setPetriNets((prev) => [...prev, createdNetwork])
      setCurrentPetriNet(createdNetwork.id)
    } catch (err) {
      console.error("Erreur lors de la création du réseau:", err)
    }
  }, [])

  const deleteNetwork = useCallback(
    async (networkId) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/rdp/petri-nets/${networkId}/delete/`, {
          method: "DELETE",
        })
        if (response.ok) {
          setPetriNets((prev) => prev.filter((n) => n.id !== networkId))
          if (currentPetriNet === networkId) {
            const remaining = petriNets.filter((n) => n.id !== networkId)
            setCurrentPetriNet(remaining.length > 0 ? remaining[0].id : null)
          }
        }
      } catch (err) {
        console.error("Erreur lors de la suppression du réseau:", err)
      }
    },
    [currentPetriNet, petriNets],
  )

  const createLayer = useCallback(async (layerData) => {
    try {
      const response = await api.post("/layers/create/", layerData)
      const createdLayer = await response.data
      setLayers((prev) => [...prev, createdLayer])
    } catch (err) {
      console.error("Erreur lors de la création de la couche:", err)
    }
  }, [])

  const deleteLayer = useCallback(
    async (layerId) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/rdp/layers/${layerId}/delete/`, {
          method: "DELETE",
        })
        if (response.ok) {
          setLayers((prev) => prev.filter((l) => l.id !== layerId))
          if (currentLayer === layerId) {
            setCurrentLayer("All")
          }
        }
      } catch (err) {
        console.error("Erreur lors de la suppression de la couche:", err)
      }
    },
    [currentLayer],
  )

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
      <ThemeSelector selectedTheme={selectedTheme} onThemeSelect={setSelectedTheme} onThemeLoad={handleThemeLoad} />

      <NetworkManager
        petriNets={petriNets}
        currentPetriNet={currentPetriNet}
        onNetworkSelect={setCurrentPetriNet}
        onNetworkCreate={createNetwork}
        onNetworkDelete={deleteNetwork}
        selectedTheme={selectedTheme}
      />

      <LayerManager
        layers={layers}
        currentLayer={currentLayer}
        onLayerSelect={setCurrentLayer}
        onLayerCreate={createLayer}
        onLayerDelete={deleteLayer}
        selectedTheme={selectedTheme}
      />

      <div className="editor-header">
        <h1>Éditeur de Réseaux de Petri</h1>
        <div className="header-controls" style={{ display: "flex", alignItems: "center" }}>
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
            <div className="grid-background" />
            {filteredArcs.map((arc) => {
              const sourceElement =
                places.find((p) => p.id_in_net === arc.source_id) ||
                transitions.find((t) => t.id_in_net === arc.source_id)
              const targetElement =
                places.find((p) => p.id_in_net === arc.target_id) ||
                transitions.find((t) => t.id_in_net === arc.target_id)

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

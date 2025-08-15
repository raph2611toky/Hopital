"use client"

import { useState, useCallback } from "react"
import "./LayerManager.css"

const LayerManager = ({ layers, currentLayer, onLayerSelect, onLayerCreate, onLayerDelete, selectedTheme }) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLayerName, setNewLayerName] = useState("")
  const [newLayerColor, setNewLayerColor] = useState("#3b82f6")

  const handleCreate = useCallback(async () => {
    
    if (newLayerName.trim() && selectedTheme) {
      await onLayerCreate({
        name: newLayerName.trim(),
        color: newLayerColor,
        theme: selectedTheme.id,
      })
      setNewLayerName("")
      setNewLayerColor("#3b82f6")
      setShowCreateForm(false)
    }
  }, [newLayerName, newLayerColor, onLayerCreate, selectedTheme])

  const handleDelete = useCallback(
    async (layerId) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette couche ?")) {
        await onLayerDelete(layerId)
      }
    },
    [onLayerDelete],
  )

  return (
    <div className="layer-manager">
      <div className="manager-header">
        <h3>Couches</h3>
        <button className="create-button" onClick={() => setShowCreateForm(true)} disabled={!selectedTheme}>
          + Nouvelle Couche
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <input
            type="text"
            placeholder="Nom de la couche"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            className="form-input"
          />
          <div className="color-input-group">
            <label>Couleur:</label>
            <input
              type="color"
              value={newLayerColor}
              onChange={(e) => setNewLayerColor(e.target.value)}
              className="color-input"
            />
          </div>
          <div className="form-actions">
            <button onClick={handleCreate} className="save-button" disabled={!selectedTheme}>
              Créer
            </button>
            <button onClick={() => setShowCreateForm(false)} className="cancel-button">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="layers-grid">
        <div className={`layer-card ${currentLayer === "All" ? "selected" : ""}`} onClick={() => onLayerSelect("All")}>
          <div className="card-header">
            <input
              type="radio"
              name="layer"
              checked={currentLayer === "All"}
              onChange={() => onLayerSelect("All")}
              className="layer-radio"
            />
            <div className="layer-color" style={{ background: "#64748b" }}></div>
            <h4>Toutes les couches</h4>
          </div>
        </div>

        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-card ${currentLayer === layer.id ? "selected" : ""}`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="card-header">
              <input
                type="radio"
                name="layer"
                checked={currentLayer === layer.id}
                onChange={() => onLayerSelect(layer.id)}
                className="layer-radio"
              />
              <div className="layer-color" style={{ background: layer.color || "#3b82f6" }}></div>
              <h4>{layer.name}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(layer.id)
                }}
                className="supprimer-button"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LayerManager
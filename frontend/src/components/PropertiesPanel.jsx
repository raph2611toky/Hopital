"use client"

import { useState } from "react"
import "./PropertiesPanel.css"

const PropertiesPanel = ({ selected, onUpdate, onDelete }) => {
  const [editedValues, setEditedValues] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (field, value) => {
    setEditedValues((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    if (selected && hasChanges) {
      onUpdate(selected.id, editedValues)
      setEditedValues({})
      setHasChanges(false)
    }
  }

  const handleCancel = () => {
    setEditedValues({})
    setHasChanges(false)
  }

  const handleDelete = () => {
    if (selected) {
      const type = isPlace ? "place" : isTransition ? "transition" : "arc"
      onDelete(selected.id, type)
    }
  }

  const getValue = (field) => {
    return editedValues[field] !== undefined ? editedValues[field] : selected[field] || ""
  }

  if (!selected) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Propriétés</h3>
        </div>
        <div className="panel-content">
          <p className="no-selection">Sélectionnez un élément pour voir ses propriétés</p>
        </div>
      </div>
    )
  }

  const isPlace = selected.tokens !== undefined
  const isTransition = !isPlace && !selected.source
  const isArc = selected.source && selected.target

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Propriétés</h3>
        <span className="element-type">{isPlace ? "Place" : isTransition ? "Transition" : "Arc"}</span>
      </div>

      <div className="panel-content">
        {isPlace && (
          <>
            <div className="property-group">
              <label htmlFor="label">Nom</label>
              <input
                id="label"
                type="text"
                value={getValue("label")}
                onChange={(e) => handleInputChange("label", e.target.value)}
                className="property-input"
              />
            </div>

            <div className="property-group">
              <label htmlFor="tokens">Jetons</label>
              <input
                id="tokens"
                type="number"
                min="0"
                value={getValue("tokens")}
                onChange={(e) => handleInputChange("tokens", Number.parseInt(e.target.value) || 0)}
                className="property-input"
              />
            </div>

            <div className="property-group">
              <label htmlFor="tokenColor">Couleur des jetons</label>
              <input
                id="tokenColor"
                type="color"
                value={getValue("tokenColor") || "#000000"}
                onChange={(e) => handleInputChange("tokenColor", e.target.value)}
                className="property-input"
              />
            </div>
          </>
        )}

        {isTransition && (
          <>
            <div className="property-group">
              <label htmlFor="label">Nom</label>
              <input
                id="label"
                type="text"
                value={getValue("label")}
                onChange={(e) => handleInputChange("label", e.target.value)}
                className="property-input"
              />
            </div>

            <div className="property-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={getValue("type")}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="property-select"
              >
                <option value="immediate">Immédiate</option>
                <option value="timed">Temporisée</option>
              </select>
            </div>

            <div className="property-group">
              <label htmlFor="orientation">Orientation</label>
              <select
                id="orientation"
                value={getValue("orientation") || "portrait"}
                onChange={(e) => handleInputChange("orientation", e.target.value)}
                className="property-select"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Paysage</option>
              </select>
            </div>

            <div className="property-group">
              <label htmlFor="priority">Priorité</label>
              <input
                id="priority"
                type="number"
                min="1"
                value={getValue("priority")}
                onChange={(e) => handleInputChange("priority", Number.parseInt(e.target.value) || 1)}
                className="property-input"
              />
            </div>
          </>
        )}

        {isArc && (
          <>
            <div className="property-group">
              <label htmlFor="weight">Poids</label>
              <input
                id="weight"
                type="number"
                min="1"
                value={getValue("weight")}
                onChange={(e) => handleInputChange("weight", Number.parseInt(e.target.value) || 1)}
                className="property-input"
              />
            </div>

            <div className="property-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={getValue("isInhibitor") || false}
                  onChange={(e) => handleInputChange("isInhibitor", e.target.checked)}
                />
                Arc inhibiteur
              </label>
            </div>

            <div className="property-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={getValue("isReset") || false}
                  onChange={(e) => handleInputChange("isReset", e.target.checked)}
                />
                Arc de remise à zéro
              </label>
            </div>
          </>
        )}
      </div>

      <div className="form-actions">
        {hasChanges && (
          <>
            <button className="save-button" onClick={handleSave}>
              Sauvegarder
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Annuler
            </button>
          </>
        )}
        <button className="delete-button" onClick={handleDelete}>
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default PropertiesPanel
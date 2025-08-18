"use client"

import { useState } from "react"
import "./PropertiesPanel.css"

const PropertiesPanel = ({ selected, selectedType, onUpdate, onDelete }) => {
  const [editedValues, setEditedValues] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (field, value) => {
    setEditedValues((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    if (selected && hasChanges) {
      onUpdate(selected.id, editedValues, selectedType)
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
      onDelete(selected.id)
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

  const isPlace = selectedType === "place"
  const isTransition = selectedType === "transition"
  const isArc = selectedType === "arc"

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
              <label htmlFor="capacity">Capacité Max</label>
              <input
                id="capacity"
                type="number"
                min="0"
                value={getValue("capacity") || ""}
                onChange={(e) =>
                  handleInputChange("capacity", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                className="property-input"
                placeholder="Illimitée"
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

            <div className="property-group">
              <label htmlFor="layer">Couche</label>
              <select
                id="layer"
                value={getValue("layer") || "All"}
                onChange={(e) => handleInputChange("layer", e.target.value)}
                className="property-select"
              >
                <option value="All">Toutes</option>
                <option value="Consultation">Consultation</option>
                <option value="Maternité">Maternité</option>
                <option value="Chirurgie">Chirurgie</option>
                <option value="Gardes">Gardes</option>
              </select>
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

            {getValue("type") === "timed" && (
              <div className="property-group">
                <label htmlFor="delayMean">Durée Moyenne (min)</label>
                <input
                  id="delayMean"
                  type="number"
                  min="1"
                  value={getValue("delayMean") || 1}
                  onChange={(e) => handleInputChange("delayMean", Number.parseInt(e.target.value) || 1)}
                  className="property-input"
                />
              </div>
            )}

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
                value={getValue("priority") || 1}
                onChange={(e) => handleInputChange("priority", Number.parseInt(e.target.value) || 1)}
                className="property-input"
              />
            </div>

            <div className="property-group">
              <label htmlFor="layer">Couche</label>
              <select
                id="layer"
                value={getValue("layer") || "All"}
                onChange={(e) => handleInputChange("layer", e.target.value)}
                className="property-select"
              >
                <option value="All">Toutes</option>
                <option value="Consultation">Consultation</option>
                <option value="Maternité">Maternité</option>
                <option value="Chirurgie">Chirurgie</option>
                <option value="Gardes">Gardes</option>
              </select>
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

            {getValue("isReset") && (
              <div className="property-group">
                <label htmlFor="resetValue">Valeur de remise à zéro</label>
                <input
                  id="resetValue"
                  type="number"
                  min="0"
                  value={getValue("resetValue") || 0}
                  onChange={(e) => handleInputChange("resetValue", Number.parseInt(e.target.value) || 0)}
                  className="property-input"
                />
              </div>
            )}

            <div className="property-group">
              <label htmlFor="probability">Probabilité (%)</label>
              <input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={getValue("probability") || 100}
                onChange={(e) => handleInputChange("probability", Number.parseInt(e.target.value) || 100)}
                className="property-input"
              />
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

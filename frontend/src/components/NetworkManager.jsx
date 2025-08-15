"use client"

import { useState, useCallback } from "react"
import "./NetworkManager.css"

const NetworkManager = ({ petriNets, currentPetriNet, onNetworkSelect, onNetworkCreate, onNetworkDelete, selectedTheme }) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNetworkName, setNewNetworkName] = useState("")

  const handleCreate = useCallback(async () => {
    if (newNetworkName.trim() && selectedTheme) {
      await onNetworkCreate({
        name: newNetworkName.trim(),
        theme: selectedTheme.id,
      })
      setNewNetworkName("")
      setShowCreateForm(false)
    }
  }, [newNetworkName, onNetworkCreate, selectedTheme])

  const handleDelete = useCallback(
    async (networkId) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer ce réseau de Petri ?")) {
        await onNetworkDelete(networkId)
      }
    },
    [onNetworkDelete],
  )

  return (
    <div className="network-manager">
      <div className="manager-header">
        <h3>Réseaux de Petri</h3>
        <button className="create-button" onClick={() => setShowCreateForm(true)} disabled={!selectedTheme}>
          + Nouveau Réseau
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <input
            type="text"
            placeholder="Nom du réseau"
            value={newNetworkName}
            onChange={(e) => setNewNetworkName(e.target.value)}
            className="form-input"
          />
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

      <div className="networks-grid">
        {petriNets.map((network) => (
          <div key={network.id} className={`network-card ${currentPetriNet === network.id ? "selected" : ""}`}>
            <div className="card-header">
              <input
                type="radio"
                name="petri-network"
                checked={currentPetriNet === network.id}
                onChange={() => onNetworkSelect(network.id)}
                className="network-radio"
              />
              <h4>{network.name}</h4>
              <button onClick={() => handleDelete(network.id)} className="supprimer-button" title="Supprimer">
                ×
              </button>
            </div>
            <div className="network-stats">
              <span>Places: {network.places_count || 0}</span>
              <span>Transitions: {network.transitions_count || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NetworkManager
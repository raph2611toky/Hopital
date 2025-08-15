"use client"

import { useState, useEffect } from "react"
import api from "../Api.js"
import "./ThemeSelector.css"

const ThemeSelector = ({ selectedTheme, onThemeSelect, onThemeLoad }) => {
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTheme, setNewTheme] = useState({ name: "", description: "" })
  const [createError, setCreateError] = useState(null)

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      setLoading(true)
      const response = await api.get("/themes/")
      setThemes(response.data)
      setError(null)
    } catch (err) {
      console.error("[ThemeSelector] Failed to load themes:", err)
      setError("Impossible de charger les thèmes")
      setThemes([
        {
          id: 1,
          name: "Hôpital",
          description: "Modèle pour la gestion des flux hospitaliers avec services de consultation, maternité et urgences",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Manufacture",
          description: "Système de production industrielle avec chaînes d'assemblage et contrôle qualité",
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: "Transport",
          description: "Réseau de transport public avec gestion des correspondances et régulation du trafic",
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleThemeSelect = async (theme) => {
    onThemeSelect(theme)
    try {
      console.log("[ThemeSelector] Loading theme details for:", theme.name)
      const response = await api.get(`/themes/${theme.id}/`)
      onThemeLoad(response.data)
    } catch (err) {
      console.error("[ThemeSelector] Failed to load theme details:", err)
      onThemeLoad({
        theme,
        layers: [],
        petri_nets: [],
        places: [],
        transitions: [],
        arcs: [],
      })
    }
  }

  const handleCreateTheme = async (e) => {
    e.preventDefault()
    if (!newTheme.name.trim()) {
      setCreateError("Le nom du thème est requis")
      return
    }
    try {
      setCreateError(null)
      const response = await api.post("/themes/create/", {
        name: newTheme.name,
        description: newTheme.description,
      })
      setThemes([...themes, response.data])
      setNewTheme({ name: "", description: "" })
      setShowCreateForm(false)
      handleThemeSelect(response.data)
    } catch (err) {
      console.error("[ThemeSelector] Failed to create theme:", err)
      setCreateError(err.response?.data?.name?.[0] || "Erreur lors de la création du thème")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewTheme((prev) => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="theme-selector loading">
        <div className="loading-spinner"></div>
        <p>Chargement des thèmes...</p>
      </div>
    )
  }

  return (
    <div className="theme-selector">
      <h2 className="theme-selector-title">Sélectionner un Thème</h2>
      <p className="theme-selector-subtitle">Choisissez un modèle prédéfini pour commencer votre réseau de Petri</p>

      {error && (
        <div className="theme-error">
          <span className="error-icon">⚠️</span>
          {error} - Utilisation des thèmes par défaut
        </div>
      )}

      {showCreateForm ? (
        <form onSubmit={handleCreateTheme} className="theme-create-form">
          <div className="form-group">
            <label htmlFor="name">Nom du thème</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newTheme.name}
              onChange={handleInputChange}
              placeholder="Entrez le nom du thème"
              maxLength={100}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newTheme.description}
              onChange={handleInputChange}
              placeholder="Entrez une description (optionnel)"
              maxLength={500}
            />
          </div>
          {createError && (
            <div className="theme-error">
              <span className="error-icon">⚠️</span>
              {createError}
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className="btn-primary">Créer</button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowCreateForm(false)
                setNewTheme({ name: "", description: "" })
                setCreateError(null)
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="theme-cards">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`theme-card ${selectedTheme?.id === theme.id ? "selected" : ""}`}
                onClick={() => handleThemeSelect(theme)}
              >
                <div className="theme-card-header">
                  <div className="theme-radio">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.id}
                      checked={selectedTheme?.id === theme.id}
                      onChange={() => handleThemeSelect(theme)}
                    />
                    <span className="radio-checkmark"></span>
                  </div>
                  <h3 className="theme-title">{theme.name}</h3>
                </div>
                <p className="theme-description">{theme.description}</p>
                <div className="theme-meta">
                  <span className="theme-date">
                    Créé le {new Date(theme.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="theme-actions">
            <button className="btn-secondary" onClick={loadThemes}>
              🔄 Actualiser
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Nouveau Thème
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeSelector
import api from "../Api.js";

class PetriNetAPI {
  // Theme endpoints
  async getThemes() {
    try {
      const response = await api.get("/themes/");
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch themes");
    }
  }

  async getThemeDetail(themeId){
    try {
      const response = await api.get(`/themes/${themeId}/`);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch themes");
    }
  }

  async createTheme(data) {
    try {
      const response = await api.post("/themes/create/", data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.name?.[0] || "Failed to create theme");
    }
  }

  async getTheme(id) {
    try {
      const response = await api.get(`/themes/${id}/`);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch theme");
    }
  }

  async updateTheme(id, data) {
    try {
      const response = await api.put(`/themes/${id}/update/`, data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to update theme");
    }
  }

  async deleteTheme(id) {
    try {
      await api.delete(`/themes/${id}/delete/`);
    } catch (err) {
      throw new Error("Failed to delete theme");
    }
  }

  // Layer endpoints
  async getLayers(themeId = null) {
    try {
      const url = themeId ? `/layers/?theme=${themeId}` : "/layers/";
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch layers");
    }
  }

  async createLayer(data) {
    try {
      const response = await api.post("/layers/create/", data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to create layer");
    }
  }

  // PetriNet endpoints
  async getPetriNets(themeId = null, layerId = null) {
    try {
      let url = "/petri-nets/";
      const params = new URLSearchParams();
      if (themeId) params.append("theme", themeId);
      if (layerId) params.append("layer", layerId);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch petri nets");
    }
  }

  async createPetriNet(data) {
    try {
      const response = await api.post("/petri-nets/create/", data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to create petri net");
    }
  }

  async getPetriNet(id) {
    try {
      const response = await api.get(`/petri-nets/${id}/`);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch petri net");
    }
  }

  async updatePetriNet(id, data) {
    try {
      const response = await api.put(`/petri-nets/${id}/update/`, data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to update petri net");
    }
  }

  async deletePetriNet(id) {
    try {
      await api.delete(`/petri-nets/${id}/delete/`);
    } catch (err) {
      throw new Error("Failed to delete petri net");
    }
  }

  // Place endpoints
  async getPlaces(petriNetId = null) {
    try {
      const url = petriNetId ? `/places/?petri_net=${petriNetId}` : "/places/";
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch places");
    }
  }

  async createPlace(data) {
    try {
      const response = await api.post("/places/create/", data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to create place");
    }
  }

  async updatePlace(id, data) {
    try {
      const response = await api.put(`/places/${id}/update/`, data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to update place");
    }
  }

  async deletePlace(id) {
    try {
      await api.delete(`/places/${id}/delete/`);
    } catch (err) {
      throw new Error("Failed to delete place");
    }
  }

  // Transition endpoints
  async getTransitions(petriNetId = null) {
    try {
      const url = petriNetId ? `/transitions/?petri_net=${petriNetId}` : "/transitions/";
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch transitions");
    }
  }

  async createTransition(data) {
    try {
      const response = await api.post("/transitions/create/", data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to create transition");
    }
  }

  async updateTransition(id, data) {
    try {
      const response = await api.put(`/transitions/${id}/update/`, data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to update transition");
    }
  }

  async deleteTransition(id) {
    try {
      await api.delete(`/transitions/${id}/delete/`);
    } catch (err) {
      throw new Error("Failed to delete transition");
    }
  }

  // Arc endpoints
  async getArcs(petriNetId = null) {
    try {
      const url = petriNetId ? `/arcs/?petri_net=${petriNetId}` : "/arcs/";
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      throw new Error("Failed to fetch arcs");
    }
  }

  async createArc(data) {
    try {
      const response = await api.post("/arcs/create/", data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to create arc");
    }
  }

  async updateArc(id, data) {
    try {
      const response = await api.put(`/arcs/${id}/update/`, data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to update arc");
    }
  }

  async deleteArc(id) {
    try {
      await api.delete(`/arcs/${id}/delete/`);
    } catch (err) {
      throw new Error("Failed to delete arc");
    }
  }

  // Simulation endpoint
  async simulatePetriNet(id, data) {
    try {
      const response = await api.post(`/petri-nets/${id}/simulate/`, data);
      return response.data;
    } catch (err) {
      throw new Error("Failed to simulate petri net");
    }
  }

  // Validation endpoint
  async validatePetriNet(id) {
    try {
      const response = await api.get(`/petri-nets/${id}/validate/`);
      return response.data;
    } catch (err) {
      throw new Error("Failed to validate petri net");
    }
  }
}

const apiService = new PetriNetAPI();
export default apiService;
// Entry point: This file initializes the route planner web app,
// sets up the Google Maps autocomplete, event listeners, localStorage restoration,
// and UI interactivity like drag-and-drop and plan loading.

export default async function () {
  await initializeApp(); // Trigger everything when module is loaded
}

// ===================== Imports =====================
import { initAutocomplete } from './SourceCode/mapManager.js';
import { drawRoute } from './SourceCode/routeManager.js';
import { exportTableToPDF } from './SourceCode/export.js';

import {
  saveStartTime,
  loadStartTime,
  saveCurrentPlan,
  loadSavedPlan,
  populateLoadDropdown,
  loadFromLocalStorage,
  deleteSavedPlan
} from './SourceCode/storage.js';

import {
  clearTable,
  makeTableDraggable
} from './SourceCode/tableManager.js';

// ===================== Event Listeners =====================

/**
 * Sets up UI button and input event listeners for user actions.
 */
function setupEventListeners() {
  document.getElementById("clearBtn").addEventListener("click", clearTable);
  document.getElementById("routeBtn").addEventListener("click", drawRoute);
  document.getElementById("start-time").addEventListener("change", saveStartTime);
  document.getElementById("saveBtn").addEventListener("click", saveCurrentPlan);
  document.getElementById("loadBtn").addEventListener("click", loadSavedPlan);
  document.getElementById("deleteBtn").addEventListener("click", deleteSavedPlan);
  document.getElementById("exportPdfBtn").addEventListener("click", exportTableToPDF);
}

// ===================== App Initialization =====================

/**
 * Initializes the entire app:
 * - Loads the Google Map and autocomplete
 * - Restores saved session data
 * - Sets up UI interactivity
 */
async function initializeApp() {
  await initAutocomplete();      // Load map and Places search
  setupEventListeners();         // Connect buttons and inputs
  populateLoadDropdown();        // Load plan names into dropdown
  makeTableDraggable();          // Enable drag-and-drop reordering
  loadStartTime();               // Restore trip start time from storage
  loadFromLocalStorage();        // Load session-based marked locations
}

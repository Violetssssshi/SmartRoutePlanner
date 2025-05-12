import { markerData, addMarkerToMap, clearAllMarkersAndTable } from './mapManager.js';
import { updateTable } from './tableManager.js';

/**
 * Saves the current markerData array to localStorage.
 * Used for session persistence (non-named saves).
 */
export function saveToLocalStorage() {
  const data = markerData.map(d => ({
    name: d.name,
    category: d.category,
    isOpen: d.isOpen,
    lat: d.latlng.lat(),
    lng: d.latlng.lng(),
    time: d.time || 0,
    weekdayText: d.weekdayText || [],
    rating: d.rating,
  }));
  localStorage.setItem("markedSpots", JSON.stringify(data));
}

/**
 * Loads session-based saved markers from localStorage and re-creates them.
 */
export function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("markedSpots") || "[]");

  // Recreate markers on map
  saved.forEach(data => {
    addMarkerToMap({
      ...data,
    });
  });

  updateTable(); // Re-render the stop list
}

/**
 * Saves the user-entered start time to localStorage.
 */
export function saveStartTime() {
  const timeInput = document.getElementById("start-time");
  localStorage.setItem("startTime", timeInput.value);
}

/**
 * Loads the saved start time from localStorage and fills it in the input box.
 */
export function loadStartTime() {
  const saved = localStorage.getItem("startTime");
  const timeInput = document.getElementById("start-time");
  if (saved) timeInput.value = saved;
}

/**
 * Saves the selected trip date to localStorage.
 */
export function saveStartDate() {
  const dateInput = document.getElementById("start-date");
  localStorage.setItem("startDate", dateInput.value);
}

/**
 * Loads and sets the trip date input from localStorage.
 */
export function loadStartDate() {
  const saved = localStorage.getItem("startDate");
  const dateInput = document.getElementById("start-date");
  if (saved) dateInput.value = saved;
}

/**
 * Saves the current trip as a named plan in localStorage under "allSavedPlans".
 * Prompts user for a name and clears the current map upon success.
 */
export function saveCurrentPlan() {
  const planName = prompt("Enter a name for this plan:");
  if (!planName) return alert("Save canceled. No plan name entered.");

  const plan = markerData.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    isOpen: d.isOpen,
    lat: d.latlng.lat(),
    lng: d.latlng.lng(),
    time: d.time || 0,
    weekdayText: d.weekdayText || [],
  }));

  // Load all previously saved plans or initialize
  const allPlans = JSON.parse(localStorage.getItem("allSavedPlans") || "{}");
  allPlans[planName] = plan; // Save under user-defined key
  localStorage.setItem("allSavedPlans", JSON.stringify(allPlans));

  // Reset map and table after saving
  clearAllMarkersAndTable();
  alert(`Plan "${planName}" saved successfully!`);
  populateLoadDropdown(); // Refresh dropdown options
}

/**
 * Loads a named saved plan from localStorage into the map.
 */
export function loadSavedPlan() {
  const selectedPlanName = document.getElementById("loadDropdown").value;
  if (!selectedPlanName) {
    alert("Please select a plan to load.");
    return;
  }

  const allPlans = JSON.parse(localStorage.getItem("allSavedPlans") || "{}");
  const saved = allPlans[selectedPlanName];

  if (!saved || !saved.length) {
    alert("Selected plan is empty or not found!");
    return;
  }

  clearAllMarkersAndTable(); // Clear current plan
  saved.forEach(data => addMarkerToMap(data)); // Restore saved stops
  updateTable();
}

/**
 * Rebuilds the saved plan dropdown list from localStorage.
 */
export function populateLoadDropdown() {
  const dropdown = document.getElementById("loadDropdown");
  dropdown.innerHTML = '<option value="">-- Load a Saved Plan --</option>';

  const allPlans = JSON.parse(localStorage.getItem("allSavedPlans") || "{}");
  for (const planName in allPlans) {
    const option = document.createElement("option");
    option.value = planName;
    option.textContent = planName;
    dropdown.appendChild(option);
  }
}

/**
 * Deletes a saved plan from localStorage after user confirmation.
 */
export function deleteSavedPlan() {
  const selectedPlanName = document.getElementById("loadDropdown").value;
  if (!selectedPlanName) {
    alert("Please select a plan to delete.");
    return;
  }

  const confirmDelete = confirm(`Are you sure you want to delete the plan "${selectedPlanName}"?`);
  if (!confirmDelete) return;

  const allPlans = JSON.parse(localStorage.getItem("allSavedPlans") || "{}");
  delete allPlans[selectedPlanName]; // Remove the selected entry

  localStorage.setItem("allSavedPlans", JSON.stringify(allPlans));
  populateLoadDropdown(); // Refresh dropdown options
  alert(`Plan "${selectedPlanName}" deleted successfully!`);
}

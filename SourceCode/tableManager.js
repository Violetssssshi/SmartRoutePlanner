import { markerData, clearAllMarkersAndTable } from './mapManager.js';
import { predictOpenStatus } from './openStatus.js';
import { saveToLocalStorage } from './storage.js';

/**
 * Rebuilds the table of marked locations based on markerData and arrivalTimes.
 * Adds time spent input, predicted open/closed status, and delete buttons.
 *
 * @param {string[]} arrivalTimes - Optional array of "HH:MM" strings for each stop
 */
export function updateTable(arrivalTimes = []) {
  const tbody = document.querySelector("#markedTable tbody");
  tbody.innerHTML = ""; // Clear existing rows

  markerData.forEach((data, i) => {
    // Get arrival time for current row (if available)
    const arrival = (arrivalTimes.length && arrivalTimes[i]) ? arrivalTimes[i] : "";

    // Predict open/closed status based on arrival time
    const status = (arrivalTimes.length && arrivalTimes[i])
      ? predictOpenStatus(data, arrivalTimes[i])
      : "Pending";

    const row = document.createElement("tr");
    row.setAttribute("data-index", i); // Used for drag/reordering

    // Build each cell: order, name, category, arrival time, open status, time spent input, delete button
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${data.name}</td>
      <td>${data.category}</td>
      <td>${arrival}</td>
      <td>${status}</td>
      <td><input type="number" min="0" value="${data.time || 0}" onchange="updateTime(${i}, this.value)" style="width: 60px;" /></td>
      <td><button class="delete-btn" onclick="deleteRow(${i})">×</button></td>
    `;

    tbody.appendChild(row);
  });
}

/**
 * Updates time spent at a location and persists it to localStorage.
 *
 * @param {number} index - Row index in markerData
 * @param {number|string} value - Minutes user entered
 */
export function updateTime(index, value) {
  markerData[index].time = parseInt(value) || 0; // Fallback to 0
  saveToLocalStorage(); // Persist change
}
window.updateTime = updateTime;

/**
 * Deletes a stop from markerData and the map, updates table and localStorage.
 *
 * @param {number} index - Row index to delete
 */
export function deleteRow(index) {
  markerData[index].marker.setMap(null); // Remove marker from map
  markerData.splice(index, 1); // Remove from array
  updateTable(); // Rebuild table
  saveToLocalStorage();
}
window.deleteRow = deleteRow;

/**
 * Clears all data from map, table, and session storage (not named plans).
 */
export function clearTable() {
  clearAllMarkersAndTable(); // Remove markers and table rows
  localStorage.removeItem("markedSpots");
  localStorage.removeItem("startTime");
}

/**
 * Enables drag-and-drop reordering of table rows.
 * After drop, reorders markerData and updates table + storage.
 */
export function makeTableDraggable() {
  let draggedRow;
  const tbody = document.querySelector("#markedTable tbody");

  // Track drag start
  tbody.addEventListener("dragstart", e => {
    draggedRow = e.target;
    e.dataTransfer.effectAllowed = "move";
  });

  // Handle dragging over other rows
  tbody.addEventListener("dragover", e => {
    e.preventDefault();
    const target = e.target.closest("tr");
    if (target && target !== draggedRow) {
      const rows = Array.from(tbody.querySelectorAll("tr"));
      const draggedIndex = rows.indexOf(draggedRow);
      const targetIndex = rows.indexOf(target);
      if (draggedIndex < targetIndex) {
        target.after(draggedRow); // Dragging down
      } else {
        target.before(draggedRow); // Dragging up
      }
    }
  });

  // Finalize new order on drop
  tbody.addEventListener("drop", () => {
    const rows = Array.from(tbody.querySelectorAll("tr"));

    // Reorder markerData based on new row order
    const reordered = rows.map(row => {
      const i = parseInt(row.getAttribute("data-index"));
      return markerData[i];
    });

    markerData.splice(0, markerData.length, ...reordered);
    updateTable(); // Refresh table content
    saveToLocalStorage(); // Save new order
  });

  // Reset drag state
  tbody.addEventListener("dragend", () => {
    draggedRow = null;
  });

  // Allow dragging when mouse is pressed
  tbody.addEventListener("mousedown", e => {
    const row = e.target.closest("tr");
    if (row) row.setAttribute("draggable", true);
  });
}

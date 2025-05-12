import { iconMap, categoryMap } from './constants.js';
import { updateTable, clearTable, makeTableDraggable } from './tableManager.js';
import {
  saveStartTime,
  saveToLocalStorage,
  saveCurrentPlan,
  loadSavedPlan,
  deleteSavedPlan,
  populateLoadDropdown,
  loadStartTime
} from './storage.js';
import { drawRoute } from './routeManager.js';
import { exportTableToPDF } from './export.js';

export let map, directionsService, directionsRenderer, currentInfoWindow = null;
export let markerData = []; // Stores metadata for each marked location

/**
 * Initializes the map, Places Autocomplete, UI listeners, and default behaviors.
 */
export async function initAutocomplete() {
  await google.maps.importLibrary("maps");
  await google.maps.importLibrary("places");

  // Initialize the Google Map centered on Williamsburg
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.2707, lng: -76.7075 },
    zoom: 15,
    mapTypeId: "roadmap"
  });

  // Initialize the directions service and renderer
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
  directionsRenderer.setMap(map);

  // Set up Google Places Autocomplete with details fetching
  const service = new google.maps.places.PlacesService(map);
  const input = document.getElementById("pac-input");
  const searchBox = new google.maps.places.SearchBox(input);

  // Handle place selection from search
  searchBox.addListener("places_changed", () => {
    clearTempMarkerAndInfoWindow(); // Remove previous temp marker/info

    const places = searchBox.getPlaces();
    if (!places.length) return;

    places.forEach(place => {
      if (!place.geometry) return;

      // Get full details for the place including opening hours, types, etc.
      service.getDetails({
        placeId: place.place_id,
        fields: [
          'name',
          'formatted_address',
          'opening_hours',
          'rating',
          'types',
          'website',
          'geometry',
          'editorial_summary'
        ]
      }, (placeResult, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          createTemporaryInfoWindow(placeResult); // Show preview marker and info window
          input.value = ""; // Clear the search input after selection
        }
      });
    });
  });

  // Attach UI button event listeners
  document.getElementById("clearBtn").addEventListener("click", clearTable);
  document.getElementById("routeBtn").addEventListener("click", drawRoute);
  document.getElementById("start-time").addEventListener("change", saveStartTime);
  document.getElementById("saveBtn").addEventListener("click", saveCurrentPlan);
  document.getElementById("loadBtn").addEventListener("click", loadSavedPlan);
  document.getElementById("deleteBtn").addEventListener("click", deleteSavedPlan);
  document.getElementById("exportPdfBtn").addEventListener("click", exportTableToPDF);

  // Populate dropdown with saved plans and restore settings
  populateLoadDropdown();
  makeTableDraggable();
  loadStartTime();
}

/**
 * Builds the content of a Google Maps InfoWindow for a place.
 */
function buildInfoWindowHTML({ name, rating, isOpen, category, weekdayText, showButton = false }) {
  return `
    <div class="custom-infowindow">
      <h3>${name}</h3>
      ${rating ? `<div>⭐ ${rating}/5</div>` : ''}
      ${(typeof isOpen === "boolean") ? `<div>${isOpen ? '🟢 Open Now' : '🔴 Closed'}</div>` : ''}
      <div class="category">Category: ${category}</div>
      ${weekdayText?.length ? `<div>${weekdayText.join('<br>')}</div>` : ''}
      ${showButton ? `<button class="mark-button" onclick="confirmMarkLocation()">Mark Location</button>` : ''}
    </div>
  `;
}

/**
 * Creates a temporary marker and info window for a searched place.
 * Allows user to preview and optionally add it to the plan.
 */
export function createTemporaryInfoWindow(placeResult) {
  const category = getCategory(placeResult.types); // Convert place types to a readable category
  const isOpen = placeResult.opening_hours?.isOpen?.(); // Determine open status

  clearTempMarkerAndInfoWindow(); // Remove any existing temp marker/info

  // Create a temporary Google Maps marker
  const tempMarker = new google.maps.Marker({
    position: placeResult.geometry.location,
    map,
    title: placeResult.name,
    icon: {
      url: iconMap[category] || iconMap["Things to Do"],
      scaledSize: new google.maps.Size(40, 40)
    }
  });

  // Generate info window HTML content
  const infoWindowContent = buildInfoWindowHTML({
    name: placeResult.name,
    rating: placeResult.rating,
    isOpen,
    category,
    weekdayText: placeResult.opening_hours?.weekday_text || [],
    showButton: true
  });

  // Display the info window
  const tempInfoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
  tempInfoWindow.open(map, tempMarker);
  currentInfoWindow = tempInfoWindow;

  // Store globally so the "Mark Location" button can access it
  window.tempMarker = tempMarker;
  window.tempPlaceResult = placeResult;

  // Clean up when the user closes the preview
  tempInfoWindow.addListener('closeclick', clearTempMarkerAndInfoWindow);
}

/**
 * Clears any temporary marker and associated info window from the map.
 */
export function clearTempMarkerAndInfoWindow() {
  if (window.tempMarker) {
    window.tempMarker.setMap(null);
    window.tempMarker = null;
  }
  if (window.tempPlaceResult) {
    window.tempPlaceResult = null;
  }
  if (window.currentInfoWindow) {
    window.currentInfoWindow.close();
    window.currentInfoWindow = null;
  }
}

/**
 * Called when user clicks "Mark Location". Adds the previewed location to the plan.
 */
export function confirmMarkLocation() {
  if (window.tempPlaceResult) {
    createPlaceMarker(window.tempPlaceResult);
    clearTempMarkerAndInfoWindow();
  }
}
window.confirmMarkLocation = confirmMarkLocation;

/**
 * Stores a place's metadata, adds a marker to the map, updates the table.
 */
export function createPlaceMarker(placeResult) {
  const markerObj = {
    name: placeResult.name,
    category: getCategory(placeResult.types),
    isOpen: placeResult.opening_hours?.isOpen?.(),
    latlng: placeResult.geometry.location,
    time: 0, // default time spent
    weekdayText: placeResult.opening_hours?.weekday_text || [],
    rating: placeResult.rating,
    opening_hours: placeResult.opening_hours,
    geometry: placeResult.geometry
  };

  addMarkerToMap(markerObj); // Show on map
  updateTable();             // Show in table
  saveToLocalStorage();      // Persist to localStorage
}

/**
 * Adds a permanent marker to the map and updates the internal markerData array.
 * Can be used for both new places and loading saved plans.
 */
export function addMarkerToMap({
  name,
  category,
  lat,
  lng,
  latlng,
  isOpen,
  time = 0,
  weekdayText = [],
  rating,
  geometry,
}) {
  // Derive marker position
  const position = latlng ||
    (geometry && geometry.location) ||
    (lat !== undefined && lng !== undefined
      ? new google.maps.LatLng(lat, lng)
      : null);
  if (!position) return;

  // Choose appropriate icon
  const icon = iconMap[category] || iconMap["Things to Do"];

  // Create the marker
  const marker = new google.maps.Marker({
    position,
    map,
    title: name,
    icon: { url: icon, scaledSize: new google.maps.Size(40, 40) }
  });

  // Info window content for each marker
  const infoWindowContent = buildInfoWindowHTML({
    name,
    rating,
    isOpen,
    category,
    weekdayText
  });

  const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });

  // Show info window on click
  marker.addListener("click", () => {
    if (window.currentInfoWindow) window.currentInfoWindow.close();
    infoWindow.open(map, marker);
    window.currentInfoWindow = infoWindow;
  });

  // Store in markerData for route planning and export
  markerData.push({
    id: Date.now() + Math.random(), // create unique ID
    marker,
    name,
    category,
    isOpen,
    latlng: position,
    time,
    weekdayText,
    rating,
  });
}

/**
 * Removes all markers from the map, clears the route, and resets the UI table.
 */
export function clearAllMarkersAndTable() {
  // Remove markers
  markerData.forEach(d => d.marker.setMap(null));
  markerData = [];

  // Clear table content
  document.querySelector("#markedTable tbody").innerHTML = "";

  // Clear visual route from map
  directionsRenderer.set('directions', null);
}

/**
 * Converts a list of Google Place types into a simplified category.
 * Falls back to "Things to Do" if nothing matches.
 */
function getCategory(types) {
  for (let type of types) {
    if (categoryMap[type]) return categoryMap[type];
  }
  return "Things to Do";
}

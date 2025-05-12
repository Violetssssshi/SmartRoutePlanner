import { markerData, directionsService, directionsRenderer } from './mapManager.js';
import { addMinutesToTime } from './timeUtils.js';
import { updateTable } from './tableManager.js';

export let travelDurations = []; // Stores duration in minutes between stops

/**
 * Computes and draws a walking route on the map between all marked locations,
 * updates their arrival times based on travel and visit durations, and refreshes the table.
 */
export function drawRoute() {
  // Require at least 2 locations to generate a route
  if (markerData.length < 2) return alert("Please mark at least 2 locations.");

  // 🛠 Reorder markerData to match the current row order in the HTML table
  const tbody = document.querySelector("#markedTable tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const reordered = rows.map(row => {
    const index = parseInt(row.getAttribute("data-index")); // retrieve the index of each stop
    return markerData[index]; // reorder based on UI
  });

  // Update the markerData array in-place
  markerData.splice(0, markerData.length, ...reordered);

  // Update each row's data-index attribute to match its new order
  markerData.forEach((data, i) => {
    rows[i].setAttribute("data-index", i);
  });

  // Define intermediate waypoints between origin and destination
  const waypoints = markerData.slice(1, -1).map(data => ({
    location: data.latlng,
    stopover: true
  }));

  // Request walking directions from Google Maps
  directionsService.route({
    origin: markerData[0].latlng,
    destination: markerData[markerData.length - 1].latlng,
    waypoints,
    travelMode: google.maps.TravelMode.WALKING
  }, (result, status) => {
    if (status === "OK") {
      // Render the route visually
      directionsRenderer.setDirections(result);

      const legs = result.routes[0].legs; // contains segments between each pair of locations

      // Convert duration in seconds to minutes for each leg
      travelDurations = legs.map(leg => Math.round(leg.duration.value / 60));

      let times = [];
      let currentTime = document.getElementById("start-time").value; // initial start time (e.g., "09:00")

      for (let i = 0; i < markerData.length; i++) {
        times.push(currentTime); // Record arrival time for current stop

        // Add travel time to get to next stop (except for the last one)
        if (i < legs.length) {
          currentTime = addMinutesToTime(currentTime, travelDurations[i]);
        }

        // Add time spent at the current stop (user-defined or 0 by default)
        currentTime = addMinutesToTime(currentTime, markerData[i].time || 0);
      }

      // Update the UI table with computed arrival times
      updateTable(times);
    } else {
      alert("Route could not be generated: " + status); // e.g., too far apart, unreachable
    }
  });
}

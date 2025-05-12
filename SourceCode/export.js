import { markerData } from './mapManager.js';
import { travelDurations } from './routeManager.js';
import { parseHHMMToDate, parseDateTime } from './timeUtils.js';

/**
 * Generates a downloadable PDF summary of the current trip plan,
 * including stop names, arrival times, time spent, categories,
 * travel durations between stops, and estimated end time.
 *
 * Uses jsPDF to create a printable-friendly vertical layout.
 */
export async function exportTableToPDF() {
  const pdf = new jspdf.jsPDF('p', 'mm', 'a4'); // A4 portrait PDF
  let y = 20; // vertical position for writing lines

  // Title
  pdf.setFontSize(14);
  pdf.text("Trip Plan", 105, 10, { align: 'center' });

  pdf.setFontSize(12); // Body font size

  for (let i = 0; i < markerData.length; i++) {
    const stop = markerData[i];

    // Get arrival time from the DOM table
    const arrivalTime = document.querySelector(`#markedTable tbody tr:nth-child(${i + 1}) td:nth-child(4)`)?.innerText || "Unknown";

    const timeSpent = stop.time || 0;
    const category = stop.category || "Uncategorized";

    // Write stop header and info
    pdf.text(`Stop ${i + 1}: ${stop.name} (${arrivalTime})`, 10, y);
    y += 8;
    pdf.text(`- Time spent: ${timeSpent} minutes`, 14, y);
    y += 8;
    pdf.text(`- Category: ${category}`, 14, y);
    y += 8;

    // Add travel time to next stop, if applicable
    if (i < travelDurations.length) {
      const travelTime = travelDurations[i] || 0;
      pdf.text(`- Travel time to next stop: ${travelTime} minutes`, 14, y);
      y += 12;
    } else {
      y += 8;
    }

    // Add a new page if vertical space exceeds limit
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
  }

  // === Final Summary: Estimate End Time ===

  const lastArrivalText = document.querySelector(`#markedTable tbody tr:last-child td:nth-child(4)`)?.innerText || "";
  const lastDuration = markerData[markerData.length - 1]?.time || 0;

  if (lastArrivalText) {
    // Get base date from input
    const baseDate = new Date(document.getElementById("start-date").value);

    // Parse last arrival time into a Date object
    const arrivalDate = parseDateTime(lastArrivalText, baseDate) || parseHHMMToDate(lastArrivalText, baseDate);

    // Add the duration spent at the final stop
    arrivalDate.setMinutes(arrivalDate.getMinutes() + lastDuration);

    // Format final time in AM/PM
    const formattedEndTime = arrivalDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Handle pagination if needed
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    // Write end time summary
    pdf.setFont(undefined, 'bold');
    pdf.text(`Estimated End Time: ${formattedEndTime}`, 14, y);
    pdf.setFont(undefined, 'normal');
  }

  // Trigger download
  pdf.save('Trip_Plan.pdf');
}

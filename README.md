# SmartRoutePlanner

## Overview:
**Smart Route Planner** is a browser-based tool designed for pedestrians to plan personalized walking routes. Users can search for locations, mark destinations, assign visit durations, and generate optimized walking paths with estimated arrival times and real-time open/closed status predictions based on business hours. The application emphasizes manual control, user flexibility, and visual interactivity without requiring a login or server backend.

This project was developed using HTML, CSS, and modular JavaScript, integrating Google Maps, Places, and Directions APIs. The system leverages browser localStorage for persistence and jsPDF for PDF generation.

Below is a detailed breakdown of the repository structure and the core modules that power Smart Route Planner.

## Tutorial:

1. Set Your Google Maps API Key  
   Open `index.html` and replace `YOUR_API_KEY` in the script tag with your own key:
   ```html
   <script async
     src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap">
   </script>
   ```

2. Open the Application  
   Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge). No installation or server setup is required.

3. Search for Places  
   Use the search bar at the top of the sidebar to find locations (e.g., cafés, stores, museums). The app uses Google Places Autocomplete to suggest results as you type.

4. Preview & Mark a Location  
   After selecting a place, a temporary marker appears on the map with an info window showing:
   - Place name
   - Category
   - Star rating (if available)
   - Business hours (weekday text)
   - Open/closed status  
   Click the **"Mark Location"** button in the info window to add it to your trip.

5. Define Your Trip Start  
   Set your trip’s **start time** and **start date** using the inputs in the sidebar. This information will be used to:
   - Estimate arrival times at each stop
   - Predict whether each destination will be open

6. Plan and Edit Your Route  
   Each marked location appears in a table with:
   - Stop order
   - Name and category
   - Auto-calculated arrival time
   - Predicted open/closed status
   - Editable time (in minutes) to spend at that stop  
   You can:
   - Drag rows to reorder your trip
   - Manually adjust time spent at each location
   - Delete unwanted stops

7. Generate the Route  
   Click **“Generate Route”** to draw a walking path between stops on the map and recalculate:
   - Arrival times
   - Open/closed status for each stop

8. Save or Load a Trip Plan  
   - Click **“Save Current Plan”** to name and store your itinerary locally.  
   - Use the dropdown to select and **“Load”** a saved plan or **“Delete”** one you no longer need.

9. Export Your Plan  
   Click **“Export Plan to PDF”** to generate a clean, printable summary that includes:
   - Stop-by-stop details (name, time, category)
   - Travel durations
   - Time spent
   - Final estimated end time

All features run entirely in-browser using localStorage—no login or server required.


## The Goal / Moving Forward
Smart Route Planner already supports single-day personalized trip planning with full route customization and real-time business hour logic. Future developments will include:

1. Multi-day Trip Planning
   Allow users to plan and organize multi-day itineraries, assign stops to specific dates, and view each day’s plan separately.

2. Real-Time Context Awareness
   Integrate weather forecasts, temporary closures, and event alerts from third-party APIs to improve accuracy and reliability.

3. Smart Recommendations
   Suggest visit durations, categories of interest, and optimized routes using crowd data, Google Popular Times, or machine learning models.

4. Polished UI/UX
   Improve mobile responsiveness, add map-based reordering, and enhance accessibility for a seamless, device-friendly experience.


## Directory Structure

```
SmartRoutePlanner/
├── SourceCode/
│   ├── constants.js           # Defines category mappings and icon styles
│   ├── export.js              # Handles PDF export of the itinerary
│   ├── mapManager.js          # Controls map, place search, and marker creation
│   ├── openStatus.js          # Predicts if a location will be open at arrival
│   ├── routeManager.js        # Calculates walking directions and travel times
│   ├── storage.js             # Manages saving, loading, and deleting plans via localStorage
│   ├── tableManager.js        # Builds and updates the interactive route table
│   ├── timeUtils.js           # Utility functions for time parsing and formatting
│   ├── main.js                    # Initializes the app and event listeners
│   ├── style.css                  # Styling for map, sidebar, buttons, and table
├── WriteUp/
│   └── Smart_Route_Planner_Writeup_final.pdf  # Final project report
├── index.html                 # Main UI entry point
├── README.md                  # Project documentation
├── .hintrc                    # Hinting configuration for code quality
```

**index.html**
Defines the HTML structure for the application interface. Includes:
- Google Maps and Places script with API key
- Search input field
- Sidebar with time inputs and control buttons
- Dynamic table for marked destinations

**main.js**
Serves as the application entry point. Responsibilities:
- Calls initializeApp() on load
- Registers event listeners for UI actions
- Triggers autocomplete, plan loading, and table interactivity

**mapManager.js**
Manages all map-related functionality:
- Initializes the Google Map and Places autocomplete
- Displays interactive info windows with ratings, hours, and categories
- Allows users to mark a location and add it to the plan
- Stores metadata in the markerData array

**routeManager.js**
Calculates the walking route:
- Uses Google Directions API
- Computes travel time between stops
- Adds time spent at each stop to estimate arrival times
- Updates the table accordingly

**openStatus.js**
Determines whether a location will be open when visited:
- Parses arrival time and weekday_text from Google Places
- Handles multiple time ranges and overnight hours
- Returns “Will be Open,” “Will be Closed,” or “Unknown”

**tableManager.js**
Controls table rendering and user interactivity:
- Builds rows with stop info, arrival time, and status
- Allows inline editing of time spent
- Supports drag-and-drop reordering
- Handles row deletion

**storage.js**
Handles persistence and plan management:
- Saves/loads current and named plans using localStorage
- Populates dropdown with saved plans
- Deletes plans with confirmation
- Restores previous start time and date inputs

**export.js**
Generates a formatted PDF report:
- Includes each stop’s name, arrival time, time spent, and category
- Lists travel durations between stops
- Displays estimated end time of the trip
- Uses jsPDF for export

**timeUtils.js**
Provides utility functions for:
- Parsing “HH:MM” or “HH:MM AM/PM” strings
- Converting time strings to Date objects
- Adding minutes to time with 24-hour wraparound

**style.css**
Custom styles for the UI:
- Responsive flex layout for map and sidebar
- Styled buttons, inputs, and tables
- Color-coded category icons
- Drag indicators and interactive visuals


/* ============================================
   Map Module — Leaflet map setup & markers
   ============================================ */

const MapManager = (() => {

    let map = null;
    let routePolyline = null;

    // Markers
    let vehicleMarker = null;
    let naiveMarker = null;
    let aiMarker = null;

    // Trail polylines (during tunnel)
    let naiveTrail = null;
    let aiTrail = null;
    let naiveTrailPoints = [];
    let aiTrailPoints = [];

    // GPS loss overlay element
    let gpsOverlay = null;

    /**
     * Initialize the Leaflet map
     */
    function init() {
        const center = RouteData.getCenter();

        map = L.map('map', {
            center: [center.lat, center.lng],
            zoom: 15,
            zoomControl: true,
            attributionControl: true
        });

        // OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Draw route polyline
        const latLngs = RouteData.points.map(p => [p.lat, p.lng]);
        routePolyline = L.polyline(latLngs, {
            color: '#00B4D8',
            weight: 4,
            opacity: 0.35,
            dashArray: '8 6',
            lineCap: 'round'
        }).addTo(map);

        // Fit map to route
        map.fitBounds(routePolyline.getBounds().pad(0.15));

        // Create vehicle marker
        vehicleMarker = createMarker(
            RouteData.points[0],
            'vehicle-dot vehicle-dot-blue',
            true // show pulse
        );

        // Create naive DR marker (hidden initially)
        naiveMarker = createMarker(
            RouteData.points[0],
            'vehicle-dot vehicle-dot-red',
            false,
            'Naive DR',
            'label-red'
        );
        naiveMarker.setOpacity(0);

        // Create AI marker (hidden initially)
        aiMarker = createMarker(
            RouteData.points[0],
            'vehicle-dot vehicle-dot-green',
            false,
            'TrackSense AI',
            'label-green'
        );
        aiMarker.setOpacity(0);

        // Trail polylines
        naiveTrail = L.polyline([], {
            color: '#FF4D6A',
            weight: 2.5,
            opacity: 0.5,
            dashArray: '6 4'
        }).addTo(map);

        aiTrail = L.polyline([], {
            color: '#00E5A0',
            weight: 2.5,
            opacity: 0.7
        }).addTo(map);
    }

    /**
     * Create a custom div-icon marker
     */
    function createMarker(pos, dotClass, showPulse, labelText, labelClass) {
        let html = `<div class="vehicle-marker">`;
        if (showPulse) {
            html += `<div class="vehicle-pulse"></div>`;
        }
        html += `<div class="${dotClass}"></div>`;
        if (labelText) {
            html += `<div class="marker-label ${labelClass}">${labelText}</div>`;
        }
        html += `</div>`;

        const icon = L.divIcon({
            className: '',
            html: html,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });

        return L.marker([pos.lat, pos.lng], {
            icon: icon,
            zIndexOffset: showPulse ? 1000 : 500
        }).addTo(map);
    }

    /**
     * Update vehicle (GPS) marker position
     */
    function setVehiclePosition(pos) {
        vehicleMarker.setLatLng([pos.lat, pos.lng]);
    }

    /**
     * Update naive DR marker position
     */
    function setNaivePosition(pos) {
        naiveMarker.setLatLng([pos.lat, pos.lng]);
        naiveTrailPoints.push([pos.lat, pos.lng]);
        naiveTrail.setLatLngs(naiveTrailPoints);
    }

    /**
     * Update AI marker position
     */
    function setAIPosition(pos) {
        aiMarker.setLatLng([pos.lat, pos.lng]);
        aiTrailPoints.push([pos.lat, pos.lng]);
        aiTrail.setLatLngs(aiTrailPoints);
    }

    /**
     * Show / hide DR markers
     */
    function showDRMarkers(show) {
        naiveMarker.setOpacity(show ? 1 : 0);
        aiMarker.setOpacity(show ? 1 : 0);

        // Legend items
        document.getElementById('legend-naive').classList.toggle('legend-visible', show);
        document.getElementById('legend-naive').classList.toggle('legend-hidden', !show);
        document.getElementById('legend-ai').classList.toggle('legend-visible', show);
        document.getElementById('legend-ai').classList.toggle('legend-hidden', !show);
    }

    /**
     * Show GPS loss overlay effect
     */
    function showGPSLossOverlay(show) {
        if (show && !gpsOverlay) {
            gpsOverlay = document.createElement('div');
            gpsOverlay.className = 'gps-loss-overlay';
            document.getElementById('map-container').appendChild(gpsOverlay);
        } else if (!show && gpsOverlay) {
            gpsOverlay.remove();
            gpsOverlay = null;
        }
    }

    /**
     * Clear trail lines
     */
    function clearTrails() {
        naiveTrailPoints = [];
        aiTrailPoints = [];
        naiveTrail.setLatLngs([]);
        aiTrail.setLatLngs([]);
    }

    /**
     * Pan map to keep markers in view
     */
    function panToFit(positions) {
        if (!positions || positions.length === 0) return;

        const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
        if (map.getBounds().contains(bounds)) return;

        map.panTo(bounds.getCenter(), { animate: true, duration: 0.5 });
    }

    /**
     * Reset map to initial state
     */
    function reset() {
        const start = RouteData.points[0];
        setVehiclePosition(start);
        setNaivePosition(start); // We'll clear trail after
        setAIPosition(start);
        showDRMarkers(false);
        showGPSLossOverlay(false);
        clearTrails();
        naiveMarker.setLatLng([start.lat, start.lng]);
        aiMarker.setLatLng([start.lat, start.lng]);
        map.fitBounds(routePolyline.getBounds().pad(0.15));
    }

    return {
        init,
        setVehiclePosition,
        setNaivePosition,
        setAIPosition,
        showDRMarkers,
        showGPSLossOverlay,
        clearTrails,
        panToFit,
        reset
    };

})();

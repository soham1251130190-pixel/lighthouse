/* ============================================
   Utility Functions
   ============================================ */

const Utils = (() => {

    /**
     * Generate Gaussian random number using Box-Muller transform
     */
    function gaussianRandom(mean = 0, stdDev = 1) {
        let u1 = Math.random();
        let u2 = Math.random();
        while (u1 === 0) u1 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z * stdDev + mean;
    }

    /**
     * Haversine distance between two lat/lng points in meters
     */
    function haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(deg) {
        return (deg * Math.PI) / 180;
    }

    function toDeg(rad) {
        return (rad * 180) / Math.PI;
    }

    /**
     * Compute bearing from point A to point B in degrees
     */
    function bearing(lat1, lng1, lat2, lng2) {
        const dLng = toRad(lng2 - lng1);
        const y = Math.sin(dLng) * Math.cos(toRad(lat2));
        const x =
            Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    /**
     * Move a lat/lng point by distance (m) at a given bearing (degrees)
     */
    function movePoint(lat, lng, distanceM, bearingDeg) {
        const R = 6371000;
        const d = distanceM / R;
        const brng = toRad(bearingDeg);
        const lat1 = toRad(lat);
        const lng1 = toRad(lng);

        const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(d) +
            Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
        );
        const lng2 = lng1 + Math.atan2(
            Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
            Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
        );

        return { lat: toDeg(lat2), lng: toDeg(lng2) };
    }

    /**
     * Snap a point to the nearest point on a polyline (array of {lat, lng})
     * Returns { lat, lng, segmentIndex, fraction }
     */
    function snapToPolyline(point, polyline) {
        let bestDist = Infinity;
        let bestPoint = polyline[0];
        let bestIdx = 0;
        let bestFraction = 0;

        for (let i = 0; i < polyline.length - 1; i++) {
            const a = polyline[i];
            const b = polyline[i + 1];
            const result = closestPointOnSegment(point, a, b);

            if (result.dist < bestDist) {
                bestDist = result.dist;
                bestPoint = result.point;
                bestIdx = i;
                bestFraction = result.fraction;
            }
        }

        return {
            lat: bestPoint.lat,
            lng: bestPoint.lng,
            segmentIndex: bestIdx,
            fraction: bestFraction,
            distance: bestDist
        };
    }

    /**
     * Closest point on a line segment A-B to point P
     */
    function closestPointOnSegment(p, a, b) {
        const dx = b.lng - a.lng;
        const dy = b.lat - a.lat;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
            const d = haversineDistance(p.lat, p.lng, a.lat, a.lng);
            return { point: { lat: a.lat, lng: a.lng }, dist: d, fraction: 0 };
        }

        let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const closest = {
            lat: a.lat + t * dy,
            lng: a.lng + t * dx
        };

        const d = haversineDistance(p.lat, p.lng, closest.lat, closest.lng);
        return { point: closest, dist: d, fraction: t };
    }

    /**
     * Interpolate between two points
     */
    function lerp(a, b, t) {
        return {
            lat: a.lat + (b.lat - a.lat) * t,
            lng: a.lng + (b.lng - a.lng) * t
        };
    }

    /**
     * Smooth lerp for positions (used for visual smoothing)
     */
    function smoothLerp(current, target, factor) {
        return {
            lat: current.lat + (target.lat - current.lat) * factor,
            lng: current.lng + (target.lng - current.lng) * factor
        };
    }

    /**
     * Clamp a value between min and max
     */
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    /**
     * Format distance for display
     */
    function formatDistance(meters) {
        if (meters < 1) return '< 1 m';
        if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
        return meters.toFixed(1) + ' m';
    }

    return {
        gaussianRandom,
        haversineDistance,
        bearing,
        movePoint,
        snapToPolyline,
        lerp,
        smoothLerp,
        clamp,
        formatDistance,
        toRad,
        toDeg
    };

})();

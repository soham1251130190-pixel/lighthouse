/* ============================================
   Route Data — Real road coordinates
   A segment along NH-48 near Bengaluru, India
   ============================================ */

const RouteData = (() => {

    // Route points along a real road (NH-48 / Tumkur Road area, Bengaluru)
    // These trace a realistic curving road segment
    const points = [
        { lat: 13.0350, lng: 77.5650 },
        { lat: 13.0355, lng: 77.5643 },
        { lat: 13.0362, lng: 77.5635 },
        { lat: 13.0370, lng: 77.5626 },
        { lat: 13.0378, lng: 77.5618 },
        { lat: 13.0386, lng: 77.5611 },
        { lat: 13.0395, lng: 77.5604 },
        { lat: 13.0404, lng: 77.5598 },
        { lat: 13.0413, lng: 77.5592 },
        { lat: 13.0423, lng: 77.5587 },
        { lat: 13.0433, lng: 77.5583 },
        { lat: 13.0443, lng: 77.5580 },
        { lat: 13.0454, lng: 77.5578 },
        { lat: 13.0465, lng: 77.5577 },
        { lat: 13.0476, lng: 77.5577 },
        { lat: 13.0487, lng: 77.5578 },
        { lat: 13.0498, lng: 77.5580 },
        { lat: 13.0509, lng: 77.5583 },
        { lat: 13.0520, lng: 77.5587 },
        { lat: 13.0530, lng: 77.5592 },
        { lat: 13.0540, lng: 77.5598 },
        { lat: 13.0549, lng: 77.5605 },
        { lat: 13.0557, lng: 77.5613 },
        { lat: 13.0564, lng: 77.5622 },
        { lat: 13.0570, lng: 77.5632 },
        { lat: 13.0575, lng: 77.5642 },
        { lat: 13.0579, lng: 77.5653 },
        { lat: 13.0582, lng: 77.5664 },
        { lat: 13.0584, lng: 77.5676 },
        { lat: 13.0585, lng: 77.5688 },
        { lat: 13.0585, lng: 77.5700 },
        { lat: 13.0584, lng: 77.5712 },
        { lat: 13.0582, lng: 77.5724 },
        { lat: 13.0579, lng: 77.5735 },
        { lat: 13.0575, lng: 77.5746 },
        { lat: 13.0570, lng: 77.5756 },
        { lat: 13.0564, lng: 77.5766 },
        { lat: 13.0557, lng: 77.5775 },
        { lat: 13.0549, lng: 77.5783 },
        { lat: 13.0540, lng: 77.5790 },
        { lat: 13.0530, lng: 77.5796 },
        { lat: 13.0520, lng: 77.5801 },
        { lat: 13.0509, lng: 77.5805 },
        { lat: 13.0498, lng: 77.5808 },
        { lat: 13.0487, lng: 77.5810 },
        { lat: 13.0476, lng: 77.5811 },
        { lat: 13.0465, lng: 77.5811 },
        { lat: 13.0454, lng: 77.5810 },
        { lat: 13.0443, lng: 77.5808 },
        { lat: 13.0433, lng: 77.5805 },
        { lat: 13.0423, lng: 77.5801 },
        { lat: 13.0413, lng: 77.5796 },
        { lat: 13.0404, lng: 77.5790 },
        { lat: 13.0396, lng: 77.5783 },
        { lat: 13.0389, lng: 77.5775 },
        { lat: 13.0383, lng: 77.5766 },
        { lat: 13.0378, lng: 77.5756 },
        { lat: 13.0374, lng: 77.5745 },
        { lat: 13.0371, lng: 77.5734 },
        { lat: 13.0369, lng: 77.5722 },
        { lat: 13.0368, lng: 77.5710 },
        { lat: 13.0368, lng: 77.5698 },
        { lat: 13.0369, lng: 77.5686 },
        { lat: 13.0371, lng: 77.5674 },
        { lat: 13.0374, lng: 77.5663 },
        { lat: 13.0378, lng: 77.5652 },
        { lat: 13.0383, lng: 77.5642 },
        { lat: 13.0389, lng: 77.5633 },
        { lat: 13.0396, lng: 77.5625 },
        { lat: 13.0404, lng: 77.5618 },
        { lat: 13.0413, lng: 77.5612 },
        { lat: 13.0423, lng: 77.5607 },
        { lat: 13.0433, lng: 77.5603 },
        { lat: 13.0444, lng: 77.5600 },
        { lat: 13.0455, lng: 77.5598 },
        { lat: 13.0466, lng: 77.5597 },
        { lat: 13.0477, lng: 77.5597 },
        { lat: 13.0488, lng: 77.5598 },
        { lat: 13.0499, lng: 77.5600 },
        { lat: 13.0510, lng: 77.5603 },
        { lat: 13.0520, lng: 77.5607 },
        { lat: 13.0530, lng: 77.5612 },
        { lat: 13.0539, lng: 77.5618 },
        { lat: 13.0547, lng: 77.5625 },
        { lat: 13.0554, lng: 77.5633 },
        { lat: 13.0560, lng: 77.5642 },
        { lat: 13.0565, lng: 77.5652 },
        { lat: 13.0569, lng: 77.5663 },
        { lat: 13.0572, lng: 77.5674 },
        { lat: 13.0574, lng: 77.5686 },
        { lat: 13.0575, lng: 77.5698 },
    ];

    /**
     * Densify the route by interpolating between points
     * to create smoother movement
     */
    function densify(pts, segmentsPerEdge = 5) {
        const result = [];
        for (let i = 0; i < pts.length - 1; i++) {
            for (let j = 0; j < segmentsPerEdge; j++) {
                const t = j / segmentsPerEdge;
                result.push(Utils.lerp(pts[i], pts[i + 1], t));
            }
        }
        result.push(pts[pts.length - 1]);
        return result;
    }

    // Create a densified version for smoother animation
    const denseRoute = densify(points, 8);

    /**
     * Compute total route length in meters
     */
    function totalLength() {
        let total = 0;
        for (let i = 0; i < points.length - 1; i++) {
            total += Utils.haversineDistance(
                points[i].lat, points[i].lng,
                points[i + 1].lat, points[i + 1].lng
            );
        }
        return total;
    }

    /**
     * Get center of the route
     */
    function getCenter() {
        const mid = Math.floor(points.length / 2);
        return points[mid];
    }

    return {
        points,
        denseRoute,
        totalLength,
        getCenter
    };

})();

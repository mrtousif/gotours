/* eslint-disable */
export default function(locations) {
    mapboxgl.accessToken =
        'pk.eyJ1IjoidG91c2lmMTAxIiwiYSI6ImNrN3hhOTh6cTA5cG0zbW8yNDRuajRsdjIifQ.nojSvBs_x4rEnyE-LBzZMg';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/tousif101/ck7xbws0z19701iltec3ijruk',
        scrollZoom: false
        // center: locations[0].coordinates,
        // zoom: 5,
        // interactive: false
    });

    // area that will be displayed on the map
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // create marker
        const element = document.createElement('div');
        element.className = 'marker';
        // add marker
        new mapboxgl.Marker({
            element: element,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // add popup
        new mapboxgl.Popup({ offset: 30 })
            .setLngLat(loc.coordinates)
            .setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);
        // extend map bounds to include current locations
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}

let map = L.map('map', {
    zoomSnap: 0.5,
    worldCopyJump: true
});

L.tileLayer(
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: '&copy; <a href="http://mapbox.com">Mapbox</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWpnZWVycyIsImEiOiJjaWs5cHZmMWswZDJ6dmhrdTg3YnNidW44In0.QPU_FxLe89puMPjldiaFCg',
    }).addTo(map);

let geojsonMarkerOptions = {
    radius: 4,
    fillColor: "#e41a1c",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 1
};

function popupContent(feature, layer) {
    layer.bindPopup("<b>" + feature.properties.placename + ", " +
        feature.properties.country + "</b> <br>" +
        feature.properties.dates.join('<br>'))
};

function connectPoints(data) {
    let line = [];
    let previousLatitude;
    for (let i = 0; i < data.length; i += 1) {
        d = data[i]
        if (d.latitude !== previousLatitude) {
            line.push([+d.latitude, +d.longitude]);
            previousLatitude = d.latitude;
        }
    }
    return line;
}

let polylineOptions = {
    color: 'black',
    weight: 1,
};

function filterCSV(row, index, columns) {
    if (row.latitude !== '') {
        return row;
    }
}

const tripSelector = document.getElementById('trip-selector');

tripSelector.addEventListener('change', function() {
    const selectedTrip = tripSelector.value;
    loadTripData(`./data/${selectedTrip}`);
});

function loadTripData(url) {
    d3.csv(url, filterCSV).then(function(data) {
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.GeoJSON) {
                map.removeLayer(layer);
            }
        });

        L.polyline(connectPoints(data), polylineOptions).addTo(map);

        let pointsJson = d3.nest()
            .key(d => d.latitude) // assuming location latitude is unique
            .rollup(v => ({
                placename: v[0].placename,
                country: v[0].country,
                nights: v.length,
                latitude: +v[0].latitude,
                longitude: +v[0].longitude,
                dates: v.map(e => e.date)
            }))
            .entries(data)
            .map(e => e.value);

        let pointsGeojsonFeatures = [];
        pointsJson.forEach(function(point) {
            let feature = {
                type: 'Feature',
                properties: {
                    placename: point.placename,
                    country: point.country,
                    nights: point.nights,
                    dates: point.dates
                },
                geometry: {
                    type: 'Point',
                    coordinates: [point.longitude, point.latitude]
                }
            };
            pointsGeojsonFeatures.push(feature);
        });

        let pointsGeojson = {
            type: 'FeatureCollection',
            features: pointsGeojsonFeatures
        };

        L.geoJSON(pointsGeojson, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        }).addTo(map);

        // HACK: Make it easier to tap on markers on small devices by adding
        // larger, invisible circleMarkers
        L.geoJSON(pointsGeojson, {
            onEachFeature: popupContent,
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 10,
                    fillOpacity: 0,
                    opacity: 0
                });
            }
        }).addTo(map);

        let bounds = L.geoJSON(pointsGeojson).getBounds();
        map.fitBounds(bounds);
    });
}

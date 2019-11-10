let map = L.map('map', {
    center: [-25, -60],
    zoom: 3,
    worldCopyJump: true
});

L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: '&copy; <a href="http://mapbox.com">Mapbox</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
        id: 'mapbox.streets',
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

const url = 'https://gist.githubusercontent.com/ajgeers/015e164b166a81c6ae5d4be4fd61b331/raw/3ee159a555e73e3aabcd587f1af1d10eb8738e5d/itinerary.csv';

const southAmericanCountries = ['Brazil', 'Argentina', 'Chile', 'Bolivia', 'Peru', 'Ecuador', 'Colombia']

function filterCSV(row, index, columns) {
    if (row.latitude !== '' && southAmericanCountries.includes(row.country)) {
        return row;
    }
}

d3.csv(url, filterCSV).then(function(data) {

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
        onEachFeature: popupContent,
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);

});
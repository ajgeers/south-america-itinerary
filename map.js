let map = L.map('map', {
    center: [-20, -60],
    zoom: 3,
    worldCopyJump: true
});

L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: '&copy; <a href="http://mapbox.com">Mapbox</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYWpnZWVycyIsImEiOiJjaWs5cHZmMWswZDJ6dmhrdTg3YnNidW44In0.QPU_FxLe89puMPjldiaFCg',
    }).addTo(map);
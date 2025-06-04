document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([40.416775, -3.703790], 6); // Coordenadas iniciales centradas en España

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var startMarker = null;
    var endMarker = null;
    var control = null;

    function saveRoute() {
        var routeData = {
            start: startMarker ? startMarker.getLatLng() : null,
            end: endMarker ? endMarker.getLatLng() : null
        };
        localStorage.setItem('routeData', JSON.stringify(routeData));
    }

    function loadRoute() {
        var routeData = JSON.parse(localStorage.getItem('routeData'));
        if (routeData) {
            if (routeData.start) {
                startMarker = L.marker(routeData.start, { draggable: true }).addTo(map);
                startMarker.bindPopup("Inicio").openPopup();
            }
            if (routeData.end) {
                endMarker = L.marker(routeData.end, { draggable: true }).addTo(map);
                endMarker.bindPopup("Destino").openPopup();
            }
            if (routeData.start && routeData.end) {
                createRoute();
            }
        }
    }

    function createRoute() {
        if (control) {
            map.removeControl(control); // Eliminar el control anterior si existe
        }

        control = L.Routing.control({
            waypoints: [
                L.latLng(startMarker.getLatLng().lat, startMarker.getLatLng().lng),
                L.latLng(endMarker.getLatLng().lat, endMarker.getLatLng().lng)
            ],
            routeWhileDragging: false,
            createMarker: function() { return null; } // No crear marcadores adicionales
        }).addTo(map);

        control.on('routesfound', function(e) {
            var routes = e.routes;
            var summary = routes[0].summary;

            var distance = summary.totalDistance / 1000;

            var motorcycleModel = document.getElementById('motorcycleModel').value;
            var consumption = distance * motorcycles[motorcycleModel];

            document.getElementById('startLocationResult').textContent = `${startMarker.getLatLng().lat.toFixed(5)}, ${startMarker.getLatLng().lng.toFixed(5)}`;
            document.getElementById('endLocationResult').textContent = `${endMarker.getLatLng().lat.toFixed(5)}, ${endMarker.getLatLng().lng.toFixed(5)}`;
            document.getElementById('distanceResult').textContent = distance.toFixed(2);
            document.getElementById('consumptionResult').textContent = consumption.toFixed(2);

            document.getElementById('resultsSection').style.display = 'block';

            saveRoute(); // Guardar la ruta en localStorage
        });
    }

    map.on('dblclick', function(e) {
        var latLng = e.latlng;

        if (!startMarker) {
            startMarker = L.marker(latLng, { draggable: true }).addTo(map);
            startMarker.bindPopup("Inicio").openPopup();
        } else if (!endMarker) {
            endMarker = L.marker(latLng, { draggable: true }).addTo(map);
            endMarker.bindPopup("Destino").openPopup();
            createRoute();
        }
    });

    const motorcycles = {
        "Yamaha R1": 0.06,
        "Honda CBR600RR": 0.05,
        "Suzuki GSX-R1000": 0.065,
        "Kawasaki Ninja ZX-10R": 0.06,
        "Ducati Panigale V4": 0.07,
        "BMW S1000RR": 0.065,
        "KTM RC 390": 0.04,
        "Yamaha MT-07": 0.045,
        "Honda CB500F": 0.043,
        "Kawasaki Z650": 0.046,
        // Agregar más modelos según sea necesario
    };

    function updateMotorcycleList(query) {
        const motorcycleModelSelect = document.getElementById('motorcycleModel');
        motorcycleModelSelect.innerHTML = ''; // Limpiar las opciones existentes

        Object.keys(motorcycles).forEach(model => {
            if (!query || model.toLowerCase().includes(query.toLowerCase())) {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                motorcycleModelSelect.appendChild(option);
            }
        });
    }

    document.getElementById('searchModel').addEventListener('input', function() {
        const query = this.value;
        updateMotorcycleList(query);
    });

    updateMotorcycleList(); // Inicializar la lista de motos

    document.getElementById('gasolineForm').addEventListener('submit', function(event) {
        event.preventDefault();

        if (!startMarker || !endMarker) {
            alert("Por favor, selecciona tanto el inicio como el destino.");
            return;
        }

        createRoute();
    });

    document.getElementById('resetRoute').addEventListener('click', function() {
        if (startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
        }
        if (endMarker) {
            map.removeLayer(endMarker);
            endMarker = null;
        }
        if (control) {
            map.removeControl(control);
            control = null;
        }
        localStorage.removeItem('routeData');
        document.getElementById('resultsSection').style.display = 'none';
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var userLat = position.coords.latitude;
            var userLng = position.coords.longitude;

            var url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=5`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    var lat = data.lat;
                    var lon = data.lon;

                    map.setView([lat, lon], 6);
                })
                .catch(error => {
                    console.error('Error al obtener la ubicación del usuario:', error);
                    map.setView([40.416775, -3.703790], 6);
                });
        }, function(error) {
            console.error('Error al obtener la ubicación del usuario:', error);
            map.setView([40.416775, -3.703790], 6);
        });
    } else {
        console.error('Geolocalización no está soportada por este navegador.');
        map.setView([40.416775, -3.703790], 6);
    }

    loadRoute(); // Cargar la ruta guardada al cargar la página
});

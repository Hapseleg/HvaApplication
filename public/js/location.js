//Asks for permission to get the geolocation, does not work for phone browers
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(showPosition);
    } else { 
        alert("Failed to get location");
    }
}

//add position to the input fields
function showPosition(position) {
    document.getElementById("latitude").value = position.coords.latitude.toFixed(2);
    document.getElementById("longitude").value = position.coords.longitude.toFixed(2);
    document.getElementById("timestamp").value = position.timestamp;
}
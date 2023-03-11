import "./App.css";
import React, { useEffect, useState } from "react";

var map = "";
var markers = [];
var directionsService = "";
var allCoordinates = [];

function App() {
  const [allCoordinatesList, setAllCoordinatesList] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const calculateAndDisplayRoute = (
    origin = markers[markers.length - 2].getLngLat(),
    destination = markers[markers.length - 1].getLngLat(),
    id = markers.length.toString()
  ) => {
    directionsService
      .route({
        origin: {
          lat: origin.lat,
          lng: origin.lng,
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        let routePath = response.routes[0].overview_path.map((v) => [
          v.lng(),
          v.lat(),
        ]);

        allCoordinates.push(...routePath);

        setAllCoordinatesList([...allCoordinates]);

        map.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routePath,
            },
          },
        });
        map.addLayer({
          id: id,
          type: "line",
          source: id,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#888",
            "line-width": 8,
          },
        });
      })
      .catch((e) => {
        window.alert("Directions request failed due to " + e);
        markers.pop();
      });
  };

  useEffect(() => {
    map = new window.maplibregl.Map({
      container: "map", // container id
      style:
        "https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL", // style URL
      center: [77.66584, 17.60727], // starting position [lng, lat]
      zoom: 5, // starting zoom
    });
    map.addControl(
      new window.maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      })
    );
    map?.on("click", function (e) {
      // The event object (e) contains information like the
      // coordinates of the point on the map that was clicked.
      markers.push(
        new window.maplibregl.Marker().setLngLat(e.lngLat).addTo(map)
      );
      if (markers.length >= 2) {
        calculateAndDisplayRoute();
      }
    });
    directionsService = new window.google.maps.DirectionsService();
  }, []);

  const handleZoonToBound = () => {
    var coordinates = allCoordinates;

    // Pass the first coordinates in the LineString to `lngLatBounds` &
    // wrap each coordinate pair in `extend` to include them in the bounds
    // result. A variation of this technique could be applied to zooming
    // to the bounds of multiple Points or Polygon geomteries - it just
    // requires wrapping all the coordinates with the extend method.
    var bounds = coordinates.reduce(function (bounds, coord) {
      return bounds.extend(coord);
    }, new window.maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
      padding: 20,
    });
  };
  const clearLayer = () => {
    try {
      for (let i = markers.length; i > -1; i--) {
        if (map.getLayer(i.toString())) {
          map.removeLayer(i.toString());
        }
        if (map.getSource(i.toString())) {
          map.removeSource(i.toString());
        }
      }
    } catch {}
  };
  const handleReverse = () => {
    clearLayer();
    markers = markers.reverse();
    setAllCoordinatesList([]);
    allCoordinates = [];
    for (let i = 0; i < markers.length - 1; i++) {
      calculateAndDisplayRoute(
        markers[i].getLngLat(),
        markers[i + 1].getLngLat(),
        i.toString()
      );
    }
  };
  return (
    <div className="App">
      <div id="map">
        {allCoordinatesList.length >= 1 && (
          <button
            id="sidebar"
            className="btn-control btn-control-sidebar"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {!showSidebar ? "Show Sidebar" : "Hide Sidebar"}
          </button>
        )}
        {showSidebar && allCoordinatesList.length >= 1 && (
          <div
            style={{
              position: "absolute",
              zIndex: 2,
              backgroundColor: "white",
              height: "80%",
              overflow: "auto",
              width: "190px",
              top: "80px",
              left: "40px",
              borderRadius: 2,
              padding: "10px",
            }}
          >
            {allCoordinatesList?.map((v) => {
              return (
                <div>
                  <div style={{ textAlign: "left" }}>
                    {"Long:" + v[0].toString() + " , Lat:" + v[1].toString()}
                  </div>
                  <hr />
                </div>
              );
            })}
          </div>
        )}
        {allCoordinatesList.length >= 1 && (
          <button
            id="zoomto"
            className="btn-control"
            onClick={() => handleZoonToBound()}
          >
            Zoom to bounds
          </button>
        )}
        {allCoordinatesList.length >= 1 && (
          <button
            id="reverse"
            className="btn-control btn-control-reverse"
            onClick={() => handleReverse()}
          >
            Reverse Path
          </button>
        )}
      </div>
    </div>
  );
}

export default App;

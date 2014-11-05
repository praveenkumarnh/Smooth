/**
 * Created by kascode on 29.10.14.
 */
var poly;
var map;
var pins = [];
var polys = [];

var workingArea = [[59.94486691748142, 30.304434299468994], [59.93431196599729, 30.335376262664795]];

var routePlan = '59.57 30.29\n59.58 39.29\n59.50 39\n-27.46758 153.027892';
var dummyResponse = "59.9403254 30.352156 1\nerror: Test error message\n59.25 30.352156 2\n59.25 30 3\n59.5 30.5\ndist: 120 50 0";

function initialize() {
    //var mapOptions = {
    //    center: { lat: 59.94, lng: 30.35},
    //    zoom: 12,
    //    zoomControl: false,
    //    panControl: false,
    //    rotateControl: false,
    //    streetViewControl: false,
    //    noClear: true
    //};
    //map = new google.maps.Map(document.getElementById('map-canvas'),
    //    mapOptions);
    //
    //google.maps.event.addListener(map, 'click', function(event) {
    //    placeMarker(event.latLng);
    //});

    map = L.map('map-canvas', {
        center: [59.9398893, 30.3191246],
        zoom: 15
    });

    L.rectangle(workingArea, {
        color: "#9BF986",
        fillOpacity: 0,
        lineJoin: 'round'
    }).addTo(map);

    L.tileLayer('http://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 18
    }).addTo(map);

    map.on('click', function(e) {
        var coords = e.latlng;

        placeMarker(coords);
    });
}
//google.maps.event.addDomListener(window, 'load', initialize);

window.addEventListener("load", initialize);

var placeMarker = function(location) {
    //var marker = new google.maps.Marker({
    //    position: location,
    //    map: map
    //});

    var workingBounds = L.bounds(L.point(workingArea[0][0], workingArea[0][1]), L.point(workingArea[1][0], workingArea[1][1]));

    if (workingBounds.contains(L.point(location.lat, location.lng))) {
        var marker = L.marker(location);
        marker.addTo(map);


        if (pins.length >= 2) {
            for (i = 0; i < pins.length; i++) {
                //pins[i].setMap(null);
                map.removeLayer(pins[i]);
            }
            pins = [];
        }

        pins.push(marker);
    } else {
        handleError('Point is out of working area');
    }
};

var drawLine = function(p1_data, p2_data) {
    var point_type = p1_data[2];
    var lon1 = p1_data[0];
    var lat1 = p1_data[1];

    var lon2 = p2_data[0];
    var lat2 = p2_data[1];

    var color = '';


    if (typeof point_type == "undefined") {
        color = '#66ff66';
    }
    else if (point_type.trim() == '1')
        color = '#66ff66';
    else if (point_type.trim() == '2')
        color = '#000000';
    else if (point_type.trim() == '3')
        color = '#3366ff';

    var p1 = new L.LatLng(lat1, lon1);
    var p2 = new L.LatLng(lat2, lon2);

    //var _polys = [p1, p2];

    var poly = L.polyline([p1, p2], {
        color: color,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
    });

    poly.addTo(map);

    //var poly = new google.maps.Polyline({
    //    path: _polys,
    //    geodesic: false,
    //    strokeColor: color,
    //    strokeOpacity: 1,
    //    strokeWight: 2
    //});
    polys.push(poly);
    //poly.setMap(map);
};

var handleError = function(errorText) {
    alert('Error: ' + errorText);
};

var removePolylines = function () {
    for (var i = 0; i < polys.length; i++) {
        //polys[i].setMap(null);
        map.removeLayer(polys[i]);
    }

    polys = [];

    $('.points p').html('');
};

var drawPolylines = function (points) {
    for (var i = 0; i < points.length - 1; i++) {
        if (points[i].trim() == "" || points[i+1].trim() == "") continue;
        if (points[i+1].indexOf("dist:") >= 0 ) {
            $('.points').append($('<p/>').html(points[i+1]));
            continue;
        }
        if (points[i].indexOf("error") >= 0 || points[i+1].indexOf("error") >= 0) {
            continue;
        }

        console.log(points[i] + '\n' + points[i+1]);

        drawLine(points[i].split(' '), points[i + 1].split(' '));
    }
};

var handleRouteResponse = function(msg) {

    var points = msg.split('\n');

    console.log('points: ' + points);

    removePolylines();

    drawPolylines(points);

//                poly = new google.maps.Polyline({
//                    path: nodes,
//                    geodesic: false,
//                    strokeColor: '#f99',
//                    strokeOpacity: 1,
//                    strokeWight: 2
//                });
//
//                poly.setMap(null);
//                poly.setMap(map);
};

$(document).ready(function() {

    // TODO: replace with real

    //$('.submit').click(function(e) {
    //    e.preventDefault();
    //
    //    handleRouteResponse(dummyResponse);
    //});

    $('.submit').click(function(e) {
        e.preventDefault();
        //var points = $('.point');
        var url_string = '';

        for (var i = 0; i < pins.length; i++) {
            var lat = pins[i].getLatLng().lat;
            var lng = pins[i].getLatLng().lng;

            url_string += lng + '&' + lat;

            if (i == 0) {
                url_string += '&';
            }
        }

        var request_path = document.URL+"path?" + url_string;
        console.log(request_path);

        $.ajax({
            url: request_path,
            dataType: 'text',
            success: function(msg) {
                handleRouteResponse(msg);
            }
        });
    });

    // Search
    $('.route-points a').click(function(e) {
        e.preventDefault();

        $(this).parent().addClass('active');
    });

    $('.tools form').submit(function(e) {
        e.preventDefault();

        var query = $(this).children('input').val();

        query = query.replace(/ /g, "+");

        var result = {
            lat: null,
            lng: null
        };

        $.ajax({
            url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + query + "&key=AIzaSyBKWD-hVZscJYssrnOe6h1bKcZyb1su56w",
            success: function(msg) {
                // console.log(msg.results[0].geometry.location);
                result.lat = msg.results[0].geometry.location.lat;
                result.lng = msg.results[0].geometry.location.lng;
                console.log(result);

                var coords = [result.lat, result.lng];

                placeMarker(coords);
            }
        });
    });

    $('.add-point').click(function(e) {
        console.log('add point');
        if("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var url_string = '';
                url_string += position.coords.latitude + '&';
                url_string += position.coords.longitude;

                console.log(url_string);

                $.ajax({
                    url: document.URL+'obstacle?' + url_string,
                    dataType: 'text',
                    success: function(msg) {
                        if (msg == "error")
                            alert('РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё РґРѕР±Р°РІР»РµРЅРёРё С‚РѕС‡РєРё')
                    }
                });
            });
        } else {
            alert('Рљ СЃРѕР¶Р°Р»РµРЅРёСЋ РіРµРѕРґР°РЅРЅС‹Рµ РІ РґР°РЅС‹Р№ РјРѕРјРµРЅ РЅРµ РґРѕСЃС‚СѓРїРЅС‹.')
        }
    });
});
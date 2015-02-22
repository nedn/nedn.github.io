
function initialize() {
  var mapCanvas = document.getElementById('map-canvas');
  var styleArray = [
  {
    featureType: "all",
      stylers: [
      { saturation: -80 }
    ]
  },{
    featureType: "poi.business",
      elementType: "labels",
      stylers: [
      { visibility: "off" }
    ]
  }
  ];
  var mapOptions = {
    center: new google.maps.LatLng(44.5403, -78.5463),
    zoom: 8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: styleArray
  }
  var map = new google.maps.Map(mapCanvas, mapOptions)
}


google.maps.event.addDomListener(window, 'load', initialize);

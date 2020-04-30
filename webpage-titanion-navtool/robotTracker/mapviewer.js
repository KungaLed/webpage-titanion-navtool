$(document).ready(function () {  
    var newcoords = [3.778543, 50.982023]; 
    var trailPts = [];
    var i = 0;
    trailPts[i]=newcoords;
    i++;
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer",
        "esri/symbols/PictureMarkerSymbol"
    ], function(Map,Mapview,Graphic,GraphicsLayer, PictureMarkerSymbol){
        var map = new Map({
            basemap: "satellite"
        });
        var view = new Mapview({
            container: "viewDiv", 
            map:map,
            center: [3.778543, 50.982023],
            zoom: 18
            });
        var graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        //add graphic
        //define point
        var robotPt = {
            type: "point",
            longitude: view.center.longitude,
            latitude: view.center.latitude
        };
        //create symbol
        var robot = new PictureMarkerSymbol ({
            url:"images/search-pointer.png",
            width: "64",
            height: "64"
        });
        //compose graphic
        var ptGraph = new Graphic({
            geometry: robotPt,
            symbol: robot
        });
        //add graphic to layer
        graphicsLayer.add(ptGraph);

        //update robot coördinates
        function fetchCoordsPeriodically(){
            //GET update on gps coordinates from robot
            $.ajax({
                url : "/fetch",
                type: "get",
                dataType : "json",
                data : FormData,
                success: function(data){
                    view.center.longitude = Number(data.lat);
                    console.log(data.lat)
                    view.center.latitude = Number(data.lon);
                    console.log(data.lon)
                    trailPts[i] = [data.lat,data.lon];
                    i++;
                    view.goTo({
                        center:[view.center.longitude,view.center.latitude]
                    }).catch(function(error){
                        if(error.name !="AbortError"){
                            console.error(error);
                        }
                    }); 
                    //adjust display of graphic to new position  
                    graphicsLayer.remove(ptGraph);
                    robotPt = {
                        type: "point",
                        longitude: data.lat,
                        latitude: data.lon
                    };
                    ptGraph = new Graphic({
                        geometry: robotPt,
                        symbol: robot
                    });
                    
                    var simpleLineSymbol = {
                        type: "simple-line",
                        color: [226, 119, 40],
                        width: 8
                    };
                    var polyline = {
                        type: "polyline",
                        paths: trailPts
                      };
                    var trail = new Graphic({
                        geometry: polyline,
                        symbol: simpleLineSymbol
                      });
                    
                    graphicsLayer.add(trail);
                    graphicsLayer.add(ptGraph);
                }
            }); 

        }
 
        setInterval(fetchCoordsPeriodically,200);
    });
    
});



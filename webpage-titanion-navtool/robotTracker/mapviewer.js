$(document).ready(function () {  
    var newcoords = [3.778543, 50.982023]; 
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/geometry/Point"
    ], function(Map,Mapview,Point){
        var map = new Map({
            basemap: "satellite"
        });
        var view = new Mapview({
            container: "viewDiv", 
            map:map,
            center: [3.778543, 50.982023],
            zoom: 16
            });
      
        function fetchCoordsPeriodically(){
            
            $.ajax({
                url : "/fetch",
                type: "get",
                dataType : "json",
                data : FormData,
                success: function(data){
                    newcoords[0] = Number(data.lat);
                    console.log(data.lat)
                    newcoords[1] = Number(data.lon);
                    console.log(data.lon)
                }
            }); 
            view.center = newcoords;  
            view.goTo({
                center: newcoords
            })
            .catch(function(error){
                if(error.name !="AbortError"){
                    console.error(error);
                }
            });     
            console.log("newcoords = " ) ;
            console.log(newcoords);
            console.log("center object = ");
            console.log(view.center);
        }
        setInterval(fetchCoordsPeriodically,500);
    });
    
});



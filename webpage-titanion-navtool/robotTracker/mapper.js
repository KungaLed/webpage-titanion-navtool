function AssertionError(message) {
    this.message = message;
    this.name = 'AssertionError';
}

$(document).ready(function () {


    // ************************************************ Map functionality *************************************
    require([
        "esri/Map",
        "esri/layers/CSVLayer",
        "esri/layers/FeatureLayer",
        "esri/geometry/Point",
        "esri/widgets/Legend",
        "esri/views/SceneView",
        "esri/config",
        "esri/core/urlUtils",
        "dojo/domReady!"
    ], function (
        Map,
        CSVLayer,
        FeatureLayer,
        Point,
        Legend,
        SceneView,
        esriConfig,
        urlUtils
    ) {
        let url, csvfilename;
        let currentcenterpoint, currentlayer, robotLocalizationLayer, currentlocationrobot;
        let robotLocalizationLayerIndex = 0;
        var layer_centerpointdict = {};
        var map;
        var view;
        var csvtemplate = {
            title: "Pass by point",
            content: "Point {number} (latitude: {latitude}, longitude: {longitude}) measured on: {time}."
        };
        var robottemplate = {
            title: "Current point {objectId}",
            content: "Point (latitude: {latitude}, longitude: {longitude}) measured on: {time}."
        };
        var customRenderer =  {
            type: "simple", // autocasts as new SimpleRenderer()
            symbol: {
                type: "point-3d", // autocasts as new PointSymbol3D()
                symbolLayers: [{
                    type: "icon", // autocasts as new IconSymbol3DLayer()
                    material: {
                        color: [238, 69, 0, 0.75] // RGB - opacity
                    },
                    outline: {
                        width: 0.1,
                        color: "white"
                    },
                    size: "5px"
                }]
            }
        };

        function createCheckbox(layer, color) {
            $('#inZoomPathSelecter')
                .append($("<option></option>")
                    .attr("value",layer.name)
                    .text(layer.name));
            $('#inZoomPathSelecter').val(layer.name);
            layer_centerpointdict[layer.name] = currentcenterpoint;


            let toggleid = layer.name + 'toggle';
            $('#toggleDiv').append($('<div class="toggleEnv" style="background:rgb('+color[0]+','+color[1]+','+color[2]+')">' +
                '                                <label class="switch">' +
                '                                    <input type="checkbox" id="' + toggleid + '" checked>' +
                '                                    <span class="slider round"></span>' +
                '                                </label>' +
                '                                <pre style="margin-left:3em">' + layer.name + '</pre>' +
                '                            </div>'));

            $('#' + toggleid).change(function () {
                if ($('#'+toggleid).is(":checked")) {
                    map.layers.push(layer);
                    console.log(layer.name + " layer added")
                } else {
                    // remove current csvLayer if there is one...
                    let index = map.layers.indexOf(layer);
                    if (index > -1) {
                        map.layers.splice(index, 1);
                    }
                    console.log(layer.name + " layer removed")
                }

            })
        }

        function createcsvLayerName(csvfilename){
            currentlayer = null;
            let words = csvfilename.split('.');
            if (words[1] !== "csv") {
                throw new AssertionError("File must be of csv format!");
            } else {
                return words[0] + "Layer";
            }
        }

        function init(){
            map = new Map({
                basemap: "satellite",
                layers: [],
                ui: {
                    padding: {
                        bottom: 15,
                        right: 0
                    }
                }
            });
            view = new SceneView({
                container: "viewDiv",
                center: [4, 50],
                zoom: 10,
                map: map
            });
        }
        init();


        $('input[type=file]').change(function () {
            let file = $('#fileUpload')[0].files[0];

            if (file){
                csvfilename = file.name;
                url = "tracks/" + csvfilename;

                try {
                    currentlayer = createcsvLayerName(csvfilename);

                    // Get the centercoordinates
                    let res;
                    var reader = new FileReader();

                    reader.onload = function(progressEvent){
                        // By lines
                        var lines = this.result.split('\n');
                        for(var line = 0; line < 3; line++){
                            res = lines[line].split(",");
                        }
                        currentcenterpoint = [Number(res[2]), Number(res[1])];
                    };
                    reader.readAsText(file);
                }catch (e) {
                    alert(e.message);
                }
            }
        });

        $('#drawcartbutton').click(function () {
            if (csvfilename && currentlayer) {
                // If CSV files are not on the same domain as your website, a CORS enabled server
                // or a proxy is required.
                esriConfig.request.corsEnabledServers.push(url);

                currentlayer = new CSVLayer({
                    name: currentlayer,
                    url: url,
                    copyright: "ILVO",
                    popupTemplate: csvtemplate,
                    elevationInfo: {
                        // drapes icons on the surface of the globe
                        mode: "on-the-ground"
                    }
                });

                let color = [Math.floor(Math.random() * 255) + 1, Math.floor(Math.random() * 255) + 1, Math.floor(Math.random() * 255) + 1, 0.75];
                currentlayer.renderer = customRenderer;
                currentlayer.renderer.symbol.symbolLayers = [{
                    type: "icon", // autocasts as new IconSymbol3DLayer()
                    material: {
                        color: color
                    },
                    outline: {
                        width: 0.1,
                        color: "white"
                    },
                    size: "5px"
                }];

                map.layers.push(currentlayer);
                view.center = currentcenterpoint;
                view.zoom = 20;

                createCheckbox(currentlayer, color);
            } else {
                alert("choose a file first!!")
            }
        });


        // ***  ***************For the robot localization***************************************
        let localizationsocket;
        var objectcnt = 0;
        var fields = [
            {
                name: "ObjectId",
                alias: "ObjectId",
                type: "oid"
            }, {
                name: "longitude",
                alias: "longitude",
                type: "number"
            }, {
                name: "latitude",
                alias: "latitude",
                type: "number"
            }, {
                name: "time",
                alias: "time",
                type: "date"
            }
        ];

        $('#startlocalizebutton').click(function () {
            $('.startlocalizebutton').prop("disabled", true);
            $('.stoplocalizebutton').prop("disabled", false);

            localizationsocket = new WebSocket("ws://ubuntu@ubiquityrobot.local:8000");

            localizationsocket.onopen = function (event) {
                console.log("TCP connection established");

                robotLocalizationLayer = new FeatureLayer({
                    name: "robotLocalizationLayer" + String(robotLocalizationLayerIndex),
                    source: [],
                    fields: fields,
                    objectIdField: "ObjectId",
                    renderer: customRenderer,
                    geometryType: "point"
                });

                let color = [Math.floor(Math.random() * 255) + 1, Math.floor(Math.random() * 255) + 1, Math.floor(Math.random() * 255) + 1, 0.75];
                robotLocalizationLayer.renderer.symbol.symbolLayers = [{
                    type: "icon", // autocasts as new IconSymbol3DLayer()
                    material: {
                        color: color
                    },
                    outline: {
                        width: 0.1,
                        color: "white"
                    },
                    size: "5px"
                }];
                map.layers.push(robotLocalizationLayer);

                createCheckbox(robotLocalizationLayer, color);
            };

            localizationsocket.onclose = function (event) {
                console.log("TCP connection closed")
            };

            localizationsocket.onmessage = function (event) {
                let s = event.data.split(',');
                let long = s[1];
                let lat = s[0];
                if (!(isNaN(long) || isNaN(lat))){
                    currentlocationrobot = [s[1], s[0]];
                    robotLocalizationLayer.source.push({
                        geometry: new Point({longitude: long, latitude: lat}),
                        attributes: {
                            objectId: objectcnt,
                            longitude: long,
                            latitude: lat,
                            time: s[2]
                        }
                    });
                }

                console.log(event.data);
            };

            localizationsocket.onerror = function (event) {
                console.log(event.data);
            }
        });

        $('#stoplocalizebutton').click(function () {
            $('.startlocalizebutton').prop("disabled", false);
            $('.stoplocalizebutton').prop("disabled", true);

            localizationsocket.close();
            robotLocalizationLayerIndex++;
        });

        // ************************************************ visibility functionality ******************************
        $('#inZoomPathSelecter').change(function () {
            if ($('#inZoomPathSelecter').val().substring(0,22) === "robotLocalizationLayer") {
                view.center = currentlocationrobot;
            } else {
                view.center = layer_centerpointdict[$('#inZoomPathSelecter').val()];
            }
        });

    });
});
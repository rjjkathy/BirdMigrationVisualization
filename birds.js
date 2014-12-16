/**
 * Bird migration flow visualization for Belgium & the Netherlands
 *
 * https://github.com/enram/bird-migration-flow-visualization
 * Copyright (c) 2014 LifeWatch INBO
 * The MIT License - http://opensource.org/licenses/MIT
 *
 * Based on air.js from air
 * https://github.com/cambecc/air
 * Copyright (c) 2013 Cameron Beccario
 */

 "use strict";

// special document elements
var CANVAS_ID = "#canvas";
var MAP_SVG_ID = "#map-svg";
var ANIMATION_CANVAS_ID = "#animation-canvas";
var ALTITUDE_BAND_ID = "#alt-band";
var TIME_INTERVAL_ID = "#time-int";
var TIME_OFFSET = 20;
var DATE_FORMAT = 'MMMM D YYYY, HH:mm';
var SECONDS_TO_PLAY = 1;
var intervalRunning = true;
var interval;


// Declare required globals
var particles = [];
var g;
var albers_projection;
var data;
var interval;
var basemap;
var field;
var minX;
var maxX;
var minY;
var maxY;
var columns;
var min_date = moment.utc("April 5 2013, 00:00", DATE_FORMAT);
var max_date = moment.utc("April 11 2013, 23:40", DATE_FORMAT);
var birdJSON = "dataTest.geojson";
var bbox = [-80, 45, -65, 47];

/** 
 * Extract parameters sent to us by the server.
 */
 var displayData = {
    topography: d3.select(CANVAS_ID).attr("data-topography"),
};

/**
 * An object to perform logging when the browser supports it.
 */
 var log = {
    debug:   function(s) { if (console && console.log) console.log(s); },
    info:    function(s) { if (console && console.info) console.info(s); },
    error:   function(e) { if (console && console.error) console.error(e.stack ? e + "\n" + e.stack : e); },
    time:    function(s) { if (console && console.time) console.time(s); },
    timeEnd: function(s) { if (console && console.timeEnd) console.timeEnd(s); }
};

/**
 * An object {width:, height:} that describes the extent of the container's view in pixels.
 */
 var view = function() {
    var b = $(CANVAS_ID)[0]; // Similar to document.getElementById
    var x = b.clientWidth;
    var y = b.clientHeight;
    // log.debug("Container size width:" + x + " height: "+ y);
    return {width: x, height: y};
}();

/**
 * Create settings
 */
 var settings = {
    vectorscale: (view.height / 1000),
    frameRate: 60, // desired milliseconds per frame
    framesPerTime: 40, // desired frames per time interval
    maxParticleAge: 60, // max number of frames a particle is drawn before regeneration
    particleCount: 300
};

/**
 * Initialize the application
 * Determine screen sizes
 */
 function init() {
    // log.debug("Topography URI: " + displayData.topography);
    // Modify the display elements to fill the screen.
    d3.select(CANVAS_ID).attr("width", view.width).attr("height", view.height);
    d3.select(MAP_SVG_ID).attr("width", view.width).attr("height", view.height);
    d3.select(ANIMATION_CANVAS_ID).attr("width", view.width).attr("height", view.height);

    $.get("dataTest.geojson", function(data){  
        alert(data);
        birdJSON = data;
    });

} 

/**
 * Returns a d3 Albers conical projection (en.wikipedia.org/wiki/Albers_projection) that maps the bounding box
 * defined by the lower left geographic coordinates (lng0, lat0) and upper right coordinates (lng1, lat1) onto
 * the view port having (0, 0) as the upper left point and (width, height) as the lower right point.
 */
function createAlbersProjection(lng0, lat0, lng1, lat1, view) {
    // Construct a unit projection centered on the bounding box. NOTE: center calculation will not be correct
    // when the bounding box crosses the 180th meridian. Don't expect that to happen to Tokyo for a while...
    // log.time("Creating projection");
    var projection = d3.geo.albers()
        .rotate([-((lng0 + lng1) / 2), 0]) // rotate the globe from the prime meridian to the bounding box's center
        .center([0, (lat0 + lat1) / 2])    // set the globe vertically on the bounding box's center
        .scale(1)
        .translate([0, 0]);
    // Project the two longitude/latitude points into pixel space. These will be tiny because scale is 1.
    var p0 = projection([lng0, lat0]);
    var p1 = projection([lng1, lat1]);
    // The actual scale is the ratio between the size of the bounding box in pixels and the size of the view port.
    // Reduce by 5% for a nice border.
    var s = 1 / Math.max((p1[0] - p0[0]) / view.width, (p0[1] - p1[1]) / view.height) * 0.95;
    // Move the center to (0, 0) in pixel space.
    var t = [view.width / 2, view.height / 2 - 200];
    // log.timeEnd("Projection created");
    return projection
           .scale(s/4)
           .translate(t);
} 

/**
 * Returns a promise for a JSON resource (URL) fetched via XHR. If the load fails, the promise rejects with an
 * object describing the reason: {error: http-status-code, message: http-status-text, resource:}.
 */

 function loadJson(resource) {
   log.time("JSON Retrieval...");
   log.debug("JSON Retrieval...");
   var d = when.defer();
   d3.json(resource, function(error, result) {
        // log.debug("Retrieval finished");
        return error ?
        !error.status ?
        d.reject({error: -1, message: "Cannot load resource: " + resource, resource: resource}) :
        d.reject({error: error.status, message: error.statusText, resource: resource}) :
        d.resolve(result);
    });
   log.timeEnd("JSON Retrieved");
   return d.promise;
}

/**
 * Load the basemap in the svg with the countries, country border and radars
 */
 function loadMap(bm) {
    log.debug("Creating basemap...");
    basemap = bm;

    var svg = d3.select(MAP_SVG_ID);

    var country = topojson.feature(basemap, basemap.objects.countryUS);
    var city = topojson.feature(basemap, basemap.objects.placesUS);
    var states = topojson.feature(basemap, basemap.objects.states);
    var dataTest = topojson.feature(basemap, basemap.objects.dataTest);

    var color = d3.scale.linear()
    .domain([0, 52])
    .range(["rgb(50,50,50)","rgb(0,0,0)", "rgb(28,28,28)"]);

    var projection= d3.geo.albers()
    .scale(2500)
    .translate([0,500]);

                //albers_projection = createAlbersProjection(bbox[0], bbox[1], bbox[2], bbox[3], view);
                albers_projection = projection;

                var path = d3.geo.path()
                .projection(albers_projection);

                path.pointRadius(4);

                svg.selectAll(".subunit")
                .data(topojson.feature(basemap, basemap.objects.placesUS).features)
                .enter().append("path")
                .attr("class", function(d) { return "subunit " + d.id; })
                .attr("d", path);

                svg.selectAll("append")
                .data(topojson.feature(basemap, basemap.objects.states).features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", function(d, i) { return color(i); });
                
                svg.append("path")
                .datum(city)
                .attr("d", path)
                .attr("class", "place");

                svg.append("path")
                .datum(states)
                .attr("d", path)
                .attr("class", "border");

                svg.append("path")
                .datum(dataTest)
                .attr("d", path)
                .attr("class", "dataTest");

                log.debug("done creating basemap...");

            }

/**
 * Here comes all the animation and interpolation stuff
 */


// Create particle object
function createParticle(age) {
    var particle = {
        age: age,
        x: rand(minX, maxX),
        y: rand(minY, maxY),
        xt: 0,
        yt: 0
    }
    return particle
}

// Calculate the next particle's position
function evolve() {
    particles.forEach(function(particle, i) {
        if (particle.age >= settings.maxParticleAge) {
            particles.splice(i, 1);
            particle = createParticle(Math.floor(rand(0, settings.maxParticleAge/2))); // respawn
            particles.push(particle);
        }
        var x = particle.x;
        var y = particle.y;
        var uv = field(x, y);
        var u = uv[0];
        var v = uv[1];
        var xt = x + u;
        var yt = y + v;
        particle.age += 1;
        particle.xt = xt;
        particle.yt = yt;
    });
}

// Draw a line between a particle's current and next position
function draw() {
    // Fade existing trails
    var prev = g.globalCompositeOperation;
    g.globalCompositeOperation = "destination-in";
    g.fillRect(0, 0, view.width, view.height);
    g.globalCompositeOperation = prev;

    // Draw new particle trails
    particles.forEach(function(particle) {
        if (particle.age < settings.maxParticleAge) {
            g.moveTo(particle.x, particle.y);
            g.lineTo(particle.xt, particle.yt);
            particle.x = particle.xt;
            particle.y = particle.yt;
        };
    });
}

// This function will run the animation for 1 time frame
function runTimeFrame() {
    g.beginPath();
    evolve();
    draw();
    g.stroke();
};

function animateTimeFrame(data, projection) {
    g = d3.select(ANIMATION_CANVAS_ID).node().getContext("2d");
    g.lineWidth = 0.7;
    g.strokeStyle = "rgba(255, 255, 255, 1)";
    g.fillStyle = "rgba(255, 255, 255, 0.7)"; /*  White layer to be drawn over existing trails */
    particles = []
    for (var i=0; i< settings.particleCount; i++) {
        particles.push(createParticle(Math.floor(rand(0, settings.maxParticleAge))));
    }
    interval = setInterval(runTimeFrame, settings.frameRate);
}


// Return a random number between min (inclusive) and max (exclusive).
function rand(min, max) {
    return min + Math.random() * (max - min);
}
/**
 * Returns the index of v in array a (adapted from Java and darkskyapp/binary-search).
 */
 function binarySearch(a, v) {
    var low = 0, high = a.length - 1;
    while (low <= high) {
        var mid = low + ((high - low) >> 1), p = a[mid];
        if (p < v) {
            low = mid + 1;
        }
        else if (p === v) {
            return mid;
        }
        else {
            high = mid - 1;
        } 
    }
    return -(low + 1);
}

// Build points based on the data retrieved from the data back end
function buildPointsFromRadars(data) {
    var points = [];
    data.rows.forEach(function(row) {
        var p = albers_projection([row.longitude, row.latitude]);
    var point = [p[0], p[1], [row.avg_u_speed, -row.avg_v_speed]]; // negate v because pixel space grows downwards, not upwards
    points.push(point);    
});
    return points;
}

function createField() {

    log.debug("creating field");
    var nilVector = [NaN, NaN, NaN];
    field = function(x, y) {
        var column = columns[Math.round(x)];
        if (column) {
            var v = column[Math.round(y)];
            if (v) {
                return v;
            }
        }
        return nilVector;
    }
    log.debug("returning field");

    return field;
}

function interpolateField(data) {
               log.debug("interpolateField begin");


    var points = buildPointsFromRadars(data);
    var numberOfPoints = points.length;
    if (numberOfPoints > 5) {
        numberOfPoints = 5; // maximum number of points to interpolate from.
    }
    var interpolate = mvi.inverseDistanceWeighting(points, numberOfPoints);
    var tempColumns = [];

    var p0 = albers_projection([bbox[0], bbox[1]]);
    var p1 = albers_projection([bbox[2], bbox[3]]);

    minX = Math.floor(p0[0]);
    maxX = Math.floor(p1[0]);
    minY = 0;
    maxY = view.height;
    var x = minX;
    var MAX_TASK_TIME = 50;  // amount of time before a task yields control (milliseconds)
    var MIN_SLEEP_TIME = 25;

    function interpolateColumn(x) {
        var column = [];
        for (var y=minY; y<=maxY; y++) {
            var v = [0, 0, 0];
            v = interpolate(x, y, v);
            v = mvi.scaleVector(v, settings.vectorscale);
            column.push(v);
        }
        return column;
    }

    function batchInterpolate() {
        var start = +new Date;
        while (x<maxX) {
            tempColumns[x] = interpolateColumn(x);
            x++;
            if ((+new Date - start) > MAX_TASK_TIME) {
               log.debug("Interpolating: " + x + "/" + maxX);
               setTimeout(batchInterpolate, MIN_SLEEP_TIME);
               return;
           }
       }
       columns = tempColumns;
       return createField();
   }
   batchInterpolate();
}

/**
 * End of the animation and interpolation stuff
 */

/**
 * Start the animation once the data is in. This method is used in the dependency tree and will 
 * be triggered once all prerequisites are completed
 */
 function startAnimation() {
    log.debug("All data is available, start animation");
    log.debug("data: " + data);
    log.debug("albers: " + albers_projection);
    animateTimeFrame(data, albers_projection);
    play();
}
/**
 * Read the values for time and altitude, retrieve data from cartodb and interpolate all fields again
 */
 function updateRadarData() {
    log.debug("get radar data");
    var d = when.defer();
    var altBand = $(ALTITUDE_BAND_ID).val();
    var datetime = $(TIME_INTERVAL_ID).val();
    var date = moment.utc(datetime, DATE_FORMAT);
    var radardata = retrieveRadarDataByAltitudeAndTime(altBand, moment.utc(date));
    radardata.done(function(birdData) {
        d.resolve(birdData);
        //data = birdData;
        
        data = {
            //-75.9847,42.1997
            rows: [
            {avg_v_speed: 3, avg_u_speed: -800, latitude: -75.9847, longitude:  45.9469},
            {avg_v_speed: 0, avg_u_speed: -200, latitude: -74.4108, longitude: 42},
            {avg_v_speed: -80, avg_u_speed: 40, latitude:  -74.0639, longitude:  42.5864},
            {avg_v_speed: 0, avg_u_speed: 20, latitude: -72.8639, longitude: 40.8656},
            {avg_v_speed: 1600, avg_u_speed: 0, latitude: -75.44, longitude: 42.8256},
            ]
        }
        
        interpolateField(data);
    });
    log.debug("return data");
    return d.promise;
}

/**
 * Hacky hack hack, imo...
 * Bind to input field to make enter work when user changes date manually
 */
 $(TIME_INTERVAL_ID).bind("keyup", function(event) {
    if (event.which == 13) {
        updateRadarData();
        pause();
        event.preventDefault();
        event.stopPropagation();
    }
});

/**
 * Change the altitude and update radar data
 */
 function changeAltitude() {
    updateRadarData();
}

/**
 * Subtract TIME_OFFSET minutes from entered time and show results
 */
 function previous() {
    var datetime = $(TIME_INTERVAL_ID).val();
    var date = moment.utc(datetime, DATE_FORMAT);
    date = moment(date).subtract('minutes', 20);
    $(TIME_INTERVAL_ID).val(moment.utc(date).format(DATE_FORMAT));
    updateRadarData();
}

/**
 * Add TIME_OFFSET minutes from entered time and show results
 */
 function next(){
    var datetime = $(TIME_INTERVAL_ID).val();
    var date = moment.utc(datetime, DATE_FORMAT);
    date = moment(date).add('minutes', 20);
    if (date > max_date) {
        date = min_date;
    }
    $(TIME_INTERVAL_ID).val(moment.utc(date).format(DATE_FORMAT));
    updateRadarData();
}

/**
 * Function used from next button on html, needs to pause the time running as wel as go to next timeframe
 */
 function nextWithPause() {
    next();
    pause();
}

/**
 * Function used from previous button on html, needs to pause the time running as wel as go to previous timeframe
 */
 function previousWithPause() {
    previous();
    pause();
}

/** 
 * Pause interval for time running
 */
 function pause() {
    // log.debug("Pause clicked");
    clearInterval(interval);
    intervalRunning = false;
    $("#play-pause").addClass("active");
}

/** 
 * Start interval for time running
 */
 function play() {
    // log.debug("Paused unclicked");
    interval = setInterval(function() {
        next();
    }, SECONDS_TO_PLAY*1000);
    intervalRunning = true; 
    $("#play-pause").removeClass("active");
}

/** 
 * Play/Pause functionality. When paused, continue animation but do not update radar data
 */
 function playPause() {
    if (intervalRunning == true) {
        pause();
    } else {
        play();
    }
}

/**
 * Returns a function that takes an array and applies it as arguments to the specified function. Yup. Basically
 * the same as when.js/apply.
 *
 * Used in the when/then calls
 */
 function apply(f) {
    return function(args) {
        return f.apply(null, args);
    }
}

/**
 * Dependency tree build with whenjs to define the order of tasks 
 * to be run when loading the application.
 */
 var taskTopoJson       = loadJson(displayData.topography);
 var taskInitialization = when.all(true).then(apply(init));
 var taskRenderMap      = when.all([taskTopoJson]).then(apply(loadMap));
 var taskRadarData      = when.all([taskRenderMap]).then(apply(updateRadarData));
 var taskAnimation      = when.all([taskRadarData, taskRenderMap]).then(apply(startAnimation))

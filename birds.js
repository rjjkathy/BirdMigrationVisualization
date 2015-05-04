/**
 * Bird migration flow visualization for Northestern US
 *
 * based on birds.js from:
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
var data = {rows: [ {avg_v_speed: 0, avg_u_speed:0, latitude: 0, longitude : 0},
{avg_v_speed: 0, avg_u_speed:0, latitude: 0, longitude : 0},
{avg_v_speed: 0, avg_u_speed:0, latitude: 0, longitude : 0},
{avg_v_speed: 0, avg_u_speed:0, latitude: 0, longitude : 0}] };

var interval;
var basemap;
var field;
var minX;
var maxX;
var minY;
var maxY;
var columns;

var dataObject;
var readCount = 0;
var bbox = [-80, 45, -65, 47];
var scanList;
var currentParticleCount = 100;
var stations = [];
var dict = {};
var stationsMap = new Map();
var xRange = 2;
var yRange = 2;
var radius = 2.2;
var highestDensity = 0;
var densityScale;
var frameNumber = "Loading radar data...";

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
    framesPerTime: 20, // desired frames per time interval
    maxParticleAge: 15, // max number of frames a particle is drawn before regeneration
    particleCount: 100
};

/**
 * Initialize information for each station
 */
function createStations()
{
	var station1 = {
		birdNumber: 1,
		name : "KBGM",
		lat: 42.1997,
		long:-75.9847,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KBGM",station1);
	stations.push(station1);


	var station2 = {
		birdNumber: 1,
		name : "KCXX",
		lat: 44.5111 ,
		long:-73.1669,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KCXX",station2);
	stations.push(station2);


	var station3 = {
		birdNumber: 1,
		name : "KBOX",
		lat: 41.9558 ,
		long:-71.1369,
		subParticles: [],
		stationData:[],
		stationReadCount : 0

	}
	stationsMap.set("KBOX",station3);
	stations.push(station3);


	var station4 = {
		birdNumber: 1,
		name : "KLWX",
		lat: 38.9753,
		long:-77.4778,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KLWX",station4);
	stations.push(station4);

	var station5 = {
		birdNumber: 1,
		name : "KTYX",
		lat: 43.7508,
		long:-75.675,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KTYX",station5);
	stations.push(station5);

	var station6 = {
		birdNumber: 1,
		name : "KCCX",
		lat: 40.9231,
		long:-78.0036,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KCCX",station6);
	stations.push(station6);

	var station7 = {
		birdNumber: 1,
		name : "KDIX",
		lat: 39.9469    ,
		long:-74.4108,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KDIX",station7);
	stations.push(station7);

	var station8 = {
		birdNumber: 1,
		name : "KBUF",
		lat: 42.9489    ,
		long:   -78.7367,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KBUF",station8);
	stations.push(station8);

	var station9 = {
		birdNumber: 1,
		name : "KENX",
		lat: 42.5864 ,
		long: -74.0639,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KENX",station9);
	stations.push(station9);

	var station10 = {
		birdNumber: 1,
		name : "KOKX",
		lat: 40.8656,    
		long:-72.8639,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KOKX",station10);
	stations.push(station10);

	var station11 = {
		birdNumber: 1,
		name : "KDOX",
		lat: 38.8256,    
		long:-75.44,
		subParticles: [],
		stationData:[],
		stationReadCount : 0	
	}
	stationsMap.set("KDOX",station11);
	stations.push(station11);

	var station12 = {
		birdNumber: 1,
		name : "KGYX",
		lat: 43.8914 ,   
		long:-70.2567,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KGYX",station12);
	stations.push(station12);

	var station13 = {
		birdNumber: 1,
		name : "KCBW",
		lat: 46.0394,    
		long:-67.8067,
		subParticles: [],
		stationData:[],
		stationReadCount : 0
	}
	stationsMap.set("KCBW",station13);
	stations.push(station13);

}

/**
 * Convert station name into station number
 */
function stationNameToId(name)
{
	if(name == "KBGM")
		return 0;
	else if(name == "KCXX")
		return 1;
	else if(name == "KBOX")
		return 2;
	else if(name == "KLWX")
		return 3;
	else if(name == "KTYX")
		return 4;
	else if(name == "KCCX")
		return 5;
	else if(name == "KDIX")
		return 6;
	else if(name == "KBUF")
		return 7;
	else if(name == "KENX")
		return 8;
	else if(name == "KOKX")
		return 9;
	else if(name == "KDOX")
		return 10;
	else if(name == "KGYX")
		return 11;
	else if(name == "KCBW")
		return 12;
}

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
    createStations();
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

 	log.debug("JSON Retrieved");
 	return d.promise;
 }

/**
 * Loads the radar data csv file, returns a promise
 */
 function loadCSV()
 {
 	log.time("csv Retrieval...");
 	log.debug("csv Retrieval...");
 	var d = when.defer();
 	jQuery.ajax({
 		url: "data/meta_all.csv",
 		cache: false,
 		success: function(response) {
 			scanList = $.csv.toObjects(response);
 			scanList.sort(scanCompare);
 			for(var i = 0; i < scanList.length; i++)
 			{
 				var row = scanList[i];
 				var name = row.station;
 				var index = stationNameToId(name);
                if (row.tot_refl_trim > highestDensity)
                {
                	highestDensity = row.tot_refl_trim;
                }
 				stations[index].stationData.push(row);
 			}

 			densityScale = highestDensity/1000;
 			frameNumber = 0;
 			alert("Radar data loaded, press OK to start bird migration visualization");
 		}
 	});

 	log.debug("CSV Retrieved");
 	return d.promise;
 }

/**
 * Load the basemap in the svg with the countries, state border, major cities and radar locations
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
 	.scale(3000)
 	.translate([-100,600]);

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

//========================================ANIMATION STUFF========================================================================

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

// Create particle with specified location
function createParticleWithLocation(age, lat, long)
{
	var particle = {
		age: age,
		x: lat,
		y: long,
		xt: 0,
		yt: 0
	}
	return particle
}

// Calculate the next particle's position
function evolve() {

	stations.forEach(function(station)
	{
		var birdNumber = station.birdNumber;
		var lat = station.lat;
		var long = station.long;
		var subParticles = station.subParticles;

		station.subParticles.forEach(function(particle,i)
		{
			if (particle.age >= settings.maxParticleAge) {
				subParticles.splice(i, 1);

				var x = rand(station.lat - xRange, station.lat + xRange);
				var y = rand(station.long - yRange, station.long + yRange);
				var p = albers_projection([y, x]);
				var dist = mvi.dist(station.lat, station.long, x, y);

				if(dist <= radius + 0.1){
            			particle = createParticleWithLocation(Math.floor(rand(0, settings.maxParticleAge/2)),p[0], p[1]); // respawn
            			subParticles.push(particle);
            		}
            	}

            	var x = particle.x;
            	var y = particle.y;
            	if(field != null)
            	{
            		var uv = field(x, y);
            		var u = uv[0];
            		var v = uv[1];
            		var xt = x + u;
            		var yt = y + v;
            		particle.age += 1;
            		particle.xt = xt;
            		particle.yt = yt;
            	}   
            	else
            	{
            		particle.age += 1;
            		particle.xt = x;
            		particle.yt = y;
            	}
            });

}
);

}

// Draw a line between a particle's current and next position
function draw() {
    // Fade existing trails
    var prev = g.globalCompositeOperation;
    g.globalCompositeOperation = "destination-in";
    g.fillRect(0, 0, view.width, view.height);
    g.globalCompositeOperation = prev;

    stations.forEach(function(station)
    {
    	var birdNumber = station.birdNumber;
    	var lat = station.lat;
    	var long = station.long;
    	var subParticles = station.subParticles;

    	subParticles.forEach(function(particle)
    	{
    		if (particle.age < settings.maxParticleAge) {
    			if(particle.x >0 && particle.y > 0 && particle.xt >0 && particle.yt >0){
    			    //var dist = mvi.dist(particle.x, particle.y, particle.xt, particle.yt)
    				//if(dist < 100){
    				g.moveTo(particle.x, particle.y);
    				g.lineTo(particle.xt, particle.yt);
    				particle.x = particle.xt;
    				particle.y = particle.yt;
    			//}
    			}
    		};

    	});

    });
}

// This function will run the animation for 1 time frame
function runTimeFrame() {
	g.beginPath();
	evolve();
	draw();

	stations.forEach(function(station)
	{
		var birdNumber = station.birdNumber;
		var lat = station.lat;
		var long = station.long;
		var subParticles = station.subParticles;

		if(subParticles.length < birdNumber)
		{
			for(var i = 0; i < birdNumber - subParticles.length; i++){
				var x = rand(station.lat - xRange, station.lat + xRange);
				var y = rand(station.long - yRange, station.long + yRange);
				var p = albers_projection([y, x]);
				var dist = mvi.dist(station.lat, station.long, x, y);

				if(dist <= radius){
					var particle = createParticleWithLocation(Math.floor(rand(0, settings.maxParticleAge)),p[0], p[1]);
					subParticles.push(particle);
				}
			}
		}else if (subParticles.length > birdNumber){
			var extra = subParticles.length - birdNumber;

			for(var i = 0; i < extra; i++){
				subParticles.splice(Math.floor(rand(0,subParticles.length-1)), 1);
			}     
		}

	});

	g.stroke();
}

function animateTimeFrame(data, projection) {
	g = d3.select(ANIMATION_CANVAS_ID).node().getContext("2d");
	g.lineWidth = 0.9;
	g.strokeStyle = "rgba(255, 165, 100, 1)";
	g.fillStyle = "rgba(255, 255, 255, 0.7)"; /*  White layer to be drawn over existing trails */

	stations.forEach(function(station) {
		station.subParticles = [];
		for (var i = 0 ; i< station.birdNumber; i++)
		{
			var x = rand(station.lat -xRange, station.lat + xRange);
			var y = rand(station.long -yRange, station.long + yRange);
			var p = albers_projection([y, x]);    
			var dist = mvi.dist(station.lat,station.long, x, y);

			if(dist <=radius){
				station.subParticles.push(createParticleWithLocation(Math.floor(rand(0, settings.maxParticleAge)), p[0], p[1]));
			}
		} 
	});
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

/**
 * Interpolates the motion vector
 */
function interpolateField(data) {
	log.debug("interpolateField begin");

	var points = buildPointsFromRadars(data);
	var numberOfPoints = points.length;
	if (numberOfPoints > 13) {
        numberOfPoints = 13; // maximum number of points to interpolate from.
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
 * Start the animation once the data is in. This method is used in the dependency tree and will 
 * be triggered once all prerequisites are completed
 */
 function startAnimation() {
 	log.debug("All data is available, start animation");
//     log.debug("data: " + data);
//     log.debug("albers: " + albers_projection);
animateTimeFrame(data, albers_projection);
play();
}

/**
 * clear the birds count for each station after each wave of input data
 */
function resetBirdNumber()
{
	 for(var i = 0; i < stations.length; i++)
    {
    	var s = stations[i];
    	s.birdNumber = 0;
    }
}

/**
 * Read the next batch of radar data
 */
 function updateRadarData() {

 	var promise = when.promise(function(resolve, reject, notify) {
 		if(scanList != null)
 		{
 			log.debug("get radar data");
 			var currentBirdArray = [];
 			var currentWindArray = [];
 			var particleNum = 0;
 			var subParticleNum = 0;
 			resetBirdNumber();

    
    for(var i = 0; i < stations.length; i++)
    {
    	var station = stations[i];
    	var currentBird = station.stationData[station.stationReadCount];
    	var stationName = station.name;
    	var lat = currentBird.lat;
    	var long = currentBird.lon;
    	var direction = 90 - currentBird.avg_direction_wtd_med_nomask;
    	var speed = currentBird.avg_speed_wtd_med_nomask;
    	var v = Math.dsin(direction)*speed * 0.5;
    	var u = Math.dcos(direction)*speed * 0.5;
    	var row = {avg_v_speed: v, avg_u_speed:u, latitude: lat, longitude : long};

       if(currentBird.benjamin == "accept" && currentBird.andrew == "accept")
        {
        currentBirdArray.push(row);
    	//particleNum += currentBird.tot_refl_trim / densityScale;
    	//station.birdNumber += currentBird.tot_refl_trim / densityScale;
    	station.birdNumber += currentBird.tot_refl_trim / densityScale;
        }       
        station.stationReadCount++;
    }

    			frameNumber++;
                currentParticleCount = particleNum;
                station.birdNumber = Math.floor(station.birdNumber);

                data = {
                	rows: currentBirdArray
                }

                interpolateField(data);
            }

            resolve(data);
        });

log.debug("return data");
return promise;
}

    // For sorting the csv file input
    function scanCompare(a, b)
    {
    	if (a.year < b.year)  { return -1; }
    	if (a.year > b.year)  { return  1; }

    	if (a.sunset_month < b.sunset_month) { return -1; }
    	if (a.sunset_month > b.sunset_month) { return  1; }

    	if (a.sunset_day < b.sunset_day) { return -1; }
    	if (a.sunset_day > b.sunset_day) { return  1; }

    	if (a.scan_time < b.scan_time) { return -1; }
    	if (a.scan_time > b.scan_time) { return  1; }

    	return 0;
    }

    // wrapping around the math library for degree sine calculation
    Math.dsin = function() {
    	var piRatio = Math.PI / 180;
    	return function dsin(degrees) {
    		return Math.sin(degrees * piRatio);
    	};
    }();

    // wrapping around the math library for degree cosine calculation
    Math.dcos = function() {
    	var piRatio = Math.PI / 180;
    	return function dcos(degrees) {
    		return Math.cos(degrees * piRatio);
    	};
    }();

/**
 * Hacky hack hack
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
 * Update the displayed frame number
 */
 function previous() {
 	$(TIME_INTERVAL_ID).val("Frame: " + frameNumber.toString());
 	updateRadarData();
 }


/**
 * Update the displaced frame number
 */
 function next(){
 	$(TIME_INTERVAL_ID).val("Frame: " + frameNumber.toString());
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
 var taskCSV            = loadCSV();
 var taskInitialization = when.all(true).then(apply(init));
 var taskRenderMap      = when.all([taskTopoJson]).then(apply(loadMap));
 var taskRadarData      = when.all([taskRenderMap]).then(apply(updateRadarData));
 var taskAnimation      = when.all([taskRadarData, taskRenderMap]).then(apply(startAnimation))

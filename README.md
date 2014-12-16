BirdMigrationVisualization
==========================


# Basemap

## Countries

Source: `ne_50m_admin_0_countries` from http://www.naturalearthdata.com/downloads/50m-cultural-vectors/

Selection (in CartoDB) following tutorial: http://bost.ocks.org/mike/map/

ogr2ogr \
  -f GeoJSON \
  -where "ISO_A2 = 'US'" \
  countryUS.json \
  ne_50m_admin_0_countries.shp
  
## Populated Places
  
  ogr2ogr \
  -f GeoJSON \
  -where "ISO_A2 = 'US' AND SCALERANK < 8" \
  placesUS.json \
  ne_10m_populated_places.shp


## TopoJson

topojson \
  -o basemap.json \
  --id-property SU_A3 \
  --properties name=name \
  -- \
  countryUS.json \
  placesUS.json
  
## Drawing Base Map

# <script>

    var width = 1460,
    height = 1500;

    var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height",height);

    d3.json("basemap.topojson", function(error, basemap) {
      if (error) return console.error(error);

      var country = topojson.feature(basemap, basemap.objects.countryUS);
      var city = topojson.feature(basemap, basemap.objects.placesUS);
      var states = topojson.feature(basemap, basemap.objects.states);
      var dataTest = topojson.feature(basemap, basemap.objects.dataTest);

        var color = d3.scale.linear()
        .domain([0, 52])
        .range(["rgb(30,30,30)","rgb(0,0,0)",
          "rgb(18,18,18)"]);

        var projection= d3.geo.albersUsa() 
        .scale(3000) 
        .translate([width/2 - 800, height / 2 - 100]);

        var path = d3.geo.path()
        .projection(projection);

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

      });

</script>

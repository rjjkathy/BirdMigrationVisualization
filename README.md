BirdMigrationVisualization
==========================

visualization 

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
  
  

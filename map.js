let filterSector;

let dotCol = '#212121'

// function reading in the data, drawing mapbox and plotting locations
async function readAndMap(hubsData, multiLocs, mapboxParams){

  // read in the city's hubs
  let hubLocs = await d3.csv(hubsData);

  hubLocs = hubLocs.filter(d => d.Lat != "");

  //////////////////////////////////////////////////////////////////////////
  // Setting up mapbox /////////////////////////////////////////////////////

  // setting up the mapbox gl map
  // first we specify the token
  mapboxgl.accessToken = mapboxParams.accessToken;
  //Setup mapbox-gl map
  const map = new mapboxgl.Map({
    container: 'map', // container id
    style: mapboxParams.styleMap, // Saad's custom style (British Council Branding)
    center: mapboxParams.center,
    zoom: mapboxParams.initZoomVal, // zoom value has been ascertained manually, is there a way to automate this given the locations (do some math with the centroid and the extent)
    //bounds: [lonExt, latExt],
    dragPan: false
  })

  const mapBounds = map.getBounds();
  const lngExt = mapBounds._ne.lng - mapBounds._sw.lng;
  const frctOffSet = 0.30/2;
  const lngOffSet = lngExt * frctOffSet;

  // disabling and enabling some map features
  map.scrollZoom.disable() // disable zoom on pinch
  map.doubleClickZoom.disable() // disable double click zoom

  //////////////////////////////////////////////////////////////////////////


  // Setup our svg layer that we can manipulate with d3
  // getting the container which contains the mapbox map
  const container = map.getCanvasContainer();
  // appending an svg to that container
  const svg = d3.select(container).append("svg");

  // for setting up an event handler (when the user click on anything but the elements in the SVG)
  const backgroundRect = svg.append('rect')
                            .attrs({
                              id: 'backgroundRect',
                              x: 0,
                              y: 0,
                              width: '100%',
                              height: '100%'
                            })
                            .styles({
                              fill: 'grey',
                              opacity: 0
                            });

  // we calculate the scale given mapbox state (derived from viewport-mercator-project's code)
  // to define a d3 projection
  const getD3 = () => {
    // get important data for the map that will be helpful to define D3 projection
    const bbox = document.body.getBoundingClientRect();
    const center = map.getCenter();
    const zoom = map.getZoom();
    // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config

    const getD3projScal = (tileSize, zoom) => (tileSize) * 0.5 / Math.PI * Math.pow(2, zoom);
    const scale = getD3projScal(512, zoom);

    const projection = d3.geoMercator()
      .center([center.lng, center.lat])
      .translate([bbox.width/2, bbox.height/2])
      .scale(scale);
    return projection;
  }


  // calculate the original d3 projection
  let d3Projection = getD3();

  // Defining scales that determine the size of the location markers
  const radScale = d3.scaleSqrt()
                    .domain([1, 10])
                    .range([3, 8]);

  const strokeScale = d3.scaleSqrt()
                    .domain([1, 10])
                    .range([1, 2]);

  // positioned same as the location of city hubs, these will just animate when hovered
  const interBub = svg.append('g')
                .attr('id', 'interBubG')
                .selectAll("circle.interBub")
                .data(hubLocs)
                .enter()
                .append("circle")
                .classed("interBub", true)
                .attr("r", 0)
                .attr("filter", 1)
                .styles({
                  'fill': dotCol,
                  'fill-opacity': 0.8,
                  'stroke': 'none'
                });

  // initialize the city's hubs (will be positioned by the render function)
  const dots = svg.append('g')
                .attr('id', 'interBubG')
                .selectAll("circle.dot")
                .data(hubLocs)
                .enter()
                .append("circle")
                .classed("dot", true)
                .attr("r", 1)
                .attr("filter", 1)
                .styles(d => (
                  {
                    'fill': dotCol,
                    'fill-opacity': 0,
                    'stroke': dotCol,
                    'stroke-width': strokeScale(d.Crafts.split(',').length),
                    'stroke-opacity': 0.9
                  }));

  // These circles don't show by default, They just appear when a location
  // is clicked (or is in focus)
  const focusCircle = svg.selectAll("circle.focusCircle")
                .data(hubLocs)
                .enter()
                .append("circle")
                .classed("focusCircle", true)
                .classed('unfocus', true)
                .attr('city', d => d["Famous_Landmarks"])
                .attr("r", 8)
                .attr("filter", 1)
                .styles({
                  'fill': dotCol,
                  'fill-opacity': 0.9
                });


  // render function positions/ repositions the locations according mapbox state
  function render() {
    // getting the current map projection using mapbox state
    d3Projection = getD3();

    // remove any tooltip in the dom
    removeTooltip();

    // remove any previously drawn voronoi (voronoi computed and drawn at each instant of render)
    removeIntVoronoi(svg);

    // positioning/ repositioning the location markers
    dots.attrs({
          cx: d => d3Projection([+d.Lon, +d.Lat])[0],
          cy: d => d3Projection([+d.Lon, +d.Lat])[1]
        })
        .transition()
        .duration(750)
        .attr("r", function(d, i){
          const nCrafts = d.Crafts.split(',').length;
          const filter = d3.select(this).attr('filter');
          return (filter == 1) ? radScale(nCrafts) : 0;
        });

    // positioning/ repositioning the interaction bubbles (animate when locations hovered)
    interBub.attrs({
          cx: d => d3Projection([+d.Lon, +d.Lat])[0],
          cy: d => d3Projection([+d.Lon, +d.Lat])[1]
        })
        .transition()
        .duration(750);

    // positioning/ repositioning the focus bubbles
    focusCircle.attrs({
          cx: d => d3Projection([+d.Lon, +d.Lat])[0],
          cy: d => d3Projection([+d.Lon, +d.Lat])[1]
        })
        .transition()
        .duration(750);

    // compute and append updated voronoi based on the new projection
    const vorCircs = appendIntVoronoi(
        {
          x: d => d3Projection([+d.Lon, +d.Lat])[0],
          y: d => d3Projection([+d.Lon, +d.Lat])[1]
        },
        {
          x: d => d3Projection([+d.Lon, +d.Lat])[0],
          y: d => d3Projection([+d.Lon, +d.Lat])[1]
        },
        [
          [0, 0],
          [getMapCanvasExtent().width, getMapCanvasExtent().height]
        ],
        svg,
        hubLocs,
        18
      );

    // activate Hover events on the voronoi circles
    // (they are activated on each instant of render because the previous
    // voronoi is deleted)
    activateHoverEvents([]);

    // activate click/ focus events
    activateClickEvents([]);

  };

  // list of crafts categories in Vceela
  const CraftCategs = [
    "Ajrak",
    "Azarband",
    "Bangles",
    "Basketry",
    "Bead Work",
    "Block Printing",
    "Bone Carving",
    "Bone Work",
    "Braiding",
    "Candles",
    "Carpet Making",
    "Ceramics",
    "Cotton",
    "Cotton Printing",
    "Cushions",
    "Doll Making",
    "Duree/Cotton Rugs",
    "Embroidery",
    "Farasi",
    "Floor Covering",
    "Gabba",
    "Gilum",
    "Gindi",
    "Glass Work",
    "Hand Looms",
    "Jewellery",
    "Khaddar",
    "Khatha",
    "Khees",
    "Khussa",
    "Lacquer Art",
    "Leather Work",
    "Lungi",
    "Marble",
    "Marble Cutting",
    "Metal Crafts",
    "Mirror Work",
    "Musical Instruments",
    "Paper Mache",
    "Paranda",
    "Patti Making",
    "Perfume Making",
    "Pottery",
    "Quilting",
    "Rilhi Work",
    "Rugs/Namda",
    "Saddle Bags",
    "Sandals/Shoes",
    "Sharma",
    "Silk",
    "Sindhi Cap",
    "Sindhi Dress",
    "Stone Carving",
    "Sussi",
    "Thread Work",
    "Tie and Dye",
    "Tiles",
    "Tobacco Pipes",
    "Wax Painting",
    "Wooden Products",
    "Wool Products"
  ];

  filterSector = (arr) => {
      const arrRef = (arr.length == 0) ? CraftCategs : arr;

      interBub.style('display', d => findCommonElements(arrRef, getSectorArray(d.Crafts))  ? 'block' : 'none');
      dots.style('display', d => findCommonElements(arrRef, getSectorArray(d.Crafts))  ? 'block' : 'none');


      removeIntVoronoi(svg);

      console.log(hubLocs.filter(d => findCommonElements(arrRef, getSectorArray(d.Crafts))));

      appendIntVoronoi(
          {
            x: d => d3Projection([+d.Lon, +d.Lat])[0],
            y: d => d3Projection([+d.Lon, +d.Lat])[1]
          },
          {
            x: d => d3Projection([+d.Lon, +d.Lat])[0],
            y: d => d3Projection([+d.Lon, +d.Lat])[1]
          },
          [
            [0, 0],
            [getMapCanvasExtent().width, getMapCanvasExtent().height]
          ],
          svg,
          hubLocs.filter(d => findCommonElements(arrRef, getSectorArray(d.Crafts))),
          18
        );

        activateHoverEvents(arr);

        // activate click/ focus events
        activateClickEvents(arr);
  }



  // position the locations for the first time
  render();

  // re-render our visualization whenever the view changes (mapbox state changes - zoom/ pan etc)
  map.on("viewreset", function() {
    render()
  });
  map.on("move", function() {
    render()
  });

  //////////////////////////////////////////////////
  // function for activating event listeners - to add and remove tooltip
  // (on voronoi circles)

  function activateHoverEvents(arr){

    const arrRef = (arr.length == 0) ? CraftCategs : arr;

    const transDur = 175;

    svg.selectAll("circle.circle-catcher")
      .filter(d => findCommonElements(arrRef, getSectorArray(d.Crafts)))
      .on('mouseover', function(d, i){
        appendTooltip(d3.event, d);

        const LM = d3.select(this).datum()["Famous_Landmarks"];

        d3.selectAll('circle.dot').transition()
                    .duration(transDur)
                    .attr('r', d => {
                      const nCrafts = d.Crafts.split(',').length;
                      if (d["Famous_Landmarks"] == LM){
                        return 12;
                      }
                      else {
                        return radScale(nCrafts);
                      }
                    })
                    .style('stroke-opacity', d => (d["Famous_Landmarks"] == LM) ? 0.9 : 0.3);

        svg.selectAll("circle.interBub")
          //.filter((d, i) => d["Famous_Landmarks"] == LM)
          .transition()
          .duration(transDur + 75)
          .attr('r', d => (d["Famous_Landmarks"] == LM) ? 7 : 0);
    })

    svg.selectAll("circle.circle-catcher")
      .filter(d => findCommonElements(arrRef, getSectorArray(d.Crafts)))
      .on('mouseout', function(d, i){
      removeTooltip();

      svg.selectAll("circle.dot")
        .transition()
        .duration(transDur)
        .attr('r', d => {
          const nCrafts = d.Crafts.split(',').length;
          return radScale(nCrafts);
        })
        .style('stroke-opacity', 0.9);

      svg.selectAll("circle.interBub")
        .transition()
        .duration(transDur)
        .attr('r', 0);
    })
  }

  function activateClickEvents(arr){
    const arrRef = (arr.length == 0) ? CraftCategs : arr;
    const transDur = 175;
    svg.selectAll("circle.circle-catcher").filter(d => findCommonElements(arrRef, getSectorArray(d.Crafts))).on('click', function(d, i){

      const LM = d.Famous_Landmarks;

      svg.selectAll("circle.focusCircle")
        .classed('unfocus', true)
        .filter(d => d.Famous_Landmarks == LM)
        .classed('unfocus', false)
        .classed('focus', true);

      map.easeTo({
        center: [+d.Lon + lngOffSet, +d.Lat],
        zoom: mapboxParams.initZoomVal * 1.02,
        //duration: 250
      })

    })

    svg.selectAll("rect#backgroundRect").on('click', function(d, i){

      map.easeTo({
        center: mapboxParams.center,
        zoom: mapboxParams.initZoomVal,
        //duration: 250
      })

      svg.selectAll("circle.focusCircle")
        .classed('unfocus', true);

      svg.selectAll("circle.dot")
        .attr('r', d => {
            const nCrafts = d.Crafts.split(',').length;
            return radScale(nCrafts);
        })
        .style('stroke-opacity', 0.9);
      //
      svg.selectAll("circle.interBub")
        .attr('r', 0);
    })
  }


  //////////////////////////////////////////////////

  // appends a tooltip showing location name
  const appendTooltip = (event, dat) => {
    const toolTipWidth = 120;

    const tool = d3.select(container).append('div')
      .attr('class', 'tooltip')
      .style('transform', 'translateY(15px)')
      .style('opacity', '0')
      .transition()
      .duration(300)
      .style('transform', 'translateY(0px)')
      .style('opacity', '1');


    d3.select('.tooltip').html(`
        <p class="toolText">
          ${dat.Famous_Landmarks}
        </p>
      `)
      .style('top', `${event.y + 10}px`)
      .style('left', `${event.x - (toolTipWidth/2)}px`);

    d3.select('.toolText')
      .style('transform', 'translateY(-20px)')
      .style('opacity', '0')
      .transition()
      .duration(300)
      .style('transform', 'translateY(0px)')
      .style('opacity', '1');
  }
  // removes tooltip
  function removeTooltip(){
    d3.select(container).select('div.tooltip').remove();
  }


  function addMultLocEvents(locArr){
    if (locArr.length > 0){
      const transDur = 175;
      locArr.forEach(item => {



        d3.select(`div#${item.id}`).on('click', function(d, i){


          map.easeTo({
            center: item.center,
            zoom: item.zoom,
            duration: 1200
          })

          console.log('clicked!')
          svg.selectAll("rect#backgroundRect").on('click', null);
          // do every thing that we do on mouseout
          svg.selectAll("circle.dot")
          .attr('r', d => {
            const nCrafts = d.Crafts.split(',').length;
            return radScale(nCrafts);
          })
            .style('stroke-opacity', 0.9);

          svg.selectAll("circle.interBub")
            .attr('r', 0);

          // make all clicked values to be 'false' when the user clicks the background
          svg.selectAll("circle.focusCircle")
            .classed('unfocus', true);
          })

          // remove and redefine background click event


      });
    }
  }

  addMultLocEvents(multiLocs);

}

// function used compute extent of the Mapbox canvas
// used for inputting extent to the d3 voronoi function
function getMapCanvasExtent() {
  const mapCanvas = document.getElementsByClassName('mapboxgl-canvas')[0]
  return mapCanvas.getBoundingClientRect()
}

function findCommonElements(arr1, arr2) {

    // Create an empty object
    let obj = {};

        // Loop through the first array
        for (let i = 0; i < arr1.length; i++) {

            // Check if element from first array
            // already exist in object or not
            if(!obj[arr1[i]]) {

                // If it doesn't exist assign the
                // properties equals to the
                // elements in the array
                const element = arr1[i];
                obj[element] = true;
            }
        }

        // Loop through the second array
        for (let j = 0; j < arr2.length ; j++) {

        // Check elements from second array exist
        // in the created object or not
        if(obj[arr2[j]]) {
            return true;
        }
    }
    return false;
}

function getSectorArray(text){
  return text.split(",").map(d => d.trim());
}

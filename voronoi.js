// must have d3 loaded in order to function
// appends a clipped circle voronoi to an SVG selection given some point data

function appendIntVoronoi(cellXY, circleXY, voronoiExt, svgSelection, pointData, circleRadius){

    // defining a function to compute voronoi celss
    const voronoi = d3.voronoi()
                    .x(cellXY.x)
                    .y(cellXY.y)
                    .extent(voronoiExt);

    // appending clipPaths in defs. This method assumes that there is no defs in the SVG from the get go
    const polygon =  svgSelection.append("defs")
                                .selectAll(".clip")
                                .data(voronoi.polygons(pointData))
                                //First append a clipPath element
                                .enter()
                                .append("clipPath")
                                .attr("class", "clip")
                                //Make sure each clipPath will have a unique id (connected to the circle element)
                                .attr("id", (d, i) => `clip-index${i}`)
                                //Then append a path element that will define the shape of the clipPath
                                .append("path")
                                .attr("class", "clip-path-circle")
                                .attr("d", d => (d !== undefined) ? `M${d.join(",")}Z` : "");

      //Append larger circles and clip them
    const clipCircSelection = svgSelection.append('g')
        .attr('id', 'CCatcher-Grp')
          .selectAll("circle.circle-catcher")
          .data(pointData)
          .enter()
          .append("circle")
          .attr("class", (d, i) => `circle-catcher index${i}`)
          //Apply the clipPath element by referencing the one with the same countryCode
          .attr("clip-path", (d, i) => `url(#clip-index${i})`)
          //Bottom line for safari, which doesn't accept attr for clip-path
          .style("clip-path", (d, i) => `url(#clip-index${i})`)
          .attr("cx", circleXY.x)
          .attr("cy", circleXY.y)
          //Make the radius a lot bigger (or a function depending on data)
          .attr("r", circleRadius)
          .style("fill", "grey")
          .style("opacity", 0.0)
          .style("pointer-events", "all")
          .style("cursor", "pointer")
          //Notice that we now have the mousover events on these circles

    return clipCircSelection;
}

// remove all voronoi related elements
function removeIntVoronoi(svgSelection) {
  svgSelection.select('defs').remove();
  svgSelection.select('g#CCatcher-Grp').remove();
}

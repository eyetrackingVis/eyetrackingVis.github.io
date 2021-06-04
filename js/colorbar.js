/**
 * Helpers
 */


function plot_colorbar(g, scaleColorPupil){

    // add the legend now
    var legendFullHeight = 400;
    var legendFullWidth = 40;

    var legendMargin = { top: 20, bottom: 20, left: 5, right: 20 };

    // use same margins as main plot
    var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
    var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

    var legendSvg = g.append("g")
        .attr('width', 100)
        .attr('height', legendWidth)
        .attr('transform', 'translate(-450, 440)')

      // create colour scale
    var [min, max] = scaleColorPupil.domain()

    // clear current legend
    legendSvg.selectAll('*').remove();

    // append gradient bar
    var gradient = legendSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '0%')
        .attr('x2', '100%') // to top
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');

    // programatically generate the gradient for the legend
    // this creates an array of [pct, colour] pairs as stop
    // values for legend
    var pct = linspace(0, 100, 10).map(function(d) {
        return Math.round(d) + '%';
    });

    var scale = linspace(min, max, 10).map(l => scaleColorPupil(l))

    var colourPct = d3.zip(pct, scale);

    colourPct.forEach(function(d) {
        gradient.append('stop')
            .attr('offset', d[0])
            .attr('stop-color', d[1])
            .attr('stop-opacity', 1);
    });

    var textDesc = legendSvg
      .append("text")
      .attrs({
        "fill":"black",
        "transform": "translate(110,-10) rotate(0)",
        "font-family": "Calibri, sans"
      })
      .text("Pupil diameter (mm)")


    legendSvg.append('rect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', legendHeight)
        .attr('height', legendWidth)
        .style('fill', 'url(#gradient)');

    // create a scale and axis for the legend
    var legendScale = d3.scaleLinear()
        .domain([max, min])
        .range([legendHeight, 0]);

    let legendAxis = d3.axisBottom(legendScale)
        .tickValues(linspace(min, max, 10))
        .tickFormat(d3.format("d"));

    legendSvg.append("g")
        .attr("class", "legend axis")
        .attr("transform", "translate(0,"+legendWidth+")")
        .call(legendAxis);

    function linspace(start, end, n) {
        let delta = (end - start) / (n-1)
        let scale = d3.range(start, end+delta, delta).slice(0, n)
        return scale
    }
}

// function plot_frequencies(g, scaleColorPupil){

//   // add the legend now
//   var legendFullHeight = 400;
//   var legendFullWidth = 40;

//   var legendMargin = { top: 20, bottom: 20, left: 5, right: 20 };

//   // use same margins as main plot
//   var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
//   var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

//   var legendSvg = g.append("g")
//       .attr('width', 100)
//       .attr('height', legendWidth)
//       .attr('transform', 'translate(-450, 370)')

//     // create colour scale
//   var [min, max] = scaleColorPupil.domain()

//   // clear current legend
//   legendSvg.selectAll('*').remove();

//   // append gradient bar
//   var gradient = legendSvg.append('defs')
//       .append('linearGradient')
//       .attr('id', 'gradient_freq')
//       .attr('x1', '0%') // bottom
//       .attr('y1', '0%')
//       .attr('x2', '100%') // to top
//       .attr('y2', '0%')
//       .attr('spreadMethod', 'pad');

//   // programatically generate the gradient for the legend
//   // this creates an array of [pct, colour] pairs as stop
//   // values for legend
//   var pct = linspace(0, 100, 10).map(function(d) {
//       return Math.round(d) + '%';
//   });

//   var scale = linspace(max, min, 10).map(l => scaleColorPupil(l))

//   var colourPct = d3.zip(pct, scale);

//   colourPct.forEach(function(d) {
//       gradient.append('stop')
//           .attr('offset', d[0])
//           .attr('stop-color', d[1])
//           .attr('stop-opacity', 1);
//   });

//   var textDesc = legendSvg
//     .append("text")
//     .attrs({
//       "fill":"black",
//       "transform": "translate(110,-10) rotate(0)",
//       "font-family": "Calibri, sans"
//     })
//     .text("Normalized Word Frequency")


//   legendSvg.append('rect')
//       .attr('x1', 0)
//       .attr('y1', 0)
//       .attr('width', legendHeight)
//       .attr('height', legendWidth)
//       .style('fill', 'url(#gradient_freq)');

//   // create a scale and axis for the legend
//   var legendScale = d3.scaleLinear()
//       .domain([min, max])
//       .range([legendHeight, 0]);

//   let legendAxis = d3.axisBottom(legendScale)
//       .tickValues(linspace(max, min, 10))
//       .tickFormat(d3.format("d"));

//   legendSvg.append("g")
//       .attr("class", "legend axis")
//       .attr("transform", "translate(0,"+legendWidth+")")
//       .call(legendAxis);

//   function linspace(start, end, n) {
//       let delta = (end - start) / (n-1)
//       let scale = d3.range(start, end+delta, delta).slice(0, n)
//       return scale
//   }
// }


function plot_frequencies(g, scale){
   // add the legend now
   var legendFullHeight = 400;
   var legendFullWidth = 40;
 
   var legendMargin = { top: 20, bottom: 20, left: 5, right: 20 };
 
   // use same margins as main plot
   var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
   var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;
 
   var legendSvg = g.append("g")
      .attr("class", "scale_freqs")
      .attr('width', 100)
      .attr('height', legendWidth)
      .attr('transform', 'translate(-450, 370)')
  
  // clear current legend
  legendSvg.selectAll('*').remove();

  legendSvg.selectAll(".rects")
      .data([70000, 20000, 200, 0])
      .enter()
      .append("rect")
      .attr("y", 10)
      .attr("height", legendWidth)
      .attr("x", (d,i)=>i*(legendHeight/4))
      .attr("width", legendHeight/4)
      .attr("fill", d=>scale(d))
      .attr("stroke", "gray");

  legendSvg.selectAll("desc")
    .data(["High", "Often", "Medium", "Low"])
    .enter()
    .append("text")
    .attrs({
      "x": (d, i) => (((legendHeight/4)/2)*i) + ((legendHeight/4)/2)*(i+1),
      "y": legendWidth+25,
      "text-anchor": "middle"
    })
    .text(d=>d)


  legendSvg
      .append("text")
      .attrs({
        "fill":"black",
        "transform": "translate(110,0) rotate(0)",
      "font-family": "Calibri, sans"
      })
      .text("Normalized Word Frequency")



}


function plot_legends(g){

    var legendSvg = g.append("g")
      .attr('width', 100)
      .attr('height', 380)
      .attr('transform', 'translate(-450, 500)')

    legendSvg.selectAll("circlesLegends")
      .data(["Transitions"]).enter()
      .append("text")
      .attrs({
        "x": 180,
        "y": 0,
        "text-anchor": "middle"
      })
      .text(d => d)

    legendSvg.selectAll("circlesLegends")
      .data(["Forward", "Backward", "Intra-Word"]).enter()
      .append("text")
      .attrs({
        "x": (d, i) => 40 + (i*100) + 10,
        "y": 25,
      })
      .text(d => d)

    legendSvg.selectAll("circlesLegends")
      .data(["#6497b1", "#c0c0c0", "#3dcc7d"]).enter()
      .append("circle")
      .attrs({
        "cx": (d, i) =>  40 + (i*100),
        "cy": 20,
        "r": 5,
        "fill": d => d
      })
}

function plot_dwell(g, min, max){

    // add the legend now
    var legendFullHeight = 400;
    var legendFullWidth = 40;

    var legendMargin = { top: 20, bottom: 20, left: 5, right: 20 };

    // use same margins as main plot
    var legendWidth = legendFullWidth - legendMargin.left - legendMargin.right;
    var legendHeight = legendFullHeight - legendMargin.top - legendMargin.bottom;

    var legendSvg = g.append("g")
        .attr('width', 100)
        .attr('height', legendWidth)
        .attr('transform', 'translate(-450, 370)')

    // clear current legend
    legendSvg.selectAll('*').remove();

    var textDesc = legendSvg
      .append("text")
      .attrs({
        "fill":"black",
        "transform": "translate(125,0)",
        "font-family": "Calibri, sans"
      })
      .text("Dwell Time (ms)")


    // create a scale and axis for the legend
    var legendScale = d3.scaleLog()
        .domain([100000, 1])
        .range([legendHeight, 0]);

    let legendAxis = d3.axisBottom(legendScale)
        .tickValues([1, 10, 100, 1000, 10000, 100000])
        .tickFormat(d3.format("d"));

    legendSvg.append("g")
        .attr("class", "legend axis")
        .attr("transform", "translate(0,"+legendWidth+")")
        .call(legendAxis);

    function linspace(start, end, n) {
        let delta = (end - start) / (n-1)
        let scale = d3.range(start, end+delta, delta).slice(0, n)
        return scale
    }
}

function plot_pos_legend(g, scale, pos){

  g.selectAll("tag")
    .data(new Array(...pos)).enter()
    .append("rect")
    .attrs({
      "x": (d,i) => 55*i,
      "y": 10,
      "width": 20,
      "height":20,
      "fill": (d) => scale(d)
    })

  g.selectAll("textPoS")
    .data(new Array(...pos)).enter()
    .append("text")
    .attrs({
      "x": (d,i) => 55*i+10,
      "y": 5,
      "font-size": 10,
      "text-anchor": "middle"
    })
    .text(d => d)
}


function updateRoot(){
    root.each(function(d){
      //outer centroid
      var r = (d.y0) / 2 //TODO: THE PLANK CONSTANT
      var a = (d.x0 + d.x1) / 2 - Math.PI / 2
      d.xi = Math.cos(a) * 2*r
      d.yi = Math.sin(a) * 2*r

      r = (d.y1) / 2
      a = (d.x0 + d.x1) / 2 - Math.PI / 2
      d.xo = Math.cos(a) * 2*r
      d.yo = Math.sin(a) * 2*r

    })
}
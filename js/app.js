// Variables
var width = 932;
var height = 950;
var radius = 300 //Math.min(width-100, height-100) / 2;


/**
 * Create the plot 
 * @param  {array} Array with node data
 * @param  {array} Array with links (transitions)
 * @param  {array} Array with syntactic dependencies (syntax tree)
 * @return {null}
 */
function create_plot(nodeData, data_links){

  //Global variables
  var SENTENCETIME_CLICKED = false;

  d3.select("#btnSentenceTime").on("click", function(d, i){
    SENTENCETIME_CLICKED = SENTENCETIME_CLICKED?false:true

    d3.select(this).text(SENTENCETIME_CLICKED?"HIDE SENTENCE TIME":"SHOW SENTENCE TIME")

    sentenceTime
      .style("display", SENTENCETIME_CLICKED?null:"none")
  })


  d3.selectAll("svg").remove()

  // Create primary <g> element
  g = d3.select("#app").append("svg")
      .attrs({
          'width': width,
          'height': height
      })
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + 400 + ')');//(height / 2) + ')');

  // Data strucure
  var partition = d3.partition()
      .size([2 * Math.PI, radius]);

  // Find data root
  root = d3.hierarchy(nodeData)
      .sum(function (d) { return d.len }); //pasar a uno para hacerlo uniforme o d.len segun tamaño

  // Size arcs
  partition(root);

  const DATA = root.descendants().filter(l=>l.depth==3)

  var max_dwell = d3.max(DATA, l => l.data.dwell)
  var inner_radius = DATA[0]['y0']
  var last = DATA.length - 1
  var last_sentence = root.descendants().filter(l=>l.depth==1).length-1
  var max_radius = inner_radius - 20

  data_links = data_links.map((d, i) => {
    let source = DATA[d.source]
    let target = DATA[d.target]
    return {
      source: source,
      target: target,
      osource: d.source,
      otarget: d.target,
      offsource: d.offsource,
      offtarget: d.offtarget,
      dwellsource: d.dwellsource,
      dwelltarget: d.dwelltarget,
      pupilsource: d.pupilsource,
      pupiltarget: d.pupiltarget,
      amplitude: d.CURRENT_SAC_AMPLITUDE,
      angle: d.CURRENT_SAC_ANGLE,
      avg_velocity: d.CURRENT_SAC_AVG_VELOCITY,
      direction: d.CURRENT_SAC_DIRECTION,
      duration: d.CURRENT_SAC_DURATION,
      peak_velocity: d.CURRENT_SAC_PEAK_VELOCITY
    }
  })

  //Wrapper for the grid & axes
  var axisGrid = g.append("g").attr("class", "axisWrapper");
  
  //Draw the background circles
  axisGrid.selectAll(".levels")
      .data(d3.range(1,(5+1)).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", function(d, i){return (max_radius)/5*d;})
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", 0.1)
      .style("filter" , "black");

  //const min = d3.min(root.descendants().filter(l => l.depth == 3), l => l.data.dwell)
  //const max = d3.max(root.descendants().filter(l => l.depth == 3), l => l.data.dwell)

  
  //let [min_freq, max_freq] = d3.extent(root.descendants().filter(l => l.depth==3), l => l.data.freq_norm)
  // let scale_freqs = d3.scaleLog().domain([max_freq, 0.01])
  //   .range([d3.hcl('#f2f3f2').toString(), d3.hcl('#8b8c88').toString()])
  //   .clamp(true)

  let scale_freqs = d3.scaleLinear()
    .domain([70000, 20000, 200, 0])
    //.range(['white','#f0f0f0','#d9d9d9','#737373'])
    .range(['#ffffff', '#d9d9d9','#969696', '#636363'])
    .clamp(true)


  const Format = d3.format(".0f")

  //Text indicating at what % each level is
  g.selectAll(".axisLabel")
     .data([10, 100, 1000, 10000, 100000])
     .enter().append("text")
     .attr("class", "axisLabel")
     .attr("x", 0)
     .attr("y", function(d, i){return -(i+1)*max_radius/5;})
     .attr("dy", "1em")
     .attr("text-anchor", "middle")
     .style("font-size", "10px")
     .attr("fill", "#737373")
     .text(function(d) { return `${Format(d)} ms` });
  

  var arc = (e, last) => d3.arc()
      .startAngle(function (d) { d.x0s = d.x0; return d.x0})
      // add the offset to last word in sentence
      .endAngle(function (d) { d.x1s = d.x1; return e==last?d.x1-0.05:d.x1 })
      .innerRadius(function (d) { d.y0 = d.y0+50; d.y0s = d.y0; return d.y0 })
      .outerRadius(function (d) { d.y1s = d.y1; return d.y1 })
      .cornerRadius(5);

  var arc_sentence = (e, last) => d3.arc()
      .startAngle(function (d) { d.x0s = d.x0; return d.x0})
      // add the offset to last word in sentence
      .endAngle(function (d) { d.x1s = d.x1; return e==last?d.x1-0.05:d.x1 })
      .innerRadius(function (d) { return inner_radius+42 })
      .outerRadius(function (d) { return inner_radius+50 })
      .cornerRadius(5);
  
  var sections_sentences = g.selectAll(".sections_sentences")
    .data(root.descendants().filter(l => l.depth == 1))
    .enter()
    .append("path")
    .attrs({
      "d": (d, i) => arc_sentence(i, last_sentence)(d)
    })
    .styles({
      "stroke": "gray",
      "fill": function(d){
        let mean_freq_sentence = d3.mean(d.children[0].children, l => l.data.freq_norm)
        return scale_freqs(mean_freq_sentence)
      }
    })
    .on("dblclick", function(d, i){
      
      let idxs_words = d.children[0].children.map(function(d){
        return d.data.id
      })

      sections_sentences
        .style("stroke", (e, j) => j==i?"red":"gray")
        .style("stroke-width", (e, j) => j==i?2:1)

      transitions
        .style("opacity", function(e, j){
          let cond = (idxs_words.includes(e.osource) || idxs_words.includes(e.otarget))
          return cond?1:0.1
        })

      lines_starplot
        .style("stroke", (e, j) => idxs_words.includes(j)?"orange":"lightgray")

      plot_isp_sentence(d.children[0].children)
    })
    .on("click", function(d, i){
      sections_sentences.style("stroke", "gray").style("stroke-width", 1)
      transitions.style("opacity", 1)
      lines_starplot.style("stroke", "lightgray")
      d3.selectAll(".subshape").remove().exit()

    })

  /**
  *Esta función dibuja el starplot para el 
  *nivel de sentencias. El calculo debe hacerse de
  *manera difente con respecto a la selección de palabras
  */
  function plot_isp_sentence(words){

    let shape_data = words.map(function(d){
      return {
        "x": Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(max_radius)(d.data.dwell),
        "y": Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(max_radius)(d.data.dwell)
      }
    })

    shape_data.unshift({"x":0, "y":0})

    const sub_shape = g.selectAll("subshape")
      .data([1]) //TODO: why?
      .enter()
      .append("path")
      .attr("class", "subshape")
      .attrs({
        "d": line(shape_data),
        "stroke-width": 0.6,
        "stroke": "orange",
        "fill": "orange", //"#ffd7b5",
        "fill-opacity": 0.2, 
        "stroke-dasharray": ("3, 3")
      });

  }


  newSlice = g.selectAll('sections').data(root.descendants().filter(l => l.depth == 3)).enter();

  const texture = textures
    .lines()
    .strokeWidth(1)
    .stroke("purple")
    .thicker(2)

  newSlice.call(texture)

  const sections = newSlice
      .append('path')
      .attrs({
        "d": (d, i) => arc(i, last)(d),
        "class": "sentenceArc",
        "id": (d, i) => "sentenceArc_"+i
      })
      .styles({
        "stroke": "gray",
        "fill": d => d.data.dwell?scale_freqs(d.data.freq_norm): texture.stroke(scale_freqs(d.data.freq_norm)).url()
      })
      .on("dblclick",(d, i) => hdlClickLabel(d, i))
      .on("click", (d,i) => hdlDblClickLabel(d, i)) 
      // .on("mouseover", function(d,i){

      //   var tooltip = d3.select("#app")
      //     .append("div")
      //     .style("opacity", 0)
      //     .attr("class", "tooltip2")

      //   tooltip.html(`<strong>Word</strong> <br> 
      //       ${d.data.name} <br>
      //       Gaze Time: ${d.data.gaze_time} ms
      //       <hr>
      //       <strong>Frequency</strong><br>
      //       Absolute: ${d.data.freq_abs}<br>
      //       Normalized: ${d.data.freq_norm}<br>`)
      //     .style("opacity",1)
      //     .style("left", (d3.mouse(this)[0]+300)+"px")
      //     .style("top", (d3.mouse(this)[1]-600) + "px")
      // })
      // .on("mouseout", function(d, i){
      //   //tooltip.style("opacity", 0)
      //   d3.select(".tooltip2").remove()
      // })

  //Grafico donde es el cambio de linea
  g.selectAll('sections')
    .data(DATA).enter()
    .append("rect")
    .filter( l => l.data.break_line == true)
    .attrs({
      "class": "break_line",
      "x": d => Math.cos((d.x1-0.03) - Math.PI/2) * (d.y0-5),
      "y": d => Math.sin((d.x1-0.03) - Math.PI/2) * (d.y0-5),
      "width": 7,
      "height": 7,
      "fill": "black"
    })

  d3.select(".tooltip2").remove()

  const labels_sentences = g.selectAll('sections')
    .data(DATA).enter()
    .append("text")
    .attrs({
      "class": "sentenceText noselect",
      "dx": DATA.length<=35?2:0,
      "dy": 15,
      "font-size": DATA.length<=35?12:5,
      "font-weight": "bold",
      "font-family": "Courier New"
    })
    .append("textPath")
    .attrs({
      "startOffset": "10%",
      "xlink:href": (d, i) => "#sentenceArc_"+i
    })
    .text(function(d){if (d.depth==3) return d.data.name})
    .on("dblclick",(d, i) => hdlClickLabel(d, i))
    .on("click", (d,i) => hdlDblClickLabel(d, i)) 
    


  const hdlDblClickLabel = function(d, i){
    sections.style("stroke-width", 1).style("stroke", "gray")
    transitions.style("opacity", 1)
    lines_starplot.style("stroke", "lightgray").style("opacity", 1)
    d3.selectAll(".microstory a").style("border","white")
    d3.selectAll(".subshape").remove().exit()
  }


  const hdlClickLabel = function(d, i){

      let transitions_related = []
      let aois_related = new Set([])
        
      transitions
        .style("opacity", function(e, j){
          let cond = (e.osource == i || e.otarget == i)
          if (cond){ 
            aois_related.add(e.otarget);
            aois_related.add(e.osource); 
            transitions_related.push(e);
          }
          return cond?1:0.1
      })

      sections
        .style("stroke", function(e, j){
          if (aois_related.has(j))
            return j==i?"red": "#ea5564"
          else
            return "gray"
        })
        .style("stroke-width",function(e, j){
          if (aois_related.has(j))
            return j==i?"4px":"2px"
        })

      lines_starplot
        .style("stroke", (e, j) => aois_related.has(j)?"orange":"lightgray")
        .style("opacity", function(e, j){
          let [min, max] = [d3.min(Array.from(aois_related.values())), d3.max(Array.from(aois_related.values()))]
          return (j>= min && j <= max && !aois_related.has(j))?0:1
        })

      aois_related.forEach(j =>{
        //let color = j == i ? "gray": "lightgray"
        d3.select("#w"+j)
          .styles({
            //"background-color": color,
            "border": j==i?"solid red":"solid #ea5564",
            "border-width": j==i?"4px":"2px"
          })
      })

      plot_inner_sp(aois_related, transitions_related)
  }


  function plot_inner_sp(aois, transitions){

    var defaultDict = new Proxy({}, {
      get: (target, name) => name in target ? target[name] : 0
    })

    let i = 0;

    while (i < transitions.length){
      let t = transitions[i]
      if (i == 0) defaultDict[t.osource] += t.dwellsource;
      defaultDict[t.otarget] += t.dwelltarget;
      i++;
    }

    let shape_data = root.descendants()
      .filter(l => l.depth == 3)
      .filter(l => aois.has(l.data.id))
      .map(function(d){
        return {
          "x": Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(max_radius)(defaultDict[d.data.id]),
          "y": Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(max_radius)(defaultDict[d.data.id])
        }
      })

    shape_data = [{"x": 0, "y":0}].concat(shape_data) //concat a origin coord to start

    const sub_shape = g.selectAll("subshape")
      .data(shape_data) //TODO: why?
      .enter()
      .append("path")
      .attr("class", "subshape")
      .attrs({
        "d": line(shape_data),
        "stroke-width": 0.6,
        "stroke": "orange",
        "fill": "orange", //"#ffd7b5",
        "fill-opacity": 0.10, 
        "stroke-dasharray": ("3, 3")
      });
    }


  updateRoot()

  /**
    Grafica el starplot dentro del anillo
  */

  const lines_starplot = g.selectAll("lines")
    .data(root.descendants().filter(l => l.depth == 3))
    .enter().append("line")
    .attrs({
      "x1":0,
      "y1":0,
      "x2": d => Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * max_radius,
      "y2": d => Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * max_radius,
      "stroke": "lightgray"
    })
    .style("stroke-width", 0.5)

  const rScale = radius => d3.scaleLog()
    .range([0, radius])
    .domain([1, 100000])
    .clamp(true)

  const shape_data = radius => root.descendants().filter(l => l.depth == 3).map(function(d){

    return {
      "x": Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(radius)(d.data.dwell),
      "y": Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(radius)(d.data.dwell)
    }
  })

  const shape_data_final = shape_data(max_radius).concat({"x":0, "y":0})

  const line = d3.line()
    .curve(d3.curveLinearClosed)
    .x(function(d){return d.x})
    .y(function(d){return d.y})


  const shape = g.selectAll("shape1")
    .data([1]).enter()
    .append("path")
    .attrs({
      "d": line(shape_data_final),
      "stroke-width": 0.5,
      "stroke": "lightgray",
      "fill": "lightgray",
    })
    .style("fill-opacity", 0.6)



  const sentence_times = radius => root.descendants().filter(l => l.depth == 3).map(function(d, i){

    var v = d.data.sentence_time

    return {
      "x_cir": Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(radius)(v),
      "y_cir": Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(radius)(v),
      "x": d.x0 + (d.x1-d.x0)/2,//(d.x0+d.x1)/2 - Math.PI/2,
      "y": rScale(radius)(v)
    }
  })

  var annulus = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => 0)
    .outerRadius(d => rScale(max_radius)(d.sentence_time))


  root.descendants().filter(l => l.depth ==1).map(function(j){
    var aux = d3.sum(j.children[0].children.map(e => e.data.dwell))
    j.data.dwell = aux
  })

  var sdata = root.descendants()
    .filter(l => l.depth == 1)
    .map(function(l){
      
      let childrens = l.children[0].children
      let start = childrens[0]
      let end = childrens[childrens.length-1]

      return {
        "x0": start.x0 + (start.x1-start.x0)/2,
        "x1": end.x0 + (end.x1-end.x0)/2,
        "sentence_time": l.data.dwell
      }
    })

  var sentenceTime = g.selectAll("sentence")
    .data(sdata).enter()
    .append("path")
    .attrs({
      "d": annulus,
      "fill": "#8c004b",
      "stroke": "#8c004b",
      "fill-opacity": 0.1,
      "stroke-width": 0.1
    })
    .style("display", "none")



  let temp = data_links.map(l => [l.pupilsource, l.pupiltarget]).flat()

  const min_pupil = d3.min(temp);
  const max_pupil = d3.max(temp);

  const scaleColorPupil = d3.scaleLog()
      .range([d3.hcl('#fdf912').toString(), d3.hcl('#87D37C').darker().toString()])
      .domain([min_pupil,max_pupil])


  /**
  * Grafica del diagrama de transiciones a nivel de palabras
  */

  var offset = 4
  var change_level = false

  var curveFunc = d3.line()
    .curve(d3.curveBundle.beta(1))
    .x(function(d) { return d.x })
    .y(function(d) { return d.y })

  var line_trasitions = function (d, i){

      if (d.osource > d.otarget){
        offset += 4
        change_level = true
      }

      if ((d.osource <= d.otarget) && (change_level == true)){
        offset += 4
        change_level = false
      }

      var r = (d.source.y1) + offset

      const scaleOff = (e) => d3.scaleLinear()
        .range([e.x0, e.x1])
        .domain([-100, 100])

      sa = scaleOff(d.source)(d.offsource)
      ea = scaleOff(d.target)(d.offtarget)


      var delta = 0.01 //- Math.PI / 2
      

      let data = []
      var [start, end] = d.osource > d.otarget ? [ea, sa]:[sa, ea]

      while (start<=end) {

        let x = Math.cos(start - Math.PI/2) * (r)
        let y = Math.sin(start - Math.PI/2) * (r)

        data.push({"x": x, "y": y})

        start = start + delta
      }

      return curveFunc(data)
  }

  var scaleForwardTransitions = d3.scaleLinear()
      .domain([data_links.length-1, 0])
      .interpolate(d3.interpolateHsl)
      .range(["hsl(200, 30%, 45%)", "hsl(200, 70%, 80%)"])

  var scaleBackwardTransitions = d3.scaleLinear()
      .domain([data_links.length-1, 0])
      .interpolate(d3.interpolateHsl)
      .range(["hsl(0, 0%, 45%)", "hsl(0, 0%, 80%)"])

  var scaleIntraTransitions = d3.scaleLinear()
      .domain([data_links.length-1, 0])
      .interpolate(d3.interpolateHsl)
      .range(["hsl(147, 40%, 45%)", "hsl(147, 70%, 80%)"])


  const transitions = g
    .selectAll(".curvas")
    .data(data_links)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("class", "transition")
    .attr("stroke", function(d,i) {
      if (d.osource > d.otarget)
        return scaleBackwardTransitions(i)
      else if (d.osource < d.otarget)
        return scaleForwardTransitions(i)
      else
        return scaleIntraTransitions(i)
    })
    .attr("stroke-width", 3)
    .attr("d", (d, i) => line_trasitions(d, i))
    .on("dblclick", function(d, i){
      plot_by_transition(d)  
      d3.select("#w"+d.osource).style("border", "solid red")
      d3.select("#w"+d.otarget).style("border", "solid red")
    
      sections
        .style("stroke", (e, j) => (j==d.osource || j==d.otarget)?"red":"gray")
        .style("stroke-width",function(e, j){
          return (j==d.osource||j==d.otarget)?4:1
        })
      transitions
        .style("opacity", (e, j) => i==j?1:0.1)
      lines_starplot
        .style("stroke", e => (e === d.source || e === d.target)?"orange":"lightgray")
    })
    .on("click", function(d){
      transitions.style("opacity", 1);
      sections.style("stroke", "gray").style("stroke-width", 1);
      lines_starplot.style("stroke", "lightgray")
      d3.selectAll(".microstory a").style("border", "white")
      d3.selectAll(".subshape").remove().exit()
    })
    .on("mouseover", function(d, i){
      var tooltip = d3.select("#app")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip2")

      tooltip
        .html(`<strong>Transition</strong> <br> 
          ${d.source.data.name} &#8594; ${d.target.data.name} <br>
          <hr>
          Amplitude: ${d.amplitude}<br>
          Angle: ${d.angle}<br>
          Avg. Velocity: ${d.avg_velocity}<br>
          Peak Velocity: ${d.peak_velocity}<br>
          Direction: ${d.direction}<br>
          Duration: ${d.duration} ms<br>`)
        .style("opacity",1)
        .style("left", (d3.mouse(this)[0]+300)+"px")
        .style("top", (d3.mouse(this)[1]-600)+"px")
    })
    .on("mouseleave", function(d){
      d3.select(".tooltip2").remove()
    })


  function plot_by_transition(transition){

    const formatter = function (d, t){
      return {
        "x": Math.cos((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(max_radius)(t),
        "y": Math.sin((d.x0 + d.x1) / 2 - Math.PI / 2) * rScale(max_radius)(t)
      }
    }

    let shape_data = [
      {"x": 0, "y": 0},
      formatter(transition.source, transition.dwellsource),
      formatter(transition.target, transition.dwelltarget),
      {"x": 0, "y": 0}
    ]

    const sub_shape = g.selectAll("subshape")
      .data(shape_data)
      .enter()
      .append("path")
      .attr("class", "subshape")
      .attrs({
        "d": line(shape_data),
        "stroke-width": 0.6,
        "stroke": "orange",
        "fill": "orange",
        "fill-opacity": 0.1,
        "stroke-dasharray": ("3, 3")
      });
  }



 /**
  * Gráfica de pupila en el tiempo
  */

  var levels = data_links.filter(l => l.osource > l.otarget).length * 2 + 1
  var off = ((inner_radius+45) - (max_radius+10)) / levels
  offset = 5
  change_level = false

  var line_pupil = function (d, i, radius, off){

    if (d.osource > d.otarget){
      offset += off
      change_level = true
    }

    if ((d.osource <= d.otarget) && (change_level == true)){
      offset += off
      change_level = false
    }

    var r = (radius) + offset

    const scaleOff = (e) => d3.scaleLinear()
      .range([e.x0, e.x1])
      .domain([-100, 100])

    sa = scaleOff(d.source)(d.offsource)
    ea = scaleOff(d.target)(d.offtarget)


    var delta = 0.01 //- Math.PI / 2
    

    let data = []
    var [start, end] = d.osource > d.otarget ? [ea, sa]:[sa, ea]

    while (start<=end) {

      let x = Math.cos(start - Math.PI/2) * (r)
      let y = Math.sin(start - Math.PI/2) * (r)

      data.push({"x": x, "y": y})

      start = start + delta
    }

    return curveFunc(data)
  }

  const pupil_flow = g
    .selectAll(".pupilas")
    .data(data_links)
    .enter()
    .append("path")
    .attrs({
      "fill": "none",
      "stroke": function(d, i){
        
        [start, end] = [scaleColorPupil(d.pupilsource), scaleColorPupil(d.pupiltarget)]

        var gradient = g.append('defs')
          .append('linearGradient')
          .attr('id', 'gradient_'+i)

        gradient.append("stop")
          .attr("stop-color",d.osource>=d.otarget?start:end)
          .attr("offset", "0")

        gradient.append("stop")
          .attr("stop-color",d.osource>=d.otarget?end:start)
          .attr("offset", "1")

        return "url(#gradient_"+i+")";
      
      },
      "stroke-width": 2,
      "d": (d, i) => line_pupil(d, i, max_radius, off)
    })



  var draw_pupil_fix = (max_radius, off) => {

    offset = 5
    change_level = false

    pupil_flow.each(function(d, i){

      if (i == 0){
          if (d.osource > d.otarget){
            offset += off
            change_level = true 
          }
      }else{
        if (d.osource > d.otarget){
          offset += off
          change_level = true
          return 
        }

      }


      if ((d.osource <= d.otarget) && (change_level == true)){
        offset += off
        change_level = false
      }

      var r = (max_radius) + offset


      const scaleOff = (e) => d3.scaleLinear()
        .range([e.x0, e.x1])
        .domain([-100, 100])

      const formatter = (v, p) => (
        {
          "x": Math.cos(v - Math.PI/2) * (r),
          "y": Math.sin(v - Math.PI/2) * (r),
          "x1": Math.cos(v - Math.PI/2) * (inner_radius+50),
          "y1": Math.sin(v - Math.PI/2) * (inner_radius+50),
          "pupil": p
        }
      )

      //console.log(new Array(formatter(sa, d.pupilsource), formatter(ea, d.pupiltarget)))

      sa = scaleOff(d.source)(d.offsource)
      ea = scaleOff(d.target)(d.offtarget)
      g.selectAll("pupilcircles")
        .data(new Array(formatter(sa, d.pupilsource), formatter(ea, d.pupiltarget))).enter()
        .append("circle")
        .attrs({
          "class": "pupilcircles",
          "r": 5,
          "fill": e => scaleColorPupil(e.pupil)})
        .on("dblclick", function(e){
          g.selectAll("linesPupilWord")
          .data([e]).enter().append("line")
          .attrs({
            "class": "linePupilWord",
            "x1": e => e.x,
            "y1": e => e.y,
            "x2": e => e.x1,
            "y2": e => e.y1,
            "stroke": "black",
            "stroke-dasharray": ("3, 3")
          })
          .style("stroke-width", 0.5)
        })
        .on("click", function(e){
          d3.selectAll(".linePupilWord").remove().exit()
        })
        .on("mouseover", function(e,j){

          var tooltip = d3.select("#app")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip2")

          tooltip.html(`<strong>Fixation</strong> <br> 
             Duration: ${d.dwellsource} ms`)
            .style("opacity",1)
            .style("left", (d3.mouse(this)[0]+300)+"px")
            .style("top", (d3.mouse(this)[1]-600) + "px")
        })
        .on("mouseout", function(e){
          d3.select(".tooltip2").remove()
        })
        .transition()
        .duration(1000)
        .attrs({
          "cx": e => e.x,
          "cy": e => e.y
        })
    })
  }


  draw_pupil_fix(max_radius, off)

  /**
  * Vista del stimulus
  */

  d3.selectAll(".microstory p").remove()

  var selector = d3.select(".microstory")
  var paragraph;
  var new_lines = root.descendants().filter(l => l.depth==3)

  var idxs_lines = [];

  for (var i = 0; i < new_lines.length; i++) {
    if (new_lines[i].data.new_line == true) idxs_lines.push(i);
  }

  words = g.selectAll("palabras")
    .data(root.descendants().filter(l => l.depth==3))
    .enter()
    .each(function(e, j){

      if (idxs_lines.includes(j))
        paragraph = selector.append("p")

      paragraph
        .data([e])
        .append("a")
        .attr("id", "w"+j)
        .text(e.data.name+" ")
        .style("background-color", d => scale_freqs(d.data.freq_norm))
        .style("font-size", "12px")
        .on("mouseover", d => hdlClickLabel(d, j))
        .on("mouseleave", d => hdlDblClickLabel(d, j))

    })

  plot_colorbar(g, scaleColorPupil)
  plot_frequencies(g, scale_freqs)
  plot_legends(g)
  //plot_dwell(g, min, max)
  set_limits(data_links)

}



/**
 * Define callbacks for click events used in pagination
 */

var id = 1;
var subject = 1;


d3.select("#btnRight")
  .on("click",function(d){

    if (id == 15) id=0

    id++

    d3.select("#microlabel").text("Micro-story "+id)
    updateChart(id, subject)
  })


d3.select("#btnLeft")
  .on("click",function(d){

    id--
    
    if (id == 0) id=15


    d3.select("#microlabel").text("Micro-story "+id)
    
    updateChart(id, subject)
  })


d3.select("#btnRightp")
  .on("click",function(d){

    if (subject == 4) subject=0

    subject++

    d3.select("#subjectlabel").text("Participant "+subject)
    updateChart(id, subject)
  })


d3.select("#btnLeftp")
  .on("click",function(d){

    subject--
    
    if (subject == 0) subject=4


    d3.select("#subjectlabel").text("Participant "+subject)
    
    updateChart(id, subject)
  })


function updateChart(number=1, subject=1){

  Promise.all(
      [
        d3.json('data/P'+subject+'/micro'+number+'.json'), 
        d3.json('data/P'+subject+'/tmicro'+number+'.json'),
      ]).then(function(files){
        var nodeData = files[0]
        data_links = files[1]["wordlevel"]

        $(".filtros input").remove()
        $(".filtros .slider-container").remove()

        create_plot(nodeData, data_links)
      })
      // .catch(function(err){
      //    d3.selectAll("svg").remove()
      //    d3.selectAll(".microstory p").remove()
      //    Swal.fire({
      //      title: 'Note',
      //      icon: 'info',
      //      text: "This microstory was removed for analysis due to artifacts or errors."
      //   })
      // })
}

updateChart()

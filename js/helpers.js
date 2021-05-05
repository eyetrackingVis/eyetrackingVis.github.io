/**
 * Module to handle the filter panel for transitions
 * @author Leandro
 */

var state_filters_saccades = {}

function set_limits(data_links){

	const transitions = d3.selectAll(".transition")

    var features = ["amplitude", "duration", "avg_velocity", "peak_velocity", "angle"]

    features.forEach(function(d, i){

    	if (d=="angle")
    		$("."+d).append('<input type="hidden" id="flt_' +d +'" value="-180,180"/>')
    	else
    		$("."+d).append('<input type="hidden" id="flt_' +d +'" value="0,1000"/>')

    	var max = d3.max(data_links, l => l[d])
    	var min = d3.min(data_links, l => l[d])
   
		max = Math.ceil(max)
	    min = Math.floor(min)
	    step = max-min

		state_filters_saccades[d] = [min, max]

	    $("#flt_"+d).jRange({
		    from: min,
		    to: max,
		    step: 0.1,
		    scale: d3.range(min, max+step,step),
		    format: '%s',
		    width: 300,
		    showLabels: true,
		    isRange : true,
		    onstatechange: function(value){
				state_filters_saccades[d] = value.split(",")
		
		    	transitions
		    		.style("display", function(l){
						let filters_status = []
						for (f in state_filters_saccades){
							filters_status.push(((l[f]>=state_filters_saccades[f][0]) && (l[f]<=state_filters_saccades[f][1])))
						}
						return filters_status.every(e=>e==true)?null:"none"
					})
		    }
		});
    })
}


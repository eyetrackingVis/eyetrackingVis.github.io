


function set_limits(data_links){

	const transitions = d3.selectAll(".transition")


    var features = ["amplitude", "duration", "avg_velocity", "peak_velocity", "angle"]

    features.forEach(function(d, i){

    	let container_name = "."+d

    	if (d=="angle")
    		$("."+d).append('<input type="hidden" id="flt_' +d +'" value="-180,180"/>')
    	else
    		$("."+d).append('<input type="hidden" id="flt_' +d +'" value="0,1000"/>')

    	var max = d3.max(data_links, l => l[d])
    	var min = d3.min(data_links, l => l[d])
   
		max = Math.ceil(max)
	    min = Math.floor(min)
	    step = max-min

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
		    	var [min_l, max_l] = value.split(",")
		    	transitions
		    		.style("display", l => ((l[d]>=min_l) && (l[d]<=max_l))?null:"none")
		    }
		});

    })

   



}

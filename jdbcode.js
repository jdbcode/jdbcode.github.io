
//////////////////////////////////////////////////////////////////////////////////////
//alteration to the image zoom function
//http://www.dynamicdrive.com/dynamicindex4/powerzoomer.htm
jQuery(document).ready(function($){ //fire on DOM ready
	$('#brtnss-change-banner').addpowerzoom({
		defaultpower: 2.5,
		powerrange: null, //[2,5],
		largeimage: null,
		magnifiersize: [120,120]
	})
})


jQuery(document).ready(function($){ //fire on DOM ready
	$('.img-gallery-orig').addpowerzoom({
		defaultpower: 3,
		powerrange: null, //[2,5],
		largeimage: null,
		magnifiersize: [170,170]
	})
})

//////////////////////////////////////////////////////////////////////////////////////
//homepage scatter plot function
function scatter(){
	var scatter = [];
	for(i=0; i<10; i++){
		var x = Math.floor(Math.random()*100);
		var y = Math.floor(Math.random()*100);
		scatter.push([x,y]);
	}
	
	//var margin = {top: 10, right: 20, bottom: 25, left: 33};
	var margin = {top: 15, right: 20, bottom: 20, left: 20};
    
	var width = 356 - margin.left - margin.right,
		height = 200 - margin.top - margin.bottom;

	//define the scales
	var xscale = d3.scale.linear()
		.domain([-9,109])
		.range([margin.left, width+margin.left]);
	
	var yscale = d3.scale.linear()
		.domain([-9,109])
		.range([height+margin.top, margin.top]);
		
	//define the axis
	var xaxis = d3.svg.axis()
		.scale(xscale)
		.ticks(0)
		.orient("bottom");
	
	var yaxis = d3.svg.axis()
		.scale(yscale)
		.ticks(0)
		.orient("left");
	
	//append the svg element to the html body - set the svg width and height
	var svg = d3.select("#plot1")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("class", "plot-background");
	
	//create the circles that will go into the svg
	var circles = svg.selectAll("circle")
		.data(scatter)
		.enter()
		.append("circle")
		.attr("class","plot1circles")
		.style('fill-opacity', 0.1)
		.style('stroke-opacity', 0.1);
		
	circles
		.transition()
        .duration(1000)
        .style('fill-opacity', 1)
		.style('stroke-opacity', 1);
	
	//define the circle attributes		
	circles.attr("cx", function(d){return xscale(d[0]);})
		.attr("cy", function(d){return yscale(d[1]);})
		.attr("r", 9);
		
	//create the x axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0,"+(height+margin.top)+")")
		.call(xaxis);
		
	//Create the y axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+margin.left+",0)")
		.call(yaxis);	

	//On click, update with new data			
	d3.select("#plot1")
		.on("click", function(){
			for(i=0; i<10; i++){				
				var x = Math.floor(Math.random()*100);
				var y = Math.floor(Math.random()*100);
				scatter[i][0] = x;
				scatter[i][1] = y;
			}
			
			//Update the circles with new data
			svg.selectAll("circle")
				.data(scatter)					   
				.transition()
				.duration(1000)
				.attr("cx", function(d) {return xscale(d[0]);})
				.attr("cy", function(d) {return yscale(d[1]);})
			
			//Update X axis
			svg.select(".x.axis")
				.transition()
				.duration(1000)
				.call(xaxis);
			
			//Update y axis
			svg.select(".y.axis")
				.transition()
				.duration(1000)
				.call(yaxis);
				
	});	
};

//////////////////////////////////////////////////////////////////////////////////////
//homepage bar plot function
function bar(){
	var data = [];
	for(i=0;i<10;i++){
			var x = Math.floor(Math.random()*100);
			if(x === 0){x=10};
			data.push({"h":x});
		}
		
	var margin = {top: 15, right: 20, bottom: 20, left: 20};

	var width = 356 - margin.left - margin.right,
		height = 200 - margin.top - margin.bottom;

	var xscale = d3.scale.ordinal()
		.domain(d3.range(data.length))
		.rangeRoundBands([0, width], 0.15);

	var yscale = d3.scale.linear()
		.domain([0,100])
		.range([height, 0]);

	var xaxis = d3.svg.axis()
		.scale(xscale)
		.ticks(0)
		.orient("bottom");
	
	var yaxis = d3.svg.axis()
		.scale(yscale)
		.ticks(0)
		.orient("left");

	var svg = d3.select("#plot2")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("class", "plot-background")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		

	var bars = svg.selectAll("rect")
		.data(data)
		.enter()
		.append("rect")
		.attr("x", function(d, i){return xscale(i);})
		.attr("y", function(d){return yscale(d.h);})
		.attr("width", xscale.rangeBand())
		.attr("height", function(d) {return height - yscale(d.h);})
		.attr("class","plot2bars")
		.style("fill-opacity",0.1)
		.style("stroke-opacity",0.1);

	bars
		.transition()
		.duration(1000)
		.style("fill-opacity", 1)
		.style("stroke-opacity", 1);
		
	//create the x axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xaxis);
		
	//Create the y axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0,0)")
		.call(yaxis);
	
	//run the sort function when plot is clicked
	d3.select("#plot2")
		.on("click", function(){sortBars();});
	
	//Define sort order flag
	var sortOrder = false;
	
	//Define sort function
	var sortBars = function() {
		//Flip value of sortOrder
		sortOrder = !sortOrder;

		svg.selectAll("rect")
		   .sort(function(a, b) {
				if (sortOrder) {
					return d3.ascending(a.h, b.h);
				} else {
					return d3.descending(a.h, b.h);
				}
			})	
		   .transition()
		   .duration(1000)
		   .attr("x", function(d, i){return xscale(i);});
	};
};

//////////////////////////////////////////////////////////////////////////////////////
//homepage line plot function
function line(){
	//make data
	var x = [];
	var data = [];		
	var x1 = Math.ceil(Math.random()*10*-1*2); 
	for(i=-10;i<=10;i=i+0.3){x.push(i)}
	for(i=0;i<x.length;i++){
		var p = Math.pow(x[i],3);
		var y = (.2*p)+(x1*x[i]);
		data.push({"x":x[i],"y":y});
	};

	//get the mins and maxs
	var xmin = Math.min.apply(xmin, data.map(function(d){return d.x;}));
	var xmax = Math.max.apply(xmax, data.map(function(d){return d.x;}));
	var ymin = Math.min.apply(ymin, data.map(function(d){return d.y;}));
	var ymax = Math.max.apply(ymax, data.map(function(d){return d.y;}));

	//create the plot area		
	var margin = {top: 15, right: 20, bottom: 20, left: 20};

	var width = 356,
		height = 200;

	var svg = d3.select("#plot3")
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.attr("class", "plot-background");
	
	//create functions to scale the data
	var xscale = d3.scale.linear().domain([xmin, xmax]).range([margin.left, width-margin.right]);
	var yscale = d3.scale.linear().domain([ymin, ymax]).range([height-margin.bottom, margin.top]);

	//create the line data using the scales
	var line = d3.svg.line()
	  .x(function(d){ return xscale(d.x); })
	  .y(function(d){ return yscale(d.y); })
	  .interpolate("linear");

	//add the data to the plot
	var lines = svg.selectAll("line")
		.data(data)
		.enter()
		.append("path")
		.attr("d", line(data))
		.attr("class", "plot3line")
		.style("opacity", 0);

	lines
		.transition()
		.duration(4000)
		.style("opacity",1);
			
		
	//define the axis
	var xaxis = d3.svg.axis()
		.scale(xscale)
		.ticks(0)
		.orient("bottom");
	
	var yaxis = d3.svg.axis()
		.scale(yscale)
		.ticks(0)
		.orient("left");

	//create the x axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0," + (height-margin.bottom) + ")")
		.call(xaxis);
		
	//Create the y axis
	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+margin.left+",0)")
		.call(yaxis);
		
					//On click, update with new data			
	d3.select("#plot3")
		.on("click", function(){
			var x = [];
			var data = [];		
			var x1 = Math.ceil(Math.random()*10*-1*2); 
			for(i=-10;i<=10;i++){x.push(i)}
			for(i=0;i<x.length;i++){
				var p = Math.pow(x[i],3);
				var y = (.2*p)+(x1*x[i]);
				data.push({"x":x[i],"y":y});
			};

			//get the mins and maxs
			var xmin = Math.min.apply(xmin, data.map(function(d){return d.x;}));
			var xmax = Math.max.apply(xmax, data.map(function(d){return d.x;}));
			var ymin = Math.min.apply(ymin, data.map(function(d){return d.y;}));
			var ymax = Math.max.apply(ymax, data.map(function(d){return d.y;}));
			
			//create functions to scale the data
			xscale.domain([xmin, xmax]);
			yscale.domain([ymin, ymax]);
		

			//add the data to the plot
			svg.selectAll(".plot3line")
			   .transition()
				.duration(500)
				.attr("d", line(data));
		
	});
		
};

////////////////////////////////////////////////////////////////
//map creation
function world_map(lat,lon,element,width,height,scale){
	var coord = [{"lat":lat,"lon":lon}];

	var width = width;
		height = height;

	var projection = d3.geo.patterson()
		.scale(scale)
		.translate([width /2 , height / 2])
		.precision(.1);

	var path = d3.geo.path()
		.projection(projection);

	//var graticule = d3.geo.graticule();

	var svg = d3.select(element).append("svg") //#map1
		.attr("width", width)
		.attr("height", height);

	//svg.append("path")
	//	.datum(graticule)
	//	.attr("class", "graticule")
	//	.attr("d", path);

	d3.json("world-50m.json", function(error, world) {
		if (error) throw error;

		//land borders
		svg.insert("path", ".graticule")
			  .datum(topojson.feature(world, world.objects.land))
			  .attr("class", "land")
			  .attr("d", path);
		
		//country borders
		svg.insert("path", ".graticule")
			  .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
			  .attr("class", "boundary")
			  .attr("d", path);
		  
    svg.selectAll("circle")
		.data(coord)
		.enter()
		.append("circle")
		.attr("cx", function (d) { return projection([d.lon, d.lat])[0]; })  //projection(d)[0];
		.attr("cy", function (d) { return projection([d.lon, d.lat])[1]; })  //projection(d)[1]
		.attr("r", "4px")
		.attr("fill", "red");
		  
	});
	
	//d3.select(self.frameElement).style("height", height + "px");	
}


function initialize(lat,lon,element,zoom) {
	var mapProp = {
		center:new google.maps.LatLng(lat,lon), //47.4715437,-123.8498118
		zoom:zoom,
		mapTypeId:google.maps.MapTypeId.TERRAIN
	};
	var map=new google.maps.Map(document.getElementById(element),mapProp); //"googleMap"
}






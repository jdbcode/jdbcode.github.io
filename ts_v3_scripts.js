					
			//////////DEFINE GLOBAL VARIABLES/////////////////////////////////////////////////////////						
			var	specIndex = "TCW"; //default index to display - set again when a plot is clicked on
			var	rgbColor = [];
			var	allDataRGBcolor = [];
			var data = {"Values":[]};
			var allData = {"Values":[]};
			var n_chips = 0;
			var lastIndex = 0;
			var origData = [];
			//var projectList = [3000,3001,3002];
			var userID = 9;
			var projectID = "";
			var plotID = "";
			var selectedCircles = [];
			var lineDate = [];
			//var plotFormInfo = [];
			var vertInfo = [];
			var selectThese=[];
			var lineData = [];
			var chipstripwindow = null ;//keep track of whether the chipstrip window is open or not so it is not opened in multiple new window on each chip click
			var highLightColor = "#32CD32";
			var	activeRedSpecIndex = "TCB"; //default index to display - set again when a plot is clicked on
			var activeGreenSpecIndex = "TCG"; //default index to display - set again when a plot is clicked on
			var activeBlueSpecIndex = "TCW"; //default index to display - set again when a plot is clicked on
			var ylabel = "";
			var tsa = "999999";
			
			var chipInfo = {
				useThisChip:[],
				canvasIDs:[],
				imgIDs:[],
				sxOrig:[],
				syOrig:[],
				sWidthOrig:[],
				sxZoom:[],
				syZoom:[],
				sWidthZoom:[],
				chipsInStrip:[],
				year:[],
				julday:[],
				src:[]
			};
			
			var chipDisplayProps = {
				box: 1,
				boxZoom: 1,
				chipSize:195,
				halfChipSize:97.5,
				offset:30,
				canvasHeight:195, //212,
				zoomLevel:20,
				plotColor:"#ED2939"					
			};
						
			var	minZoom = 0;
			var	maxZoom = 40;
			var	stopZoom = 40;
			var	sAdj = [0];
			var	lwAdj = [chipDisplayProps.box];
			var	zoomIn = 0;
						
			
			
			var timeLapseIndex = 0;
			var playTL;
			var flickerTL;

			//DEFINE LOADING FUNCTIONS AND LISTENERS//
			function getData(url,specIndex,activeRedSpecIndex,activeGreenSpecIndex,activeBlueSpecIndex,ylabel){				
				$.getJSON(url).done(function(returnedData){ //origData
					origData = returnedData; //reset global
					n_chips = origData.length; //reset global 
					lastIndex = n_chips-1; //reset global
					data = {"Values":[]}; //reset global
					allData = {"Values":[]}; //reset global
					var yearList = [];					
					
					for(var i=0;i<n_chips;i++){
						data.Values.push({
							"Year":origData[i].image_year,
							"doy":origData[i].image_julday,
							"B1":parseInt(origData[i].b1.split("|")[12]),
							"B2":parseInt(origData[i].b2.split("|")[12]),
							"B3":parseInt(origData[i].b3.split("|")[12]),
							"B4":parseInt(origData[i].b4.split("|")[12]),
							"B5":parseInt(origData[i].b5.split("|")[12]),
							"B7":parseInt(origData[i].b7.split("|")[12])
						});
						yearList.push(origData[i].image_year)
					}
					data = calcIndices(data); //reset global - calculate the spectral indices
					rgbColor = scaledRGB(data, activeRedSpecIndex, activeGreenSpecIndex, activeBlueSpecIndex, stretch, 2, n_chips); //reset global - calculate the rbg color
					data = calcDecDate(data); //could wrap this into data appending push function
					
					var urlList = [];
					var count = [];
					for(var i=0;i<n_chips;i++){
						//urlList.push('http://timesync.forestry.oregonstate.edu/_y/data/'+projectID+'/999999/9/'+plotID+'/'+origData[i].image_year)		
						urlList.push('http://timesync.forestry.oregonstate.edu/_y/data/'+projectID+'/'+tsa+'/'+userID+'/'+plotID+'/'+origData[i].image_year)							
						count.push(0)
					}
					
					urlList.forEach(function(listItem,index){
						$.getJSON(listItem).done(function(returnedData){
							for(var d=0;d<returnedData.length;d++)
							allData.Values.push({
								"Year":returnedData[d].image_year,
								"doy":returnedData[d].image_julday,
								"B1":parseInt(returnedData[d].b1.split("|")[12]),
								"B2":parseInt(returnedData[d].b2.split("|")[12]),
								"B3":parseInt(returnedData[d].b3.split("|")[12]),
								"B4":parseInt(returnedData[d].b4.split("|")[12]),
								"B5":parseInt(returnedData[d].b5.split("|")[12]),
								"B7":parseInt(returnedData[d].b7.split("|")[12])
							});
							//make sure that all of the urls have been added to "allData" before getting the plot interps and plotting the points - need "selectThese" to be determined first - any other way and asynchronous loading will mess it up
							count[index] = 1//++;
							if (d3.sum(count) == n_chips){
								allData = calcIndices(allData); //reset global - calculate the spectral indices
								allDataRGBcolor = scaledRGB(allData, activeRedSpecIndex, activeGreenSpecIndex, activeBlueSpecIndex, stretch, 2, allData.Values.length); //reset global - calculate the rbg color
								allData = calcDecDate(allData); //could wrap this into data appending push function
								
								//get the plot interpretations					
								var url = 'http://timesync.forestry.oregonstate.edu/_y/index.php/vertex/'+projectID+'/'+tsa+'/'+plotID+'/'+userID 
								$.getJSON(url).done(function(vertices){
									console.log(vertices)
									console.log(yearList)
									yearList.indexOf()
									vertices.forEach(function(v) {
										vertInfo.push({
											year: v.image_year,
											julday: v.image_julday,
											index: yearList.indexOf(v.image_year),//idx,
											landUse: {
												dominant: v.dominant_landuse,
												notes: parseNote(v.other_landuse, 'landuse')
											},
											landCover: {
												dominant: v.dominant_landcover,
												other: parseNote(v.other_landcover, 'landcover')
											},
											changeProcess: {
												changeProcess: v.change_process,
												notes: parseNote(v.change_process_confidence, 'process')
											}
										});
									});
																	
									//check to see if vert info has been filled in for this plot
									if(vertInfo.length !=0){
										console.log("not equal to zero")
										for(var i=0;i<vertInfo.length;i++){
											selectThese.push(vertInfo[i].index); //reset global
										}
									} else{
										console.log("equal to zero")
										selectThese = [0,lastIndex]
										for(var i=0;i<selectThese.length;i++){
											vertInfo.push({year:origData[selectThese[i]].image_year,index:selectThese[i],landUse:{dominant:"",notes:{wetland:false,mining:false,rowCrop:false,orchardTreeFarm:false,vineyardsOtherWoody:false}},landCover:{dominant:"",other:{trees:false,shrubs:false,grassForbHerb:false,impervious:false,naturalBarren:false,snowIce:false,water:false}},changeProcess:{changeProcess:"",notes:{natural:false,prescribed:false,sitePrepFire:false,airphotoOnly:false,clearcut:false,thinning:false,flooding:false,reserviorLakeFlux:false,wetlandDrainage:false}}})
										}
									}		
																								
									//$(".segment").remove(); //reset the form
									//$(".vertex").remove(); //reset the form
									
									fillInForm() //fill out the form inputs					
									plotInt(); //draw the points
									appendSrcImg(); //append the src imgs
									appendChips("annual",selectThese); //append the chip div/canvas/img set
									
									//once the imgs have loaded make the chip info and draw the img to the canvas and display the time-lapse feature
									$("#img-gallery").imagesLoaded(function(){
										makeChipInfo("json", origData); //chip info array gets set in "appendChips" gets filled out here because we have to wait until the imgs have loaded to get their height (used when chip strip is the src - not needed when chips are singles)
										drawAllChips("annual");	//draw the imgs to the canvas	
										tlInt(); //draw the time-lapse img
										if ((expandedChipWindow != null) && expandedChipWindow.closed == false){
											var selectedColor = $("#selectedColor").prop("value");
											var pass_data = {
												"action":"init_chips", //hard assign
												"selectThese":selectThese, //selectThese, //"n_chips":"40", //get this from the img metadata
												"chipInfo":chipInfo,
												"n_chips":n_chips,
												"chipDisplayProps":chipDisplayProps,
												"selectedColor":selectedColor
											};
											expandedChipWindow.postMessage(JSON.stringify(pass_data),"*");	
										}
									});		
								});
								
								//plotInt(); //draw the points
							};
						});						
					});	
				});				
			}

		
			//function to populate the project list when #projectList element finishes loading
			function addProjectData(userID){
				var url = "http://timesync.forestry.oregonstate.edu/_y/project/"+userID //api for the project list query - get USERID from global var
				$.getJSON(url).done(function(object){
					for(var i=0;i<object.length;i++){$("#projectList").append('<li>'+object[i].project_id+'</li>')}
				});
			}

			
			
			//listener/action for when the body has loaded - append the projects to the projects list
			$("#projectList").load(addProjectData(userID=userID))

			//listener/action for when a project is clicked on - append plots to the plot list for that project
			$("body").on("click", "#projectList li", function(){
				appendPlots(projectID=$(this).text(), userID=userID, tsa=tsa)
			});
			
			
			//function to clear all plot elements in preparation for a new plot display - gets called when a new plot is selected or a new project is selected
			function clearThePlotDisplay(){
				$("#chip-gallery, #img-gallery, #svg").empty(); //reset
				$(".segment, .vertex").remove(); //empty the current vertex and segment forms
				tlctx.clearRect(0, 0, 235, 235); //reset
				timeLapseIndex = 0; //reset
				selectedCircles = []; //reset
				lineData = []; //reset
				selectThese = []; //reset	
			}	
			
			//function to load and append plots when a project is clicked on
			function appendPlots(projectID, userID, tsa){
				clearThePlotDisplay()
				$("#projBtn").empty().append(projectID+'<span class="caret projBtn"></span>');
				$("#plotList").empty();		
				var url = 'http://timesync.forestry.oregonstate.edu/_y/plot/'+projectID+'/'+tsa+'/'+userID
				$.getJSON(url).done(function(object){
					for(var i=0;i<object.length;i++){
						$("#plotList").append('<li class="">'+object[i].plotid+'</li>');	
						//plotFormInfo.push([]);
					}
					//$("#plotList li").eq(0).addClass("selected"); //commented out because we don't want to pre-select a plot - also it does not default to loading this defauly "selected" plot
				})				
			}
			
		
				
			//listener/action for plot selection - load the data for the selected plot
			$("body").on("click", "#plotList li", function(){				
				clearThePlotDisplay(); //remove all plot elements in prep for new plot
				var thisVertInfo = $("#plotList li").index($("#plotList li.selected"))
				//plotFormInfo[thisVertInfo] = vertInfo;
				
				$("#plotList li").removeClass("selected");
				$(this).addClass("selected");
				var index = $("#plotList li").index($(this));
				vertInfo = [] //plotFormInfo[index];
				plotID = $(this).text()
				var url = 'http://timesync.forestry.oregonstate.edu/_y/data/'+projectID+'/'+tsa+'/'+userID+'/'+plotID
				
				activeRedSpecIndex = $("#red-list li.active").attr('id');
				activeGreenSpecIndex = $("#green-list li.active").attr('id');
				activeBlueSpecIndex = $("#blue-list li.active").attr('id');
				specIndex = $("#index-list li.active").attr('id');
				ylabel = $("#"+specIndex).text() //check to see if this one needs to be passed to the getData function
							
				getData(url,specIndex,activeRedSpecIndex,activeGreenSpecIndex,activeBlueSpecIndex,ylabel)
				//var url = 'http://timesync.forestry.oregonstate.edu/_y/vertex/'+projectID+'/999999/'+plotID+'/'+userID

			});


			
			////////////////////////////////////////FROM YANG///////////////////////////////////////////////////////////////////////
			//Parse Land Use, Land Cover, and Change Process notes * @param note* @param category* @returns {*}

			function parseNote(note, category) {
				var landuseNote = {wetland:false, mining:false, rowCrop:false, orchardTreeFarm:false, vineyardsOtherWoody:false};
				var landcoverNote = {trees:false, shrubs:false, grassForbHerb:false, impervious:false, naturalBarren:false, snowIce:false, water:false};
				var processNote = {natural:false, prescribed:false, sitePrepFire:false, airphotoOnly:false, clearcut:false, thinning:false, flooding:false, reserviorLakeFlux:false, wetlandDrainage:false};

				var result = landuseNote;
				if (category == 'landcover') {
				result = landcoverNote;
				}
				else if (category == 'process') {
				result = processNote;
				}

				if (note.trim()=='') {
				return result;
				}

				var items = note.split("/");
				items.forEach(function(item) {
				result[item] = true;
				})
				return result;
			}

			//serialize Land Use, Land Cover, and Change process notes for database@param notes@returns {string}
			function serializeNote(notes) {
				var result = "";
				var idx = 0;
				for (var k in notes) {
					if (notes[k]) {
						if (idx++ > 0) {
							result += '/';
						}
						result += k;
					}
				}
				return result;
			}
			////////////////////////////////////////FROM YANG///////////////////////////////////////////////////////////////////////


//The following is a code snippet to convert server returned data into vertInfo structure
//vertices.forEach(function(v) {
//	vertInfo.push({
//		year: v.image_year,
//		julday: v.image_julday,
//		index: idx,
//		landUse: {
//			dominant: v.dominant_landuse,
//			notes: parseNote(v.other_landuse, 'landuse')
//		},
//		landCover: {
//			dominant: v.dominant_landcover,
//			other: parseNote(v.other_landcover, 'landcover')
//		},
//		changeProcess: {
//			changeProcess: v.change_process,
//			notes: parseNote(v.change_process_confidence, 'process')
//		}
//	});
//});
			
			
			
			
//{"vertex_id":165,
//"plotid":9,
//"image_year":1984,
//"image_julday":210,
//"dominant_landuse":"Forest",
//"dominant_landuse_over50":0,
//"other_landuse":"",
//"landuse_confidence":"",
//"dominant_landcover":"Shrub",
//"dominant_landcover_over50":0,
//"other_landcover":"Grass\/forb\/herb",
//"landcover_confidence":"",
//"landcover_ephemeral":0,
//"date_confidence":"",
//"change_process":"",
//"change_process_confidence":"",
//"comments":"null",
//"interpreter":12,
//"tsa":999999,
//"project_id":3000,
//"patch_size":0,
//"relative_magnitude":0
//}
			
			
			
//vertInfo[i].year = vertInfoStore[i].image_year
//vertInfo[i].index = ? get from year list
//vertInfo[i].landUse.dominant = vertInfoStore[i].dominant_landuse

//$.inArray["Grass/forb/herb"]

//			var vertInfo = {[{
//						year:0,
//						index:0,
//						landUse:{
//							dominant:"",
//							notes:{
//								wetland:false,
//								mining:false,
//								rowCrop:false,
//								orchardTreeFarm:false,
//								vineyardsOtherWoody:false
//							}
//						},
//						landCover:{
//							dominant:"",
//							other:{
//								trees:false,
//								shrubs:false,
//								grassForbHerb:false,
//								impervious:false,
//								naturalBarren:false,
//								snowIce:false,
//								water:false
//							}
//						},
//						changeProcess:{
//							changeProcess:"",
//							notes:{
//								natural:false,
//								prescribed:false,
//								sitePrepFire:false,
//								airphotoOnly:false,
//								clearcut:false,
//								thinning:false,
//								flooding:false,
//								reserviorLakeFlux:false,
//								wetlandDrainage:false
//							}
//						}					
//				}]}			
			
			
			
			
//////////////////////////////////////////////////////////////////////////////////////////////////////			
//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////D3 POINT AND LINE SCRIPTS////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////	
//////////////////////////////////////////////////////////////////////////////////////////////////////
	
			//define function to update the zoom behaviors
			function zoomUpdate() {
				xyzoom = d3.behavior.zoom()
					.y(yscale)
					.x(xscale)
					.on("zoom", zoomDraw);
				xzoom = d3.behavior.zoom()
					.x(xscale)
					.on("zoom", zoomDraw);
				yzoom = d3.behavior.zoom()
					.y(yscale)
					.on("zoom", zoomDraw);
				
				xybox.call(xyzoom).on("dblclick.zoom", null); //svg.
				xbox.call(xzoom).on("dblclick.zoom", null); //svg.
				ybox.call(yzoom).on("dblclick.zoom", null);	//svg.	 					
			}
			
			//define function to redraw the points and update the zoom behavior is invoked 
			function zoomDraw() {
				svg.select('.x.axis').call(xaxis);
				svg.select('.y.axis').call(yaxis);
				svg.selectAll("circle")
					.attr("cx", function(d){return xscale(d.decDate);})
					.attr("cy", function(d){return yscale(d[specIndex]);});
				//svg.selectAll("circle.data")
				//	.attr("cx", function(d){return xscale(d.decDate);})
				//	.attr("cy", function(d){return yscale(d[specIndex]);});
				//svg.selectAll("circle.allData")
				//	.attr("cx", function(d){return xscale(d.decDate);})
				//	.attr("cy", function(d){return yscale(d[specIndex]);});					
				svg.selectAll("#plotLine").attr("d", lineFunction(lineData));
				svg.selectAll(".vline")
					.attr("x1", function(d){return xscale(d.Year)})
					.attr("x2", function(d){return xscale(d.Year)})
				zoomUpdate();
			};
			
			//define function to initialize the spectral trajectory
			function plotInt(){
				//get the range of the x values
				var showPoints = $("#allPointsDisplayThumb").hasClass("glyphicon-thumbs-down");
				if(showPoints == false){
					var pointDisplay = "visible";
					var opacity = 0.5;
				} else {
					var pointDisplay = "hidden"
					var opacity = 1;
				}
				
				var w = $("#plot").width()
				$("#svg").attr("width",w)
				
				var yearmin = d3.min(data.Values, function(d) {return d.Year;}),
					yearmax = d3.max(data.Values, function(d) {return d.Year;});
				
				//adjust the ranges so there is some buffer
				var xmin = yearmin-1, //
					xmax = yearmax+1;
				
				//define the width of the svg plot area
				//var w = 740,// 
				var	h = 250; 
				
				//define the plot margins
				var pt = 10, //plot top
					pr = 15, //plot right
					pl = 65, //plot left
					pb = 28; //plot bottom 37
												
				//define the x scale
				xscale = d3.scale.linear() //NEEDS TO BE A GLOBAL VARIABLE - IS USED HERE AND IN THE UPDATE FUNCTION
					.domain([xmin, xmax])
					.range([pl, w - pr]);
				
				//define the y scale
				yscale = d3.scale.linear() //NEEDS TO BE A GLOBAL VARIABLE - IS USED HERE AND IN THE UPDATE FUNCTION
					.domain([domain[specIndex].min, domain[specIndex].max])
					.range([h - pb, pt]);
					
				//define the x axis
				xaxis = d3.svg.axis()
					.scale(xscale)
					.orient("bottom")
					.tickFormat(d3.format("d"));
				
				//define the x axis
				yaxis = d3.svg.axis() //NEEDS TO BE A GLOBAL VARIABLE - IS USED HERE AND IN THE UPDATE FUNCTION
					.scale(yscale)
					.orient("left");
				
				//define the zoom behavior
				xyzoom = d3.behavior.zoom()
					.y(yscale)
					.x(xscale)
					.on("zoom", zoomDraw); //zoomed
				xzoom = d3.behavior.zoom()
				  .x(xscale)
				  .on("zoom", zoomDraw);
				yzoom = d3.behavior.zoom()
				  .y(yscale)
				  .on("zoom", zoomDraw);				
				
				//retrieve the svg reference
				svg = d3.select("#svg"); 
				
				//make the default line data
				//lineData = [ //needs to be local variable
				//	{"x":yearmin ,"y":data.Values[0][specIndex]},
				//	{"x":yearmax ,"y":data.Values[len-1][specIndex]}
				//];

				//make the line function to convert the xy object to svg path syntax 
				lineFunction = d3.svg.line() //global because it gets used when selecting new points
					.x(function(d){return xscale(d.x);})
					.y(function(d){return yscale(d.y);})
					.interpolate("linear");

				//append an xy box
				xybox = svg.append("rect")
					.attr("class", "zoom xy box")
					.attr("id","xybox")
					.attr("x", pl) //70
					.attr("y", pt) //10
					.attr("width", w - pl - pr)
					.attr("height", h - pt - pb)
					.style("visibility", "hidden")
					.attr("pointer-events", "all")
					.call(xyzoom)
					.on("dblclick.zoom", null)

				var vline = svg.selectAll(".vline")
					.data(data.Values)
					.enter()
					.append("line")
					.attr("x1", function(d){return xscale(d.Year)})
					.attr("x2", function(d){return xscale(d.Year)})
					.attr("y1", function(d){return -20000})
					.attr("y2", function(d){return 20000})
					.attr("class","vline")	
					
				//append all the points
				allCircles = svg.selectAll(".allData")
					.data(allData.Values)
					.enter()
					.append("circle")
					//.style("fill-opacity",0.25) //0.25
					.attr("visibility",pointDisplay) //"hidden"
					.style("fill",function(d,i){
						//console.log(allDataRGBcolor[i]);
						return allDataRGBcolor[i];})
					.attr("cx", function(d){return xscale(d.decDate);}) //d.decDate
					.attr("cy", function(d){return yscale(d[specIndex]);})
					.attr("r", 3)
					.attr("class","allData");
				
				//append the representative points
				circles = svg.selectAll(".data")
					.data(data.Values)
					.enter()
					.append("circle")
					.style("fill-opacity",opacity)
					.style("fill",function(d,i){return rgbColor[i];})
					.attr("cx", function(d){return xscale(d.decDate);})
					.attr("cy", function(d){return yscale(d[specIndex]);})
					.attr("r", 9)
					.attr("class","data unselected");
				
				
				//draw the x axis
				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + (h - pb) + ")")
					.call(xaxis);
					
				//draw the y axis
				svg.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(" + pl + ",0)")
					.call(yaxis);
					
				//add label for the x axis
				svg.append("text")      
					.attr("transform", "rotate(-90)")
					.attr("x", (h-pb)/-2)
					.attr("y", 15)
					.style("text-anchor", "middle")
					.text(ylabel) //"TC Wetness"
					.attr("id","specPlotIndex");
				
				//define clip path so that circles don't go outside the axes
				svg.append("defs")
					.append("clipPath")
					  .attr("id", "clip")
					.append("rect")
					  .attr("x", 70)
					  .attr("y", 10)
					  .attr("width", w-pr-pl)
					  .attr("height", h-pb-pt);
					
				//append an x box
				xbox = svg.append("rect")
					.attr("class", "zoom x box")
					.attr("id","xbox")
					.attr("x", pl)
					.attr("y", h-pb)
					.attr("width", w - pl - pr)
					.attr("height", pb)
					.style("visibility", "hidden")
					.attr("pointer-events", "all")
					.call(xzoom)
					.on("dblclick.zoom", null) 
								
				//append a y box
				ybox = svg.append("rect")
					.attr("class", "zoom y box")
					.attr("id","ybox")
					.attr("y", pt)
					.attr("width", pl)
					.attr("height", h - pt - pb)
					.style("visibility", "hidden")
					.attr("pointer-events", "all")
					.call(yzoom)
					.on("dblclick.zoom", null)
					

															
				//default the first and last circles to class "selected"
				var dataCircles = $("circle.data");
				for(var i=0;i<selectThese.length;i++){
					dataCircles.eq(selectThese[i]).attr("class","data selected");
					lineData.push({"x":data.Values[selectThese[i]].decDate ,"y":data.Values[selectThese[i]][specIndex]}) //.Year
				}			
				
				//console.log(lineData);
				
				//add the default line
				var lineGraph = svg.append("path") //local because it will get overwritten
					.attr("d", lineFunction(lineData))
					//.style("stroke", $("#selectedColor").prop("value"))
					.attr("id","plotLine");
				
				//add the path to the circles to activate the clipping
				circles.attr("clip-path", "url(#clip)");
				allCircles.attr("clip-path", "url(#clip)");
				lineGraph.attr("clip-path", "url(#clip)");
				vline.attr("clip-path", "url(#clip)");
				
				
				//dataCircles.eq(0).attr("class","data selected");
				//dataCircles.eq(len-1).attr("class","data selected");
				
				//fill in the global selectedCircles variable for the first time
				var selectedCirclesTemp = $("circle.data.selected");
				for(var i=0; i < selectedCirclesTemp.length; i++){
					selectedCircles.push(dataCircles.index(selectedCirclesTemp[i]));
				}
				setSelectedColor(); //set the selected color of the line and the circles
				//updateSegmentForm();
			}
			
		
			//define function to update the D3 scatterplot when new selection are made
			function plotUpdate(data, specIndex, rgbColor, domain){
				//reset the y domain based on new spectral index
				yscale.domain([domain[specIndex].min, domain[specIndex].max]); //yscale was defined in the plotInt function
				
				//update the zoom since the y axis domain has changed
				zoomUpdate()
				
				//update the circles with new data
				svg.selectAll("circle.allData") //svg was defined in the plotInt function
					.data(allData.Values)					   
					.transition()
					.duration(500)
					//.attr("cx", function(d){return xscale(d.decDate);})
					.attr("cy", function(d){return yscale(d[specIndex]);})
					.style("fill",function(d,i){return allDataRGBcolor[i]})

				svg.selectAll("circle.data") //svg was defined in the plotInt function
					.data(data.Values)					   
					.transition()
					.duration(500)
					//.attr("cx", function(d){return xscale(d.decDate);})
					.attr("cy", function(d){return yscale(d[specIndex]);})
					.style("fill",function(d,i){return rgbColor[i]})

				//make a new line 
				for(var i=0; i < selectedCircles.length; i++){
					var thisone = selectedCircles[i];
					lineData[i] = ({"x":data.Values[thisone].decDate, "y":data.Values[thisone][specIndex]}); //.push
				}
				
				//update the line
				svg.selectAll("#plotLine") //local because it will get overwritten
					.transition()
					.duration(500)
					.attr("d", lineFunction(lineData));
					
				//update y axis
				svg.select(".y.axis") //svg was defined in the plotInt function
					.transition()
					.duration(500)
					.call(yaxis);
			}
	
			function updatePlotRGB(){
				svg.selectAll("circle.data") //svg was defined in the plotInt function					   
					.transition()
					.duration(500)
					.style("fill",function(d,i){return rgbColor[i]})
					
				svg.selectAll("circle.allData") //svg was defined in the plotInt function					   
					.transition()
					.duration(500)
					.style("fill",function(d,i){return allDataRGBcolor[i]})
			}

			function changePlotPoint(){
				svg.selectAll("circle.data") //svg was defined in the plotInt function
					.data(data.Values) //data value changed so need to rebind the data				   
					.transition()
					.duration(500)
					.attr("cx", function(d){return xscale(d.decDate);})
					.attr("cy", function(d){return yscale(d[specIndex]);})
					.style("fill",function(d,i){return rgbColor[i]})
				
				//make a new line in case the point is also a vertex
				for(var i=0; i < selectedCircles.length; i++){
					var thisone = selectedCircles[i];
					lineData[i] = ({"x":data.Values[thisone].decDate, "y":data.Values[thisone][specIndex]}); //.push
				}
				
				//update the line
				svg.selectAll("#plotLine") //local because it will get overwritten
					.transition()
					.duration(500)
					.attr("d", lineFunction(lineData));
			}
			
			
			//define function to add and remove line segments
			function changePlotLine(){
				var selectedCirclesTemp = $("circle.selected");
				lineData = [] //reset lineData
				selectedCircles = []; //reset selectedCircles
				for(var i=0; i < selectedCirclesTemp.length; i++){
					var thisone = $("circle.data").index(selectedCirclesTemp[i]);
					selectedCircles.push(thisone);
					lineData.push({"x":data.Values[thisone].decDate, "y":data.Values[thisone][specIndex]});
				}
				
				$("#plotLine").remove(); //remove the line
				
				lineGraph = svg.append("path") //redraw the line
					.attr("d", lineFunction(lineData))
					.attr("id","plotLine")
					.attr("clip-path", "url(#clip)");
				
				//updateSegmentForm();				
			}
	
//////////////////////////////////////////////////////////////////////////////////////////////////////	
//////////////////////////////////////////////////////////////////////////////////////////////////////	
//////////////////////////////////////////////////////////////////////////////////////////////////////	
	
	
			//define function to update the circle selection
			function changeSelectedClass(seriesIndex){
				var thisCircle = $("circle.data").eq(seriesIndex);
				var thisChipHolder = $(".chipHolder").eq(seriesIndex); //thisCanvas
				var status = thisCircle.attr("class");
				if(status == "data unselected"){ //add a vertex
					thisCircle.attr("class","data selected");
					thisChipHolder.addClass("selected");
					updateSegmentForm(seriesIndex,"add")
				} else { //remove a vertex
					thisCircle.attr("class","data unselected");
					thisCircle.css("stroke","none");
					thisChipHolder.removeClass("selected");
					thisChipHolder.css("border-color","white");
					updateSegmentForm(seriesIndex,"remove")
				}
				changePlotLine(); //update the plotline
				//updateSegmentForm(); //update the segment forms
				
				setSelectedColor();
				circleBorderColor = thisCircle.css("stroke");
				//circleBorderWidth = thisCircle.css("stroke-width");
				thisCircle.css({"stroke":highLightColor,"stroke-width":5}).attr("id","hover")
				thisChipHolder.addClass("hover")
				borderColor = thisChipHolder.css("borderTopColor");
				thisChipHolder.css({"borderTopColor":highLightColor,"borderRightColor":highLightColor,"borderBottomColor":highLightColor,"borderLeftColor":highLightColor,});				
			}

			//make the trajectory svg circles selectable
			$(document).on("dblclick", "circle.data, .chipHolder.annual", function(e){ //need to use this style event binding for elements that don't exisit yet - these lines will run before the "circle" elements are created, alternatively could use the commented lines in the above jquery section
				if($("tr").hasClass("active") == false){
					e.preventDefault(); //make sure that default browser behaviour is prevented
					var nodeType = $(this).prop('nodeName');
					if(nodeType == "circle"){
						var seriesIndex = $("circle.data").index(this);
					} else{
						var seriesIndex = $(".chipHolder").index(this);
					}
					if(seriesIndex != 0 &&  seriesIndex != lastIndex){changeSelectedClass(seriesIndex);}					
				}
			});

			
			$(document).on({	
				mouseenter: function(){
					var nodeType = $(this).prop('nodeName');
					if(nodeType == "circle"){
						var thisCircle = $(this);
						var thisIndex = $("circle.data").index(thisCircle)
						var thisChipHolder = $(".chipHolder.annual").eq(thisIndex)
					} else{
						var thisChipHolder = $(this); //store since it gets called multiple times
						var thisIndex = $(".chipHolder.annual").index(thisChipHolder) //get the index of the hovered .chipHolder.annual
						var thisCircle = $("circle.data").eq(thisIndex) //figure out what circle.data to highlight based on index of the hovered .chipHolder.annual
					}
					circleBorderColor = thisCircle.css("stroke"); //need to record the stroke so we know if the circle is selected or not - if selected there will be a stroke, if not stroke will be none
					circleBorderWidth = thisCircle.css("stroke-width"); //need to record the stroke width because it could be 2 or 5 depending on whether highlighting is turn on in the trajectory form
					thisCircle.css({"stroke":highLightColor,"stroke-width":5}).attr("id","hover"); //set the stroke and stroke-width of the circle 
					thisChipHolder.addClass("hover"); //add hover class to the .chipHolder.annual so we know which one to turn off on mouseleave - TODO: could just record the index instead of mess with DOM
					borderColor = thisChipHolder.css("borderTopColor"); //record the chipHolder border color so we can return it on mouseleave
					thisChipHolder.css({"borderTopColor":highLightColor,"borderRightColor":highLightColor,"borderBottomColor":highLightColor,"borderLeftColor":highLightColor,}); //ser the highlight border colors
				},
				mouseleave: function(){
					$("#hover").css({"stroke":circleBorderColor,"stroke-width":circleBorderWidth}).removeAttr("id");
					$(".hover").css({"borderTopColor":borderColor,"borderRightColor":borderColor,"borderBottomColor":borderColor,"borderLeftColor":borderColor,}).removeClass("hover");
				}
			},".chipHolder.annual, circle.data")
			
						
			//define function to return stretch color array by index
			function setcolor(data, specIndex, stretch, n_stdev, len) {
				var minv = stretch[specIndex].mean - (stretch[specIndex].stdev * n_stdev),
					maxv = stretch[specIndex].mean + (stretch[specIndex].stdev * n_stdev),
					color = [];
				for (var i=0; i < len; i++) {
					if (data.Values[i][specIndex] < minv) data.Values[i][specIndex] = minv;
					if (data.Values[i][specIndex] > maxv) data.Values[i][specIndex] = maxv;
					color[i] = ((data.Values[i][specIndex] - minv) / (maxv - minv)) * 256;
				}
				return color;
			}
			
			//define function to return scaled color arrays as RGB color
			function scaledRGB(data, RspecIndex, GspecIndex, BspecIndex, stretch, n_stdev, len){
				var colorR = setcolor(data, RspecIndex, stretch, n_stdev, len),
					colorG = setcolor(data, GspecIndex, stretch, n_stdev, len),
					colorB = setcolor(data, BspecIndex, stretch, n_stdev, len),
					color = [];
				for(var i=0;i<len;i++) {color[i] = d3.rgb(colorR[i],colorG[i],colorB[i]);}
				return color;
			}			
			
			//define function to calculate spectral indices from the raw band data
			function calcIndices(data){
				//define and initialize variables		
				var n_obj = data.Values.length, //this is already calc
					b1 = 0, 
					b2 = 0, 
					b3 = 0,
					b4 = 0,
					b5 = 0,
					b7 = 0,
					bcoef = [0.2043, 0.4158, 0.5524, 0.5741, 0.3124, 0.2303],
					gcoef = [-0.1603, -0.2819, -0.4934, 0.7940, -0.0002, -0.1446],
					wcoef = [0.0315, 0.2021, 0.3102, 0.1594,-0.6806, -0.6109],
					i = 0;
				
				//calculate indices and include them in the json object
				for(i; i<n_obj; i++){
					//pull out the values by band from json object so we don't have to deal with the long json text to 
					//call a value when calculating indices 
					b1 = data.Values[i].B1;
					b2 = data.Values[i].B2;
					b3 = data.Values[i].B3;
					b4 = data.Values[i].B4;
					b5 = data.Values[i].B5;
					b7 = data.Values[i].B7;
				
					//calculate indices
					data.Values[i]["TCB"]=(b1*bcoef[0])+(b2*bcoef[1])+(b3*bcoef[2])+(b4*bcoef[3])+(b5*bcoef[4])+(b7*bcoef[5]);		
					data.Values[i]["TCG"]=(b1*gcoef[0])+(b2*gcoef[1])+(b3*gcoef[2])+(b4*gcoef[3])+(b5*gcoef[4])+(b7*gcoef[5]);
					data.Values[i]["TCW"]=(b1*wcoef[0])+(b2*wcoef[1])+(b3*wcoef[2])+(b4*wcoef[3])+(b5*wcoef[4])+(b7*wcoef[5]);
					data.Values[i]["TCA"]=Math.atan(data.Values[i].TCG/data.Values[i].TCB) * (180/Math.PI) * 100;
					data.Values[i]["NBR"]=(b4-b7)/(b4+b7);
					data.Values[i]["NDVI"]=(b4-b3)/(b4+b3);
				}
				return data
			}
			

			//define function to determine if leap year
			function leapYear(year){
				return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
			}
			
			function calcDecDate(trajData){
				for(var i=0;i<trajData.Values.length;i++){
					var thisYear = trajData.Values[i].Year;
					if(leapYear(thisYear)){
						var n_days = 367
					} else{
						var n_days = 366
					}
					var decDate = thisYear + (trajData.Values[i].doy/n_days);
					trajData.Values[i]["decDate"] = decDate
				}
				return trajData
			}

			
			//update the plot when buttons are clicked		
			$(document).ready(function(){
				$(".specPlot li").click(function() { //This will attach the function to all the input elements					
					//figure out which dropdown was selected and change its active status 
					var thisLi = $(this);
					var thisListID = thisLi.closest("ul").attr('id'),
						thisSpecIndexID = thisLi.attr('id'),
						newactive = "#"+thisListID+" #"+thisSpecIndexID,
						activesearch = "#"+thisListID+" .active",
						activeid = $(activesearch).attr('id'),
						oldactive = "#"+thisListID+" #"+activeid;
						
					$(oldactive).removeClass('active');
					$(newactive).addClass('active');
					
					if(thisLi.parent().hasClass("rgb")){
						if(thisListID == "red-list"){$("#btnRed div").replaceWith('<div><strong>R</strong><small>GB</small><br><small>'+$("#"+thisSpecIndexID).text()+'</small><span class="caret specPlot"></span></div>')}
						else if(thisListID == "green-list"){$("#btnGreen div").replaceWith('<div><small>R</small><strong>G</strong><small>B</small><br><small>'+$("#"+thisSpecIndexID).text()+'</small><span class="caret specPlot"></span></div>')}
						else if(thisListID == "blue-list"){$("#btnBlue div").replaceWith('<div><small>RG</small><strong>B</strong><br><small>'+$("#"+thisSpecIndexID).text()+'</small><span class="caret specPlot"></span></div>')};
						
						var activeRedSpecIndex = $("#red-list li.active").attr('id'), //these could be global, they are retrieved again when a chip is replaced.
							activeGreenSpecIndex = $("#green-list li.active").attr('id'),
							activeBlueSpecIndex = $("#blue-list li.active").attr('id');
						rgbColor = scaledRGB(data, activeRedSpecIndex, activeGreenSpecIndex, activeBlueSpecIndex, stretch, 2, n_chips);
						allDataRGBcolor = scaledRGB(allData, activeRedSpecIndex, activeGreenSpecIndex, activeBlueSpecIndex, stretch, 2, allData.Values.length);
						updatePlotRGB();
					} else{
						$("#btnIndex div").replaceWith('<div><strong>Index:</strong><br><small>'+$("#"+thisSpecIndexID).text()+'</small><span class="caret specPlot"></span></div>');
						specIndex = $("#index-list li.active").attr('id')
						plotUpdate(data, specIndex, rgbColor, domain);
						$("#specPlotIndex").text($("#"+specIndex).text());
					}
				});
			});
			

			
			
			//mechanism to display the selected points and line in the trajectory plot
			$("#btnLine").click(function(){
				if ($("#lineDisplayThumb").attr("class") == "glyphicon glyphicon-thumbs-up"){
					$("#lineDisplayThumb").removeClass("glyphicon glyphicon-thumbs-up")
						.addClass("glyphicon glyphicon-thumbs-down");					
					$("circle.selected").css("stroke-opacity","0");
					$("circle.highlight").css("stroke-opacity","0");
					$("#plotLine").css("stroke-opacity","0");
				} else{
					$("#lineDisplayThumb").removeClass("glyphicon glyphicon-thumbs-down")
						.addClass("glyphicon glyphicon-thumbs-up");
					$("circle.selected").css("stroke-opacity","1");
					$("circle.highlight").css("stroke-opacity","1");
					$("#plotLine").css("stroke-opacity","1");
				}
			});

			//mechanism to display all points trajectory plot
			$("#btnPoints").click(function(){
				if ($("#allPointsDisplayThumb").attr("class") == "glyphicon glyphicon-thumbs-up"){
					$("#allPointsDisplayThumb").removeClass("glyphicon glyphicon-thumbs-up")
						.addClass("glyphicon glyphicon-thumbs-down");					
					$("circle.allData").attr("visibility","hidden");
					$("circle.data").css("fill-opacity","1");
				} else{
					$("#allPointsDisplayThumb").removeClass("glyphicon glyphicon-thumbs-down")
						.addClass("glyphicon glyphicon-thumbs-up");
					$("circle.allData").attr("visibility","visible");
					$("circle.data").css("fill-opacity","0.5");
				}
			});
			
			//mechanism to reset the plot zoom
			$("#btnReset").click(function(){
				xyzoom.scale(1);
				xzoom.scale(1);
				yzoom.scale(1);
				xybox.call(xyzoom).on("dblclick.zoom", null); //svg.
				xbox.call(xzoom).on("dblclick.zoom", null); //svg.
				ybox.call(yzoom).on("dblclick.zoom", null);	//svg.	
			});
			
			$("#highlightColor").change(function(){
				setHighlightColor();
			});
			
			$("#selectedColor").change(function(){
				setSelectedColor()
			});
			
			$("#plotColor").change(function(){
				chipDisplayProps.plotColor = $("#plotColor").prop("value")
				drawAllChips("annual")
			});
			
			function setHighlightColor(){
				//var color = $("#highlightColor").prop("value");
				highLightColor = $("#highlightColor").prop("value");
				$("circle.highlight").css({"stroke":highLightColor,"stroke-width":5});
				$(".chipHolder.highlight").css("border-color",highLightColor);
				$("tr.active").css("background-color",highLightColor);
			}
						
			function setSelectedColor(){
				var color = $("#selectedColor").prop("value");
				$("circle.selected").css("stroke",color);
				$("#plotLine").css("stroke",color);
				$(".chipHolder.selected").css("border-color",color);
			}

			
///////////////////////////////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS/////////////////////////////////////////////////////////////////
//////////////BELOW ARE LINE INFO FORM SCRIPTS////////////////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS//////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS/////////////////////////////////
////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS/////////////////////////////////BELOW ARE LINE INFO FORM SCRIPTS////			



////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
//GLOBAL VARIABLES//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////

//template vertInfo object which holds all the segment and vertice info			
//			var vertInfo = {[{
//						year:0,
//						index:0,
//						landUse:{
//							dominant:"",
//							notes:{
//								wetland:false,
//								mining:false,
//								rowCrop:false,
//								orchardTreeFarm:false,
//								vineyardsOtherWoody:false
//							}
//						},
//						landCover:{
//							dominant:"",
//							other:{
//								trees:false,
//								shrubs:false,
//								grassForbHerb:false,
//								impervious:false,
//								naturalBarren:false,
//								snowIce:false,
//								water:false
//							}
//						},
//						changeProcess:{
//							changeProcess:"",
//							notes:{
//								natural:false,
//								prescribed:false,
//								sitePrepFire:false,
//								airphotoOnly:false,
//								clearcut:false,
//								thinning:false,
//								flooding:false,
//								reserviorLakeFlux:false,
//								wetlandDrainage:false
//							}
//						}					
//				}]}

			

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
//EVENT LISTENERS///////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
			
			function saveVertInfo(vertInfo, userID, projectID, tsa, plotID){
				
				url = 
				$.post( "test.php", vertInfo);
			}
			
			
			//saves the form info to the server
			$("#saveBtn").click(saveVertInfo(vertInfo=vertInfo, userID=userID, projectID=projectID, tsa=tsa, plotID=plotID));
$("#saveBtn").click(function(){
	console.log("save button!!!")
	var vertInfoSave = {
                "vertInfo": vertInfo,   //array of objects – see below for the keys
                "projectID": projectID,   //integer
                "userID": userID,   //integer
                "plotID": plotID,   //integer
                "tsa":tsa   //integer
}
    console.log(vertInfoSave)
	
	console.log(JSON.stringify(vertInfoSave));
})

			
			//controls the trajectory form section tabs and tables 
			$("#segmentsFormTab").click(function(){	
				var status = $("#segmentsFormTab").attr("class");
				if(status == "unselected"){
					highlightOff();
					closeDropAndRecord();
					$("#CommentsFormTab, #verticesFormTab").attr("class","unselected");
					$("#CommentsFormDiv, #verticesFormDiv").hide();
					$("#segmentsFormTab").attr("class","selected").show();
					$("#segmentsFormDiv").show();
				}
			});
			$("#verticesFormTab").click(function(){				
				var status = $("#verticesFormTab").attr("class");
				if(status == "unselected"){
					highlightOff();
					closeDropAndRecord();
					$("#segmentsFormTab, #CommentsFormTab").attr("class","unselected");
					$("#segmentsFormDiv, #CommentsFormDiv").hide();
					$("#verticesFormTab").attr("class","selected").show();
					$("#verticesFormDiv").show();
				}
			});
			$("#CommentsFormTab").click(function(){				
				var status = $("#CommentsFormTab").attr("class");
				if(status == "unselected"){
					highlightOff();
					closeDropAndRecord();
					$("#segmentsFormTab, #verticesFormTab").attr("class","unselected");
					$("#segmentsFormDiv, #verticesFormDiv").hide();
					$("#CommentsFormTab").attr("class","selected").show();
					$("#CommentsFormDiv").show();
				}
			});
			

//INPUT DROP DOWNS AND HIGHLIGHTING CIRCLES PERTAINING TO THE SELECTED ROW//////////////////////
			$(document).on("click",".changeProcessInput", function(e){		//, .landUseInput, .landCoverInput,		
				highlightOff();
				closeDropAndRecord();								
				var thisInput = $(this);
				thisInput.addClass("active"); //set this <td> as active so we know which <td> to place the dropdown selection in
				thisInput.closest("tr").addClass("active"); //set this <tr> as active so it will be highlighted	
				$("#CPnotesList li").addClass("disabled").removeClass("selected") //reset the display
				dropInputLists(thisInput, "changeProcessDiv", -1, -1, 1);
				var thisOne = $("tr.segment .changeProcessInput").index(thisInput)+1;
				var selection = vertInfo[thisOne].changeProcess.changeProcess;
				$("#changeProcessList .selected").removeClass("selected");				
				appendCPnotes(selection);					
				changeNoteIcon("#CPnotesList", thisOne, "changeProcess");							
				highlightOn("segment", thisOne);
				e.stopPropagation(); //stop other actions from happening - what are the other actions??? - check
			});	

			$(document).on("click",".lulc", function(e){
				highlightOff();
				closeDropAndRecord();
				$("#LUnotesList li").addClass("disabled").removeClass("selected"); //reset the display
				$("#LCnotesList li").addClass("disabled").removeClass("selected"); //reset the display
				//var thisInput = ; //either lu or lc
				var thisInput = $(this);
				var thisRow = thisInput.closest("tr"); //which row
				var thisLU = thisRow.children(".landUseInput");
				var thisLC = thisRow.children(".landCoverInput");
				thisRow.addClass("active");
				thisLU.addClass("active");
				thisLC.addClass("active");
				
				var thisOne = $("tr.vertex").index(thisRow);		
				highlightOn("vertex", thisOne);
				
				$("#landUseList .selected").removeClass("selected");
				$("#landCoverList .selected").removeClass("selected");
				var LUselection = vertInfo[thisOne].landUse.dominant;
				var LCselection = vertInfo[thisOne].landCover.dominant;
				appendLUnotes(LUselection);
				appendLCnotes(LCselection);
				
				changeNoteIcon("#LUnotesList", thisOne, "landUse");
				changeNoteIcon("#LCnotesList", thisOne, "landCover");
				
				
				
				var luPos = thisLU.position();
				var lcPos = thisLC.position();
				var bottomTop = luPos.top;
				var bottomLeft = luPos.left;
				var bottomHeight = thisLU[0].getBoundingClientRect().height;
				var luWidth = thisLU[0].getBoundingClientRect().width;
				var lcWidth = thisLC[0].getBoundingClientRect().width;
				var bottomWidth = luWidth + lcWidth;
				var xAdj = -1;
				var yAdj = -1;
				var widthAdj = 1;
				
				$("#landUseDiv").css("width", parseFloat(luWidth)-6+"px"); //widthAdj+
				$("#landCoverDiv").css("width", parseFloat(lcWidth)-6+"px"); //widthAdj+

				$("#lulc").css({
					position: "absolute",
					top: (bottomTop+parseFloat(bottomHeight)+yAdj),
					left: bottomLeft+xAdj,
					width: (parseFloat(bottomWidth)+widthAdj+"px")
				}).show();				
			});

			
///////////////////////////////////////////////////////////////////////////////////////////////////

//DROP THE SELECTION LISTS ON CLICK///////////////////////////////////////////////////////////////////			
			$("#changeProcessSelection").click(function(e){			//, #landUseSelection, #landCoverSelection"
				var thisList = $(this).next("ul").attr("id")				
				$("#"+thisList).show();
				e.stopPropagation();
			});
////////////////////////////////////////////////////////////////////////////////////////////////////////
			
						
//DONE BUTTON EVENT HANDLERS////////////////////////////////////////////////////////////////////////////
			//when done buttons are clicked close their dropdown and record  the info in the inputs to the lineInfo object
			$(".doneBtn").click(function(){
				closeDropAndRecord();
			});
			
			
//MAKE SURE THAT FORM DROPS ARE CLOSED WHEN MOVING TO A NEW PLOT OR PROJECT
			
			//$("").click(function(){ //, #projBtn
			//$(document).on("click","#plotList li", function(){		 //, #LUnotesList li, #LCnotesList li	
			//	console.log("IM IN!")
			//	closeDropAndRecord();
			//});
//////////////////////////////////////////////////////////////////////////////////////////////////////////
			
			
//DISPLAY THE CONDITIONAL NOTES ONCE A CHANGE PROCESS HAS BEEN SELECTED/////////////////

			$("#changeProcessList li").click(function(){	//, #landUseList li, #landCoverList li					
				$("#CPnotesList li").addClass("disabled").removeClass("selected"); //reset display
				$("#changeProcessList li").removeClass("selected");
				//$(this).addClass("selected");
				var selection = $(this).text();	//get the text from the list selection that was clicked					
				$("td.active").text(selection);	 //place the text in the active td			
				appendCPnotes(selection);
			});
			
			$("#landUseList li").click(function(){						
				$("#LUnotesList li").addClass("disabled").removeClass("selected"); //reset display
				$("#landUseList li").removeClass("selected");
				//$(this).addClass("selected");
				var selection = $(this).text();	//get the text from the list selection that was clicked					
				$("td.landUseInput.active").text(selection);	 //place the text in the active td
				appendLUnotes(selection);
			});
		
			$("#landCoverList li").click(function(){						
				$("#LCnotesList li").addClass("disabled").removeClass("selected"); //reset display
				$("#landCoverList li").removeClass("selected");
				//$(this).addClass("selected");
				var selection = $(this).text();	//get the text from the list selection that was clicked					
				$("td.landCoverInput.active").text(selection);	 //place the text in the active td
				appendLCnotes(selection);
			});

			
			
			
/////////////////////////////////////////////////////////////////////////////////////////
			
			
//MAKE THE NOTE CHECKBOXES TOGGLE ON AND OFF AND SET THE "SELECTED" CLASS////////////////
			$(document).ready(function(){
				$(document).on("click","#CPnotesList li, #LUnotesList li, #LCnotesList li", function(){
					var selected = $(this);
					if(selected.hasClass("disabled") == false){
						if(selected.hasClass("selected")){
							selected.removeClass("selected");
							//$("span", this).replaceWith('<span class="glyphicon glyphicon-unchecked"></span> ');
						} else {
							selected.addClass("selected");
							//$("span", this).replaceWith('<span class="glyphicon glyphicon-ok"></span> ');
						}
					}
				});
			});			
//////////////////////////////////////////////////////////////////////////////////////////

			//highlight selected circles, canvases, and input row when the magnifying glass is clicked
			$(document).ready(function(){
				$(document).on("click","td.highlightIt", function(){
					var thisTr = $(this).closest("tr");
					if(thisTr.hasClass("active")){
						highlightOff();
						closeDropAndRecord();						
					} else {
						highlightOff();
						closeDropAndRecord();
						thisTr.addClass("active");
						if(thisTr.hasClass("segment")){
							thisOne = $("tr.segment").index(thisTr);
							highlightOn("segment", thisOne+1);
						} else {
							thisOne = $("tr.vertex").index(thisTr);
							highlightOn("vertex", thisOne);
						}
					}
				});
			});

////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
//UNIQUE FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

//APPEND NOTES TO THE NOTES DIV///////////////////////////////////////////////////////////////////	
			//change process
			function appendCPnotes(selection){					
				//$("#CPnotesList").empty();
				switch(selection){
					case "Fire":
						//$("#CPnotesList").append('<li class="natural">Natural</li><li class="prescribed">Prescribed</li><li class="sitePrepFire">Site-prep fire</li><li class="airphotoOnly">Airphoto only</li>');								
						$("#fire").addClass("selected");
						$(".forFire").removeClass("disabled");						
						break;
					case "Harvest":
						//$("#CPnotesList").append('<li class="clearcut">Clearcut</li><li class="thinning">Thinning</li><li class="sitePrepFire">Site-prep fire</li><li class="airphotoOnly">Airphoto only</li>');								
						$("#harvest").addClass("selected");
						$(".forHarvest").removeClass("disabled")
						break;
					case "Decline":
						//$("#CPnotesList").append('<li class="airphotoOnly">Airphoto only</li>');								
						$("#decline").addClass("selected");
						$(".forDecline").removeClass("disabled")
						break;
					case "Wind":
						//$("#CPnotesList").append('<li class="airphotoOnly">Airphoto only</li>');								
						$("#wind").addClass("selected");
						$(".forWind").removeClass("disabled")
						break;
					case "Hydrology":
						//$("#CPnotesList").append('<li class="flooding">Flooding</li><li class="reserviorLakeFlux">Reservoir/Lake flux</li><li class="airphotoOnly">Airphoto only</li>');								
						$("#hydro").addClass("selected");
						$(".forHydro").removeClass("disabled")
						break;
					case "Debris":
						//$("#CPnotesList").append('<li class="airphotoOnly">Airphoto only</li>');
						$("#debris").addClass("selected");
						$(".forDebris").removeClass("disabled")
						break;
					case "Growth":
						//$("#CPnotesList").append('<li class="airphotoOnly">Airphoto only</li>');								
						$("#growth").addClass("selected");
						$(".forGrowth").removeClass("disabled")
						break;
					case "Stable":
						//$("#CPnotesList").append('<li class="airphotoOnly">Airphoto only</li>');								
						$("#stable").addClass("selected");
						$(".forStable").removeClass("disabled")
						break;
					case "Conversion":
						//$("#CPnotesList").append('<li class="wetlandDrainage">Wetland drainage</li><li class="airphotoOnly">Airphoto only</li>');
						$("#conversion").addClass("selected");
						$(".forConserv").removeClass("disabled")
						break;
					case "Other":
						//$("#CPnotesList").append('<li class="airphotoOnly">Airphoto only</li>');
						$("#otherCP").addClass("selected");
						$(".forOther").removeClass("disabled")
						break;						
				}
			}
			
			//land use
			function appendLUnotes(selection){					
				switch(selection){
					case "Forest":
						//$("#LUnotesList").append('<li class="wetland">Wetland</li>');	
						$("#forest").addClass("selected");
						$(".forForest").removeClass("disabled")				
						break;
					case "Developed":
						//$("#LUnotesList").append('<li class="mining">Mining</li>');
						$("#developed").addClass("selected");
						$(".forDeveloped").removeClass("disabled")							
						break;
					case "Agriculture":
						//$("#LUnotesList").append('<li class="rowCrop">Row crop</li><li class="orchardTreeFarm">Orchard/Tree farm</li><li class="vineyardsOtherWoody">Vineyard/Other woody</li>');								
						$("#ag").addClass("selected");
						$(".forAg").removeClass("disabled")	
						break;						
					
					case "Non-forest Wetland":
						//$("#LUnotesList").append('<li class="wetland">Wetland</li>');	
						$("#nonForWet").addClass("selected");
						$(".forForest").removeClass("disabled")				
						break;
					case "Rangeland":
						//$("#LUnotesList").append('<li class="mining">Mining</li>');
						$("#rangeland").addClass("selected");
						$(".forDeveloped").removeClass("disabled")							
						break;
					case "Other":
						//$("#LUnotesList").append('<li class="rowCrop">Row crop</li><li class="orchardTreeFarm">Orchard/Tree farm</li><li class="vineyardsOtherWoody">Vineyard/Other woody</li>');								
						$("#otherLU").addClass("selected");
						$(".forAg").removeClass("disabled")	
						break;	
				}
			}
			
			//land cover
			function appendLCnotes(selection){					
				switch(selection){
					case "Trees":;	
						$("#treesLC").addClass("selected");
						$("#shrubs,#grassForbHerb,#impervious,#naturalBarren,#snowIce,#water").removeClass("disabled")				
						break;
					case "Shrubs":
						$("#shrubsLC").addClass("selected");
						$("#trees,#grassForbHerb,#impervious,#naturalBarren,#snowIce,#water").removeClass("disabled")								
						break;
					case "Grass/forb/herb":
						$("#gfhLC").addClass("selected");
						$("#trees,#shrubs,#impervious,#naturalBarren,#snowIce,#water").removeClass("disabled")	
						break;						
					case "Impervious":
						$("#imperviousLC").addClass("selected");
						$("#trees,#shrubs,#grassForbHerb,#naturalBarren,#snowIce,#water").removeClass("disabled")	
						break;
					case "Natural barren":
						$("#natBarLC").addClass("selected");
						$("#trees,#shrubs,#impervious,#grassForbHerb,#snowIce,#water").removeClass("disabled")
						break;
					case "Snow/ice":
						$("#snowIceLC").addClass("selected");
						$("#trees,#shrubs,#impervious,#naturalBarren,#grassForbHerb,#water").removeClass("disabled")	
						break;
					case "Water":
						$("#waterLC").addClass("selected");
						$("#trees,#shrubs,#impervious,#naturalBarren,#snowIce,#grassForbHerb").removeClass("disabled")	
						break;
				}
				
				
				
				
				//$("#LCnotesList").empty();
				//if(selection != ""){
					//$("#LCnotesList").append(
					//	'<li class="trees">Trees</li>'+
					//	'<li class="shrubs">Shrubs</li>'+
					//	'<li class="grassForbHerb">Grass/forb/herb</li>'+
					//	'<li class="impervious">Impervious</li>'+
					//	'<li class="naturalBarren">Natural/barren</li>'+
					//	'<li class="snowIce">Snow/ice</li>'+
					//	'<li class="water">Water</li>'
					//);
				//	$("#LCnotesList li").each(function(){
				//		var thisClass = $(this).text().trim();
				//		if(thisClass == selection){
				//			$(this).hide();
				//			return false
				//		}					
				//	});
				//}
			}
			
			
//DONE BUTTON FUNCTION TO CLOSE DROPDOWN MENUS AND RECORD INFO FROM THE FORM INPUTS TO THE LINEINFO OBJECT						
			function changeProcessDoneBtn(){
				$("#changeProcessDiv").hide();
				//$("#changeProcessList").hide();
				
				//remove the highlighted circle class - could find the highlighted class and only change that one (current implementation) or just reset all selected circles (commented out)
				highlightOff();
				
				//fill in the lineInfo object
				var thisOne = $(".changeProcessInput").index($(".changeProcessInput.active"))+1;
				var selection = $("td.changeProcessInput.active").text();
				
				vertInfo[thisOne].changeProcess.changeProcess = selection;		
				vertInfo[thisOne].changeProcess.notes.natural = $("#natural").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.prescribed = $("#prescribed").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.sitePrepFire = $("#sitePrepFire").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.airphotoOnly = $("#airphotoOnly").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.clearcut = $("#clearcut").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.thinning = $("#thinning").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.flooding = $("#flooding").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.reserviorLakeFlux = $("#reserviorLakeFlux").hasClass("selected")
				vertInfo[thisOne].changeProcess.notes.wetlandDrainage = $("#wetlandDrainage").hasClass("selected")
				$("#CPnotesList .selected").removeClass("selected");
				
				//switch(selection){
				//	case "Fire":
				//		fillInNotes("#CPnotesList .selected",thisOne,"natural","changeProcess");
				//		fillInNotes("#CPnotesList .selected",thisOne,"prescribed","changeProcess");
				//		fillInNotes("#CPnotesList .selected",thisOne,"sitePrepFire","changeProcess");
				//	break;
				//	case "Harvest":
				//		fillInNotes("#CPnotesList .selected",thisOne,"clearcut","changeProcess");
				//		fillInNotes("#CPnotesList .selected",thisOne,"thinning","changeProcess");
				//		fillInNotes("#CPnotesList .selected",thisOne,"sitePrepFire","changeProcess");						
				//	break;
				//	case "Decline":								
				//	break;
				//	case "Wind":								
				//	break;
				//	case "Hydrology":
				//		fillInNotes("#CPnotesList .selected",thisOne,"flooding","changeProcess");
				//		fillInNotes("#CPnotesList .selected",thisOne,"reserviorLakeFlux","changeProcess");											
				//	break;
				//	case "Debris":								
				//	break;
				//	case "Growth":							
				//	break;
				//	case "Stable":							
				//	break;
				//	case "Conversion":
				//		fillInNotes("#CPnotesList .selected",thisOne,"wetlandDrainage","changeProcess");						
				//	break;
				//	case "Other":
				//	break;						
				//}
				//fillInNotes("#CPnotesList .selected",thisOne,"airphotoOnly","changeProcess");
				//console.log(vertInfo)
			}
			
			//land use
			function landUseDoneBtn(){				
				//$("#landUseDiv").hide(); //hide the dropdown
				//$("#landUseList").hide();
				
				//remove the highlighted circle class - could find the highlighted class and only change that one (current implementation) or just reset all selected circles (commented out)				
				highlightOff();
				
				//fill in the lineInfo object
				var thisOne = $(".landUseInput").index($(".landUseInput.active"));
				var selection = $("td.landUseInput.active").text();
				
				vertInfo[thisOne].landUse.dominant = selection;			
				vertInfo[thisOne].landUse.notes.wetland = $("#wetland").hasClass("selected")
				vertInfo[thisOne].landUse.notes.mining = $("#mining").hasClass("selected")
				vertInfo[thisOne].landUse.notes.rowCrop = $("#rowCrop").hasClass("selected")
				vertInfo[thisOne].landUse.notes.orchardTreeFarm = $("#orchardTreeFarm").hasClass("selected")
				vertInfo[thisOne].landUse.notes.vineyardsOtherWoody = $("#vineyardsOtherWoody").hasClass("selected")
				$("#LUnotesList .selected").removeClass("selected");				
				
				//switch(selection){
				//	case "Forest":
				//		fillInNotes("#LUnotesList .selected",thisOne,"wetland","landUse");
				//	break;
				//	case "Developed":
				//		fillInNotes("#LUnotesList .selected",thisOne,"mining","landUse");
				//	
				//	break;
				//	case "Agriculture":								
				//		fillInNotes("#LUnotesList .selected",thisOne,"rowCrop","landUse");
				//		fillInNotes("#LUnotesList .selected",thisOne,"orchardTreeFarm","landUse");
				//		fillInNotes("#LUnotesList .selected",thisOne,"vineyardsOtherWoody","landUse");
				//	break;					
				//}				
			}
	
			//land cover
			function landCoverDoneBtn(){			
				//$("#landCoverDiv").hide(); //hide the dropdown
				//$("#landCoverList").hide();
				
				//remove the highlighted circle class - could find the highlighted class and only change that one (current implementation) or just reset all selected circles (commented out)				
				highlightOff();
			
				//fill in the lineInfo object
				var thisOne = $(".landCoverInput").index($(".landCoverInput.active"));
				var selection = $("td.landCoverInput.active").text();
				
				vertInfo[thisOne].landCover.dominant = selection;			
				
				vertInfo[thisOne].landCover.other.trees = $("#trees").hasClass("selected")
				vertInfo[thisOne].landCover.other.shrubs = $("#shrubs").hasClass("selected")
				vertInfo[thisOne].landCover.other.grassForbHerb = $("#grassForbHerb").hasClass("selected")
				vertInfo[thisOne].landCover.other.impervious = $("#impervious").hasClass("selected")
				vertInfo[thisOne].landCover.other.naturalBarren = $("#naturalBarren").hasClass("selected")
				vertInfo[thisOne].landCover.other.snowIce = $("#snowIce").hasClass("selected")
				vertInfo[thisOne].landCover.other.water = $("#water").hasClass("selected")
							
				//fillInNotes("#LCnotesList .selected",thisOne,"trees","landCover");
				//fillInNotes("#LCnotesList .selected",thisOne,"shrubs","landCover");
				//fillInNotes("#LCnotesList .selected",thisOne,"grassForbHerb","landCover");
				//fillInNotes("#LCnotesList .selected",thisOne,"impervious","landCover");
				//fillInNotes("#LCnotesList .selected",thisOne,"naturalBarren","landCover");
				//fillInNotes("#LCnotesList .selected",thisOne,"snowIce","landCover");
				//fillInNotes("#LCnotesList .selected",thisOne,"water","landCover");
				$("#LCnotesList .selected").removeClass("selected");
			}				
						
////////////////////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
//SHARED FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
			function fillInForm(){
				var len = selectThese.length
				//fill in segment form
				for(var i=0;i<len-1;i++){
					var yearStart = vertInfo[i].year 
					var yearEnd = vertInfo[i+1].year
					$("#segmentsFormTbl").append('<tr class="segment"><td class="highlightIt"><span class="glyphicon glyphicon-search"></span></td><td>'+yearStart+'</td><td>'+yearEnd+'</td><td class="changeProcessInput formDrop"></td></tr>');
					$(".changeProcessInput").eq(i).text(vertInfo[i+1].changeProcess.changeProcess)
				}
				//fill in vertex form
				for(i=0; i < len; i++){
					yearStart = vertInfo[i].year;
					$("#verticesFormTbl").append('<tr class="vertex"><td class="highlightIt"><span class="glyphicon glyphicon-search"></span></td><td>'+yearStart+'</td><td class="landUseInput formDrop lulc"></td><td class="landCoverInput formDrop lulc"></td></tr>');					
					$(".landUseInput").eq(i).text(vertInfo[i].landUse.dominant)
					$(".landCoverInput").eq(i).text(vertInfo[i].landCover.dominant)
				}	
			}
			

			//function to sync the segments form to the selected vertices
			function updateSegmentForm(seriesIndex, addRemove){
				if(addRemove == "add"){
					//figure out where to insert the new vertInfo object - compare the index of the selected year against those already selected and recorded in the vertInfo array
					for(var i=0;i<vertInfo.length;i++){
						if(vertInfo[i].index > seriesIndex){break} //where it breaks out is the index (i) to splice the new vertInfo object
					}
					
					//make a vertInfo object to splice into the vertInfo array
					var spliceVertInfo = {
						year:data.Values[seriesIndex].Year, //fill in for the selected point
						index:seriesIndex, //fill in for the selected point
						landUse:{
							dominant:"",
							notes:{
								wetland:false,
								mining:false,
								rowCrop:false,
								orchardTreeFarm:false,
								vineyardsOtherWoody:false
							}				
						},
						landCover:{
							dominant:"",
							other:{
								trees:false,
								shrubs:false,
								grassForbHerb:false,
								impervious:false,
								naturalBarren:false,
								snowIce:false,
								water:false
							}
						},
						changeProcess:{
							changeProcess:"",
							notes:{
								natural:false,
								prescribed:false,
								sitePrepFire:false,
								airphotoOnly:false,
								clearcut:false,
								thinning:false,
								flooding:false,
								reserviorLakeFlux:false,
								wetlandDrainage:false
							}
						}
					}
					
					vertInfo.splice(i,0,spliceVertInfo) //splice the new vertInfo object into the vertInfo array at the location found above (i)
					selectThese.splice(i,0,seriesIndex) //insert the seriesIndex in the "selectThese" array so that highlighting and form filling reflects the change

					
				} else if(addRemove == "remove"){ //remove a vertex
					var thisVertIndex = selectThese.indexOf(seriesIndex); //get the vertexInfo array index of the selected point
					vertInfo.splice(thisVertIndex, 1); //remove the vertInfo object at the index found one line above
					selectThese.splice(thisVertIndex,1); //remove the series index from the selectThese array at the index found one line above
				}
				
				$(".segment").remove(); //empty the current segment form
				$(".vertex").remove(); //empty the current vertex form
				fillInForm(); //append new forms and fill them in from the altered vertInfo array

				
				
				//vertInfo = [];
				//var yearStart = 0,
				//	yearEnd = 0,
				//	len = selectedCircles.length,
				//	startIndex = 0,
				//	endIndex = 0,
				//	i = 0;
				
				//make empty segment entries in the form
				//for(i; i < len-1; i++){
				//	startIndex = selectedCircles[i];
				//	endIndex = selectedCircles[i+1];
				//	yearStart = data.Values[startIndex].Year; //years[startIndex]  
				//	yearEnd =   data.Values[endIndex].Year; //years[endIndex];
				//	$("#segmentsFormTbl").append('<tr class="segment"><td class="highlightIt"><span class="glyphicon glyphicon-search"></span></td><td>'+yearStart+'</td><td>'+yearEnd+'</td><td class="changeProcessInput formDrop"></td></tr>');
				//}
				
				//make empty vertex entries
				//for(i=0; i < len; i++){
				//	startIndex = selectedCircles[i];
				//	yearStart = data.Values[startIndex].Year //years[startIndex];
				//	$("#verticesFormTbl").append('<tr class="vertex"><td class="highlightIt"><span class="glyphicon glyphicon-search"></span></td><td>'+yearStart+'</td><td class="landUseInput formDrop lulc"></td><td class="landCoverInput formDrop lulc"></td></tr>');
				//	vertInfo.push({
				//		year:yearStart,
				//		index:startIndex,
				//		landUse:{
				//			dominant:"",
				//			notes:{
				//				wetland:false,
				//				mining:false,
				//				rowCrop:false,
				//				orchardTreeFarm:false,
				//				vineyardsOtherWoody:false
				//			}
				//		
				//		},
				//		landCover:{
				//			dominant:"",
				//			other:{
				//				trees:false,
				//				shrubs:false,
				//				grassForbHerb:false,
				//				impervious:false,
				//				naturalBarren:false,
				//				snowIce:false,
				//				water:false
				//			}
				//		},
				//		changeProcess:{
				//			changeProcess:"",
				//			notes:{
				//				natural:false,
				//				prescribed:false,
				//				sitePrepFire:false,
				//				airphotoOnly:false,
				//				clearcut:false,
				//				thinning:false,
				//				flooding:false,
				//				reserviorLakeFlux:false,
				//				wetlandDrainage:false
				//			}
				//		}
				//	});					
				//}
			}	

			
			//function to show a dropdown for the land use and change process inputs
			function dropInputLists(thisInput, thisList, xAdj, yAdj, widthAdj){
				var rowPos = thisInput.position(),
					bottomTop = rowPos.top,
					bottomLeft = rowPos.left,
					bottomWidth = thisInput[0].getBoundingClientRect().width,
					bottomHeight = thisInput[0].getBoundingClientRect().height
					
				//drop its dropdown based on the position of the clicked element
				$("#"+thisList).css({
					position: "absolute",
					top: (bottomTop+parseFloat(bottomHeight)+yAdj),
					left: bottomLeft+xAdj,
					width: (parseFloat(bottomWidth)+widthAdj+"px")
				}).show();
			}
			
			//fill in note check box status in the lineInfo object when the done button is pressed
			//function fillInNotes(selector, thisOne, noteClass, inputType){
			//	noteClassSelected = $(selector).hasClass(noteClass);
			//	switch(inputType){
			//		case "landUse":
			//			if(noteClassSelected){
			//				vertInfo[thisOne].landUse.notes[noteClass] = true;
			//			} else {
			//				vertInfo[thisOne].landUse.notes[noteClass] = false;
			//			}	
			//		break;
			//		case "landCover":
			//			if(noteClassSelected){
			//				vertInfo[thisOne].landCover.other[noteClass] = true;
			//			} else {
			//				vertInfo[thisOne].landCover.other[noteClass] = false;
			//			}						
			//		break;
			//		case "changeProcess":
			//			if(noteClassSelected){
			//				vertInfo[thisOne].changeProcess.notes[noteClass] = true;
			//			} else {
			//				vertInfo[thisOne].changeProcess.notes[noteClass] = false;
			//			}
			//		break;
			//	}
			//}
			
			//function to change the note icon depending on whether the note is selected or not
			function changeNoteIcon(notesList, thisOne, inputType){
				theseLi = $(notesList+" li")
				theseLi.each(function(i){
					var thisLi = $(this)
					var noteClass = thisLi.attr("id");
					switch(inputType){
						case "landUse":
							noteNull = vertInfo[thisOne].landUse.notes[noteClass];
						break;
						case "landCover":
							noteNull = vertInfo[thisOne].landCover.other[noteClass];
						break;
						case "changeProcess":
							noteNull = vertInfo[thisOne].changeProcess.notes[noteClass];
						break;
					}

					//noteNull = lineInfo.segments[thisOne].notes[noteClass];
					if(noteNull == false){
						//thisLi.prepend('<span class="glyphicon glyphicon-unchecked"></span> ') //theseLi.eq(i)
					} else{
						//thisLi.removeClass("disables");
						//thisLi.prepend('<span class="glyphicon glyphicon-ok"></span> '); //theseLi.eq(i)
						thisLi.addClass("selected");
					}
				});
			}
			
			//turn highlighting off
			function highlightOff(){
				$("circle.data.highlight").attr("class","data selected").css({"stroke":highLightColor,"stroke-width":2});
				$(".chipHolder.highlight").addClass("selected").removeClass("highlight");							
				$("tr.active").removeClass("active").css("background-color","white"); //only needed when using the color options			
				$("circle").css("cursor","pointer");
				$(".chipImg").css("cursor","pointer");
				setSelectedColor();
			}
			
			//turn highlighting on
			function highlightOn(linePart, thisOne){
				switch(linePart){
					case "vertex":
						var thisIndex = vertInfo[thisOne].index;
						$("circle.data:eq("+thisIndex+")").attr("class","data highlight");
						$(".chipHolder:eq("+thisIndex+")").removeClass("selected").addClass("highlight");
					break;
					case "segment":
						var startIndex = vertInfo[thisOne-1].index; //pull out the start index for the selected row
						var endIndex = vertInfo[thisOne].index; //pull out the end index for the selected row
						$("circle.data:eq("+startIndex+")").attr("class","data highlight"); //highlight the start circle for the selected row (segment)
						$("circle.data:eq("+endIndex+")").attr("class","data highlight"); //highlight the end circle for the selected row (segment)
						$(".chipHolder:eq("+startIndex+")").removeClass("selected").addClass("highlight"); //highlight the start canvas for the selected row (segment)
						$(".chipHolder:eq("+endIndex+")").removeClass("selected").addClass("highlight"); //highlight the end canvas for the selected row (segment)
					break;
				}
				$("circle").css("cursor","not-allowed");
				$(".chipImg").css("cursor","not-allowed");
				setHighlightColor(); //only needed when using the color options	
			}
			
			//figure out which dropdown to close and what info to record
			function closeDropAndRecord(){
				var tdActive = $("td.active");
				if(tdActive.hasClass("changeProcessInput")){
					changeProcessDoneBtn();	
				} else if(tdActive.hasClass("lulc")){ //landUseInput
					$("#lulc").hide();
					landUseDoneBtn();
					landCoverDoneBtn();
				} //else if(tdActive.hasClass("landCoverInput")){
					//landCoverDoneBtn();
				//}
				tdActive.removeClass("active");
			}
/////////////////////////////////////////////////////////////////////////////////////////
			
			
			
			
			
///////////////////////////////////////////////////////BELOW ARE CHIP SCRIPTS///////////////////////////////////////////////////////
//////////////BELOW ARE CHIP SCRIPTS////////////////////////////////////////BELOW ARE CHIP SCRIPTS//////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////BELOW ARE CHIP SCRIPTS//////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////BELOW ARE CHIP SCRIPTS///////////////////////
////////////////////////////BELOW ARE CHIP SCRIPTS//////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////BELOW ARE CHIP SCRIPTS/////////////////////////////////BELOW ARE CHIP SCRIPTS////
		
			///////////////SET GLOBAL VARIABLES//////////////////////////////////////////////////////////
			
			//var images = [
			//	"chips/test_chip_1985.png",
			//	"chips/test_chip_1986.png",
			//	"chips/test_chip_1987.png",
			//	"chips/test_chip_1988.png",
			//	"chips/test_chip_1989.png",
			//	"chips/test_chip_1990.png",
			//	"chips/test_chip_1991.png",
			//	"chips/test_chip_1992.png",
			//	"chips/test_chip_1993.png",
			//	"chips/test_chip_1994.png",
			//	"chips/test_chip_1995.png",
			//	"chips/test_chip_1996.png",
			//	"chips/test_chip_1997.png",
			//	"chips/test_chip_1998.png",
			//	"chips/test_chip_1999.png",
			//	"chips/test_chip_2000.png",
			//	"chips/test_chip_2001.png",
			//	"chips/test_chip_2002.png",
			//	"chips/test_chip_2003.png",
			//	"chips/test_chip_2004.png",
			//	"chips/test_chip_2005.png",
			//	"chips/test_chip_2006.png",
			//	"chips/test_chip_2007.png",
			//	"chips/test_chip_2008.png",
			//	"chips/test_chip_2009.png",
			//	"chips/test_chip_2010.png",
			//	"chips/test_chip_2011.png",
			//	"chips/test_chip_2012.png",
			//	"chips/test_chip_2013.png",
			//	"chips/test_chip_2014.png"
			//];
			//var years = [];
			//for(var i=0;i<images.length;i++){years.push(1985+i)}
			


			



			

			

			///////////PLOT SIZE CHANGE///////////////////////////////////////////////////////////////////////////////			
			$("#plotSize").change(function(){
				var plotSizeObject = $("#plotSize"),
					plotSize = parseInt(plotSizeObject.prop("value"));
				if((plotSize % 2) == 0){plotSize += 1}
				plotSize = Math.min(plotSize,5);
				plotSize = Math.max(plotSize,1);
				plotSizeObject.prop("value",plotSize);	
				//chipInfo.box = Math.sqrt(plotSize);
				chipDisplayProps.box = plotSize;
				$("#plotSizeList").hide();
				switch(chipDisplayProps.box){
					case 1:
						stopZoom = 40;
					break;
					case 3:
						stopZoom = 32;
					break;
					case 5:
						stopZoom = 27;
					break;
				}
				updateChipInfo();
				drawAllChips("annual");	
				var message = {"action":"plotSize","chipDisplayProps":chipDisplayProps} //prepare zoom message
				
				if ((chipstripwindow != null) && chipstripwindow.closed == false){					
					chipstripwindow.postMessage(JSON.stringify(message),"*");	
				}
				if ((expandedChipWindow != null) && expandedChipWindow.closed == false){
					expandedChipWindow.postMessage(JSON.stringify(message),"*");	
				}
			});
						
			///////////CHIP SIZE CHANGE///////////////////////////////////////////////////////////////////////////////
			$("#chipSize").change(function(){
				var chipSizeObject = $("#chipSize");
				var	chipSize = parseInt(chipSizeObject.prop("value"));
				if((chipSize % 2) == 0){chipSize += 1}
				chipSize = Math.min(chipSize,255);
				chipSize = Math.max(chipSize,135);
				chipSizeObject.prop("value",chipSize);
				
				//redraw the canvases and img chips
				chipDisplayProps.chipSize = chipSize;
				chipDisplayProps.halfChipSize = chipSize/2;
				chipDisplayProps.offset = (255 - chipSize)/2;
				chipDisplayProps.canvasHeight = chipSize//+17;

				$(".chipHolder").remove();
				appendChips("annual", selectThese);
				updateChipInfo();
				drawAllChips("annual");	
				var message = {"action":"chipSize","chipDisplayProps":chipDisplayProps} //prepare zoom message
				
				//send the zoom message
				if ((chipstripwindow != null) && chipstripwindow.closed == false){
					chipstripwindow.postMessage(JSON.stringify(message),"*");	
				}
				if ((expandedChipWindow != null) && expandedChipWindow.closed == false){
					expandedChipWindow.postMessage(JSON.stringify(message),"*");	
				}
				
			});
			
			///////////ZOOM SLIDER CHANGE///////////////////////////////////////////////////////////////////////////////
			$("#zoomSize").change(function(){
				var zoomSizeObject = $("#zoomSize"),
					zoomSize = parseInt(zoomSizeObject.val());
					if (zoomSize > stopZoom){zoomSize = stopZoom}
					if (zoomSize < minZoom){zoomSize = minZoom}
					chipDisplayProps.zoomLevel = zoomSize;
	
					drawAllChips("annual"); //redraw the chips with the new zoom

					zoomInfo = {
						"action":"zoom",
						//"zoomLevel":chipDisplayProps.zoomLevel,
						"chipDisplayProps":chipDisplayProps
					}
					
					//send the zoom array to the external window
					if ((chipstripwindow != null) && chipstripwindow.closed == false){ 
						chipstripwindow.postMessage(JSON.stringify(zoomInfo),"*");
					}
					if ((expandedChipWindow != null) && expandedChipWindow.closed == false){
						expandedChipWindow.postMessage(JSON.stringify(zoomInfo),"*");	
					}					
			});
			

			
			
			
			///////////DEFINE THE FUNCTION TO ADD THE CANVAS AND IMAGE FOR EACH CHIP ON-THE-FLY////////////
			function appendSrcImg(){
				for(var i=0;i<n_chips;i++){
					chipInfo.imgIDs[i] = ("img"+i);
					var appendThisImg = '<img class="chipImgSrc" id="'+chipInfo.imgIDs[i]+'"src="'+origData[i].url+'">';
					$("#img-gallery").append(appendThisImg);
				}
			}
			
			function appendChips(window, selected, color){ //this function is handling the appending of the main chips and the remote chips, though it might be better to separate them
					for(var i=0; i<n_chips; i++){
						chipInfo.canvasIDs[i] = ("chip"+i);						
						var appendThisCanvas = '<div id="'+chipInfo.canvasIDs[i]+'" class="chipHolder">'+
									'<canvas class="chipImg" width="'+chipDisplayProps.chipSize+'" height="'+chipDisplayProps.canvasHeight+'"></canvas>'+
									'<div class="chipDate">&nbsp;</div>'+ //'<span class="glyphicon glyphicon-new-window expandChipYear" aria-hidden="true" style="float:right; margin-right:5px"></span>'+
								'</div>';
						$("#chip-gallery").append(appendThisCanvas);						
					}
				if(window == "annual"){
					$(".chipHolder, .chipImg, .chipImgSrc").addClass("annual")
					for(var i=0;i<selected.length;i++){$(".chipHolder").eq(selected[i]).addClass("selected");}
					setSelectedColor()						
				} else if(window == "intraAnnual"){
					$(".chipHolder, .chipImg, .chipImgSrc").addClass("intraAnnual")
					for(var i=0;i<selected.length;i++){$(".chipHolder").eq(selected[i]).addClass("selected");}
				}
		
			}
	
	
	
			
			////////////////DEFINE FUNCTION TO INITIALLY POPULATE CHIPINFO OBJECT/////////////////////////////////////
			function makeChipInfo(selection, origData){
				for(var i=0; i < n_chips; i++){					
					var thisimg = document.getElementById(chipInfo.imgIDs[i]);
					var	thisManyChips = thisimg.naturalHeight/255; 
					if(selection == "random"){
						//randomly select a chip from a strip to display - not needed once we have json file to tell us
						var useThisChip = Math.floor((Math.random() * thisManyChips)); 
					} else if(selection == "ordered"){
						var useThisChip = i;						
					} else if(selection == "json"){
						var useThisChip = 0;
						var year = origData[i].image_year
						var julday = origData[i].image_julday
						var src = origData[i].url
					}
					//define/store some other info needed for zooming
					//chipInfo.chipsInStrip.push(thisManyChips);
					//chipInfo.useThisChip.push(useThisChip);
					//chipInfo.year.push(year);
					//chipInfo.julday.push(julday);
					//chipInfo.src.push(src);	
					
					chipInfo.chipsInStrip[i] = thisManyChips;
					chipInfo.useThisChip[i] = useThisChip;
					chipInfo.year[i] = year;
					chipInfo.julday[i] = julday;
					chipInfo.src[i] = src;	


					
				}				
				updateChipInfo();
			}
			
			
			////////////////DEFINE FUNCTION TO UPDATE THE CHIPINFO OBJECT WHEN A NEW CHIP SIZE IS SELECTED////////////
			function updateChipInfo(){
				for(var i=0; i < n_chips; i++){										
					//define/store some other info needed for zooming
					chipInfo.sxOrig[i] = chipDisplayProps.offset;	//0 chipInfo.offset set/push the original source x offset to the sxOrig array
					chipInfo.syOrig[i] = (255*chipInfo.useThisChip[i])+chipDisplayProps.offset; // +chipInfo.offset   set/push the original source y offset to the syOrig array
					chipInfo.sWidthOrig[i] = chipDisplayProps.chipSize; //255  set/push the original source x width to the sWidthOrig array
					chipInfo.sxZoom[i] = chipInfo.sxOrig[i];
					chipInfo.syZoom[i] = chipInfo.syOrig[i];
					chipInfo.sWidthZoom[i] = chipInfo.sWidthOrig[i];					
				}
				
				var starter = chipDisplayProps.halfChipSize,
					lwstarter = chipDisplayProps.box;
				
				//console.log(sAdj);
				for(var i=1; i<maxZoom+1; i++){
					starter *= 0.9 
					sAdj[i] = (chipDisplayProps.halfChipSize-starter);
					lwstarter /= 0.9;
					lwAdj[i] = lwstarter;
				}
			}
						
			
			/////////////////////////////////////////////////////////////////////////////////////////////////////
			/////////////////////////////////////////////////////////////////////////////////////////////////////


			function tlPlay(){
				var tlImgID = $(".chipImgSrc").eq(timeLapseIndex)[0]
				tlctx.drawImage(
					tlImgID,
					chipInfo.sxZoom[timeLapseIndex],
					chipInfo.syZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					0,0,235,235
				);
				tlctx.strokeStyle=chipDisplayProps.plotColor; //"#FF0000"
				tlctx.lineWidth=1;
				tlctx.lineCap = 'square';
				tlctx.strokeRect(117.5-(chipDisplayProps.boxZoom/2), 117.5-(chipDisplayProps.boxZoom/2), chipDisplayProps.boxZoom, chipDisplayProps.boxZoom);
				$("#tlDate").text(data.Values[timeLapseIndex].Year);
				if(timeLapseIndex < lastIndex){timeLapseIndex += 1} else {timeLapseIndex = 0}			 			
			}
			
			flickerDir = "forward"; //"forward";
			function tlFlicker(){
				var tlImgID = $(".chipImgSrc").eq(timeLapseIndex)[0]
				tlctx.drawImage(
					tlImgID,
					chipInfo.sxZoom[timeLapseIndex],
					chipInfo.syZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					0,0,235,235
				);
				tlctx.strokeStyle=chipDisplayProps.plotColor; //"#FF0000"
				tlctx.lineWidth=1;
				tlctx.lineCap = 'square';
				tlctx.strokeRect(117.5-(chipDisplayProps.boxZoom/2), 117.5-(chipDisplayProps.boxZoom/2), chipDisplayProps.boxZoom, chipDisplayProps.boxZoom);
				$("#tlDate").text(data.Values[timeLapseIndex].Year);
				
				if(flickerDir == "forward"){
					timeLapseIndex -= 1;
					flickerDir = "back";
				} else{
					timeLapseIndex += 1;
					flickerDir = "forward";
				}
				if(timeLapseIndex > lastIndex){timeLapseIndex = 0}
				if(timeLapseIndex < 0){timeLapseIndex = lastIndex}
			}
			

			var vidCntl = {"isVidPlaying":0,"dontPlayVid":0,"isFlickerOn":0,"dontFlicker":0,"speed":300}
			$(".tlBtn").click(function(){
				var thisID = $(this).attr("id");
				var wasVidPlaying = vidCntl.isVidPlaying;
				var wasFlickerOn = vidCntl.isFlickerOn;
				
				if(vidCntl.isVidPlaying == 1){
					clearInterval(playTL);
					$("#tlPlay span").attr("class","glyphicon glyphicon-play")
					vidCntl.isVidPlaying = 0;
					vidCntl.dontPlayVid = 1;
				}
				if(vidCntl.isFlickerOn == 1){
					clearInterval(flickerTL);
					$("#tlPlay span").attr("class","glyphicon glyphicon-play")
					vidCntl.isFlickerOn = 0;
					vidCntl.dontFlicker = 1;
					flickerDir = "forward";
				}
				
				
				if(thisID == "tlBackx2"){
					timeLapseIndex += -2;
					timeLapseIndex = (timeLapseIndex < 0) ? 0:timeLapseIndex
					drawTLimage();
					$("#tlDate").text(data.Values[timeLapseIndex].Year);
					drawTLimage();
				} else if(thisID == "tlBack" && timeLapseIndex > 0){
					timeLapseIndex += -1;
					drawTLimage();
					$("#tlDate").text(data.Values[timeLapseIndex].Year);
					drawTLimage();					
				} else if(thisID == "tlPlay" && vidCntl.dontPlayVid == 0){
					playTL = setInterval(tlPlay, vidCntl.speed);
					vidCntl.isVidPlaying = 1
					$("#tlPlay span").attr("class","glyphicon glyphicon-pause")		
				} else if(thisID == "tlForward" && timeLapseIndex < lastIndex){
					timeLapseIndex += 1;
					drawTLimage();
					$("#tlDate").text(data.Values[timeLapseIndex].Year);
					drawTLimage();
				} else if(thisID == "tlForwardx2"){
					timeLapseIndex += 2;
					timeLapseIndex = (timeLapseIndex > lastIndex) ? (lastIndex):timeLapseIndex
					$("#tlDate").text(data.Values[timeLapseIndex].Year);
					drawTLimage();
				} else if(thisID == "flicker" && vidCntl.dontFlicker == 0){
					flickerTL = setInterval(tlFlicker, vidCntl.speed);
					vidCntl.isFlickerOn = 1					
				} else if(thisID == "faster"){
					vidCntl.speed = (vidCntl.speed > 100) ? vidCntl.speed-50:vidCntl.speed //50 is the lowest speed
					if(wasVidPlaying == 1){
						playTL = setInterval(tlPlay, vidCntl.speed);
						$("#tlPlay span").attr("class","glyphicon glyphicon-pause")
						vidCntl.isVidPlaying = 1
					}
					if(wasFlickerOn == 1){
						flickerTL = setInterval(tlFlicker, vidCntl.speed);
						vidCntl.isFlickerOn = 1
					}
				} else if(thisID == "slower"){
					vidCntl.speed = (vidCntl.speed < 850) ? vidCntl.speed+50:vidCntl.speed //900 is the lowest speed
					if(wasVidPlaying == 1){
						playTL = setInterval(tlPlay, vidCntl.speed);
						$("#tlPlay span").attr("class","glyphicon glyphicon-pause")
						vidCntl.isVidPlaying = 1
					}
					if(wasFlickerOn == 1){
						flickerTL = setInterval(tlFlicker, vidCntl.speed);
						vidCntl.isFlickerOn = 1
					}
				}

				vidCntl.dontPlayVid = 0;
				vidCntl.dontFlicker = 0;
				
				//$("#tlDate").text(data.Values[timeLapseIndex].Year);
			})
			
			function drawTLimage(){
				var tlImgID = $(".chipImgSrc").eq(timeLapseIndex)[0]
				tlctx.drawImage(
					tlImgID,
					chipInfo.sxZoom[timeLapseIndex],
					chipInfo.syZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					0,0,235,235
				);
				tlctx.strokeStyle=chipDisplayProps.plotColor; //"#FF0000"
				tlctx.lineWidth=1;
				tlctx.lineCap = 'square';
				tlctx.strokeRect(117.5-(chipDisplayProps.boxZoom/2), 117.5-(chipDisplayProps.boxZoom/2), chipDisplayProps.boxZoom, chipDisplayProps.boxZoom);
			}
			
			/////////////////////////////////////////////////////////////////////////////////////////////////////
			/////////////////////////////////////////////////////////////////////////////////////////////////////
			
			
			
			
			
			
			
			
			
			
			
			
			////////////////DEFINE FUNCTION TO DRAW ALL THE IMAGE CHIPS TO THE CANVASES/////////////////////
			//var plotColor = $("#plotColor").prop("value") //global variable
			function drawAllChips(window){
				updateZoom();
				for(var i=0; i<n_chips; i++){drawOneChip(i, window)}
			}
		
		
			////////////DEFINE FUNCTION TO DRAW A NEW IMAGE SECTION TO A CANVAS////////////////////////////
			function drawOneChip(thisChip, window){				
				var imgID = $('.chipImgSrc.'+window).eq(thisChip)[0];
				var	canvasID = $('.chipImg.'+window).eq(thisChip)[0];
				var	ctx = canvasID.getContext("2d");
				//console.log(chipInfo.sxZoom[thisChip],chipInfo.sWidthZoom[thisChip],chipDisplayProps.chipSize)
				ctx.mozImageSmoothingEnabled = false;
				ctx.msImageSmoothingEnabled = false;
				ctx.imageSmoothingEnabled = false;		
				ctx.drawImage(
					imgID,
					chipInfo.sxZoom[thisChip],
					chipInfo.syZoom[thisChip],
					chipInfo.sWidthZoom[thisChip],
					chipInfo.sWidthZoom[thisChip],
					0,0,chipDisplayProps.chipSize,chipDisplayProps.chipSize
				); //chipInfo.offset,chipInfo.offset
				ctx.strokeStyle=chipDisplayProps.plotColor; //"#FF0000"
				ctx.lineWidth=1;
				ctx.lineCap = 'square';
				ctx.strokeRect(chipDisplayProps.halfChipSize-(chipDisplayProps.boxZoom/2), chipDisplayProps.halfChipSize-(chipDisplayProps.boxZoom/2), chipDisplayProps.boxZoom, chipDisplayProps.boxZoom);
				if(window == "annual"){
					$(".chipDate").eq(thisChip).empty().append(chipInfo.year[thisChip]+"-"+chipInfo.julday[thisChip]+'<span class="glyphicon glyphicon-new-window expandChipYear" aria-hidden="true" style="float:right; margin-right:5px"></span>')
				} else if(window == "intraAnnual"){
					$(".chipDate").eq(thisChip).empty().append(chipInfo.year[thisChip]+"-"+chipInfo.julday[thisChip])
				}
			}			
			
			
							
			////////////REPLACE A CHIP WITH ONE SELECTED IN THE REMOTE WINDOW//////////////////////////////
			function replaceChip(pass_data){
				//adjust the chip offset for the orig			
				var replaceThisChip = pass_data.originChipIndex
				var thisImg = $(".chipImgSrc").eq(replaceThisChip);
				thisImg.attr("src",chipInfo.src[replaceThisChip]);
				chipInfo.useThisChip[replaceThisChip] = pass_data.useThisChip;
				chipInfo.syOrig[replaceThisChip] = (255*chipInfo.useThisChip[replaceThisChip])+chipDisplayProps.offset; // +chipInfo.offset   set/push the original source y offset to the syOrig array
				chipInfo.syZoom[replaceThisChip] = chipInfo.syOrig[replaceThisChip]+sAdj[chipDisplayProps.zoomLevel];
				//draw the chip - need to call updateZoom first since not running drawAllChips
				//updateZoom() //don't need to run since the syZoom was updated a line up
				
				//thisImg.on("load",function(){
				//	drawOneChip(replaceThisChip)
				//}).attr("src",chipInfo.src[replaceThisChip]);
				
				
				//thisImg.on("load",function(){
				drawOneChip(replaceThisChip, "annual")	
				//});
			}
			/////////////////////////////////////////////////////////////////////////////////////////////////
			
			
			function updateZoom(){
				for(var i=0; i<n_chips; i++){
					chipInfo.sxZoom[i] = chipInfo.sxOrig[i]+sAdj[chipDisplayProps.zoomLevel];
					chipInfo.syZoom[i] = chipInfo.syOrig[i]+sAdj[chipDisplayProps.zoomLevel];
					chipInfo.sWidthZoom[i] = chipInfo.sWidthOrig[i]-(sAdj[chipDisplayProps.zoomLevel]*2);
				}
				chipDisplayProps.boxZoom = lwAdj[chipDisplayProps.zoomLevel];
			}
  
			
			$(document).on("mousewheel","canvas",function(e){
				if(e.shiftKey){ //
					e.preventDefault(); //make sure that default browser behaviour is prevented
					if(e.deltaX <= -1 || e.deltaY >= 1){zoomIn = 1} else {zoomIn = 0}
					if(zoomIn > 0){
						if (chipDisplayProps.zoomLevel < maxZoom & chipDisplayProps.zoomLevel < stopZoom){chipDisplayProps.zoomLevel++;}
					} else {
						if (chipDisplayProps.zoomLevel > minZoom){chipDisplayProps.zoomLevel--;}
					}
					
					$("#zoomSize").val(chipDisplayProps.zoomLevel)
					zoomInfo = {
						"action":"zoom",
						//"zoomLevel":chipDisplayProps.zoomLevel,
						"chipDisplayProps":chipDisplayProps
					}
					
					if($(this).hasClass("annual") == true){
						drawAllChips("annual"); //redraw the chips with the new zoom
						if ((chipstripwindow != null) && chipstripwindow.closed == false){
							chipstripwindow.postMessage(JSON.stringify(zoomInfo),"*");	
						}
						if ((expandedChipWindow != null) && expandedChipWindow.closed == false){
							expandedChipWindow.postMessage(JSON.stringify(zoomInfo),"*");	
						}
					} else if($(this).hasClass("intraAnnual") == true){
						drawAllChips("intraAnnual"); //redraw the chips with the new zoom
						originURL.postMessage(JSON.stringify(zoomInfo),"*"); //originURL is defined in the intraAnnual window
					}
				}
			});

			
						
			///////////////////OPEN THE REMOTE CHIP STRIP WINDOW AND SEND MESSAGES/////////////////////

			//var originURL = null;
			$("body").on("click", ".expandChipYear", function(e){ //need to use body because the canvases have probably not loaded yet
				//if (e.ctrlKey) { 					
					//var thisImg = (parseInt($(this).attr("id").replace( /^\D+/g, ''))); //extract the chip index
					var thisImg = $(".expandChipYear").index(this) //extract the chip index
					var selectedColor = $("#selectedColor").prop("value");
					var pass_data = {
						"action":"add_chips", //hard assign
						"n_chips":chipInfo.chipsInStrip[thisImg], //"n_chips":"40", //get this from the img metadata
						"src":chipInfo.src[thisImg], //"src":"chips/chips_2012.png", //get this from the id of the .chipholder clicked
						//"canvasID":$(this).attr("id"),
						"chipIndex":thisImg,
						"chipDisplayProps":chipDisplayProps,
						"useThisChip":chipInfo.useThisChip[thisImg],
						"year":chipInfo.year[thisImg],
						"julday":chipInfo.julday[thisImg],
						"project":projectID,
						"plot":plotID,
						"selectedColor":selectedColor
						
					};
					if ((chipstripwindow == null) || (chipstripwindow.closed)){      //if the window is not loaded then load it and send the message after it is fully loaded
						chipstripwindow = window.open("./chip_strip_6.html","_blank","width=1080px, height=840px", "toolbar=0","titlebar=0","menubar=0","scrollbars=yes"); //open the remote chip strip window
						$(chipstripwindow).load(function(){chipstripwindow.postMessage(JSON.stringify(pass_data),"*");}); //wait until the remote window finishes loading before sending the message
					} else {                                                         //else if the window is already loaded, just send the message - no need to wait
						chipstripwindow.postMessage(JSON.stringify(pass_data),"*");
					}
				//}
			});
			
			
			///////////////////OPEN THE REMOTE CHIP STRIP WINDOW AND SEND MESSAGES/////////////////////
			var trajectoryWindow = null ;//keep track of whether the chipstrip window is open or not so it is not opened in multiple new window on each chip click
			var innerWidth = window.innerWidth
			$("body").on("click", "#expandTrajPlot", function(e){ //need to use body because the canvases have probably not loaded yet

				var pass_data = {
					"action":"add_trajectory", //hard assign
					"data":data,
					"allData":allData,
					"specIndex":specIndex,
					"domain":domain,
					"n_chips":n_chips,
					"selectThese":selectThese,
					"activeRedSpecIndex":activeRedSpecIndex,
					"activeGreenSpecIndex":activeGreenSpecIndex,
					"activeBlueSpecIndex":activeBlueSpecIndex
				};
				
				if ((trajectoryWindow == null) || (trajectoryWindow.closed)){      //if the window is not loaded then load it and send the message after it is fully loaded
					trajectoryWindow = window.open("./expanded_trajectory_plot.html","_blank","width="+innerWidth+"px, height=750px, toolbar=0, titlebar=0, menubar=0, scrollbars=yes"); //open the remote chip strip window
					$(trajectoryWindow).load(function(){trajectoryWindow.postMessage(JSON.stringify(pass_data),"*");}); //wait until the remote window finishes loading before sending the message
					} else {                                                         //else if the window is already loaded, just send the message - no need to wait
					trajectoryWindow.postMessage(JSON.stringify(pass_data),"*");
				}
			});
			
			
			var expandedChipWindow = null;
			$("#expandChipGallery").click(function(){

				var selectedColor = $("#selectedColor").prop("value");
				var pass_data = {
					"action":"init_chips", //hard assign
					"selectThese":selectedCircles, //selectThese, //"n_chips":"40", //get this from the img metadata
					"chipInfo":chipInfo,
					"n_chips":n_chips,
					"chipDisplayProps":chipDisplayProps,
					"selectedColor":selectedColor
					
				};
				if ((expandedChipWindow == null) || (expandedChipWindow.closed)){      //if the window is not loaded then load it and send the message after it is fully loaded
					expandedChipWindow = window.open("./expanded_chip_gallery.html","_blank","width=1080px, height=840px", "toolbar=0","titlebar=0","menubar=0","scrollbars=yes"); //open the remote chip strip window
					$(expandedChipWindow).load(function(){expandedChipWindow.postMessage(JSON.stringify(pass_data),"*");}); //wait until the remote window finishes loading before sending the message
				} else {                                                         //else if the window is already loaded, just send the message - no need to wait
					expandedChipWindow.postMessage(JSON.stringify(pass_data),"*");
				}
			});
			
			
			
			
			
			var doyCalWindow = null;
			$("#doyCalLi").click(function(){
				if ((doyCalWindow == null) || (doyCalWindow.closed)){      //if the window is not loaded then load it and send the message after it is fully loaded
					doyCalWindow = window.open("./doy_calendar.html","_blank","width=900px, height=647px, toolbar=0, titlebar=0, menubar=0, scrollbars=yes"); //open the remote chip strip window
				}
			});
			
			var RDWindow = null;
			$("#RDLi").click(function(){
				if ((RDWindow == null) || (RDWindow.closed)){      //if the window is not loaded then load it and send the message after it is fully loaded
					RDWindow = window.open("./response_design.html","_blank","width=900px, height=647px, toolbar=0, titlebar=0, menubar=0, scrollbars=1"); //open the remote chip strip window
				}
			});
			
			
			//////////////////////////GET MESSAGES FROM REMOTE////////////////////////////////////////////
			//receive messages from the origin window
			$(window).on("message onmessage",function(e){
				var pass_data = JSON.parse(e.originalEvent.data);
				if(pass_data.action == "replace_chip"){
					//replaceChip(pass_data.originChipIndex, pass_data.newSyOffset, pass_data.useThisChip);
					data.Values[pass_data.originChipIndex] = pass_data.data;
					

					data = calcDecDate(data);
					chipInfo.src[pass_data.originChipIndex]=pass_data.src
					chipInfo.julday[pass_data.originChipIndex]=pass_data.julday
					replaceChip(pass_data); //replace a chip with one selected in the remote window
					
					//activeRedSpecIndex = $("#red-list li.active").attr('id'); //already defined global
					//activeGreenSpecIndex = $("#green-list li.active").attr('id'); //already defined global
					//activeBlueSpecIndex = $("#blue-list li.active").attr('id'); //already defined global
					rgbColor = scaledRGB(data, activeRedSpecIndex, activeGreenSpecIndex, activeBlueSpecIndex, stretch, 2, n_chips); //len
					//updatePlotRGB();
					

					//var thisImg = $(".chipImgSrc").eq(pass_data.originChipIndex);
					//thisImg.imagesLoaded(function(){
						changePlotPoint();
						//plotUpdate(data, specIndex, rgbColor, domain);
					//});	

				} else if (pass_data.action == "zoom"){
					chipDisplayProps.zoomLevel = pass_data.zoomLevel;
					$("#zoomSize").val(chipDisplayProps.zoomLevel);
					drawAllChips("annual");
				}
				
				//$("#message").append(e.originalEvent.data); //****need to use 'originalEvent' instead of 'event' since im using jquery to bind the event. the jquery event object is different from the javascript event object - originalEvent is a copied version of the original javascript event object
			});	

			
			function tlInt(){
				var tlImgID = $(".chipImgSrc").eq(timeLapseIndex)[0]				
				tlctx.mozImageSmoothingEnabled = false;
				tlctx.msImageSmoothingEnabled = false;
				tlctx.imageSmoothingEnabled = false;
				tlctx.drawImage(
					tlImgID,
					chipInfo.sxZoom[timeLapseIndex],
					chipInfo.syZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					chipInfo.sWidthZoom[timeLapseIndex],
					0,0,235,235
				);
				tlctx.strokeStyle=chipDisplayProps.plotColor; //"#FF0000"
				tlctx.lineWidth=1;
				tlctx.lineCap = 'square';
				tlctx.strokeRect(117.5-(chipDisplayProps.boxZoom/2), 117.5-(chipDisplayProps.boxZoom/2), chipDisplayProps.boxZoom, chipDisplayProps.boxZoom);
				$("#tlDate").text(data.Values[timeLapseIndex].Year);
			}
			
			
			
			
			/////////////////////////LOAD THE CHIPS////////////////////////////////////////////////////////
			//function to run functions that need all the elements to be loaded - also need to do them in order was the window is loaded
			//var tlctx //global
			//function start(){
				//makeChipInfo("json"); //random
				//drawAllChips();
				
				//tlImgID = document.getElementById("img0");
			//	tlImgID = $(".chipImgSrc").eq(timeLapseIndex)[0]
			//	console.log(tlImgID);
			//	tlctx = tlCanvasID.getContext("2d")
			//	tlctx.mozImageSmoothingEnabled = false;
			//	tlctx.msImageSmoothingEnabled = false;
			//	tlctx.imageSmoothingEnabled = false;
			//	tlctx.drawImage(
			//		tlImgID,
			//		chipInfo.sxZoom[timeLapseIndex],
			//		chipInfo.syZoom[timeLapseIndex],
			//		chipInfo.sWidthZoom[timeLapseIndex],
			//		chipInfo.sWidthZoom[timeLapseIndex],
			//		0,0,235,235
			//	);
			//	tlctx.strokeStyle=chipDisplayProps.plotColor; //"#FF0000"
			//	tlctx.lineWidth=1;
			//	tlctx.lineCap = 'square';
			//	tlctx.strokeRect(117.5-(chipDisplayProps.boxZoom/2), 117.5-(chipDisplayProps.boxZoom/2), chipDisplayProps.boxZoom, chipDisplayProps.boxZoom);
			//	$("#tlDate").text(data.Values[timeLapseIndex].Year);
			//	
			//}
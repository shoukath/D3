/*
Data analysis and charting
Charting Cluters data usage over a period of time.
Author: Shoukath
*/
(function() {
	'use strict';
	/* globals $, _, d3, moment */

	/* Declaring the variables */
	var lineData,
		clusterMemoryUsageOriginalData, clusterLocationData,
		lineDataAllRegions,
		groupedLocationData,
		maxData,
		margin = {top: 30, right: 10, bottom: 100, left: 130},
		height = 500 - margin.top - margin.bottom,
		width  = 900 - margin.left - margin.right,
		yScale, xScale,
		vAxis, vGuide, vGuideScale,
		hAxis, hGuide,
		tooltip,
		radius = 4,
		svg, clusterUsageChart,
		area, path, line, lineFunc, point;

	var dataUsageChart = {
		init: function() {
			this.createBlankCanvas();
			this.setTooltip();
			this.loadExternalData();
		},
		createBlankCanvas: function() {
			// Creating the SVG with the appropriate dimensions
			svg = d3.select('#chart').append('svg')
				.attr('width', width +  margin.left + margin.right)
				.attr('height', height + margin.top + margin.bottom);
		},
		loadExternalData: function() {
			d3.csv('./data/cluster-disk-util.csv', this.generateChart.bind(this));
			d3.csv('./data/cluster-locations.csv', this.generateClusterLocationsDropdown.bind(this));
		},
		generateChart: function(data){

			// Saving the raw data in a variable, so that the raw data could be used later
			clusterMemoryUsageOriginalData = data;

			// Formatting the raw data to D3 consumable data
			lineDataAllRegions = lineData = this.createDataArray(clusterMemoryUsageOriginalData);

			// Setting the Horizontal and Vertical Scales
			this.createScales();

			// Creating the Chart Content
			this.generateChart_Line();
			this.generateChart_Area();
			this.generateChart_Point();

			// Creating the Axes
			this.generateChart_XAxis();
			this.generateChart_YAxis();
		},
		createScales: function() {
			yScale = d3.scale.linear()
						.domain([0, d3.max(lineData, function(d) {
							return d.dataUsage;
						})])
						.range([0, height]);

			xScale = d3.scale.ordinal()
						.domain(d3.range(0, lineData.length))
						.rangePoints([0, width]);
		},
		generateChart_Line: function() {
			lineFunc = d3.svg.line()
				.x(function(d, i) {
					return xScale(i) + margin.left;
				})
				.y(function(d) {
					return height - yScale(d.dataUsage) + margin.top;
				});

			line = svg.append("path")
				.datum(lineData)
				.attr("class", "line")
				.attr("d", lineFunc);
		},
		generateChart_Area: function() {
			area = d3.svg.area()
				.x(function(d, i) {
					return xScale(i) + margin.left;
				})
				.y0(function(d) {
					return height - yScale(d.dataUsage) + margin.top;
				})
				.y1(height+ margin.top);

			path = svg.append("path")
				.datum(lineData)
				.attr("class", "area")
				.attr("d", area);
		},
		generateChart_Point: function() {
			point = svg.selectAll(".point")
				.data(lineData)
				.enter().append("g")
				.attr("class", "point")
				.attr("transform", function(d, i) {
					return "translate(" + (xScale(i) + margin.left) + "," + (height - yScale(d.dataUsage) + margin.top) + ")";
				});

			point.append("circle")
				.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", radius)
				.attr("opacity", 0.5)
				.attr("fill", "#B1C095")
				.on('mouseover', function(d) {
					tooltip.show(d);

					d3.select(this)
						.transition()
						.style('opacity', 0.5)
						.attr('r', 10);
				})
				.on('mouseout', function() {
					tooltip.hide();

					d3.select(this)
						.transition()
						.style('opacity', 1)
						.attr('r', radius);
				});
		},
		generateChart_XAxis: function() {
			hAxis = d3.svg.axis()
					.scale(xScale)
					.orient('bottom')
					.tickFormat(function(d) {
						return lineData[d].date;
					});
			hGuide = svg.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate('+margin.left+','+(height + margin.top)+')');
			hGuide
				.call(hAxis)
				.selectAll('text')
					.style('text-anchor', 'end')
					.attr('dx', '-.8em')
					.attr('dy', '-.55em')
					.attr('transform', 'rotate(-90)' );

			hGuide.append('text')
				.attr('y', 100)
				.attr('x', width/2)
				.style('text-anchor', 'middle')
				.style('font-weight', 'bold')
				.text('Date');
			hGuide.selectAll('path');
			hGuide.selectAll('line')
				.style({stroke: '#000'});
		},
		generateChart_YAxis: function() {
			vGuideScale = d3.scale.linear()
				.domain([0, d3.max(lineData, function(d) {
					return d.dataUsage;
				})])
				.range([height, 0]);

			vAxis = d3.svg.axis()
				.scale(vGuideScale)
				.orient('left')
				.ticks(10);

			vGuide = d3.select('svg').append('g').attr('class', 'y axis');
			vAxis(vGuide);
			vGuide
				.attr('transform', 'translate('+margin.left+','+margin.top+')')
				.selectAll('path');
			vGuide.selectAll('line')
				.style({stroke: '#000'});
			vGuide.append('text')
				.attr({
					'y': 0,
					'dy': '-7.5em',
					'x': -height/2,
					'transform': 'rotate(-90)'
				})
				.style('text-anchor', 'middle')
				.style('font-weight', 'bold')
				.text('Data Usage (MB)');

		},
		generateClusterLocationsDropdown: function(data){
			clusterLocationData = data;

			groupedLocationData = _(_.sortBy(clusterLocationData, 'country_code'))
										.groupBy('country_code');

			for(var key in groupedLocationData) {
				if (groupedLocationData.hasOwnProperty(key)) {
					groupedLocationData[key] = _.pluck(groupedLocationData[key], 'cluster_id');

					$('<li>').html('<a href="#">'+key+'</a>')
						.appendTo('.dropdown-menu');
				}
			}

			$('.dropdown-toggle').dropdown();
			$('.dropdown-menu li').click(this.updateChart.bind(this));

			$('.dropdown').removeClass('invisible');
		},
		updateChart: function (event) {
			var easyType = 'linear',
				easeDuration = 1000,
				location = $(event.currentTarget).text();

			if (location === 'All Regions') {
				lineData = lineDataAllRegions;
			} else {
				this.getUsageDataByLocation(location);
			}

			yScale.domain([0, d3.max(lineData, function(d) {
				return d.dataUsage;
			})]);

			line.datum(lineData)
				.transition()
					.attr("d", lineFunc)
					.duration(easeDuration)
					.ease(easyType);

			path.datum(lineData)
				.transition()
					.attr("d", area)
					.duration(easeDuration)
					.ease(easyType);

			point.data(lineData)
				.transition()
				.attr("transform", function(d, i) {
					return "translate(" + (xScale(i) + margin.left) + "," + (height - yScale(d.dataUsage) + margin.top) + ")";
				})
				.duration(easeDuration)
				.ease(easyType);

			vGuideScale.domain([0, d3.max(lineData, function(d) {
				return d.dataUsage;
			})]);

			svg.select('.y.axis')
				.transition()
				.duration(easeDuration)
				.ease(easyType)
				.call(vAxis);

			$('.dropdown #dropdown-label').text(location);
		},
		/* 	Creating a tooltip for the bar chart */
		setTooltip: function() {
			tooltip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function(d) {
					return ("<strong>Date:</strong> <span>"+d.date+"</span></br><strong>Data Usage:</strong> <span>"+d.dataUsage+"</span>");
			});
			svg.call(tooltip);
		},
		/* This function processes the cluster usage data to sum up the data usage per day and
		formats it to be ready and charted by D3 */
		createDataArray: function (data) {
			var lineData = [];

			/* Looping through the entire data set to sum up the data usage */
			_.each(data, function(item){
				var parseDate = d3.time.format("%d-%b-%y").parse;
				var formattedDate = moment(item.timestamp, 'YYYY-MM-DD').format('D-MMM-YY'),
					matchedData = _.where(lineData, {date : formattedDate});

				if ( matchedData.length ) {
					matchedData[0].dataUsage = matchedData[0].dataUsage + Number(item['disk_usage(MB)']);
				} else {
					lineData.push({
						date : formattedDate,
						dataUsage: Number(item['disk_usage(MB)'])
					});
				}
			});
			return lineData;
		},
		/* Filters data usage by regions from the raw data usage file and sends it to 'createDataArray'
		function to format it to be read by D3 */
		getUsageDataByLocation: function(location) {
			var listOfClusterIds = groupedLocationData[location],
				filteredByLocation = [];

			_.each(clusterMemoryUsageOriginalData, function(clusterObj) {
				if (_.contains(listOfClusterIds, clusterObj.cluster_id)) {
					filteredByLocation.push(clusterObj);
				}
			});

			lineData = this.createDataArray(filteredByLocation);
		}
	};

	dataUsageChart.init();

})();

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
		clusterMemoryUsageData, clusterLocationData,
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
		colors,
		svg, clusterUsageChart;

	/* This function processes the cluster usage data to sum up the data usage per day and 
	formats it to be ready and charted by D3 */
	var createDataArray = function (data) {
		lineData = [];

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
	};

	/* Filters data usage by regions from the raw data usage file and sends it to 'createDataArray' 
	function to format it to be read by D3 */
	var getUsageDataByLocation = function() {
		var listOfClusterIds = groupedLocationData[$(this).text()],
			filteredByLocation = [];

		_.each(clusterMemoryUsageData, function(clusterObj) {
			if (_.contains(listOfClusterIds, clusterObj.cluster_id)) {
				filteredByLocation.push(clusterObj);
			}
		});

		createDataArray(filteredByLocation);
	};


	/* Creating a tooltip for the bar chart */
	tooltip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d) {
			return ("<strong>Date:</strong> <span>"+d.date+"</span></br><strong>Data Usage:</strong> <span>"+d.dataUsage+"</span>");
	});

	var area, path, line, lineFunc;

	d3.csv('./data/cluster-disk-util.csv', function(data){

		clusterMemoryUsageData = data;

		createDataArray(clusterMemoryUsageData);

		lineDataAllRegions = lineData;

		// getMaxData();


		colors = d3.scale.linear() // --> May be unuseful
					.domain([0, d3.max(lineData, function(d) {
						return d.dataUsage;
					})])
					.range(['#0C4F9E', '#AED137']);

		yScale = d3.scale.linear()
					.domain([0, d3.max(lineData, function(d) {
						return d.dataUsage;
					})])
					.range([0, height]);

		xScale = d3.scale.ordinal()
					.domain(d3.range(0, lineData.length))
					.rangePoints([0, width]);
		// xScale = d3.time.scale()
		// 			.range([0, width])

		svg = d3.select('#chart').append('svg')
			.attr('width', width +  margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			// .call(tooltip);
		area = d3.svg.area()
			.interpolate("basis")
			.x(function(d, i) { 
				return xScale(i) + margin.left; 
			})
			.y0(function(d) { 
				return height - yScale(d.dataUsage) + margin.top; 
			})
			.y1(height+ margin.top);

		lineFunc = d3.svg.line()
			.interpolate("basis")
	        .x(function(d, i) { 
				return xScale(i) + margin.left; 
			})
	        .y(function(d) { 
				return height - yScale(d.dataUsage) + margin.top; 
			});

		path = svg.append("path")
			.datum(lineData)
			.attr("class", "area")
			.attr("d", area);
		line = svg.append("path")
			.datum(lineData)
			.attr("class", "line")
			.attr("d", lineFunc);
			// .transition()
			// 	.attr("d", area)
			// 	.duration(2500)
			// 	.ease('elastic');

		/*clusterUsageChart = svg
			.append('g')
			.attr('transform', 'translate('+margin.left+','+margin.top+')')
			.selectAll('rect').data(lineData)
			.enter().append('rect')
				.style('fill', function(d, i) {
					return 'rgb(100, 200, ' + (i * 10) + ')';
				})
				.attr({
					'width': xScale.rangeBand(),
					'height': 0,
					'x': function(d, i) {
						return xScale(i);
					},
					'y': height
				});*/

		/*clusterUsageChart.transition()
			.attr('height', function(d) {
				return yScale(d.dataUsage);
			})
			.attr('y', function (d) {
				return height - yScale(d.dataUsage);
			})
			.delay(function(d, i) {
				return i * 20;
			})
			.duration(1000)
			.ease('elastic');*/

/*		clusterUsageChart
			.on('mouseover', function(d) {
				tooltip.show(d);

				d3.select(this)
					.style('opacity', 0.5);
			})
			.on('mouseout', function() {
				tooltip.hide();

				d3.select(this)
					.style('opacity', 1);
			});
*/
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

		/*hAxis = d3.svg.axis()
			.scale(xScale)
			.orient('bottom')
			.tickValues(xScale.domain().filter(function(d,i) {
				return i;
			}));
		hGuide = d3.select('svg').append('g');
		hAxis(hGuide);
		hGuide.attr('transform', 'translate('+margin.left+','+(height + margin.top)+')')
			.selectAll('path')
				.style({fill: 'none', stroke: '#000'});
		hGuide.selectAll('line')
			.style({stroke: '#000'});*/
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

		$('.dropdown').removeClass('invisible');
	});

	var updateChart = function () {
		var easyType = 'linear', easeDuration = 1000;
		if ($(this).text() === 'All Regions') {
			lineData = lineDataAllRegions;
		} else {
			getUsageDataByLocation.call(this);
		}

		// getMaxData();

		yScale.domain([0, d3.max(lineData, function(d) {
			return d.dataUsage;
		})]);
			
		/*clusterUsageChart.data(lineData).transition()
			.attr('height', function(d) {
				return yScale(d.dataUsage);
			})
			.attr('y', function (d) {
				return height - yScale(d.dataUsage);
			})
			.delay(function(d, i) {
				return i * 20;
			})
			.duration(700)
			.ease('circle');*/
		path.datum(lineData)
			.transition()
				.attr("d", area)
				.duration(easeDuration)
				.ease(easyType);
		line.datum(lineData)
			.transition()
				.attr("d", lineFunc)
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

		$('.dropdown #dropdown-label').text($(this).text());
	};

	d3.csv('./data/cluster-locations.csv', function(data){
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
		$('.dropdown-menu li').click(updateChart);

	});
})();

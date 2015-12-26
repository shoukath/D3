(function() {
	'use strict';
	/* globals $, _, d3, moment */

	var barData,
		clusterMemoryUsageData, clusterLocationData,
		barDataAllRegions,
		groupedLocationData,
		maxData,
		margin = {top: 30, right: 0, bottom: 100, left: 130},
		height = 500 - margin.top - margin.bottom,
		width  = 900 - margin.left - margin.right,
		yScale, xScale,
		vAxis, vGuide, vGuideScale,
		hAxis, hGuide,
		tooltip,
		colors,
		svg, clusterUsageChart;

	var createDataArray = function (data) {
		barData = [];

		_.each(data, function(item){
			var formattedDate = moment(item.timestamp, 'YYYY-MM-DD').format('D-MMM-YY'),
				matchedData = _.where(barData, {date : formattedDate});

			if ( matchedData.length ) {
				matchedData[0].dataUsage = matchedData[0].dataUsage + Number(item['disk_usage(MB)']);
			} else {
				barData.push({
					date : formattedDate,
					dataUsage: Number(item['disk_usage(MB)'])
				});
			}
		});
	};

	var getMaxData = function () {
		d3.max(barData, function(d) {
			maxData = d.dataUsage;
		});
	}

	tooltip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d) {
			return ("<strong>Date:</strong> <span>"+d.date+"</span></br><strong>Data Usage:</strong> <span>"+d.dataUsage+"</span>");
	});

	d3.csv('./data/cluster-disk-util.csv', function(data){

		clusterMemoryUsageData = data;

		createDataArray(clusterMemoryUsageData);

		barDataAllRegions = barData;

		getMaxData();

		colors = d3.scale.linear() // --> May be unuseful
					.domain([0, maxData])
					.range(['#ffb832', '#c61c6f']);

		yScale = d3.scale.linear()
					.domain([0, maxData])
					.range([0, height]);

		xScale = d3.scale.ordinal()
					.domain(d3.range(0, barData.length))
					.rangeBands([0, width], 0.2);

		svg = d3.select('#chart').append('svg')
			.attr('width', width +  margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.call(tooltip);
		
		clusterUsageChart = svg
			.append('g')
			.attr('transform', 'translate('+margin.left+','+margin.top+')')
			.selectAll('rect').data(barData)
			.enter().append('rect')
				.style('fill', function(d, i) {
					return 'rgb(100, 200, ' + (i * 10) + ')';
				})
				.attr('width', xScale.rangeBand())
				.attr('height', 0)
				.attr('x', function(d, i) {
					return xScale(i);
				})
				.attr('y', height);

		clusterUsageChart.transition()
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
			.ease('elastic');

		clusterUsageChart
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

		vGuideScale = d3.scale.linear()
			.domain([0, maxData])
			.range([height, 0]);

		vAxis = d3.svg.axis()
			.scale(vGuideScale)
			.orient('left')
			.ticks(10);

		vGuide = d3.select('svg').append('g').attr('class', 'y axis');
		vAxis(vGuide);
		vGuide
			.attr('transform', 'translate('+margin.left+','+margin.top+')')
			.selectAll('path')
				.style({fill: 'none', stroke: '#000'});
		vGuide.selectAll('line')
			.style({stroke: '#000'});
		vGuide.append('text')
			.attr('y', 0)
			.attr('dy', '-7.5em')
			.attr('x', -height/2)
			.attr('transform', 'rotate(-90)')
			// .attr('class', 'label')
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
					return barData[d].date;
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
		hGuide.selectAll('path')
			.style({fill: 'none', stroke: '#000'});
		hGuide.selectAll('line')
			.style({stroke: '#000'});


		$('.dropdown').removeClass('invisible');
	});

	var updateChart = function () {
		if ($(this).text() === 'All Regions') {
			barData = barDataAllRegions;
		} else {
			getUsageDataByLocation.call(this);
		}

		getMaxData();

		yScale
			.domain([0, maxData]);
			
		clusterUsageChart.data(barData).transition()
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
			.ease('circle');
		
		vGuideScale.domain([0, maxData]);

		svg.select('.y.axis')
			.transition()
			.duration(700)
			.ease('circle')
			.call(vAxis);

		$('.dropdown #dropdown-label').text($(this).text());
	};

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

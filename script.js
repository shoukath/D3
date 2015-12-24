(function() {
	'use strict';

	var barData,
		clusterMemoryUsageData, clusterLocationData,
		barDataAllRegions,
		groupedLocationData,
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
			var dateFormat = d3.time.format("%d-%b-%y");
			var formattedDate = dateFormat(new Date(item.timestamp));
			var matchedData = _.where(barData, {date : formattedDate});
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

	d3.csv('./data/cluster-disk-util.csv', function(data){

		clusterMemoryUsageData = data;

		createDataArray(clusterMemoryUsageData);

		barDataAllRegions = barData;

		colors = d3.scale.linear()
					.domain([0, d3.max(barData, function(d) {
						return d.dataUsage;
					})])
					.range(['#ffb832', '#c61c6f']);

		yScale = d3.scale.linear()
					.domain([0, d3.max(barData, function(d) {
						return d.dataUsage;
					})])
					.range([0, height]);

		xScale = d3.scale.ordinal()
					.domain(d3.range(0, barData.length))
					.rangeBands([0, width], 0.2);

		tooltip = d3.select('body').append('div')
			.style({
				position: 'absolute',
				padding: '0 10px',
				background: 'gray',
				opacity: 0
			});

		svg = d3.select('#chart').append('svg')
			.attr('width', width +  margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		
		clusterUsageChart = svg
			.append('g')
			.attr('transform', 'translate('+margin.left+','+margin.top+')')
			.selectAll('rect').data(barData)
			.enter().append('rect')
				.style('fill', function(d, i) {
					return "rgb(100, 200, " + (i * 10) + ")";
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
			tooltip.transition()
				.style('opacity', 0.9);

			tooltip.html(d.dataUsage + '</br>' + d.date)
				.style({
					left: d3.event.pageX + 'px',
					top: d3.event.pageY + 'px'
				});

			d3.select(this)
				.style('opacity', 0.5);
		})
		.on('mouseout', function() {
			d3.select(this)
				.style('opacity', 1);

			tooltip.style('opacity', 0);
		});

		vGuideScale = d3.scale.linear()
			.domain([0, d3.max(barData, function(d) {
				return d.dataUsage;
			})])
			.range([height, 0]);

		vAxis = d3.svg.axis()
			.scale(vGuideScale)
			.orient('left')
			.ticks(10);

		vGuide = d3.select('svg').append('g').attr("class", "y axis");
		vAxis(vGuide);
		vGuide
			.attr('transform', 'translate('+margin.left+','+margin.top+')')
			.selectAll('path')
				.style({fill: 'none', stroke: '#000'});
		vGuide.selectAll('line')
			.style({stroke: '#000'});
		vGuide.append("text")
			.attr("y", 0)
			.attr("dy", "-7.5em")
			.attr("x", -height/2)
			.attr("transform", "rotate(-90)")
			.style("text-anchor", "middle")
			.text("Data Usage (MB)");

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
				.orient("bottom")
				.tickFormat(function(d) {
					return barData[d].date;
				});
		hGuide = svg.append("g")
			.attr("class", "x axis")
			.attr("transform", 'translate('+margin.left+','+(height + margin.top)+')');
		hGuide
			.call(hAxis)
			.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", "-.55em")
				.attr("transform", "rotate(-90)" );
		
		hGuide.append("text")
			.attr("y", 100)
			.attr("dy", "0")
			.attr("x", width/2)
			.style("text-anchor", "middle")
			.text("Date");
	});

	var updateChart = function () {
		if ($(this).text() === 'All') {
			barData = barDataAllRegions;
		} else {
			getUsageDataByLocation.call(this);
		}

		yScale
			.domain([0, d3.max(barData, function(d) {
				return d.dataUsage;
			})]);
			
			
		clusterUsageChart.data(barData).transition()
			.attr('height', function(d) {
				// console.log(yScale(d.dataUsage));
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
		
		vGuideScale.domain([0, d3.max(barData, function(d) {
			return d.dataUsage;
		})]);

		svg.select(".y.axis")
			.transition()
			.duration(700)
			.ease("circle")
			.call(vAxis);
	};

	var getUsageDataByLocation = function() {
		var listOfClusterIds = groupedLocationData[$(this).text()],
			filteredByLocation = [];

		_.each(listOfClusterIds, function(clusterObj){
			var perClusterIdFilter = _.where(clusterMemoryUsageData, {cluster_id: clusterObj.cluster_id});
			// filteredByLocation = _.union(filteredByLocation, perClusterIdFilter);
			filteredByLocation = filteredByLocation.concat(perClusterIdFilter);
		});
		createDataArray(filteredByLocation);
	};

	d3.csv('./data/cluster-locations.csv', function(data){
		clusterLocationData = data;

		groupedLocationData = _(_.sortBy(clusterLocationData, 'country_code'))
									.groupBy('country_code');

		for(var key in groupedLocationData) {
			$('<li>').html('<a href="#">'+key+'</a>')
				.appendTo('.dropdown-menu')

		}
		$('.dropdown-toggle').dropdown();
		$('.dropdown-menu li').click(updateChart);
	});
})();

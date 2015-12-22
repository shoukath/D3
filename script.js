var barData = []
var createDataArray = function (data) {
	var i;
	for(i = 0; i < data.length; i++) {
		// barData[data[i].timestamp] = (barData[data[i].timestamp] || 0) + Number(data[i]['disk_usage(MB)']);
		var formattedDate = moment(data[i].timestamp, 'YYYY-MM-DD').format('D-MMM-YY');
		var matchedData = _.where(barData, {date : formattedDate});
		if ( matchedData.length ) {
			matchedData[0].dataUsage = matchedData[0].dataUsage + Number(data[i]['disk_usage(MB)']);
		} else {
			barData.push({
				date : formattedDate,
				dataUsage: Number(data[i]['disk_usage(MB)'])
			})
		}
	}
};

d3.csv('./data/cluster-disk-util.csv', function(data){
	/*
		[
			{date}
			"2012-06-01 04:03:38 PST": "2323"
		]
	*/
	var margin = {top: 30, right: 30, bottom: 40, left: 50};

	var height = 200 - margin.top - margin.bottom,
		width  = 600 - margin.left - margin.right,
		barWidth = 50,
		barOffset = 5,
		yScale, xScale;

	createDataArray(data);

	// barData = [10,12,30,15];
	yScale = d3.scale.linear()
				.domain([0, d3.max(barData, function(d) {
					return d.dataUsage;
				})])
				.range([0, height]);
	xScale = d3.scale.ordinal()
				.domain(d3.range(0, barData.length))
				.rangeBands([0, width], .2);
	
	var clusterUsageChart = d3.select('#chart').append('svg')
		// .style('background', 'gray')
		.attr('width', width +  margin.top + margin.bottom)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate('+margin.left+','+margin.top+')')
		.selectAll('rect').data(barData)
		.enter().append('rect')
			.style('fill', '#C61C6F')
			.attr('width', xScale.rangeBand())
			.attr('height', function(d) {
				// return yScale(d.dataUsage);
				return 0;
			})
			.attr('x', function(d, i) {
				return xScale(i);
			})
			.attr('y', function (d) {
				// return height - yScale(d.dataUsage);
				return height;
			});

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

	var vGuideScale = d3.scale.linear()
		.domain([0, d3.max(barData, function(d) {
			return d.dataUsage;
		})])
		.range([height, 0]);

	var vAxis = d3.svg.axis()
		.scale(vGuideScale)
		.orient('left')
		.ticks(10);

	vGuide = d3.select('svg').append('g')
	vAxis(vGuide);
	vGuide
		.attr('transform', 'translate('+margin.left+','+margin.top+')')
		.selectAll('path')
			.style({fill: 'none', stroke: '#000'})
	vGuide.selectAll('line')
		.style({stroke: '#000'});

	var hAxis = d3.svg.axis()
		.scale(xScale)
		.orient('bottom')
		.tickValues(xScale.domain().filter(function(d,i) {
			return i;
		}))
	var hGuide = d3.select('svg').append('g');
		hAxis(hGuide)
		hGuide.attr('transform', 'translate('+margin.left+','+(height + margin.top)+')')
			.selectAll('path')
				.style({fill: 'none', stroke: '#000'});
		hGuide.selectAll('line')
			.style({stroke: '#000'});
});





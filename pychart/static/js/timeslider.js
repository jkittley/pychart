(function( $ ) {

    $.fn.timeSlider = function( options ) {
        var settings = $.extend({
            width: 800,
            height: 50,
            margin: {
                top: 0,
                right: 50,
                bottom: 0,
                left: 50
            }
        }, options );

        this.filter( "div" ).each(function() {
            init(this, settings);
        });

        return this;
    }

    var init = function (elem, settings) {

        formatDate = d3.time.format("%b %d %Y");
        var width  = settings.width - settings.margin.left - settings.margin.right;
        var height = settings.height - settings.margin.bottom - settings.margin.top;

        // scale function
        var timeScale = d3.time.scale()
          .domain([new Date('2012-01-02'), new Date('2013-01-01')])
          .range([0, width])
          .clamp(true);

        // initial value
        var startValue = timeScale(new Date('2012-03-20'));
        startingValue = new Date('2012-03-20');

        // defines brush
        var brush = d3.svg.brush()
          .x(timeScale)
          .extent([startingValue, startingValue])
          .on("brush", brushed);

        var svg = d3.select(elem).append("svg")
          .attr("width", width + settings.margin.left + settings.margin.right)
          .attr("height", height + settings.margin.top + settings.margin.bottom)
          .append("g")
          // classic transform to position g
          .attr("transform", "translate(" + settings.margin.left + "," + settings.margin.top + ")");

        svg.append("g")
          .attr("class", "x axis")
          // put in middle of screen
          .attr("transform", "translate(0," + height / 3 + ")")
          // inroduce axis
          .call(d3.svg.axis()
              .scale(timeScale)
              .orient("bottom")
              .tickFormat(function(d) {
                    return formatDate(d);
               })
              .tickSize(0)
              .tickPadding(12)
              .tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
              .select(".domain")
              .select(function() {
                return this.parentNode.appendChild(this.cloneNode(true));
              })
          .attr("class", "halo");

        var slider = svg.append("g")
          .attr("class", "slider")
          .call(brush);

        slider.selectAll(".extent,.resize")
          .remove();

        slider.select(".background")
          .attr("height", height);

        var handle = slider.append("g")
          .attr("class", "handle")

        handle.append("path")
          .attr("transform", "translate(0," + height / 3 + ")")
          .attr("d", "M 0 -20 V 20")

        handle.append('text')
          .text(startingValue)
          .attr("transform", "translate(" + (+5) + " ," + (height / 3 - 5)  + ")");

        slider
          .call(brush.event)

        function brushed() {
          var value = brush.extent()[0];
          if (d3.event.sourceEvent) { // not a programmatic event
            value = timeScale.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
          }
          handle.attr("transform", "translate(" + timeScale(value) + ",0)");
          handle.select('text').text(formatDate(value));
        }
    }

}(jQuery));
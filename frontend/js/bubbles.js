
var bubble = (function() {
    
    var width = 0,
        height = 0,
        center = {x:0, y:0, point: [0,0] },
        padding = 6, // separation between nodes
        baseRadius = 5,
        maxRadius = 10,
        focusRadius= 50;

    var circle = null,
        svg=null,
        force=null,
        nodes=null,
        focusNode=null,
        search_element=null,
        vis_div=null,
        node_info=null,
        stats=null,
        rangeSlider=null;

    var infoVisivle = false,
        searchVisible = true;

    var search_text = null,
        search_low  = null,
        search_high = null; 

    var n = 200, // total number of nodes
        m = 10; // number of distinct clusters

    // Called during the animate
    function tick(e) {
      circle
          .each(gravity(.2 * e.alpha))
          .each(collide(.5))
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }

    // Move nodes toward cluster focus.
    function gravity(alpha) {
      return function(d) {
          d.y += (d.cy - d.y) * alpha;
          d.x += (d.cx - d.x) * alpha;
      };
    }

    // Resolve collisions between nodes.
    function collide(alpha) {
      var quadtree = d3.geom.quadtree(nodes);
      return function(d) {
        var r = d.radius + maxRadius + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }

    // Called to start the visualisation
    var init = function(v, se, ni) {
      // Set key elements
      vis_div = v;
      search_element = se;
      node_info = ni;
      // Show search
      $(node_info).hide();
      showSearch();
      // Set width and height of SVG
      width  = $(vis_div).width() * 2;
      height = $(vis_div).height() * 2;
      width  = Math.max(width, height);
      height = Math.max(width, height);
      // Store center x, y coords
      center.x = width/2;
      center.y = (height/2) - ($(search_element).height()/2);
      center.point = [center.x,center.y];
      // Center scroll pane
      $(vis_div).animate({ scrollTop: height / 3 });
      $(vis_div).animate({ scrollLeft: width / 4 });
      // Load nodes
      nodes = loadNodes();
      // Add search listener
      $(search_element+' .search-input').on("keyup", search_state_changed);
      $(search_element+' .search-input').focus();
      // Add info pane listener
      $(node_info+' .close a').on("click", reset);
      
    }

    // Once nodes are all loaded
    var onNodesLoad = function(n) {
      
      nodes = n; 

      force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(0)
        .charge(0)
        .on("tick", tick)
        .on('end', function() { console.log('Force ended!'); })
        .start();

      svg = d3.select(vis_div)
        .append("svg")
          .attr("width", width)
          .attr("height", height);
        
      circle = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
          .attr("class","node")
          .attr("id", function(d) { return "node_" + d.data.id; })
          .attr("r", function(d) { return d.radius; })
          .style("fill", function(d) { return d.color; })
          .on('click', nodeClick);

      // Run search
      run_search();
    }

    // Set the gravitational home of a node
    var setNodeGravityPoint = function(node, gPoint) {
        if (gPoint !== null && gPoint !== undefined) {
          node.cx = gPoint[0];
          node.cy = gPoint[1];
        } else {
          console.log("setNodeGravityPoint gPoint was "+gPoint)
        }
        
    }

    // Load node data
    var loadNodes = function() {
      d3.json("js/testdata.json", function(loadedData) {
        var loadedData = testData();
        var nodes = [];
        stats = loadedData.stats;
        var color = d3.scale.category10().domain(stats.min_pop,stats.max_pop);

        for (i in loadedData.nodes) {
          var node = loadedData.nodes[i];
          //console.log(node);
          var r = baseRadius + node.popularity / stats.max_pop * maxRadius;
          nodes.push({
            data: node, 
            radius: parseInt(r),
            origRa: parseInt(r),
            color: color(node.popularity),
            cx: center.x,
            cy: center.y
          });
        }

        initRangeSlider(stats);
        onNodesLoad(nodes);
      });
    }
    
    // When a node is selected
    var nodeClick = function(n, j) {
      // If the node clicked is the one currently focused then ignore
      if (focusNode !== null && focusNode === n) return
      // Deselect current node
      if (focusNode !== null) resetNode(focusNode);  
      // Remove focus class from all nodes
      $(".node").attr("class","node");
      // Start force dynamics
      force.start();  
      // Hide all nodes
      for (i in nodes) { if (nodes[i] !== n) hideNode(nodes[i]); }
      // Make selected node the new focus node
      $("#node_"+n.data.id).attr("class","node focus-node");
      $("#node_"+n.data.id).attr("r", focusRadius - padding);
      n.radius = 80;
      n.x = width / 2;
      n.y = height / 2;
      focusNode = n;   

      // Hide search and show info
      showInfo(focusNode);
      
      // Bring neighbours back in
      setTimeout(function(){ 
        // TODO: COnvert ot callback
        focusNode.fixed = true;
        for (i in n.data.neighbours) {
          orbitNode(nodes[i]);
        }
        // Restart force
        force.start();  
      }, 2000);
      
    }

    // Make node fly off screen i.e. its hiden
    var hideNode = function(node) {
        var rndPos = rndNodePosition(Math.max(width/3, height/3));
        setNodeGravityPoint(node, [center.x + rndPos.o, center.y - rndPos.a]);
    }

    // Function to set gravity of a node to be in orbit of focusNode
    var orbitNode = function(node) {
        var rndPos = rndNodePosition(focusRadius + padding);
        //console.log(rndPos);
        setNodeGravityPoint(node, [center.x + rndPos.o, center.y - rndPos.a]);
    }

    // Calculate a random position at a dist_from_center fron the center point
    var rndNodePosition = function(h) {
        var t = Math.round(Math.random() * 359);
        var o = parseInt( h * Math.sin(t) );
        var a = parseInt( h * Math.cos(t) );
        return { "o":o, "h":h, "a":a, "t":t }
    }

    // Reset the size and gravity point of all nodes
    var resetAllNodes = function() {
        resetNode(focusNode);
        focusNode = null;
        for (i in nodes) { hideNode(nodes[i]); }
        force.start();  
        for (i in nodes) {
            n = nodes[i];
            resetNode(n);
            setNodeGravityPoint(n, center.point)
        }
    }

    // Return a node to its original size and make sure its free to move
    var resetNode = function(n) {
      if (n !==null && n !== undefined) {
        n.fixed = false;
        n.radius = n.origRa;
        $("#node_"+n.data.id)
          .attr("class","node")
          .attr("r",n.origRa);
      }
    }

    // Reset state to that at load
    var reset = function() {
      $(search_element + ' .search-input').val('');
      showSearch();
      resetAllNodes();
    }

    // Generate test data
    var testData = function() {
      var testNodes  = [];
      var totalNodes = 200;
      var max_pop = null;
      var min_pop = null;

      for (var i=0; i<totalNodes; i++) {
        var fakeNames = "";
        var popularity = parseInt(Math.random() * 100);
        if (max_pop===null || popularity > max_pop) max_pop = popularity;
        if (min_pop===null || popularity < min_pop) min_pop = popularity;
        // Add some neighbours
        var neighbours = [];
        while (neighbours.length < parseInt(totalNodes*0.2)) {
          neighbours.push( parseInt(Math.random() * totalNodes) );
        }
        // Add test node to list
        testNodes.push({
          "id": i,
          "name": rndstr(2),
          "desc": rndstr(52),
          "pypi": "http://www.pychart.com/get_pypi_data/"+i,
          "popularity": popularity,
          "neighbours": neighbours
        });
      };

      // Return as JSON
      return { 
        "stats": {
          "max_pop": max_pop,
          "min_pop": min_pop,
          "init_range": "10,40",
          "init_low": 10,
          "init_high": 40
        },
        "nodes": testNodes,
      }
    }

    // Create a random string
    var rndstr = function(num_chars) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < num_chars; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    var hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    var showInfo = function(node) {
      var rgb = hexToRgb(node.color);
      $(node_info).css('background-color', "rgba("+rgb.r+", "+rgb.g+", "+rgb.b+", 0.4)" );
      $(node_info+' .ptitle').html(node.data.name+' ');
      $(node_info+' .pinfo span').html(node.data.desc);
      $(node_info+' .pinfo a').attr('href', node.data.pypi);

      $(node_info+' .pneighbours').html('Used with<BR><ul></ul>');
      for (i in node.data.neighbours) {
        ney = node.data.neighbours[i];
        $(node_info+' .pneighbours ul').append('<li><a class="neighbour-list" data-index="'+nodes[ney].data.id+'">'+nodes[ney].data.name+'</a></li>');
      }
      $('.neighbour-list').click(function(e) { var ney=$(this).data('index'); nodeClick(nodes[ney], ney); return false;  });
      if (!infoVisivle) {
        infoVisivle = true;
        searchVisible = false;
        panelsAnimate(node_info, search_element);
      }
    }

    var showSearch = function() {
      if (!searchVisible) {
        searchVisible = true;
        infoVisivle = false;
        panelsAnimate(search_element, node_info);
      }
    }

    var panelsAnimate = function(in_elem, out_elem) {
        $(out_elem)
          .css( "z-index", 8888 )
          .animate({ "bottom": "-="+$(out_elem).height()+"px" }, "slow", function() {
              $(out_elem).hide();
              $(in_elem)
                .css( "bottom", -1 * $(in_elem).height() )
                .css( "z-index", 9999 )
                .show()
                .animate({ "bottom": "+="+$(in_elem).height()+"px" }, "slow");
          });   
    }

    var range_change_state = function(e) {
      var chunks  = e.value.split(',');
      search_low  = chunks[0];
      search_high = chunks[1];
      run_search();
    }
    
    // When the state of the search box changes, reprocess the found nodes
    var search_state_changed = function() {
      search_text = $(search_element+' .search-input').val().toLowerCase();
      if (search_text !=="") resetNode(focusNode);
      run_search();
    }


    var run_search = function() {
      var nodesToHide = [];
      for (n in nodes) {
        var node = nodes[n];
        if (search_text !==null && search_text !=="" && node.data.name.toLowerCase().indexOf(search_text) === -1) {
          nodesToHide.push(parseInt(n));
        } 
        if (search_high !== null && node.data.popularity > search_high) nodesToHide.push(parseInt(n));
        if (search_low  !== null && node.data.popularity < search_low)  nodesToHide.push(parseInt(n));
      } 
      // Hide nodes
      for (n in nodes) {
        if (n in nodesToHide) {
          hideNode(nodes[n]);
        } else {
          setNodeGravityPoint(nodes[n], center.point);
        }
      }
      force.start();
    }


    var initRangeSlider = function(stats) {
      search_low  = stats.init_low;
      search_high = stats.init_high;
      rangeSlider = $("#rangeSlider").roundSlider({
        min: stats.min_pop,
        max: stats.max_pop,
        radius: 85,
        sliderType: "range",
        value: stats.init_range,
        change: range_change_state
      });
    }

    // -----------------
    // Public API
    // -----------------
    return {
        init: init,
        reset: reset
    };

})();
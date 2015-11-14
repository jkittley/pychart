
var bubble = (function() {
    
    var width = 0,
        height = 0,
        center = {x:0, y:0, point: [0,0] },
        padding = 6, // separation between nodes
        baseRadius = 20;
        maxRadius = 50;

    var circle = null,
        svg = null,
        force = null,
        nodes = null,
        focusNode =null;

    var n = 200, // total number of nodes
        m = 10; // number of distinct clusters

    var offScreenGravPoints = [[-20,-20]]

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


    var init = function(w,h) {
      width = w;
      height = h;
      center.x = w/2;
      center.y = h/2;
      center.point = [center.x,center.y];
      nodes = loadNodes();
      dist = 40;
      offScreenGravPoints = [[-dist,-dist],[center.x,-dist],[w+dist, -dist],[-dist,center.y],[w+dist,center.y],[-dist,h+dist],[center.x,h+dist],[w+dist,h+dist]];
    }

    var onNodesLoad = function(n) {
      
      nodes = n; 

      force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(0)
        .charge(0)
        .on("tick", tick)
        .start();


      svg = d3.select("body")
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
    }

    var setNodeGravityPoint = function(node, gPoint) {
        if (gPoint !== null && gPoint !== undefined) {
          node.cx = gPoint[0];
          node.cy = gPoint[1];
        } else {
          console.log("setNodeGravityPoint gPoint was "+gPoint)
        }
        
    }

    var loadNodes = function() {
      d3.json("js/testdata.json", function(loadedData) {
        var loadedData = testData();
        var nodes = [];
        var stats = loadedData.stats;
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

        onNodesLoad(nodes);
      });
    }
    
    var nodeClick = function(n, i) {
   
      // If the node clicked is the one currently focused then ignore
      if (focusNode !== null && focusNode === n) return

      // Deselect current node
      if (focusNode !== null) resetNode(focusNode);  
                
      // Remove focus class from all nodes
      $(".node").attr("class","node");
      for (i in nodes) { if (nodes[i] !== n) hideNode(nodes[i]); }

      // Make selected node the new focus node
      $("#node_"+n.data.id).attr("class","node focus-node");
      $("#node_"+n.data.id).attr("r",100);
      n.radius = 100;
      n.x = width / 2;
      n.y = height / 2;
      n.fixed = true;
      focusNode = n;      

      // Bring chums back in
      setTimeout(function(){ 
        // TODO: COnvert ot callback
        for (i in n.data.chums) {
            setNodeGravityPoint(nodes[i], center.point)
        }
      }, 3000);
      
    }

    var hideNode = function(node) {
        var rnd = Math.round(Math.random() * offScreenGravPoints.length);
        setNodeGravityPoint(node, offScreenGravPoints[rnd]);
    }

    var resetAllNodes = function() {
        focusNode - null;
        for (i in nodes) { hideNode(nodes[i]); }
        setTimeout(function(){ 
          // TODO: COnvert ot callback
          for (i in nodes) {
              n = nodes[i];
              resetNode(n);
              setNodeGravityPoint(n, center.point)
          }
          force.start();
      }, 5000);
    }

    var resetNode = function(n) {
      n.fixed = false;
      n.radius = n.origRa;
      $("#node_"+n.data.id)
        .attr("class","node")
        .attr("r",n.origRa);
    }

    var reset = function() {
      resetAllNodes();
    }

    var testData = function() {
      var testNodes = [];
      
      for (var i=0; i<60; i++) {
        testNodes.push({
          "id": i,
          "name": "Test "+i,
          "pypi": "http://www.pychart.com/get_pypi_data/"+i,
          "popularity": parseInt(Math.random() * 100),
          "neighbours": [0,1,2] 
        });
      };
      return { 
        "stats": {
          "max_pop": 5000,
          "min_pop": 50
        },
        "nodes": testNodes,
      }
    }

    // -----------------
    // Public API
    // -----------------
    return {
        init: init,
        reset: reset
    };

})();
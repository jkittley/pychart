
var peek = (function() {
    
    var svg 

    var width  = null,
        height = null;

    var nodeScaler = 5,
        nodeMinWidth = 12;

    var color = d3.scale.category10();

    var nodes = [], node = null,
        links = [], link = null;

    var root_node = null;
    
    var info_elem = null;
    var force = null;

    var init = function(ie) {

        force = d3.layout.force()
          .nodes(nodes)
          .links(links)
          .charge(-400)
          .linkDistance(120)
          .size([width, height])
          .on("tick", tick);

        info_elem = ie;
        width  = $(window).width();
        height = $(window).height() - $(info_elem).height();

        $(info_elem).width(width-20);

        root_node = { 
          "id": "root", 
          "name": "Django",
          "fixed": true, 
          "x": width/2, 
          "y": height/2, 
          "parent": null, 
          "radius": 10  
        }

        // Add the root node
        svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);

        node = svg.selectAll(".node"),
        link = svg.selectAll(".link");

        addNode(root_node);
    }
    

    var addNode = function(node) {
      nodes.push(node);
      if (node.parent !== null) links.push({"source": node, "target": node.parent});
      update();
    }

    var findNode = function (id) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].id === id)
                return nodes[i]
        };
    }

    var getChums = function(soonTooBeParent) {
      radius = nodeMinWidth + Math.random() * nodeScaler;
      var newID = Math.floor(Date.now() / 1000);
      addNode({ "id": newID, "name": "Child", "parent":soonTooBeParent, "radius":radius });
    }

    var updateInfo = function(node) {
      
      // Hide link
      $(info_elem).find('.pypi-link').hide();

      // TODO: Fetch PyPi data and display in description

      $(info_elem).find('.title').html(node.name);
      $(info_elem).find('.description').html("Loading...");
      $(info_elem).find('.pypi-link').attr("href","#?=sdsfd").show();
      
    }

    var nodeClicked = function(node) {
        getChums(node);
        updateInfo(node);
    }
    

    function update() {
      
      link = link.data(force.links(), function(d) { return d.source.id + "-" + d.target.id; });
      link.enter().insert("line", ".node").attr("class", "link");
      link.exit().remove();
      
      node = node.data(force.nodes(), function(d) { return d.id;});
      node.enter()
        .append("circle")
          .attr("class", "node")
          .attr("data-id", function(d) { return d.id; })
          .attr("data-name", function(d) { return d.name; })
          .on("click", nodeClicked )
          .attr("r", function(d) {  return d.radius })
         
      node.exit().remove();
      force.start();
    }

    function tick() {
      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })

      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    }

    // Public API
    return {
        init: init,
    };

})();
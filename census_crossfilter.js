//queue()
//  .defer(d3.csv, "sa1_to_ssc_converted.csv")
//  .defer(d3.csv, "suburb_names.csv")
//  .defer(d3.csv, "frankendata_trimmed_nosmall.csv")
//  .await(ready);

queue()
  .defer(d3.csv, "final_data_vic.csv")
  .defer(d3.json, "sa2.vic.topo.json")
  .await(ready);

function ready(error, data, geo) {
  var projection = d3.geo.mercator()
    .center([144.5, -37.9])
    .scale(10000);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select("#map").append("g").attr("id", "map-g")
    .call(d3.behavior.zoom()
      .translate(projection.translate())
      .scale(projection.scale())
      .on("zoom", redraw));

  var regionsHash = d3.map();

  var color;

  svg.selectAll("path")
      .data(topojson.feature(geo, geo.objects.sa2).features)
    .enter().append("path")
      .attr("d", path)
    .each(function(d) {
      regionsHash.set(d.properties.code, this);
    })
    .on("mouseover", function(d) { color = this.style.opacity; this.style.opacity = "0.8"; updateHover(d.properties); })
    .on("mouseout", function(d) { this.style.opacity = color; deleteHover(); });

  redraw();

  function redraw() {
    if (d3.event) {
      projection
      .translate(d3.event.translate)
      .scale(d3.event.scale);
    }
    svg.selectAll("path").attr("d", path);
  }

  var hover = d3.select("#hover");

  function updateHover(d) {
    var s = "Selected: " + d.name;
    hover.html(s);
  }

  function deleteHover() {
    hover.html("");
  }


  // Various formatters.
  var formatNumber = d3.format(",d");

  //var linear = d3.scale.linear().domain([0, 20]).range(["yellow", "blue"]);
  var linear = d3.scale.quantile().domain([0, 20]).range(d3.range(9));
  var quantile = d3.scale.quantile().range(d3.range(20));
  var colorScale = function(x) { return colorbrewer.OrRd[9][linear(x)]; };


  var numeric_fields = d3.set(d3.keys(data[0]));
  numeric_fields.remove("SA2_NAME");
  // A little coercion, since the CSV is untyped.
  data.forEach(function(d, i) {
    d.index = i;
    d.region_id = +d.region_id;
    var region = regionsHash.get(d.region_id);
    d.feature = region;
    numeric_fields.forEach(function(field) {
      d[field] = +d[field];
      region.__data__.properties[field] = d[field];
    });
  });

  data = data.filter(function(d) { return d.Total_Persons_Persons > 0; });
  //region_id,Median_age_of_persons,Median_mortgage_repayment_monthly,Median_total_personal_income_weekly,Median_rent_weekly,Median_total_family_income_weekly,Average_number_of_Persons_per_bedroom,Median_total_rent_income_weekly,Average_rent_size
  //region_id,Median_age_of_persons,Median_mortgage_repayment_monthly,Median_total_personal_income_weekly,Median_rent_weekly,Median_total_family_income_weekly,Average_number_of_Persons_per_bedroom,Median_total_household_income_weekly,Average_household_size,Owned_outright_Total,Owned_with_a_mortgage_Total,Total_Persons_Persons
  //region_id   Median_age_of_persons   Median_mortgage_repayment_monthly       Median_total_personal_income_weekly     Median_rent_weekly      Median_total_family_income_weekly       Average_number_of_Persons_per_bedroom   Median_total_household_income_weekly    Average_household_size  Total_Persons_Persons


  // Create the crossfilter for the relevant dimensions and groups.
  var c = crossfilter(data),
    all = c.groupAll(),
    feature = c.dimension(function(d) { return d.feature; });
    //features = feature.group(function(d) { return d; });

  //population = suburb.dimension(function(d) { return ((d.Total_Persons_Persons + 1) / d.AREA_SQKM) + 10; }),
  //populations = population.group(function(d) { return (d); }),
  //region = suburb.dimension(function(d, i) { return d.region_id; }),
  //regions = region.group(function(id) { return id; }).reduceCount(),

  window.data = data;


  //console.log(d3.extent(data, function(d) {return d.Total_Persons_Persons;}));
  //console.log(data.map(function(d) { return d.median_total_rent_income; }));

  var charts = [

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return Math.min(80, d.Median_age_of_persons); })
        .group(function(d) { return Math.floor(d / 4) * 4; })
      .x(d3.scale.linear()
        .domain([0, 80])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return Math.min(1300, d.Median_total_personal_income_weekly); })
        .group(function(d) { return Math.floor(d / 70) * 70; })
    .x(d3.scale.linear()
        .domain([0, 1400])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return Math.min(800, d.Median_rent_weekly); })
        .group(function(d) { return Math.floor(d / 40) * 40;})
    .x(d3.scale.linear()
        .domain([0, 800])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return (d.Persons_Year_12_or_equivalent_Total / d.Total_Persons_Persons) * 100; })
        .group(function(d) { return Math.floor(d / 5) * 5; })
    .x(d3.scale.linear()
        .domain([0, 100])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return (d.Persons_Total_Volunteer / d.Total_Persons_Persons) * 100; })
        .group(function(d) { return Math.floor(d / 2) * 2; })
    .x(d3.scale.linear()
        .domain([0, 40])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return (d.Born_elsewhere_Persons / d.Total_Persons_Persons) * 100; })
        .group(function(d) { return Math.floor(d) ; })
    .x(d3.scale.linear()
        .domain([0, 20])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return (d.Persons_Total_labour_force_Total / d.Total_Persons_Persons) * 100; })
        .group(function(d) { return Math.floor(d / 4) * 4 ; })
    .x(d3.scale.linear()
        .domain([0, 80])
        .rangeRound([0, 200])),

    barChart()
        .crossfilter(c)
        .dimension(function(d) { return (d.Persons_Unemployed_looking_for_Total_Total / d.Total_Persons_Persons) * 1000; })
        .group(function(d) { return Math.floor(d / 4) * 4; })
    .x(d3.scale.linear()
        .domain([0, 80])
        .rangeRound([0, 200])),
  ];


  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
    .data(charts)
    .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); })


  // Render the initial lists.
 // var list = d3.select(".list")
 // .data(populations.all());

  // Render the total.
  d3.selectAll("#total")
  .text(formatNumber(c.size()));

  var selectedChart;
  renderAll();

  charts[1].select();
  renderAll();

  function updateRegions() {
    svg.selectAll("path").each(function() { this.style.fill = ""; });
    var polygons;
    if (selectedChart) {
      quantile.domain(selectedChart.domain());
      polygons = selectedChart.dimension().top(Infinity);
      var dfunc = selectedChart.dimensionFunction();
      var gfunc = selectedChart.groupFunction();

      polygons.forEach(function(d) {
        d.feature.style.fill = colorScale(quantile(gfunc(dfunc(d))));
      });
    } else {
      polygons = feature.top(Infinity);
      polygons.forEach(function(d) { d.feature.style.fill = "steelblue"; });
    }
  }


  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
    updateRegions();

    //updateList(population.top(100));
    d3.select("#active").text(formatNumber(all.value()));
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    window.location.hash="vis";
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function unselectAll() {
    charts.forEach(function(d, i) { charts[i].unselect(); });
  }


//  function updateList(data) {
//    var list = d3.select(".list").selectAll(".area")
//    .data(data, function(d) { return d.region_id; });
//
//    list.enter().append("div")
//    .attr("class", "area")
//    .text(function(d) { return d.SA2_NAME; });
//
//    list.exit().remove();
//    div.each(function() {
//      var date = d3.select(this).selectAll(".date")
//      .data(age.top(40), function(d) { return d.key; });
//
//      date.enter().append("div")
//      .attr("class", "date")
//      .append("div")
//      .attr("class", "day")
//      .text("hello");
//
//      date.exit().remove();
//
//      var flight = date.order().selectAll(".flight")
//      .data(function(d) { return d.values; }, function(d) { return d.index; });
//
//      var flightEnter = flight.enter().append("div")
//      .attr("class", "flight");
//
//      flightEnter.append("div")
//      .attr("class", "time")
//      .text(function(d) { return d.region_id; });
//
//      flightEnter.append("div")
//      .attr("class", "origin")
//      .text(function(d) { return d.Median_age_of_persons + " years"; });
//
//      flightEnter.append("div")
//      .attr("class", "destination")
//      .text(function(d) { return "$" + d.Median_total_personal_income_weekly + " p/w"; });
//
//      flightEnter.append("div")
//      .attr("class", "destination")
//      .text(function(d) { return "rent: $" + d.Median_rent_weekly + " p/w"; });
//
//      flightEnter.append("div")
//      .attr("class", "destination")
//      .text(function(d) { return d.Total_Persons_Persons + " people"; });
//
//      flight.exit().remove();
//
//      flight.order();
//    });
  //}

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
    x,
    y = d3.scale.linear().range([75, 0]),
    id = barChart.id++,
    axis = d3.svg.axis().orient("bottom"),
    brush = d3.svg.brush(),
    brushDirty,
    crossfilter,
    dimension,
    dimensionFunction,
    group,
    groupFunction,
    round,
    selected,
    el,
    domain;

    var chart = function chart(div) {
      el = div;

      var width = x.range()[1],
      height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
        g = div.select("g");

        div.select(".title")
          .on("click", function() {
            var wasSelected = selected;
            unselectAll();
            wasSelected ? chart.unselect() : chart.select();
            renderAll();
            console.log(selected);
          });


        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".description").append("a")
          .attr("href", "javascript:reset(" + id + ")")
          .attr("class", "reset")
          .text("Reset")
          .style("display", "none");

          g = div.append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
          .attr("id", "clip-" + id)
          .append("rect")
          .attr("width", width)
          .attr("height", height);

          g.selectAll(".bar")
          .data(["background", "foreground"])
          .enter().append("g")
          .attr("class", function(d) { return d + " bar"; })
          .datum(group.all());

          g.selectAll(".foreground.bar")
          .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + height + ")")
          .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".description a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
            .attr("x", 0)
            .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
            .attr("x", x(extent[0]))
            .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").each(function(d) {
          var bar = d3.select(this).selectAll("path")
          .data(d, function(x) { return x.key; });

          bar.enter().append("path")
            .attr("d", barPath);

          bar.attr("d", barPath);
        });
        g.selectAll(".foreground path")
            .style("fill", function(d, i) { return selected ? colorScale(i) : "steelblue"; });
      });

      function barPath(d) {
        return "M" + x(d.key) + "," + height + "V" + y(d.value) + "h9V" + height + "z";
      }

      function resizePath(d) {
        var e = +(d == "e"),
        x = e ? 1 : -1,
        y = height / 3;
        return "M" + (.5 * x) + "," + y
        + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
        + "V" + (2 * y - 6)
        + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
        + "Z"
        + "M" + (2.5 * x) + "," + (y + 8)
        + "V" + (2 * y - 8)
        + "M" + (4.5 * x) + "," + (y + 8)
        + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".description a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
      extent = brush.extent();
      if (round) g.select(".brush")
      .call(brush.extent(extent = extent.map(round)))
      .selectAll(".resize")
      .style("display", null);
      g.select("#clip-" + id + " rect")
      .attr("x", x(extent[0]))
      .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".description a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      domain = x.domain();
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.crossfilter = function(_) {
      crossfilter = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimensionFunction = _;
      dimension = crossfilter.dimension(dimensionFunction);
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      groupFunction = _;
      group = dimension.group(groupFunction);
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    chart.selected = function(_) {
      if (!arguments.length) return selected;
      selected = _;
      return chart;
    };

    chart.unselect = function() {
      selected = false;
      el.classed("selected", selected);
      selectedChart = undefined;

      return chart;
    };

    chart.select = function() {
      selected = true;
      el.classed("selected", selected);
      selectedChart = chart;
      return chart;
    };

    chart.dimensionFunction = function() {
      return dimensionFunction;
    };

    chart.groupFunction = function() {
      return groupFunction;
    };

    chart.domain = function() {
      return domain;
    };

    return d3.rebind(chart, brush, "on");
  }
}


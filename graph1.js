var d3_new = {};
d3_new = Object.assign(d3_new, d3);

const requestData1 = async () => {
    //one svg element per graph (one for summer, one for winter, one for combined)

    let svgA = d3.select("#graph1a"); //summer
    let svgB = d3.select("#graph1b"); //winter
    let svgC = d3.select("#graph1c"); //combined
    let svgD = d3.select("#graphLegend"); //color gradient
    let width = svgA.attr("width");
    let height = svgA.attr("height");
    let margin = { top: 20, right: 20, bottom: 40, left: 60};
    let chartWidth = width - margin.left - margin.right;
    let chartHeight = height - margin.top - margin.bottom;

    //load the data
    var gdp_data = await d3_new.csv("../datasets/dictionary.csv");
    var medals_data = await d3_new.csv("../datasets/athlete_events.csv");

    //console.log(gdp_data)
    gdp_data = gdp_data.filter(d => d.GDP != "" && d.Population != "");

    gdp_data.forEach( d => {
        d.Country = d.Country.replace(/[*]/g,"");
        d.GDP = Number(d.GDP);
        d.Population = Number(d.Population);
    });

    gdp_data = gdp_data.filter(d => d.GDP > 0 && d.Population > 0);

    //min, max, and scale for GDP
    const gdpMin = d3.min(gdp_data, d => d.GDP);
    const gdpMax = d3.max(gdp_data, d => d.GDP);

    const gdpScale = d3.scaleLog()
        .domain([gdpMin+1, 102000])
        .range([0, chartWidth])


    //min, max, and scale for population (to vary the radii of circles)
    const popMin = d3.min(gdp_data, d => d.Population);
    const popMax = d3.max(gdp_data, d => d.Population);

    const sum_popScale = d3.scaleLog()
        .domain([popMin, popMax])
        .range(["white", "darkgreen"])

    const win_popScale = d3.scaleLog()
        .domain([popMin, popMax])
        .range(["white", "midnightblue"])

    const tot_popScale = d3.scaleLog()
        .domain([popMin, popMax])
        .range(["white", "darkred"])

    var countries = {}; //dictionary of country objects
    gdp_data.forEach( d => {
        var country = new Object();
        var code = d.Code;
        country.cName = d.Country;
        country.population = d.Population;
        country.gdp = d.GDP;
        country.sum_medal = 0;
        country.sum_total = 0;
        country.win_medal = 0;
        country.win_total = 0;
        country.sum_perc = 0;
        country.win_perc = 0;
        country.tot_perc = 0;
        countries[code] = country;

    })

    //collect data for gold medalists in summer and winter for each country

    medals_data.forEach( d => {
        var c_code = d.NOC;
        if (countries[c_code]) {
            if (d.Season == "Summer") {
                countries[c_code].sum_total += 1;
                if (d.Medal == "Gold" || d.Medal == "Silver" || d.Medal == "Bronze") {
                    countries[c_code].sum_medal += 1;
                }
            }
            else {
                countries[c_code].win_total += 1;
                if (d.Medal == "Gold" || d.Medal == "Silver" || d.Medal == "Bronze") {
                    countries[c_code].win_medal += 1;
                }
            }
        }
    })

    //find gold medalist percentages in summer, winter, and combined events

    Object.values(countries).forEach(country => {
        var sum_perc = 0;
        var win_perc = 0;
        var tot_perc = 0;

        if (country.sum_total != 0) {
            sum_perc = (country.sum_medal / country.sum_total)*100;
        }

        if (country.win_total != 0) {
            win_perc = (country.win_medal / country.win_total)*100;
        }

        if (country.sum_total != 0 && country.win_total != 0) {
            tot_perc = ((country.sum_medal + country.win_medal) / (country.sum_total + country.win_total))*100;
        }

        country.sum_perc = sum_perc;
        country.win_perc = win_perc;
        country.tot_perc = tot_perc;
    })

    //find min and max and construct scales


    const sumMin = d3.min(Object.values(countries), d => d.sum_perc);
    const sumMax = d3.max(Object.values(countries), d => d.sum_perc);

    const winMin = d3.min(Object.values(countries), d => d.win_perc);
    const winMax = d3.max(Object.values(countries), d => d.win_perc);

    const totMin = d3.min(Object.values(countries), d => d.tot_perc);
    const totMax = d3.max(Object.values(countries), d => d.tot_perc);

    const yMin = Math.min(sumMin, winMin, totMin);

    const yScale = d3.scaleLinear()
        .domain([yMin, 35])
        .range([chartHeight, 0])

    let leftGridlines = d3.axisLeft(yScale).tickSize(-chartWidth).tickFormat("");
    svgA.append("g").attr("class", "y gridlines")
        .attr("transform","translate("+ (margin.left) +","+ margin.top +")")
        .call(leftGridlines);
    svgB.append("g").attr("class", "y gridlines")
        .attr("transform","translate("+ (margin.left) +","+ margin.top +")")
        .call(leftGridlines);
    svgC.append("g").attr("class", "y gridlines")
        .attr("transform","translate("+ (margin.left) +","+ margin.top +")")
        .call(leftGridlines);

    let bottomGridlines = d3.axisBottom(gdpScale).tickSize(-chartHeight).tickFormat("");
    svgA.append("g").attr("class", "x gridlines")
        .attr("transform","translate("+ margin.left +","+ (margin.top + chartHeight) +")")
        .call(bottomGridlines);
    svgB.append("g").attr("class", "x gridlines")
        .attr("transform","translate("+ margin.left +","+ (margin.top + chartHeight) +")")
        .call(bottomGridlines);
    svgC.append("g").attr("class", "x gridlines")
        .attr("transform","translate("+ margin.left +","+ (margin.top + chartHeight) +")")
        .call(bottomGridlines);

    let leftAxis = d3.axisLeft(yScale).ticks(10, d3.format(".01s"));
    svgA.append("g").attr("class", "y axis")
        .attr("transform","translate("+ (margin.left) +","+ margin.top +")")
        .call(leftAxis);
    svgB.append("g").attr("class", "y axis")
        .attr("transform","translate("+ (margin.left) +","+ margin.top +")")
        .call(leftAxis);
    svgC.append("g").attr("class", "y axis")
        .attr("transform","translate("+ (margin.left) +","+ margin.top +")")
        .call(leftAxis);

    let bottomAxis = d3.axisBottom(gdpScale).ticks(10, d3.format("$.01s"));
    svgA.append("g").attr("class", "x axis")
        .attr("transform","translate("+ (margin.left) +","+(margin.top + chartHeight)+")")
        .call(bottomAxis);
    svgB.append("g").attr("class", "x axis")
        .attr("transform","translate("+ (margin.left) +","+(margin.top + chartHeight)+")")
        .call(bottomAxis);
    svgC.append("g").attr("class", "x axis")
        .attr("transform","translate("+ (margin.left) +","+(margin.top + chartHeight)+")")
        .call(bottomAxis);

    //add text labels
    svgA.append("text").attr("class", "x labels")
        .attr("transform","translate("+ (margin.left) +","+( margin.top + 10)+")")
        .attr("text-anchor", "middle")
        .attr("x", chartWidth/2 )
        .attr("y", chartHeight+20)
        .style("font-family", "Arial")
        .style("font-size", "12")
        .text("GDP per Capita");

    svgB.append("text").attr("class", "x labels")
        .attr("transform","translate("+ (margin.left) +","+(margin.top + 10)+")")
        .attr("text-anchor", "middle")
        .attr("x", chartWidth/2 )
        .attr("y", chartHeight+20)
        .style("font-family", "Arial")
        .style("font-size", "12")
        .text("GDP per Capita");

    svgC.append("text").attr("class", "x labels")
        .attr("transform","translate("+ (margin.left) +","+(margin.top + 10)+")")
        .attr("text-anchor", "middle")
        .attr("x", chartWidth/2 )
        .attr("y", chartHeight+20)
        .style("font-family", "Arial")
        .style("font-size", "12")
        .text("GDP per Capita");

    svgA.append("text").attr("class", "y labels")
        .attr("transform","rotate(-90)")
        .attr("x", 0-(chartHeight/2))
        .attr("y", margin.left-40)
        .style("text-anchor", "middle")
        .style("font-family", "Arial")
        .style("font-size", "12")
        .text("Percentage of medalists (Summer)");

    svgB.append("text").attr("class", "y labels")
        .attr("transform","rotate(-90)")
        .attr("x", 0-(chartHeight/2))
        .attr("y", margin.left-40)
        .style("text-anchor", "middle")
        .style("font-family", "Arial")
        .style("font-size", "12")
        .text("Percentage of medalists (Winter)");

    svgC.append("text").attr("class", "y labels")
        .attr("transform","rotate(-90)")
        .attr("x", 0-(chartHeight/2))
        .attr("y", margin.left-40)
        .style("text-anchor", "middle")
        .style("font-family", "Arial")
        .style("font-size", "12")
        .text("Percentage of medalists (Total)");

    //graph for summer events only
    let circlesA = svgA.append("g").attr("transform","translate("+(margin.left)+","+margin.top+")");

    Object.values(countries).forEach(country => {
        circlesA.append("circle")
            .attr("cx", gdpScale(country.gdp+1))
            .attr("cy", yScale(country.sum_perc))
            .attr("fill", sum_popScale(country.population))
            .style("r", 8)
            .style("stroke", "grey")
            .style("opacity", 1);
    });

    //graph for winter events
    let circlesB = svgB.append("g").attr("transform","translate("+margin.left+","+margin.top+")");

    Object.values(countries).forEach(country => {
        circlesB.append("circle")
            .attr("cx", gdpScale(country.gdp+1))
            .attr("cy", yScale(country.win_perc))
            .attr("fill", win_popScale(country.population))
            .attr("r", 8)
            .style("stroke", "grey")
            .style("opacity", 1);
    });

    //graph for combined events

    let circlesC = svgC.append("g").attr("transform","translate("+margin.left+","+margin.top+")");

    Object.values(countries).forEach(country => {
        circlesC.append("circle")
            .attr("cx", gdpScale(country.gdp+1))
            .attr("cy", yScale(country.tot_perc))
            .attr("fill", tot_popScale(country.population))
            .style("r", 8)
            .style("stroke", "grey")
            .style("opacity", 1);

    });

    //Create the gradient
    width = svgD.attr("width");
    height = svgD.attr("height");

    svgD.append("text").attr("class", "labels")
      .attr("text-anchor", "middle")
      .attr("x", width/4 + 70)
      .attr("y", 65)
      .style("font-family", "Open Sans Condensed")
      .style("font-size", "20")
      .text("Population size of country:");

    var gradientA = svgD.append("defs")
    	.append("linearGradient")
    	.attr("id", "legendA_1")
    	.attr("x1", "0%")
        .attr("y1", "0%")
    	.attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
        
    gradientA.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);

    gradientA.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "darkgreen")
        .attr("stop-opacity", 1);

    svgD.append("rect")
        .attr("x", width/2)
        .attr("y", 10)
        .attr("width", width/3)
        .attr("height", 10)
        .style("fill", "url(#legendA_1)");

    var gradientScaleA = d3.scaleLog().domain(sum_popScale.domain()).range([width/2, 5*width/6]);
    var gradientAxisA = d3.axisBottom(gradientScaleA).ticks(5,d3.format(".01s"));

    svgD.append("g").attr("class", "axis")
        .attr("transform","translate(0,20)")
        .call(gradientAxisA);
    svgD.append("text")
        .attr("x", width/2-70)
        .attr("y", 20)
        .style("font-family", "Open Sans Condensed")
        .style("font-size", "16")
        .text("Summer")

    var gradientB = svgD.append("defs")
        .append("linearGradient")
        .attr("id", "legendB_1")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    gradientB.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);

    gradientB.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "midnightblue")
        .attr("stop-opacity", 1);

    svgD.append("rect")
        .attr("x", width/2)
        .attr("y", 50)
        .attr("width", width/3)
        .attr("height", 10)
        .style("fill", "url(#legendB_1)");

    svgD.append("g")
        .attr("class", "axis")
        .attr("transform","translate(0,60)")
        .call(gradientAxisA);

    svgD.append("text")
        .attr("x", width/2-70)
        .attr("y", 60)
        .style("font-family", "Open Sans Condensed")
        .style("font-size", "16")
        .text("Winter")

    var gradientC = svgD.append("defs")
        .append("linearGradient")
        .attr("id", "legendC")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    gradientC.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);

    gradientC.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "darkred")
        .attr("stop-opacity", 1);

    svgD.append("rect")
        .attr("x", width/2)
        .attr("y", 90)
        .attr("width", width/3)
        .attr("height", 10)
        .style("fill", "url(#legendC)");

    svgD.append("g").attr("class", "axis")
        .attr("transform","translate(0,100)")
        .call(gradientAxisA);

    svgD.append("text")
        .attr("x", width/2-70)
        .attr("y", 100)
        .style("font-family", "Open Sans Condensed")
        .style("font-size", "16")
        .text("Combined")
}

requestData1()

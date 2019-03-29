const requestData2 = async () => {

    var country_data = await d3_new.json("../datasets/dictionary.json");
    var summer_data = await d3_new.csv("../datasets/summer.csv");
    var winter_data = await d3_new.csv("../datasets/winter.csv");

    var countries = {}; //dictionary of country objects

    country_data = country_data.filter(d => d.GDP != "" && d.Population != "");

    country_data.forEach (d => {
        var country = new Object();
        var code = d.Code;
        country.cName = d.Country;
        country.men_gold = 0;
        country.women_gold = 0;
        country.men = 0;
        country.women = 0;
        country.code = code;
        countries[code] = country;
    })
    
    summer_data.forEach( d => {
        var c_code = d.Country;
        if (countries[c_code]) {
            if (d.Gender == "Men") {
                countries[c_code].men += 1;
                if (d.Medal == "Gold") {
                    countries[c_code].men_gold += 1;
                }
            }
            if (d.Gender == "Women") {
                countries[c_code].women += 1;
                if (d.Medal == "Gold") {
                countries[c_code].women_gold += 1;
                }
            }
        }
    })

    winter_data.forEach( d => {
        var c_code = d.Country;
        if (countries[c_code]) {
            if (d.Gender == "Men") {
                countries[c_code].men += 1;
                if (d.Medal == "Gold") {
                    countries[c_code].men_gold += 1;
                }
            }
            if (d.Gender == "Women") {
                countries[c_code].women += 1;
                if (d.Medal == "Gold") {
                    countries[c_code].women_gold += 1;
                }
            }
        }
    })

    Object.values(countries).forEach( country => {
        var men_perc = 0;
        var women_perc = 0;
        var ratio = 1;

        if (country.men != 0) {
            men_perc = (country.men_gold / country.men)*100;
        }

        if (country.women != 0) {
            women_perc = (country.women_gold / country.women)*100;
        }

        if (country.women_gold != 0 && country.women != 0 && country.men != 0) {
            ratio = (country.men_gold / country.men) / (country.women_gold / country.women);
        }else if (country.men != 0) {
            ratio = (country.men_gold / country.men);
        }

        country.men_perc = men_perc;
        country.women_perc = women_perc;
        country.ratio = ratio;
    })

    let end_data = {};

    Object.values(countries).forEach(country => {
        end_data[country.cName] = country.ratio;
        end_data[country.code.toLowerCase()] = country.ratio;
    })

    country_data = country_data.filter(d => d.GDP > 0 && d.Population > 0);

    // Now do the graphing of the data

    const svg1 = d3_new.select("#choropleth1");
    const width = svg1.attr("width");
    const height = svg1.attr("height");
    const margin = { top: 100, right: 10, bottom: 10, left:10};
    const mapWidth = width - margin.left - margin.right;
    const mapHeight = height - margin.top - margin.bottom;
    const map1 = svg1.append("g")
                    .attr("transform","translate("+ margin.left + "," + margin.top + ")");

    const svg2 = d3_new.select("#choropleth2");
    const map2 = svg2.append("g")
                    .attr("transform","translate("+ margin.left + "," + margin.top + ")");
    const mapTranslateString = "translate(0, -45)";


    const world = await d3_new.json("datasets/map/world.json");
    const subunits = topojson.feature(world, world.objects.subunits2);
    const projection = d3.geoEquirectangular().fitSize([mapWidth, mapHeight], subunits);;
    const path = d3.geoPath().projection(projection);
    
    map1.append("path").datum(subunits).attr("d", path).attr("transform", mapTranslateString);
    map2.append("path").datum(subunits).attr("d", path).attr("transform", mapTranslateString);

    countries = {}

    topojson.feature(world, world.objects.subunits2).features.forEach((d) => {
        countries[d.properties.name] = d.id;
    })

    const convertCountryCode = getMappings()
    const percentMin = 0.00;
    const percentMax = 1.00;
    const menColor = "#1923F5"
    const womenColor = "#FF1493"
    const dummyColor = "#B0B0B0";

    const getMenPercent = (country_name, code) => {
        var ratio = getRatio(country_name, code);
        if(ratio < 0){
            return -100000000
        }
        return (ratio * 1.0) / ((ratio * 1.0) + 1.0);
    }

    const getWomenPercent = (country_name, code) => {
        var men = getMenPercent(country_name, code);
        if(men < 0){
            return -100000000
        }
        return 1.0 - men;
    }

    const getRatio = (country_name, code) => {
        code = code.toLowerCase()
        if(end_data[country_name]){
            return end_data[country_name];
        }else{
            if(end_data[code]){
                return end_data[code];
            }else{
                if(convertCountryCode[country_name]){
                    code = convertCountryCode[country_name].toLowerCase()
                    if(end_data[code]){
                        return end_data[code];
                    }else{
                    }
                }
            }
        }        
        return -4;
    }

    const menScale = d3.scaleLinear()
                .domain([percentMin, percentMax])
                .range(["white", menColor])

    const womenScale = d3.scaleLinear()
                .domain([percentMin, percentMax])
                .range(["white", womenColor])

    //First Map
    map1.selectAll(".subunit")
        .data(topojson.feature(world, world.objects.subunits2).features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", function(d){
            return "black";
        })
        .attr("stroke-width", function(d){
            return "0.25";
        })
        .attr("fill", function(d) {
            var ratio = getMenPercent(d.properties.name, d.id);
            if(ratio < 0){
                return dummyColor;
            }
            return menScale(ratio);
        }).attr("transform", mapTranslateString)

    var gradient1 = svg1.append("defs")
        .append("linearGradient")
        .attr("id", "legendA2")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");

    gradient1.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);
    
    gradient1.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", menColor)
        .attr("stop-opacity", 1);
    
    svg1.append("text").attr("class", "labels")
      .attr("x", 70)
      .attr("y", 65)
      .style("font-family", "Open Sans Condensed")
      .style("font-size", "17")
      .text("Percentage of Male Gold Medalists: ")
      .attr("transform", "translate(30, -45)");
    
    var gradientScale1 = d3.scaleLinear().domain(menScale.domain()).range([width/2, 5*width/6]);
    var gradientAxis1 = d3.axisBottom(gradientScale1).ticks(5,d3.format(",%"));
    
    svg1.append("g").attr("class", "axis")
        .attr("transform","translate(0,20)")
        .call(gradientAxis1);

    svg1.append("rect")
        .attr("x", width/2)
        .attr("y", 10)
        .attr("width", width/3)
        .attr("height", 10)
        .style("fill", "url(#legendA2)");

    // Second Map

    map2.selectAll(".subunit")
      .data(topojson.feature(world, world.objects.subunits2).features)
      .enter().append("path")
      .attr("d", path)
      .attr("stroke", function(d){
          return "black";
      })
      .attr("stroke-width", function(d){
          return "0.25";
      })
      .attr("fill", function(d) {
          var ratio = getWomenPercent(d.properties.name, d.id);
          if(ratio < 0){
              return dummyColor;
          }
          return womenScale(ratio);
      }).attr("transform", mapTranslateString)

    svg2.append("text").attr("class", "labels")
      .attr("x", 70)
      .attr("y", 65)
      .style("font-family", "Open Sans Condensed")
      .style("font-size", "17")
      .text("Percentage of Female Gold Medalists: ")
      .attr("transform", "translate(30, -45)");

    var gradient2 = svg2.append("defs")
        .append("linearGradient")
        .attr("id", "legendB2")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
            .attr("spreadMethod", "pad");
    gradient2.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white")
        .attr("stop-opacity", 1);
    gradient2.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", womenColor)
        .attr("stop-opacity", 1);
    svg2.append("rect")
        .attr("x", width/2)
        .attr("y", 10)
        .attr("width", width/3)
        .attr("height", 10)
        .style("fill", "url(#legendB2)");

    var gradientScale2 = d3.scaleLinear().domain(womenScale.domain()).range([width/2, 5*width/6]);
    var gradientAxis2 = d3.axisBottom(gradientScale2).ticks(5,d3.format(",%"));
    svg2.append("g").attr("class", "axis")
        .attr("transform","translate(0,20)")
        .call(gradientAxis2);

}

function getMappings(){
    return {
        "Malaysia": "MYS", 
        "Dhekelia": "ESB", 
        "Cyprus": "CYP", 
        "Gaza": "GAZ", 
        "West Bank": "WEB", 
        "Lebanon": "LBN", 
        "S. Sudan": "SDS", 
        "Puntland": "SOP", 
        "Tanzania": "TZA", 
        "UNDOF Zone": "SYU", 
        "French Guiana": "GUF", 
        "Guyana": "GUY", 
        "Korean DMZ (south)": "KNX", 
        "Korean DMZ (north)": "KNZ", 
        "W. Sahara": "SAH", 
        "Namibia": "NAM", 
        "Syria": "SYX", 
        "St-Martin": "MAF", 
        "Sint Maarten": "SXM", 
        "Tajikistan": "TJK", 
        "Vietnam": "VNM", 
        "Flemish": "BFR", 
        "Walloon": "BWR", 
        "Macedonia": "MKD", 
        "Kosovo": "KOS", 
        "Adjara": "GEA", 
        "Ceuta": "SEC", 
        "Kyrgyzstan": "KGZ", 
        "Libya": "LBY", 
        "N. Ireland": "NIR", 
        "Zambia": "ZMB", 
        "Sudan": "SDN", 
        "Djibouti": "DJI", 
        "Eritrea": "ERI", 
        "Iraqi Kurdistan": "IRK", 
        "Iran": "IRN", 
        "Liechtenstein": "LIE", 
        "Côte d'Ivoire": "CIV", 
        "Vojvodina": "SRV", 
        "Senegal": "SEN", 
        "Qatar": "QAT", 
        "Saudi Arabia": "SAU", 
        "Botswana": "BWA", 
        "Melilla": "SEM", 
        "San Marino": "SMR", 
        "Haiti": "HTI", 
        "Kuwait": "KWT", 
        "Iraq": "IRR", 
        "Guatemala": "GTM", 
        "Pante Makasar": "TLP", 
        "Timor-Leste": "TLX", 
        "Monaco": "MCO", 
        "Myanmar": "MMR", 
        "Andorra": "AND", 
        "Afghanistan": "AFG", 
        "Serbia": "SRS", 
        "Montenegro": "MNE", 
        "Fed. of Bos. & Herz.": "BHF", 
        "Rep. Srpska": "BIS", 
        "USNB Guantanamo Bay": "USG", 
        "Cuba": "CUB", 
        "Colombia": "COL", 
        "Paraguay": "PRY", 
        "Brcko District": "BHB", 
        "Moldova": "MDA", 
        "Kaliningrad": "RUK", 
        "North Korea": "PRK", 
        "Gabon": "GAB", 
        "Niger": "NER", 
        "Togo": "TGO", 
        "Ghana": "GHA", 
        "Gibraltar": "GIB", 
        "United States of America": "USA", 
        "Venezuela": "VEN", 
        "Papua New Guinea": "PNX", 
        "Mauritania": "MRT", 
        "Río Muni": "GNR", 
        "Alaska": "USA", 
        "Hong Kong": "HKG", 
        "Vatican": "VAT", 
        "N. Cyprus": "CYN", 
        "Cyprus U.N. Buffer Zone": "CNM", 
        "Siachen Glacier": "KAS", 
        "South Korea": "KOX", 
        "Baikonur": "KAB", 
        "Akrotiri": "WSB", 
        "Crimea": "RUC", 
        "Wales": "WLS", 
        "England": "ENG", 
        "Scotland": "SCT", 
        "Brussels": "BCR", 
        "Antarctica": "ATB", 
        "Greenland": "GRL", 
        "N.Z. SubAntarctic Is.": "NZA", 
        "Isla Sala y Gomez": "CHS", 
        "Easter I.": "CHP", 
        "New Caledonia": "NCL", 
        "Galápagos Is.": "ECG", 
        "Philippines": "PHL", 
        "Sri Lanka": "LKA", 
        "Curaçao": "CUW", 
        "Aruba": "ABW", 
        "Hainan": "CHH", 
        "Turks and Caicos Is.": "TCA", 
        "Taiwan": "TWN", 
        "Kyushu": "JPY", 
        "Shikoku": "JPS", 
        "South Korea": "KXI", 
        "Honshu": "JPH", 
        "Hokkaido": "JPK", 
        "St. Pierre and Miquelon": "SPM", 
        "Iceland": "ISL", 
        "S. Orkney Is.": "ATS", 
        "Pitcairn Is.": "PCN", 
        "Fr. Polynesia": "PYF", 
        "Juan De Nova I.": "JUI", 
        "Kiribati": "KIR", 
        "Marshall Is.": "MHL", 
        "Lakshadweep": "INL", 
        "Trinidad": "TTD", 
        "Tobago": "TTG", 
        "Caribbean Netherlands": "NLY", 
        "St. Vin. and Gren.": "VCT", 
        "Barbados": "BRB", 
        "Martinique": "MTQ", 
        "Guadeloupe": "GLP", 
        "Montserrat": "MSR", 
        "Antigua": "ACA", 
        "St. Kitts and Nevis": "KNA", 
        "Barbuda": "ACB", 
        "U.S. Virgin Is.": "VIR", 
        "St-Barthélemy": "BLM", 
        "Puerto Rico": "PRI", 
        "Anguilla": "AIA", 
        "British Virgin Is.": "VGB", 
        "Cayman Is.": "CYM", 
        "Bermuda": "BMU", 
        "Heard I. and McDonald Is.": "HMD", 
        "Fr. S. Antarctic Lands": "FSA", 
        "Prince Edward Is.": "ZAI", 
        "Tristan da Cunha": "SHT", 
        "Réunion": "REU", 
        "Mauritius": "MUS", 
        "St. Helena": "SHS", 
        "Mayotte": "MYT", 
        "Ascension": "BAC", 
        "Zanzibar": "TZZ", 
        "Annobón": "GNA", 
        "São Tomé": "STS", 
        "Principe": "STA", 
        "Bioko": "GNK", 
        "Canary Is.": "ESC", 
        "Madeira": "PMD", 
        "Pantelleria": "ITP", 
        "Azores": "PAZ", 
        "Sicily": "ITY", 
        "Balearic Is.": "ESI", 
        "Sardinia": "ITD", 
        "Corsica": "FXC", 
        "Jersey": "JEY", 
        "Guernsey": "GGG", 
        "Isle of Man": "IMN", 
        "Bornholm": "DNB", 
        "Åland": "ALD", 
        "Faeroe Is.": "FRO", 
        "Tasmania": "AUA", 
        "Cocos Is.": "CCK", 
        "Diego Garcia NSF": "IOD", 
        "Singapore": "SGP", 
        "Nicobar Is.": "INN", 
        "Hawaii": "USH", 
        "Nansei-shoto": "JPO", 
        "Volcano Is.": "JPV", 
        "Bonin Is.": "JPB", 
        "Izu-shoto": "JPI", 
        "Jejudo": "KOJ", 
        "Ulleungdo": "KOU", 
        "Baengnyeongdo": "KOB", 
        "Jan Mayen I.": "NJM", 
        "Svalbard Is.": "NSV", 
        "Macquarie I.": "AUM", 
        "Chatham Is.": "NZC", 
        "Kermadec Is.": "NZK", 
        "Norfolk Island": "NFK", 
        "Cook Is.": "COK", 
        "Tonga": "TON", 
        "Wallis and Futuna Is.": "WLF", 
        "Solomon Is.": "SLB", 
        "Tuvalu": "TUV", 
        "Br. Indian Ocean Ter.": "IOT", 
        "Bougainville": "PNB", 
        "S. Sandwich Is.": "SGX", 
        "S. Georgia": "SGG", 
        "Bouvet I.": "BVT", 
        "Falkland Is.": "FLK", 
        "Niue": "NIU", 
        "American Samoa": "ASM", 
        "Socotra": "YES", 
        "Guam": "GUM", 
        "N. Mariana Is.": "MNP", 
        "Paracel Is.": "PFA", 
        "Europa Island": "EUI", 
        "Christmas I.": "CXR", 
        "Tokelau": "TKL", 
        "Spratly Is.": "PGA", 
        "Isole Pelagie": "ITI", 
        "Sark": "GGS", 
        "Alderney": "GGA", 
        "Peter I I.": "ATP", 
        "Macao": "MAC", 
        "South I.": "NZS", 
        "North I.": "NZN", 
        "Herm": "GGH", 
    }
}

requestData2()

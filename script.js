// Data object containing details about different datasets
const DATASETS = {
    videogames: {
        TITLE: "Video Game Sales", // Title of the dataset
        DESCRIPTION: "Top 100 Most Sold Video Games Grouped by Platform", // Description of the dataset
        FILE_PATH: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json" // URL to fetch the dataset
    },
    movies: {
        TITLE: "Movie Sales",
        DESCRIPTION: "Top 100 Highest Grossing Movies Grouped By Genre",
        FILE_PATH: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json"
    },
    kickstarter: {
        TITLE: "Kickstarter Pledges",
        DESCRIPTION: "Top 100 Most Pledged Kickstarter Campaigns Grouped By Category",
        FILE_PATH: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json"
    }
};

// Retrieve the dataset specified in the URL parameters, or use the default dataset
const urlParams = new URLSearchParams(window.location.search);
const DEFAULT_DATASET = "kickstarter"; // Fallback dataset if no parameter is provided
const DATASET = DATASETS[urlParams.get("data") || DEFAULT_DATASET];

// Update the page's title and description based on the selected dataset
document.getElementById("title").innerHTML = DATASET.TITLE;
document.getElementById("description").innerHTML = DATASET.DESCRIPTION;

// Select the body element for appending additional elements
const body = d3.select("body");

// Create and configure a tooltip div for displaying additional information on hover
const tooltip = body
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0); // Initially hidden

// Set up the SVG element and dimensions for the treemap
const svg = d3.select("#tree-map"),
    width = +svg.attr("width"), // Extract and parse the width attribute
    height = +svg.attr("height"); // Extract and parse the height attribute

// Define a colour scale for categories using D3's predefined colour schemes
const colour = d3.scaleOrdinal(d3.schemeCategory10);

// Configure the treemap layout with specified dimensions and padding
const treemap = d3.treemap().size([width, height]).paddingInner(0.5);

// Fetch the JSON data for the selected dataset
d3.json(DATASET.FILE_PATH)
    .then(data => {
        // Create a hierarchy structure from the dataset
        const root = d3.hierarchy(data)
            .eachBefore(d => {
                // Assign a unique ID to each node based on its name and parent
                d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
            })
            .sum(d => d.value) // Sum up the values to compute the layout
            .sort((a, b) => b.height - a.height || b.value - a.value); // Sort nodes by height and value

        // Apply the treemap layout to the hierarchy
        treemap(root);

        // Bind data to group elements and position them based on treemap layout
        const cell = svg.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("class", "group")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Append rectangles representing individual data points
        cell.append("rect")
            .attr("id", d => d.data.id)
            .attr("class", "tile")
            .attr("width", d => d.x1 - d.x0) // Width based on layout dimensions
            .attr("height", d => d.y1 - d.y0) // Height based on layout dimensions
            .attr("data-name", d => d.data.name) // Data attributes for accessibility and testing
            .attr("data-category", d => d.data.category)
            .attr("data-value", d => d.data.value)
            .attr("fill", d => colour(d.data.category)) // Assign colour based on category
            .on("mousemove", function (event, d) { // Show tooltip on hover
                tooltip.style("opacity", 0.9);
                tooltip.html(`Name: ${d.data.name}<br>Category: ${d.data.category}<br>Value: ${Number(d.data.value).toLocaleString()}`)
                    .attr("data-value", d.data.value)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () { // Hide tooltip on mouse out
                tooltip.style("opacity", 0);
            });

        // Append text labels inside each rectangle
        cell.append("text")
            .attr("id", "tile-text")
            .selectAll("tspan")
            .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g)) // Split name into segments for readability
            .enter()
            .append("tspan")
            .attr("x", 0) // Horizontal offset for text
            .attr("y", (d, i) => 8 + i * 9) // Vertical positioning for multiple lines
            .text(d => d);

        // Extract unique categories from the data
        const categories = [...new Set(root.leaves().map(nodes => nodes.data.category))];
        const legend = d3.select("#legend");
        const legendWidth = +legend.attr("width");
        const LEGEND_OFFSET = 0;
        const LEGEND_RECT_SIZE = 15; // Size of legend color boxes
        const LEGEND_H_SPACING = 150; // Horizontal spacing between legend items
        const LEGEND_V_SPACING = 10; // Vertical spacing between legend rows
        const legendElemsPerRow = Math.floor(legendWidth / LEGEND_H_SPACING);

        // Create and position legend items
        const legendElem = legend.append("g")
            .attr("transform", `translate(70,${LEGEND_OFFSET})`)
            .selectAll("g")
            .data(categories)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(${(i % legendElemsPerRow) * LEGEND_H_SPACING},${Math.floor(i / legendElemsPerRow) * (LEGEND_RECT_SIZE + LEGEND_V_SPACING)})`);

        // Append colored rectangles for each category in the legend
        legendElem.append("rect")
            .attr("width", LEGEND_RECT_SIZE)
            .attr("height", LEGEND_RECT_SIZE)
            .attr("class", "legend-item")
            .attr("fill", d => colour(d));

        // Append text labels next to legend rectangles
        legendElem.append("text")
            .attr("x", LEGEND_RECT_SIZE + 4) // Horizontal offset for text
            .attr("y", LEGEND_RECT_SIZE - 2) // Vertical alignment with legend box
            .text(d => d);
    });

/* TODO
 * - complete missing data on lola
 * - Add MPs
 * - display axis text labels
 * - Add filtering options ?
 * - Add PNG exports ?
*/

import Papa from "papaparse";
import iwanthue from "iwanthue";

import Graph from "graphology";
import { Sigma } from "sigma";
import { Coordinates } from "sigma/types";

import { createNodeCompoundProgram } from 'sigma/rendering/webgl/programs/common/node';
import NodePointWithBorderProgram from '@yomguithereal/sigma-experiments-renderers/node/node.point.border';
import NodeHaloProgram from '@yomguithereal/sigma-experiments-renderers/node/node.halo';
import { drawLabel, drawHover } from './custom-label';

const sigmaContainer = document.getElementById("sigma");
const titleContainer = document.getElementById("media_name");
const linkContainer = document.getElementById("media_link") as any;
const metadataContainer = document.getElementById("media_metadata");
const helpClickContainer = document.getElementById("helpclick");
const legendContainer = document.getElementById("legend-colors");
const histoContainer = document.getElementById("histogram");
const histoLegendContainer = document.getElementById("histogram-legend");
const histoTooltipContainer = document.getElementById("histogram-tooltip");
const histoHoverContainer = document.getElementById("histogram-hover");

const sigmaSettings = {
  minCameraRatio: 0.15,
  maxCameraRatio: 10,
  labelFont: "SourceCodePro",
  labelColor: {color: '#888'},
  labelWeight: 'bold',
  labelDensity: 1.5,
  labelGridCellSize: 300,
  nodeProgramClasses: {
    circle: createNodeCompoundProgram([
      NodeHaloProgram,
      NodePointWithBorderProgram
    ])
  },
  nodeHoverProgramClasses: {
    circle: NodePointWithBorderProgram
  },
  labelRenderer: drawLabel,
  hoverRenderer: drawHover,
  stagePadding: -10
};

const quantiFields = {
  "Gephi InDeg": {
    "label": "InDegree"
  },
  "Gephi OutDeg": {
    "label": "OutDegree"
  },
  "sum tweet": {
    "label": "Tweets in 2022"
  },
  "twitteruser": {
    "label": "Twitter users in 2022"
  },
  "median activity": {
    "label": "Tweets median per month in 2022"
  },
  "twitter score ranking fusion": {
    "label": "Twitter Score"
  },
  "ACPM_moy_visites_totales_site_par_mois": {
    "label": "Visites moyennes par mois (ACPM)"
  },
  "ACPM_moy_pages_site_vues_par_mois": {
    "label": "Pages vues moyennes par mois (ACPM)"
  },
  "fakenews": {
    "label": "Articles fact-checked as false (ScienceFeeback, DeFacto or Condor)"
  }
};

const qualiFields = {
  "clusters_legend": {
    "label": "Catégorie (Hyphe Louvain)",
    "color": "clusters_color"
  },
  "Editeur": {
    "label": "Qualification par l'État"
  },
  "Forme juridique": {
    "label": "Forme juridique"
  },
  "Qualification": {
    "label": "Qualification par l'État",
    "color": "generate"
  }
};

function displayDate(dt) {
  return dt.replace(/20(..)-(..)-(..)/, "$3/$2/$1");
}
function addClass(element, clss) {
  const classes = new Set(element.className.split(/\s+/));
  classes.add(clss);
  element.className = Array.from(classes).join(" ");
}

function rmClass(element, clss) {
  const classes = new Set(element.className.split(/\s+/));
  if (classes.has(clss))
    classes.delete(clss);
  element.className = Array.from(classes).join(" ");
}

const isAxisNode = (node) => /^[xy][01]_/.test(node);

const buildViz = function(medias, minVals, maxVals) {

  document.getElementById("edit-color").innerHTML = Object.keys(qualiFields)
    .filter((key) => qualiFields[key].color !== undefined)
    .map((key) => '<option value="' + key + '">' + qualiFields[key]["label"] + "</option>")
    .join("\n");

  document.getElementById("edit-size").innerHTML = '<option value="default">rien</option>' + Object.keys(quantiFields)
    .map((key) => '<option value="' + key + '">' + quantiFields[key]["label"] + "</option>")
    .join("\n");

  const graph = new Graph();

  // Build grid + axes
  let x = 0, y = 0;
  while (x < 12) {
    graph.addNode("x0_" + x, {
      x: x,
      y: 0,
      size: 0,
      borderColor: "black",
      color: "black"
    });
    graph.addNode("x1_" + x, {
      x: x,
      y: 11,
      size: 0,
      borderColor: "black",
      color: "black"
    });
    graph.addEdge("x0_" + x, "x1_" + x, {
      color: "#555",
      weight: 0.25
    })
    x++;
  }
  while (y < 12) {
    graph.addNode("y0_" + y, {
      x: 0,
      y: y,
      size: 0,
      borderColor: "black",
      color: "black"
    });
    graph.addNode("y1_" + y, {
      x: 11,
      y: y,
      size: 0,
      borderColor: "black",
      color: "black"
    });
    graph.addEdge("y0_" + y, "y1_" + y, {
      color: "#555",
      weight: 0.25
    })
    y++;
  }

  // Load medias
  medias.forEach(function(m) {
    if (!m.Label) return;
    graph.addNode(m.Label, {
      ...m,
      type: "circle",
      label: m.Label,
      url: m["HOME PAGE"],
      x: parseFloat(m.lrgen),
      y: parseFloat(m.antielite_salience),
      color: m.clusters_color,
      size: 6,
      borderSize: 1,
      borderColor: "555",
      haloSize: 0,
      haloIntensity: 0.3,
      haloColor: "#7C9"
    });
  });
  const renderer = new Sigma(graph, sigmaContainer, sigmaSettings);
  const camera = renderer.getCamera();
  const centerGraph =  () => camera.animate({
    x: 0.55,
    y: 0.58,
    ratio: 0.7,
    angle: 0
  }, { duration: 300 });
  centerGraph();

  document.getElementById("loader").remove();
  
  // Zoom buttons
  document.getElementById("zoom-in").onclick =
    () => camera.animatedZoom({ duration: 600 });
  document.getElementById("zoom-out").onclick =
    () => camera.animatedUnzoom({ duration: 600 });
  document.getElementById("zoom-reset").onclick = centerGraph;

  // Fullscreen buttons
   const fullscreenButton = document.getElementById("fullscreen"),
    regscreenButton = document.getElementById("regscreen");
  fullscreenButton.onclick = () => {
    const doc = document.documentElement as any;
    if (doc.requestFullscreen) {
      doc.requestFullscreen();
    } else if (doc.webkitRequestFullscreen) { /* Safari */
      doc.webkitRequestFullscreen();
    } else if (doc.msRequestFullscreen) { /* IE11 */
      doc.msRequestFullscreen();
    }
    fullscreenButton.style.display = "none";
    regscreenButton.style.display = "block";
    setTimeout(function() { renderer.refresh() }, 50);
  };

  regscreenButton.onclick = () => {
    const doc = document as any;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) { /* Safari */
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) { /* IE11 */
      doc.msExitFullscreen();
    }
    regscreenButton.style.display = "none";
    fullscreenButton.style.display = "block";
    setTimeout(function() { renderer.refresh() }, 50);
  };

  // Prepare list of nodes for search suggestions
  let suggestions = [],
    selectedNode = null,
    haloOption = "";

  const allSuggestions = graph.nodes()
    .filter(node => !isAxisNode(node))
    .map((node) => ({
      node: node,
      label: graph.getNodeAttribute(node, "label")
    }))
    .sort((a, b) => a.label < b.label ? -1 : 1);
  function feedAllSuggestions() {
    suggestions = allSuggestions.map(x => x);
  }
  feedAllSuggestions();

  function fillSuggestions() {
    document.getElementById("suggestions").innerHTML = suggestions
      .sort((a, b) => a.label < b.label ? -1 : 1)
      .map((node) => "<option>" + node.label + "</option>")
      .join("\n");
  }
  fillSuggestions();

  // Setup nodes input search for web browsers
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  function setSearchQuery(query="") {
    feedAllSuggestions();
    if (searchInput.value !== query)
      searchInput.value = query;

    if (query) {
      const lcQuery = query.toLowerCase();
      suggestions = [];
      graph.forEachNode((node, {label}) => {
        if (!isAxisNode(node) && label.toLowerCase().includes(lcQuery))
          suggestions.push({node: node, label: label});
      });

      const suggestionsMatch = suggestions.filter(x => x.label === query);
      if (suggestionsMatch.length === 1) {
        // Move the camera to center it on the selected node:
        const nodePosition = renderer.getNodeDisplayData(suggestionsMatch[0].node) as Coordinates;
        camera.animate(nodePosition, {duration: 500});
        clickNode(suggestionsMatch[0].node);
        suggestions = [];
      } else if (selectedNode) {
        clickNode(null);
      }
    } else if (selectedNode) {
      clickNode(null);
      feedAllSuggestions();
    }
    fillSuggestions();
  }
  searchInput.oninput = () => {
    setSearchQuery(searchInput.value || "");
  };
  searchInput.onblur = () => {
    if (!selectedNode)
      setSearchQuery("");
  };
  document.getElementById("search-icon").onclick = () => searchInput.focus();

  // Setup Nodes hovering
  renderer.on("enterNode", () => sigmaContainer.style.cursor = "pointer");
  renderer.on("leaveNode", () => sigmaContainer.style.cursor = "default");

  // Handle clicks on nodes
  function clickNode(node) {
    metadataContainer.innerHTML = "";
    if (!node || isAxisNode(node)) {
      selectedNode = null;
      titleContainer.textContent = "";
      helpClickContainer.style.display = "block";
        renderer.setSetting("nodeReducer", (n, attrs) =>
          haloOption ? {...attrs, haloSize: 150 * Math.sqrt(tweetsMedias[haloOption].data[n])} : attrs
        );
      return;
    }
    searchInput.value = graph.getNodeAttribute(node, "label");
    selectedNode = node;
    renderer.setSetting("nodeReducer", (n, attrs) =>
      haloOption
      ? ( n === node ? {...attrs, size: attrs.size * 1.2, highlighted: true, haloSize: 150 * Math.sqrt(tweetsMedias[haloOption].data[n])} : {...attrs, haloSize: 150 * Math.sqrt(tweetsMedias[haloOption].data[n])} )
      : ( n === node ? {...attrs, size: attrs.size * 1.2, highlighted: true} : attrs )
    );

    helpClickContainer.style.display = "none";
    titleContainer.textContent = searchInput.value;
    linkContainer.href = graph.getNodeAttribute(node, "url");
    let li = null, val = null;
    li = document.createElement("li");
    li.innerHTML = "<b>Left - Right:</b> " + graph.getNodeAttribute(node, "lrgen");
    metadataContainer.appendChild(li);
    li = document.createElement("li");
    li.innerHTML = "<b>Elitism:</b> " + graph.getNodeAttribute(node, "antielite_salience");
    metadataContainer.appendChild(li);
    Object.keys(qualiFields).forEach(function(key) {
      val = graph.getNodeAttribute(node, key);
      if (val === "" || val === undefined || (isNaN(val) && !/\w/.test(val))) return console.log("Filter quali field", key, val, "for", node);
      li = document.createElement("li");
      li.innerHTML = '<b>' + qualiFields[key]["label"] + "</b>: " + val;
      metadataContainer.appendChild(li);
    });
    Object.keys(quantiFields).forEach(function(key) {
      val = graph.getNodeAttribute(node, key);
      if (val === undefined || isNaN(val)) return console.log("Filter quanti field", key, val, "for", node);
      li = document.createElement("li");
      li.innerHTML = '<b>' + quantiFields[key]["label"] + "</b>: " + val;
      metadataContainer.appendChild(li);
    });
  }

  renderer.on("clickNode", (event) => clickNode(event.node));
  renderer.on("clickStage", () => setSearchQuery(""));
  renderer.on("doubleClickNode", (event) => {
    event.preventSigmaDefault();
    window.open(graph.getNodeAttribute(event.node, "url"));
  });
  renderer.on("doubleClickStage", (event) => event.preventSigmaDefault());
  renderer.on("doubleClickEdge", (event) => event.preventSigmaDefault());

  document.getElementById("edit-size").onchange = (e) => {
    const option = (document.getElementById("edit-size") as HTMLSelectElement).value;
    graph.forEachNode((node, attrs) => {
      if (isAxisNode(node)) return;
      if (option === "default")
        graph.setNodeAttribute(node, "size", 6);
      else graph.setNodeAttribute(node, "size", 20 * Math.sqrt(attrs[option] / (quantiFields[option].maxVal - quantiFields[option].minVal)));
    });
  };

  Object.keys(qualiFields).forEach((key) => {
    if (qualiFields[key].color !== "generate") return;
    const values = [];
    graph.forEachNode((node, attrs) => {
      if (isAxisNode(node)) return;
      if (!~values.indexOf(attrs[key])) values.push(attrs[key]);
    });
    const palette = iwanthue(values.length, {
      colorSpace: 'sensible',
      seed: '0.9404079128839915',
      clustering: 'force-vector',
      attempts: 5
    });
    qualiFields[key].color = key+"_color";
    graph.forEachNode((node, attrs) => {
      attrs[key+"_color"] = palette[values.indexOf(attrs[key])];
    });
  });

  document.getElementById("edit-color").onchange = (e) => {
    const option = (document.getElementById("edit-color") as HTMLSelectElement).value;
    let legend = {};
    graph.forEachNode((node, attrs) => {
      if (isAxisNode(node)) return;
      if (!legend[attrs[option]]) legend[attrs[option]] = attrs[qualiFields[option].color];
      graph.setNodeAttribute(node, "color", attrs[qualiFields[option].color]);
    });

    let li = null;
    legendContainer.innerHTML = "";
    Object.keys(legend).sort().forEach(function(key) {
      li = document.createElement("li");
      li.innerHTML = '<span style="background-color: ' + legend[key] + '"></span> ' + key;
      legendContainer.appendChild(li);
    });
  };
  document.getElementById("edit-color").onchange(null);

  document.getElementById("edit-halo").onchange = (e) => {
    const option = (document.getElementById("edit-halo") as HTMLSelectElement).value;
    haloOption = option;
    if (option === "") {
      renderer.setSetting("nodeReducer", (n, attrs) => attrs);
      histoContainer.innerHTML = "";
      return;
    }
    clickNode(null);
    renderer.setSetting("nodeReducer", (n, attrs) =>
      isAxisNode(n) ? attrs : {...attrs, haloSize: 150 * Math.sqrt(tweetsMedias[option].data[n])}
    );
    const barWidth = histoContainer.offsetWidth / Object.keys(tweetsMedias[option].total_by_day).length;
    const heightRatio = histoContainer.offsetHeight / tweetsMedias[option].max_val_by_day;
    let histo = "", hover = "";
    Object.keys(tweetsMedias[option].total_by_day).forEach((day) => {
      histo += '<span class="histobar" ' +
      'style="width: ' + barWidth + 'px; ' +
        'height: ' + tweetsMedias[option].total_by_day[day] * heightRatio + 'px">' +
    '</span>';
      hover += '<span class="histobar-hover" day="' + day + '" + tooltip="' + displayDate(day) + ': ' + tweetsMedias[option].total_by_day[day].toString().replace(/(...)$/, " $1") + ' tweets" style="width: ' + barWidth + 'px;"></span>';
    });
    histoContainer.innerHTML = histo;
    histoHoverContainer.innerHTML = hover;
    histoLegendContainer.innerHTML = '<div style="left: 0">' + displayDate(tweetsMedias[option].min_date) + '</div>' +
      '<div style="left: calc(85% - 75px);">' + displayDate(tweetsMedias[option].max_date) + '</div>';

    (document.querySelectorAll(".histobar-hover") as NodeListOf<HTMLElement>).forEach(bar => {
      bar.onmouseenter = e => {
        const tooltip = bar.getAttribute("tooltip"),
          day = bar.getAttribute("day");
        document.querySelectorAll(".histobar-hover.highlighted").forEach(b => rmClass(b, "highlighted"));
        addClass(bar, "highlighted");
        histoTooltipContainer.innerHTML = tooltip;
        histoTooltipContainer.style.display = "inline-block";
        const dims = bar.getBoundingClientRect();
        histoTooltipContainer.style.top = dims.bottom + "px";
        histoTooltipContainer.style.left = dims.left - 15 + "px";
        renderer.setSetting("nodeReducer", (n, attrs) =>
          selectedNode && n === selectedNode
          ? {...attrs, size: attrs.size * 1.2, highlighted: true, haloSize: 350 * Math.sqrt(tweetsMedias[haloOption].data_by_day[day][n])}
          : {...attrs, size: attrs.size, highlighted: false, haloSize: 350 * Math.sqrt(tweetsMedias[haloOption].data_by_day[day][n])}
        );
      };
      bar.onmouseleave = e => {
        rmClass(bar, "highlighted");
        histoTooltipContainer.style.display = "none";
        renderer.setSetting("nodeReducer", (n, attrs) =>
          haloOption
          ? ( selectedNode && n === selectedNode ? {...attrs, size: attrs.size * 1.2, highlighted: true, haloSize: 150 * Math.sqrt(tweetsMedias[haloOption].data[n])} : {...attrs, haloSize: 150 * Math.sqrt(tweetsMedias[haloOption].data[n])} )
          : ( selectedNode && n === selectedNode ? {...attrs, size: attrs.size * 1.2, highlighted: true} : attrs )
        );
      };
    });
  };
};

let resizing = null;
function resize() {
  sigmaContainer.style.height = window.innerHeight - 47 + "px";
  const availableHeight = window.innerHeight - 43,
    explicationsHeight = Math.min(330, availableHeight / 2) - 1,
    availableWidth = window.innerWidth,
    sidebarWidth = Math.max(350, availableWidth / 4);
  document.getElementById("sidebar").style.height = availableHeight + "px";
  document.getElementById("sidebar").style.width = sidebarWidth + "px";
  document.getElementById("explications").style.height = explicationsHeight+ "px";
  document.getElementById("legend").style.height = (availableHeight - explicationsHeight) + "px";
  document.getElementById("sigma").style.width = (availableWidth - sidebarWidth - 5) + "px";
  document.getElementById("interact").style.left = (sidebarWidth + 3) + "px";
}

window.onresize = () => {
  if (resizing) clearTimeout(resizing);
  resizing = setTimeout(resize, 0);
};
resize();

const tweetsMedias = {
  "nahel": {
    label: "La mort de Nahel",
    data: {},
    max_val: 0,
    data_by_day: {},
    max_val_by_day: 0,
    total_by_day: {},
    min_date: "9999",
    max_date: "0000"
  },
  "liot": {
    label: "La motion de censure LIOT",
    data: {},
    max_val: 0,
    data_by_day: {},
    max_val_by_day: 0,
    total_by_day: {},
    min_date: "9999",
    max_date: "0000"
//  },
//  "lola": {
//    label: "La mort de Lola",
//    data: {},
//    max_val: 0,
//    data_by_day: {},
//    max_val_by_day: 0,
//    total_by_day: {},
//    min_date: "9999",
//    max_date: "0000"
  }
};
Object.keys(tweetsMedias).forEach((corpus) => {
  document.getElementById("edit-halo").innerHTML += '<option value="' + corpus + '">' + tweetsMedias[corpus].label + '</option>';
  
  fetch("./data/tweets-by-media-" + corpus + ".csv")
    .then((res) => res.text())
    .then((data) => {
      Papa.parse(data, {
        header: true,
        step: function(row) {
          if (!row.data.media_label) return;
          tweetsMedias[corpus].data[row.data.media_label] = parseInt(row.data.count_tweets)
          if (tweetsMedias[corpus].max_val < tweetsMedias[corpus].data[row.data.media_label])
            tweetsMedias[corpus].max_val = tweetsMedias[corpus].data[row.data.media_label];
        },
        complete: function() {
          Object.keys(tweetsMedias[corpus].data).forEach((m) => {
            tweetsMedias[corpus].data[m] = tweetsMedias[corpus].data[m] / tweetsMedias[corpus].max_val
          });
        }
      });
    });
  
  fetch("./data/daily-tweets-by-media-" + corpus + ".csv")
    .then((res) => res.text())
    .then((data) => {
      Papa.parse(data, {
        header: true,
        step: function(row) {
          if (!row.data.media_label) return;
          if (!tweetsMedias[corpus].data_by_day[row.data.date]) {
            tweetsMedias[corpus].data_by_day[row.data.date] = {};
            tweetsMedias[corpus].total_by_day[row.data.date] = 0;
          }
          tweetsMedias[corpus].data_by_day[row.data.date][row.data.media_label] = parseInt(row.data.count_tweets);
          tweetsMedias[corpus].total_by_day[row.data.date] += parseInt(row.data.count_tweets);
          if (tweetsMedias[corpus].max_val_by_day < tweetsMedias[corpus].total_by_day[row.data.date])
            tweetsMedias[corpus].max_val_by_day = tweetsMedias[corpus].total_by_day[row.data.date];
          if (tweetsMedias[corpus].min_date > row.data.date)
            tweetsMedias[corpus].min_date = row.data.date
          if (tweetsMedias[corpus].max_date < row.data.date)
            tweetsMedias[corpus].max_date = row.data.date
        },
        complete: function() {
          Object.keys(tweetsMedias[corpus].data_by_day).forEach((d) => {
            Object.keys(tweetsMedias[corpus].data_by_day[d]).forEach((m) => {
              tweetsMedias[corpus].data_by_day[d][m] = tweetsMedias[corpus].data_by_day[d][m] / tweetsMedias[corpus].max_val_by_day
            });
          });
          console.log(tweetsMedias)
        }
      });
    });
});

fetch("./data/medias.csv")
  .then((res) => res.text())
  .then((data) => {
    const medias = [];
    const minVals = {};
    const maxVals = {};
    Papa.parse(data, {
      header: true,
      step: function(row) {
        row.data.fakenews = parseInt(row.data.n_science_false) + parseInt(row.data.n_defacto_false) + parseInt(row.data.n_condor_false);
        medias.push(row.data);
        Object.keys(quantiFields).forEach(function(key) {
            row.data[key] = parseFloat(row.data[key])
          if (quantiFields[key].minVal === undefined || quantiFields[key].minVal > row.data[key])
            quantiFields[key].minVal = row.data[key];
          if (quantiFields[key].maxVal === undefined || quantiFields[key].maxVal < row.data[key])
            quantiFields[key].maxVal = row.data[key];
        });
      },
      complete: function() {
        resize();
        buildViz(medias, minVals, maxVals);
      }
    });
  });

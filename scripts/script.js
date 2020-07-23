var skillNames = ["pra", "sum", "agi", "thi", "hun", "smi", "cra", "fle", "her", "run", "coo", "con", "fir", "woo", "far", "fis", "min", "div", "arc"];
var fullSkillNames = ["Prayer", "Summoning", "Agility", "Thieving", "Hunter", "Smithing", "Crafting", "Fletching", "Herblore", "Runecrafting", "Cooking", "Construction", "Firemaking", "Woodcutting", "Farming", "Fishing", "Mining", "Divination", "Archeology"];
var skillDropdown;
var categoryDropdown;
var methodsDropdown;
var table;
var mainTableDiv;
var trainingDisplay;
var selectedSkill;
var currXp;
var currXpTrain;
var records = {};
var lvlIndx;
var methodIndx;
var xpIndx;
var catIndx;
var reader = new XpcounterReader();
var mode = localStorage.xpmeter_mode == "start" ? "start" : "fixed";// fixed || start
var skillid = "";
var prevValue = 0;
var pauseTick = true;

function onLoad() {
	getData();
	skillDropdown = document.getElementById("skillDropdown");
	categoryDropdown = document.getElementById("categoryDropdown");
	methodsDropdown = document.getElementById("methodDropdown");
	mainTableDiv = document.getElementById("mainTableDiv");
	trainingDisplay = document.getElementById("trainingDisplay");
	currXp = document.getElementById("currExp");
	currXpTrain = document.getElementById("currXpTrain");
	table = document.getElementById("methodTable");
	for (var i = 0; i < skillNames.length; i++) {
		var el = document.createElement("option");
		el.text = fullSkillNames[i];
		el.value = skillNames[i];
		skillDropdown.add(el);
	}
	 startFindCounter();
	 setInterval(tick, 1000);
	 tick();
}

function getData() {
	var head = document.getElementsByTagName('head')[0];
	for (var i = 1; i < skillNames.length+1; i++) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://spreadsheets.google.com/feeds/cells/1YGpYeEt97XXws7mSOHPIumICZA7_Zu-LyDteHObSYsw/' + i + '/public/values?alt=json-in-script&callback=createRecordJson';
		head.appendChild(script);
	}
}

function createRecordJson(json) {
	var title = json.feed.title.$t
	var data = json.feed.entry;
	var row = [[]];
	if (data) {
		for(var r=0; r < data.length; r++) {
			var cell = data[r]["gs$cell"];
			var val = cell["$t"];
			if (!row[cell.row-1]) {
				row[cell.row-1] = [];
			}
			row[cell.row - 1][cell.col - 1] = val;
		}
		records[title] = {
			data: row,
			categories: []
		}
		if (records[title].data != undefined) {
			lvlIndx = records[title].data[0].indexOf('Level');
			methodIndx = records[title].data[0].indexOf('Method');
			xpIndx = records[title].data[0].indexOf('Xp');
			catIndx = records[title].data[0].indexOf('Category');
			for(var i = 1; i < records[title].data.length; i++) {
				if (!records[title].categories.includes(records[title].data[i][catIndx])) {
					records[title].categories.push(records[title].data[i][catIndx]);
				}
			}
		}
	}
}

function populateCategory() {
	table.setAttribute("style", "display: table");
	selectedSkill = skillDropdown.options[skillDropdown.selectedIndex].text;
	if (skillDropdown.options[skillDropdown.selectedIndex].text && records[selectedSkill].categories.length > 0) {
		document.getElementById("categoryDiv").setAttribute("style", "display: block;");
		document.getElementById("multiplierDiv").setAttribute("style", "display: block");
		// document.getElementById("methodDiv").setAttribute("style", "display: none");
		categoryDropdown.options.length = 0;
		records[selectedSkill].categories.sort();
		for (var i = 0; i < records[selectedSkill].categories.length; i++) {
			var el = document.createElement("option");
			el.text = records[selectedSkill].categories[i];
			el.value = records[selectedSkill].categories[i];
			categoryDropdown.add(el);
		}
		categoryDropdown.options.selectedIndex = 0;
		populateMethods();
		createTable();
	} else {
		document.getElementById("categoryDiv").setAttribute("style", "display: none;");
		document.getElementById("multiplierDiv").setAttribute("style", "display: none");
		document.getElementById("methodDiv").setAttribute("style", "display: none");
		table.setAttribute("style", "display: none");
	}
}

function createTable() {
	var tbody = document.getElementById("methodTable").getElementsByTagName('tbody')[0];
	while (tbody.hasChildNodes()) {
		tbody.removeChild(tbody.lastChild);
	}
	catSelected = categoryDropdown.options[categoryDropdown.selectedIndex].text;
	for (var row = 0; row < records[selectedSkill].data.length; row++) {
		if ((records[selectedSkill].data[row][catIndx] == catSelected || catSelected === 'All') && row != 0) {
			var tr = tbody.insertRow();
			for (var col = 0; col < records[selectedSkill].data[row].length; col++) {
				if (col != catIndx) {
					var td = tr.insertCell(col)
					if (col == xpIndx) {
						var m = Math.round(Number(records[selectedSkill].data[row][col]) + (Math.round(Number(records[selectedSkill].data[row][col]) * (Number(document.getElementById("multiplier").value) / 100))));
						td.innerHTML = formatNumber(m);
						var td = tr.insertCell(Number(col)+1);
						td.innerHTML = formatNumber(remainingActions(returnRemainingXp(), m));
					} else {
						td.innerHTML = records[selectedSkill].data[row][col];
					}
				}
			}
		}
	}
}

function populateMethods() {
	if (categoryDropdown.options[categoryDropdown.selectedIndex].value != '' || records[selectedSkill].categories.length != 0)  {
		document.getElementById("methodDiv").setAttribute("style", "display: block");
		methodsDropdown.options.length = 0;
		for (var row = 0; row < records[selectedSkill].data.length; row++) { 
			if (records[selectedSkill].data[row][catIndx] == categoryDropdown.options[categoryDropdown.selectedIndex].value) {
				var el = document.createElement("option");
				el.text = records[selectedSkill].data[row][methodIndx];
				methodsDropdown.add(el);
			}
		}
	} else {
		document.getElementById("methodDiv").setAttribute("style", "display: none");
	}

}

function remainingActions(remainingXp, methodXp) {
	var remaning = Math.ceil(remainingXp / methodXp);
	if (remaning > 0) {
		return remaning
	} else {
		return 0;
	}
}

function returnRemainingXp() {
	var t = document.getElementById("targetLvlorXp");
	if (t.options[t.selectedIndex].value == "targetLevel") {
		return Number(a1lib.lvltoxp(document.getElementById("target").value)) - Number(currXp.value);
	} else {
		return Number(document.getElementById("target").value) - Number(currXp.value);
	}
}

function switchToTraining() {
	mainTableDiv.setAttribute("style", "display: none");
	trainingDisplay.setAttribute("style", "display: block");
	currXpTrain.value = currXp.value;
}

function switchToTable() {
	mainTableDiv.setAttribute("style", "display: block");
	trainingDisplay.setAttribute("style", "display: none");
	currXp.value = currXpTrain.value;
}

function startFindCounter() {
	if (!reader.searching) { reader.pos = null;}
	reader.findAsync(function () {
		reader.read();
		var found = false;
		for (var a in reader.skills) { if (reader.values[a] > 0) { found = true; } }
		if (!found) { reader.pos = null; }

		if (!reader.pos) { findfails++; if (findfails >= 2) { findcounterError(); } }
		else { findfails = 0; }

		if (reader.pos) { reader.showPosition(); }
		if (reader.rounded) { xpcounterRoundError();}
		tick();
	});
	tick();
}

function tick() {
	var gainedXp;
	reader.read();
	skillid = skillDropdown.options[skillDropdown.selectedIndex].value;
	for (var i = 0; i < reader.skills.length; i++) {
		if (reader.skills[i] == skillid && currXp.value.length != 0) {
			if (prevValue != 0) {
				gainedXp = reader.values[i] - prevValue;
			}
			prevValue = reader.values[i];
			if (gainedXp > 0) {
				currXp.value = currXpTrain.value = Number(currXp.value) + Number(gainedXp);
				createTable();
			}
		}
	}
}

function xpcounterRoundError() {
	if (localStorage.xpmeter_roundwarning=="true") { return;}
	var box = promptbox2({ title: "Xpmeter info", width: 300, style: "popup" }, [
		{ t: "text", text: "Your RuneMetrics interface is set to round xp to K or M. This settings makes xp tracking inaccurate. You can turn this settings off in the RuneMetrics settings under the 'Metrics' tab, there is a toggle to 'show precise values'." },
		{ t: "h/11" },
		{ t: "button", text: "Close", onclick: function () { box.frame.close(); } },
		{ t: "button", text: "Don't show again", onclick: function () { box.frame.close(); localStorage.xpmeter_roundwarning = "true"; } },
	]);
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
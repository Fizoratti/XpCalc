var skillNames = ["pra", "sum", "agi", "thi", "hun", "smi", "cra", "fle", "her", "run", "coo", "con", "fir", "woo", "far", "fis", "min", "div", "arc"];
var fullSkillNames = ["Prayer", "Summoning", "Agility", "Thieving", "Hunter", "Smithing", "Crafting", "Fletching", "Herblore", "Runecrafting", "Cooking", "Construction", "Firemaking", "Woodcutting", "Farming", "Fishing", "Mining", "Divination", "Archeology"];
var skillDropdown;
var categoryDropdown;
var table;
var selectedSkill;
var currXp;
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

/**
 * Gets all the records from google sheets and populates the skill dropdown
 */
function onLoad() {
	getData();
	skillDropdown = document.getElementById("skillDropdown");
	categoryDropdown = document.getElementById("categoryDropdown");
	currXp = document.getElementById("currExp");
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

/**
 * Adds all the script calls to pull data from google spreadsheets
 */
function getData() {
	var head = document.getElementsByTagName('head')[0];
	for (var i = 1; i < skillNames.length+1; i++) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://spreadsheets.google.com/feeds/cells/1YGpYeEt97XXws7mSOHPIumICZA7_Zu-LyDteHObSYsw/' + i + '/public/values?alt=json-in-script&callback=createRecordJson';
		head.appendChild(script);
	}
}

/**
 * Creates a json object of all the skills and their data
 * @param {*} json 
 */
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
			categories: ['All']
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

/** 
 * Populates the category dropdown based on the selected skill and calls to create the table
*/
function populateCategory() {
	table.setAttribute("style", "display: table");
	if (skillDropdown.options[skillDropdown.selectedIndex].text) {
		document.getElementById("categoryDiv").setAttribute("style", "display: block;");
		document.getElementById("multiplierDiv").setAttribute("style", "display: block");
		document.getElementById("methodDiv").setAttribute("style", "display: block");
		selectedSkill = skillDropdown.options[skillDropdown.selectedIndex].text;
		categoryDropdown.options.length = 0;
		records[selectedSkill].categories.sort();
		for (var i = 0; i < records[selectedSkill].categories.length; i++) {
			var el = document.createElement("option");
			el.text = records[selectedSkill].categories[i];
			el.value = records[selectedSkill].categories[i];
			categoryDropdown.add(el);
		}
		categoryDropdown.options.selectedIndex = 0;
		createTable();
	} else {
		document.getElementById("categoryDiv").setAttribute("style", "display: none;");
		document.getElementById("multiplierDiv").setAttribute("style", "display: none");
		document.getElementById("methodDiv").setAttribute("style", "display: none");
		table.setAttribute("style", "display: none");
	}
}

/**
 * Creates the actual table minus the header (hard coded in html file)
 */
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

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
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
				currXp.value = Number(currXp.value) + Number(gainedXp);
				createTable();
			}
		}
	}
	// for (var a in hist) { hist[a].visible = false; }
	// for (var a = 0; a < reader.skills.length; a++) {
	// 	if (!reader.skills[a]) { continue; }
	// 	if (reader.values[a] == -1) { continue; }
	// 	skillread(reader.skills[a], reader.values[a]);
	// 	if (hist[reader.skills[a]]) { hist[reader.skills[a]].visible = true; }
	// }
}

// function setskillicon(skillid) {
// 	var newid = (typeof skillid == "string" ? iconoffset(skillid) : skillid);
// 	if (newid == -1) {
// 		elid("xpskillicon").style.display = "none";
// 	}
// 	else {
// 		elid("xpskillicon").style.backgroundPosition = "0px " + (-28 * newid) + "px";
// 		elid("xpskillicon").style.display = "";
// 	}
// }

// function fixintervals() {
// 	if (mode == "fixed") { measuretime = fixedtime; }
// 	if (mode == "start") { measuretime = currenttime - measurestart; }
// 	measuretime = Math.min(measuretime, deletetime);
// }

// function skillread(skill, xp) {
// 	if (!hist[skill]) {
// 		hist[skill] = { id: skill, offcount: 0, data: [], visible: true };
// 	}
// 	var obj = hist[skill];
// 	var last = obj.data[obj.data.length - 1];
// 	if (!last) { last = { xp: 0, time: 0 }; }

// 	var dxp = xp - last.xp;
// 	if (dxp == 0) { return; }

// 	var expected = dxp > 0 && dxp < 100000;//expected change is positive and below 100k
// 	if (last.xp == 0 || obj.offcount > 10 || expected) {

// 		//make previous records relative to new counter value (after counter reset or glitch)
// 		if (!expected && dxp != 0) {
// 			qw(skill + " reset, d=" + dxp);
// 			for (var b = 0; b < obj.data.length; b++) { obj.data[b].xp += dxp; }
// 		}

// 		obj.data.push({ xp: xp, time: time });
// 		obj.offcount = 0;
// 	}
// 	else {
// 		obj.offcount++;
// 	}

// 	if (skill == skillid && dxp != 0) { lastchange = currenttime; }
// }

function xpcounterRoundError() {
	if (localStorage.xpmeter_roundwarning=="true") { return;}
	var box = promptbox2({ title: "Xpmeter info", width: 300, style: "popup" }, [
		{ t: "text", text: "Your RuneMetrics interface is set to round xp to K or M. This settings makes xp tracking inaccurate. You can turn this settings off in the RuneMetrics settings under the 'Metrics' tab, there is a toggle to 'show precise values'." },
		{ t: "h/11" },
		{ t: "button", text: "Close", onclick: function () { box.frame.close(); } },
		{ t: "button", text: "Don't show again", onclick: function () { box.frame.close(); localStorage.xpmeter_roundwarning = "true"; } },
	]);

}
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
		selectedSkill = skillDropdown.options[skillDropdown.selectedIndex].text;
		categoryDropdown.options.length = 0;
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
					td.innerHTML = records[selectedSkill].data[row][col];
					if (col == xpIndx) {
						var td = tr.insertCell(Number(col)+1);
						td.innerHTML = remainingActions(returnRemainingXp(), records[selectedSkill].data[row][col]);
					}
				}
			}
		}
	}
}

function remainingActions(remainingXp, methodXp) {
	return Math.ceil(remainingXp / methodXp);
}

function returnRemainingXp() {
	var t = document.getElementById("targetLvlorXp");
	if (t.options[t.selectedIndex].value == "targetLevel") {
		return Number(a1lib.lvltoxp(document.getElementById("target").value)) - Number(currXp.value);
	} else {
		return Number(document.getElementById("target").value) - Number(currXp.value);
	}
}
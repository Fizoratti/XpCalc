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
var currMethodName;
var currMethodAmount;
var records = {};
var lvlIndx = 0;
var methodIndx = 1;
var xpIndx = 2;
var catIndx = 3;
var reader = new XpcounterReader();
var mode = localStorage.xpmeter_mode == "start" ? "start" : "fixed";// fixed || start
var skillid = "";
var prevValue = 0;
var viewTable = true;

/** Assigns elements to respective variables, creates skill dropdown, and finds counter **/
function onLoad() {
	skillDropdown = document.getElementById("skillDropdown");
	categoryDropdown = document.getElementById("categoryDropdown");
	methodsDropdown = document.getElementById("methodDropdown");
	mainTableDiv = document.getElementById("mainTableDiv");
	trainingDisplay = document.getElementById("trainingDisplay");
	currXp = document.getElementById("currExp");
	currXpTrain = document.getElementById("currXpTrain");
	currMethodName = document.getElementById("methodName");
	currMethodAmount = document.getElementById("methodAmount");
	table = document.getElementById("methodTable");
	getData();
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
	for (var i = 0; i < skillNames.length; i++) {
		let skillName = fullSkillNames[i]
		var url = 'https://sheets.googleapis.com/v4/spreadsheets/1YGpYeEt97XXws7mSOHPIumICZA7_Zu-LyDteHObSYsw/values/' + skillName + '?alt=json&key=AIzaSyAvamFsTw5DoHtrcXatlApL1GQhABhVIhI';
		$.getJSON(url).success(function(data) {
			createRecordJson(data.values, skillName);
		});
	}
	mainTableDiv.setAttribute("style", "display: block");
}

/* 
	creates the records objects in the form of: 
	{
		prayer: {
			data: [ { lvl: '1', method: 'Ashes', xp: '4', category: 'ash' } ],
			categories: ['Bones and Ashes', 'Urns']
		}
	}
*/
function createRecordJson(data, skillName) {
	skillingMethodValues = [];
	if (data) {
		for(var r=1; r < data.length; r++) {
			skillingMethodValues.push({
				lvl: data[r][lvlIndx],
				method: data[r][methodIndx],
				xp: data[r][xpIndx],
				category: data[r][catIndx]
			});
		}
		records[skillName] = {
			data: skillingMethodValues,
			categories: []
		};
		for(var i = 0; i < records[skillName].data.length; i++) {
			if (!records[skillName].categories.includes(records[skillName].data[i].category)) {
				records[skillName].categories.push(records[skillName].data[i].category);
			}
		}
	}
}

function populateCategory() {
	table.setAttribute("style", "display: table");
	selectedSkill = skillDropdown.options[skillDropdown.selectedIndex].text;
	if (skillDropdown.options[skillDropdown.selectedIndex].text && records[selectedSkill].categories && records[selectedSkill].categories.length > 0) {
		document.getElementById("categoryDiv").setAttribute("style", "display: block;");
		document.getElementById("multiplierDiv").setAttribute("style", "display: block");
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
		if ((records[selectedSkill].data[row].category == catSelected || catSelected === 'All')) {
			var tr = tbody.insertRow();
			var td = tr.insertCell(0);
			td.innerHTML = records[selectedSkill].data[row].lvl;
			td = tr.insertCell(1);
			td.innerHTML = records[selectedSkill].data[row].method;
			td = tr.insertCell(2);
			var m = +(Number(records[selectedSkill].data[row].xp) + (Number(records[selectedSkill].data[row].xp) * (Number(document.getElementById("multiplier").value) / 100))).toFixed(1);
			td.innerHTML = formatNumber(m);
			td = tr.insertCell(3);
			td.innerHTML = formatNumber(remainingActions(returnRemainingXp(), m));
		}
	}
}

function populateMethods() {
	if (categoryDropdown.options[categoryDropdown.selectedIndex].value != '' || records[selectedSkill].categories.length != 0)  {
		document.getElementById("methodDiv").setAttribute("style", "display: block");
		methodsDropdown.options.length = 0;
		for (var row = 0; row < records[selectedSkill].data.length; row++) { 
			if (records[selectedSkill].data[row].category == categoryDropdown.options[categoryDropdown.selectedIndex].value || categoryDropdown.options[categoryDropdown.selectedIndex].value == "All") {
				var el = document.createElement("option");
				el.text = records[selectedSkill].data[row].method;
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
	viewTable = false;
	mainTableDiv.setAttribute("style", "display: none");
	trainingDisplay.setAttribute("style", "display: block");
	trainingUpdate();
}

function trainingUpdate() {
	currXpTrain.value = currXp.value;
	var selectedMethod = methodsDropdown.options[methodsDropdown.selectedIndex].value;
	for (var row = 0; row < records[selectedSkill].data.length; row++) {
		if (records[selectedSkill].data[row].method == selectedMethod && records[selectedSkill].data[row].category == categoryDropdown.options[categoryDropdown.selectedIndex].value) {
			currMethodName.innerHTML = selectedMethod;
			var m = Math.round(Number(records[selectedSkill].data[row].xp) + (Math.round(Number(records[selectedSkill].data[row].xp) * (Number(document.getElementById("multiplier").value) / 100))));
			currMethodAmount.innerHTML = formatNumber(remainingActions(returnRemainingXp(), m));
		}
	}
}

function switchToTable() {
	viewTable = true;
	mainTableDiv.setAttribute("style", "display: block");
	trainingDisplay.setAttribute("style", "display: none");
	currXp.value = currXpTrain.value;
	createTable();
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
				if (viewTable) {
					createTable();
				} else {
					trainingUpdate();
				}
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

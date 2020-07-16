var skillNames=["pra","sum","dun","agi","thi","sla","hun","smi","cra","fle","her","run","coo","con","fir","woo","far","fis","min","div","inv","arc"];
var fullSkillNames=["Prayer","Summoning","Dungeoneering","Agility","Thieving","Slayer","Hunter","Smithing","Crafting","Fletching","Herblore","Runecrafting","Cooking","Construction","Firemaking","Woodcutting","Farming","Fishing","Mining","Divination","Invention","Archeology"];
var skillDropdown;
var categoryDropdown;

function onLoad() {
	skillDropdown = document.getElementById("skillDropdown");
	categoryDropdown = document.getElementById("categoryDropdown");
	for(var i = 0; i < skillNames.length; i++) {
		var el = document.createElement("option");
		el.text = fullSkillNames[i];
		el.value = skillNames[i];
		skillDropdown.add(el);
	}
}

function populateCategory() {
	var skillSelection = skillDropdown.options[skillDropdown.selectedIndex].value;
}
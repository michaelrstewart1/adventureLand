//main

var attack_mode = true
var party = get_party();
var partyKeys = Object.keys(party);

setTimeout(function () {
	setInterval(function(){
		party = get_party();
		partyKeys = Object.keys(party);
		use_regen();
		loot();
		doInvites();
    
		switch(character.ctype){
			case "warrior":
				tankCombat();
				break;
			case "priest":
				priestCombat();
				break;
			default: 
				defaultCombat();
		}
	},1000/4); // Loops every 1/4 seconds.
}, 1000); //Delay execution of Grind Code to load ajax.

function tankCombat() {
	if (!attack_mode || character.rip || is_moving(character)) {
		return;
	}

	mainTank();
}

function priestCombat() {
	if (character.rip || is_moving(character)) {
		return;
	}

	if (character.party) {
		var mainAssist = getMainAssist()
		if (mainAssist) {
			mode = "assist"
		} else {
			return;
		}
	} else {
		return;
	}

	if (!is_in_range(mainAssist)) {
		catchUpTo(mainAssist);
	} else {
		priestEngage(mainAssist);
	}
}
function defaultCombat() {
	var player;

	if (!attack_mode || character.rip) {
		return;
	}
	
	if (character.party) {
		var mainAssist = getMainAssist()
		if (mainAssist) {
			mode = "assist"
		} else {
			return;
		}
	} else {
		mode = "solo";
	}

	if (mode == "assist") {
		assist(mainAssist);
	} else if (mode == "solo") {
		goSolo();
	}
}

var urls = [
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/main.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/party.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/engagement.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/movement.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/healing.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/gui.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/items.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/mage.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/priest.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/ranger.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/tank.js'
]

$.each(urls, function(i, u) {
	$.ajax(u, {
		type: 'POST',
		dataType: "script",
		async: false,
		cache: true
	});
});

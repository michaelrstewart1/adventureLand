//ranger
var attack_mode=true

setTimeout(function () {
	setInterval(function() {
		use_regen();
		loot();
		doInvites();
		update_xptimer();

		//var party = get_party();
		//var partyKeys = Object.keys(party);
		var player;

		if (!attack_mode || character.rip) {
			return;
		}
		
		if (character.party != "") {
			var mainAssistName = getMainAssist()
			if (mainAssistName) {
				player = get_player(mainAssistName);
				if (player) {
					mode = "assist"
				} else {
					mode = "solo"	
				}
			} else {
				mode = "solo"	
			}
		} else {
			mode = "solo"
		}

		if (mode == "assist") {
			assist(player);
		} else if (mode == "solo") {
			goSolo();
		}

	},1000/4); // Loops every 1/4 seconds.
}, 1000); //Delay execution of Grind Code to load ajax.

var urls = [
	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/movement.js',
	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/engagement.js',
	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/healing.js',
	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/gui.js',
	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/party.js',
	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/items.js',
//	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/mage.js',
//	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/priest.js',
//	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/ranger.js',
//	'https://raw.githubusercontent.com/michaelrstewart1/adventureLand/master/tank.js'
]

$.each(urls, function(i, u) {
	$.ajax(u, {
		type: 'POST',
		dataType: "script",
		async: false,
		cache: true
	});
});

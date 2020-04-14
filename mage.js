//mage

var attack_mode=true

setInterval(function() {
	use_regen();
	loot();
	doInvites();
	update_xptimer();
	
	var party = get_party();
	var partyKeys = Object.keys(party);
	var player;
	
	if (!attack_mode || character.rip) {
		return;
	}
	
	if (party["Beef"]) {
		player = get_player("Beef");
		if (player) {
			mode = "assist"
		}
	} else {
		//log("no party found. Going solo");
	}

	if (mode == "assist") {
		assist(player);
	} else if (mode == "solo") {
		goSolo();
	}

},1000/4); // Loops every 1/4 seconds.

var urls = [
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/movement.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/engagement.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/healing.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/gui.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/party.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/items.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/mage.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/priest.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/ranger.js',
//	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand/tank.js'
]

$.each(urls, function(i, u) {
	$.ajax(u, {
		type: 'POST',
		dataType: "script",
		async: false,
		cache: true
	});
});

//priest
//pragmus

var attack_mode = false
var party = get_party();
var partyKeys = Object.keys(party);

setTimeout(function () {
	setInterval(function() {
		if (character.rip || is_moving(character)) {
			return;
		}
		party = get_party();
		partyKeys = Object.keys(party);
		use_regen();
		loot();
		doInvites();

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
	},1000/4); // Loops every 1/4 seconds.
}, 1000); //Delay execution of Grind Code to load ajax.

var urls = [
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/movement.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/engagement.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/healing.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/gui.js',
	'https://cdn.jsdelivr.net/gh/michaelrstewart1/adventureLand@master/party.js',
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


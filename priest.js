//priest
//pragmus

var attack_mode = false

setTimeout(function () {
	setInterval(function() {
		//use_hp_or_mp();
		use_regen();
		loot();
		doInvites();
		update_xptimer();

		if (character.rip || is_moving(character)) {
			return;
		}

		if (character.party != "") {
			var mainAssistName = getMainAssist()
			if (mainAssistName) {
				player = get_player(mainAssistName);
				if (player) {
					mode = "assist"
				} else {
					return;
				}
			} else {
				return;
			}
		} else {
			return;
		}
		var currentTarget = get_target();
		if (!currentTarget) {
			change_target(player);
		}

		if (!is_in_range(player)) {
			catchUpTo(character, player);
		} else {
			priestEngage(player);
		}
	},1000/4); // Loops every 1/4 seconds.
}, 1000); //Delay execution of Grind Code by 500 milliseconds to load ajax.

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


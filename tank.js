//tank
//beef

var attack_mode = true

setTimeout(function () {
	setInterval(function(){
		use_regen();
		loot();
		doInvites();
		update_xptimer();

		if (!attack_mode || character.rip || is_moving(character)) {
			return;
		}

		mainTank();

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

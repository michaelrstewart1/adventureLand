//hp and mp management

function use_regen() {
	var manaPercent = character.mp/character.max_mp;
	var healthPercent = character.hp/character.max_hp;
	
	if (manaPercent < 0.25 && !is_on_cooldown("use_mp")) {
		log("Getting low on mana. Using mana regen.");
		use_skill("regen_mp");
	} else if (healthPercent < 0.5 && !is_on_cooldown("use_hp")) {
		log("Getting low on health. Using health regen.");
		use_skill("regen_hp");
	} else if (manaPercent < 0.75 && !is_on_cooldown("use_mp")) {
		log("Topping off mana.");
		use_skill("regen_mp");
	} else if (healthPercent < 1 && !is_on_cooldown("use_hp")) {
		log("Topping off health.");
		use_skill("regen_hp");
	}
	return;
}

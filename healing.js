//hp and mp management
var last_heal = new Date();

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

function doHeal() {
	if (parent.safeties && parent.mssince(last_heal) < min(200, parent.character.ping*3)) {
		return;
	}
	var used = false;
	if (new Date() < parent.next_skill.use_hp) return;
	if (parent.character.mp / parent.character.max_mp < 0.25) {
		parent.use_skill('regen_mp',parent.character);
		used = true;
	} else if (parent.character.hp < parent.character.max_hp) {
		parent.use_skill('regen_hp',parent.character);
		used = true;
	}
	if (used) last_heal = new Date();
}

function healParty(party) {
	var partyArray = [];
	var tempMember;
	var partyMember;
	var numberNeedingHeal = 0;
	for (let i in party) {
		partyMember = get_player(party[i]);
		if (partyMember) {
			if (partyMember.hp < partyMember.max_hp && is_in_range(partyMember)) {
				numberNeedingHeal++;
			}
			tempMember = {
				name: partyMember.name,
				hp: partyMember.hp,
				max_hp: partyMember.max_hp,
				percent_hp: partyMember.hp/partyMember.max_hp,
				in_range: is_in_range(partyMember)
			}
			if (is_in_range(partyMember)) {
				partyArray.push(tempMember);
			}
		}
	}
	if (numberNeedingHeal > 1 && !is_on_cooldown("partyheal")) {
		//if (use_skill("partyheal")) {
		//	return true;
		//}
	}
	
	partyArray.sort(compare);
	for (let p in partyArray) {
		if (partyArray[p].percent_hp < 0.8 && partyArray[p].in_range) {
			//heal them
			if (!is_on_cooldown('attack')) {
				log("Healing "+partyArray[p].name+" at "+partyArray[p].hp+" ("+partyArray[p].percent_hp+"%)");
				heal(get_player(partyArray[p].name)).then(function(data){reduce_cooldown("heal",character.ping);});
				return true;
			} else {
				set_message("Heal CD");
				return true;
			}
		}
	}
	return false;
}

function compare(a, b) {
	// Use toUpperCase() to ignore character casing
	const percentA = a.percent_hp;
	const percentB = b.percent_hp;
	const hpA = a.hp;
	const hpB = b.hp;

	let comparison = 0;
	if (hpA > hpB) {
		comparison = 1;
	} else if (hpA < hpB) {
		comparison = -1;
	}
	return comparison;
}

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

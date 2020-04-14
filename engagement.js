//engagement of targets
var mode = "solo";

function assist(player) {
	if (!is_in_range(player) && !seeking) {
		catchUpTo(player);
	} else {
		var whatToAttack = parent.entities[get_player(player.name).target];
		if (whatToAttack) {
			engageTarget(whatToAttack);
		}
	}	
}

function engageTarget(target) {
	//check if in range
	if (is_in_range(target)) {
		//if in range, either stand or kite depending on their target
		if (target.target == character.name) {
			//they are targeting me
			//kite if we have larger range, otherwise stand
			if (target.range < character.range) {
				kite(target);
			}
		} else {
			//they are in range and not targeting us. Hold position
			if (target.target == "" && distance(character,target) <= target.range) {
				if (target.range < character.range) {
					//getting out of range before engaging
					log("getting out of range before first hit");
					kite(target);
				}
			}
		}
		
	} else {
		//they are out of range. Approach them
		if (!character.moving && !seeking) {
			log("Moving towards target");
			smarter_move(
				target.x,
				target.y,
				character,
				target
			);
		}
	}
	
	//check if in range and attack
	if (is_in_range(target) && can_attack(target) && !is_on_cooldown("attack")) {
		if (target.target == "" && distance(character,target) <= target.range) {
			//too close. wait until we get out of range
			log("getting out of range before attacking");
		} else {
			attack(target);
		}
	}
}

function goSolo() {
	//check for currently targeted monster
	var target=get_targeted_monster();
	
	//if nothing already targeted, target nearest monster
	if (!target) {
		//if we need to rest, then rest
		//no need to rest
		//target nearest monster
		target=get_nearest_monster({min_xp:1000,max_att:750});
		
		//if we found a monster, target it
		if (target) {
			change_target(target);

		} else {
			//no monsters found :(
			//try again in 0.25 seconds
			set_message("No Monsters");
			return;
		}
	}
	
	if (target) {
		engageTarget(target);
	}
}

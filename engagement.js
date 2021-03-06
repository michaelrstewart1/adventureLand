//engagement of targets
var mode = "solo";
var party = get_party();
var partyKeys = Object.keys(party);

function getMainAssist() {
	if (character.party) {
		var highestTankLevel = 0;
		var tank;

		for (let i in partyKeys) {
			let potentialTank = get("character_data_"+partyKeys[i]);
			//log(potentialTank);
			if (potentialTank) {
				if (potentialTank.ts > Date.now() - 2000 && potentialTank.level > highestTankLevel && potentialTank.ctype == "warrior") {
					highestTankLevel = potentialTank.level;
					tank = potentialTank;
				} else if (potentialTank.ts <= Date.now() - 2000) {
					send_cm(partyKeys[i], {'command':'get_character_data'});
					return;
				}
			} else if (players.indexOf(partyKeys[i]) >= 0) {
				send_cm(partyKeys[i], {'command':'get_character_data'});
				return;
			}
		}
		if (tank) {
			return tank;
		} else {
			return;	
		}
	} else {
		return
	}
}

function priestEngage(player) {
	if (character.party) {
		var healedSomeone = healParty(partyKeys);
		if (!healedSomeone) {
			//we didn't heal someone, so lets try to assist
			let realPlayerObject = get_player(player.name);
			if (!realPlayerObject) return;
			
			var whatToAttack = parent.entities[realPlayerObject.target];
			if (whatToAttack && is_in_range(whatToAttack) && !is_on_cooldown("attack")) {
				if (!is_in_range(whatToAttack)) {
					log("Target out of range. Moving closer");
					smarter_move(
						whatToAttack.x,
						whatToAttack.y,
						character,
						whatToAttack
					);
				} else {
					attack(whatToAttack);
				}
			}
		}
	}
}

function assist(player) {
	if (!is_in_range(player) && !seeking) {
		catchUpTo(player);
	} else {
		let playerToAssist = get("character_data_"+player.name);
		if (playerToAssist) {
			if (playerToAssist.ts > Date.now() - 2000) {
				var whatToAttack = parent.entities[playerToAssist.target];
				if (whatToAttack) {
					engageTarget(whatToAttack);
				}
			} else {
				//get new data
				send_cm(player.name, {'command': 'get_character_data'});
				return;
			}
		} else {
			//get new data
			send_cm(player.name, {'command': 'get_character_data'});
			return;
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
			if (target.range < character.range && character.ctype !== "warrior") {
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

function mainTank() {
	var target = get_targeted_monster();
	if (!target) {
		if (character.targets > 0) {
			target=get_nearest_attacker();
			if (target) {
				change_target(target);
			} else {
				set_message("No Monsters");
			}
		} else {
			target=get_nearest_monster({min_xp:200,max_att:200});
			if (target) {
				change_target(target);
			} else {
				set_message("No Monsters");
			}
		}
	}
	//even though we have a target, make sure we don't need to 
	//switch targets to b'tect a best buddy
	if (character.party) {
		var targetToTaunt = protect();
		if (targetToTaunt) {
			target = targetToTaunt;
			if (is_in_range(target) && !is_on_cooldown("taunt")) {
				log("Taunt "+targetToTaunt.name);
				use_skill("taunt");
			} else if (!is_in_range(target) && !is_on_cooldown("charge")) {
				log("Charging "+targetToTaunt.name);
				use_skill("charge");	
			}
		}
	}
	
	if (target) {
		engageTarget(target);
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
		target=get_nearest_monster({min_xp:200,max_att:200});
		
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

function get_nearest_attacker() {
	var min_d=999999;
	var target;
	for (id in parent.entities) {
		var current=parent.entities[id];
		if (current.type!="monster" || !current.visible || current.rip || current.invincible) continue;
		if (current.target != character.name) continue;
		var c_dist=distance(character,current);
		if (c_dist<min_d) {
			min_d=c_dist;
			target=current;
		}
	}
	return target;
}

function protect() {
	for (id in parent.entities) {
		var current=parent.entities[id];
		if (current.type!="character" || current.rip) continue;
		if (current.party != character.party) continue;
		if (current.targets == 0) continue;
		if (!can_move_to(current.x,current.y)) continue;
		for (monsterID in parent.entities) {
			var currentMonster=parent.entities[monsterID];
			if (currentMonster.type != "monster") continue;
			if (currentMonster.target != current.name) continue;
			if (!can_move_to(currentMonster.x,currentMonster.y)) continue;
			return currentMonster;
		}
	}
}

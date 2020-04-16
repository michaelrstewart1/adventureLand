//////////////////////////////////////////////////////////////
////////// CORE

/////////// END CORE
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// ENGAGEMENT
//engagement of targets
var mode = "solo";

function getMainAssist() {
	if (character.party) {
		var highestTankLevel = 0;
		var tank;
		for (let i in partyKeys) {
			let potentialTank = get("character_data_"+partyKeys[i]);
			if (potentialTank) {
				if (potentialTank.ts > Date.now() - 2000 && potentialTank.level > highestTankLevel && potentialTank.ctype == "warrior") {
					highestTankLevel = potentialTank.level;
					tank = potentialTank;
				}
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
	if (!is_in_range(player)) {
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
			log("Taunt "+targetToTaunt.name);
			target = targetToTaunt;
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
/////////// END ENGAGEMENT
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// GUI
//GUI components
var minute_refresh; // how long before the clock resets

var lastcc = 0;
init_ccmeter();
function init_ccmeter() {
	let $ = parent.$;
	let statbars = $('#bottommid');

	statbars.find('#ccmeter').remove();

	let ccmeter = $('<div id="ccmeter"></div>').css({
		fontSize: '15px',
		color: 'white',
		textAlign: 'center',
		display: 'table',
		width: "50%",
		margin: "0 auto"
	});

	let ccmeter_content = $('<div id="ccmetercontent"></div>')
	.html("<div><div id='ccmeterfill'></div></div>")
	.css({
		display: 'table-cell',
		verticalAlign: 'middle',
		background: 'green',
		border: 'solid gray',
		borderWidth: '4px 4px 0px, 4px',
		height: '15px',
		color: '#FFD700',
		textAlign: 'center',
		width: "100%",
	})
	.appendTo(ccmeter);
	statbars.children().first().after(ccmeter);

	update_ccmeter();
}



function update_ccmeter()
{
	let $ = parent.$;
	var fillAmount = ((character.cc/180)*100).toFixed(0);
	
	$("#ccmeterfill").css({
		background: 'red',
		height: '15px',
		color: '#FFD700',
		textAlign: 'center',
		width: fillAmount + "%",
	});
}

//Clean out an pre-existing listeners
if (parent.prev_handlersccmeter) {
    for (let [event, handler] of parent.prev_handlersccmeter) {
      parent.socket.removeListener(event, handler);
    }
}

parent.prev_handlersccmeter = [];

//handler pattern shamelessly stolen from JourneyOver
function register_ccmeterhandler(event, handler) 
{
    parent.prev_handlersccmeter.push([event, handler]);
    parent.socket.on(event, handler);
};

function ccmeter_playerhandler(event){
	if(event.cc != lastcc)
	{
		update_ccmeter();
		lastcc = event.cc;
	}
}

register_ccmeterhandler("player", ccmeter_playerhandler);

function init_xptimer(minref) {
  minute_refresh = minref || 1;
  parent.add_log(minute_refresh.toString() + ' min until tracker refresh!', 0x00FFFF);

  let $ = parent.$;
  let brc = $('#bottomrightcorner');

  brc.find('#xptimer').remove();

  let xpt_container = $('<div id="xptimer"></div>').css({
    background: 'black',
    border: 'solid gray',
    borderWidth: '5px 5px',
    width: '320px',
    height: '96px',
    fontSize: '28px',
    color: '#77EE77',
    textAlign: 'center',
    display: 'table',
    overflow: 'hidden',
    marginBottom: '-5px'
  });

  //vertical centering in css is fun
  let xptimer = $('<div id="xptimercontent"></div>')
    .css({
      display: 'table-cell',
      verticalAlign: 'middle'
    })
    .html('Estimated time until level up:<br><span id="xpcounter" style="font-size: 40px !important; line-height: 28px">Loading...</span><br><span id="xprate">(Kill something!)</span>')
    .appendTo(xpt_container);

  brc.children().first().after(xpt_container);
}

var last_minutes_checked = new Date();
var last_xp_checked_minutes = character.xp;
var last_xp_checked_kill = character.xp;
// lxc_minutes = xp after {minute_refresh} min has passed, lxc_kill = xp after a kill (the timer updates after each kill)

function update_xptimer() {
  if (character.xp == last_xp_checked_kill) return;

  let $ = parent.$;
  let now = new Date();

  let time = Math.round((now.getTime() - last_minutes_checked.getTime()) / 1000);
  if (time < 1) return; // 1s safe delay
  let xp_rate = Math.round((character.xp - last_xp_checked_minutes) / time);
  if (time > 60 * minute_refresh) {
    last_minutes_checked = new Date();
    last_xp_checked_minutes = character.xp;
  }
  last_xp_checked_kill = character.xp;

  let xp_missing = parent.G.levels[character.level] - character.xp;
  let seconds = Math.round(xp_missing / xp_rate);
  let minutes = Math.round(seconds / 60);
  let hours = Math.round(minutes / 60);
  let counter = `${hours}h ${minutes % 60}min`;

  $('#xpcounter').text(counter);
  $('#xprate').text(`${ncomma(xp_rate)} XP/s`);
}

function ncomma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

init_xptimer(5);
/////////// END GUI
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// HEALING
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
/////////// END HEALING
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// ITEMS
var uc = false; //Enable Upgrading/Compounding/selling/exchanging of items = true, Disable Upgrading/Compounding/selling/exchanging of items = false
var upgrade_level = 8; //Max level it will stop upgrading items at if enabled
var compound_level = 3; //Max level it will stop compounding items at if enabled
swhitelist = []; //swhitelist is for the selling of items
ewhitelist = []; //ewhitelist is for the exchanging of items
uwhitelist = []; //uwhitelist is for the upgrading of items.
cwhitelist = ['wbook0', 'intamulet', 'stramulet', 'dexamulet', 'intearring', 'strearring', 'dexearring', 'hpbelt', 'hpamulet', 'ringsj', 'amuletofm', 'orbofstr', 'orbofint', 'orbofres', 'orbofhp'];

//item management
function seuc_merge(ulevel, clevel) {
  for (let i = 0; i < character.items.length; i++) {
    let c = character.items[i];
    if (c) {
      if (uwhitelist.includes(c.name) && c.level < ulevel) {
        let grades = item_info(c).grades;
        let scrollname;
        //Gets the item grade from parent.G.items so it only uses the cheapest scroll possible.
        if (c.level < grades[0])
          scrollname = 'scroll0';
        else if (c.level < grades[1])
          scrollname = 'scroll1';
        else
          scrollname = 'scroll2';
        //Check if the required scroll is in the inventory, buy one if there isn't.

        let [scroll_slot, scroll] = find_item_filter(i => i.name === scrollname);
        if (!scroll) {
          parent.buy(scrollname);
          return;
        }

        //Upgrade the item.
        parent.socket.emit('upgrade', {
          item_num: i,
          scroll_num: scroll_slot,
          offering_num: null,
          clevel: c.level
        });
        return;
      } else if (cwhitelist.includes(c.name) && c.level < clevel) { //There is an item that has to be compounded.
        let [item2_slot, item2] = find_item_filter((item) => c.name === item.name && c.level === item.level, i + 1); //The second item to compound.
        let [item3_slot, item3] = find_item_filter((item) => c.name === item.name && c.level === item.level, item2_slot + 1); //The third item to compound.
        if (item2 && item3) { //If there is a second and third copy of the item compound them.
          let cscrollname;
          if (c.level < 2) //Use whitescroll at base and +1.
            cscrollname = 'cscroll0';
          else //Use blackscroll at +2 and higher
            cscrollname = 'cscroll1';

          //Check if the required scroll is in the inventory, buy one if there isn't.
          let [cscroll_slot, cscroll] = find_item_filter(i => i.name === cscrollname);
          if (!cscroll) {
            parent.buy(cscrollname);
            return;
          }

          //Compound the items.
          parent.socket.emit('compound', {
            items: [i, item2_slot, item3_slot],
            scroll_num: cscroll_slot,
            offering_num: null,
            clevel: c.level
          });
          return;
        }
      } else if (c && ewhitelist.includes(c.name)) { //There is an item that has to be exchanged.

        //Exchange the items.
        exchange(i)
        parent.e_item = i;
      } else if (c && swhitelist.includes(c.name)) { //There is an item that has to be sold.

        //Sell the items.
        sell(i);
      }
    }
  }
}

//Returns the item information from parent.G.items of the item.
function item_info(item) {
  return parent.G.items[item.name];
}

//Returns the item slot and the item given the slot to start from and a filter.
function find_item_filter(filter, search_slot) {
  let slot = search_slot;
  if (!slot)
    slot = 0

  for (let i = slot; i < character.items.length; i++) {
    let item = character.items[i];

    if (item && filter(item))
      return [i, character.items[i]];
  }

  return [-1, null];
}
/////////// END ITEMS
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// MOVEMENT
//movement
var seeking = false;
var reverseKiteRotation = false;
var stuckThreshold = 2;
var last_x = character.x;
var last_y = character.y;
var last_x2 = character.x;
var last_y2 = character.y;

function kite(target) {
	//if we get to here, we know we have a target
	var howFarAway = distance(character,target);
	var howFarTheyCanHit = target.range;
	var rotationDegrees = 30;
	var newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, rotationDegrees, 1);
	var newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
	
	
	if (!can_move_to(newCoordinates.x, newCoordinates.y)) {
		//cant move there, try the other way
		//log("Hit a wall. Reversing rotation.");
		reverseKiteRotation = !reverseKiteRotation;
		newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, rotationDegrees, 1);
		newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
		
		while (!can_move_to(newCoordinates.x, newCoordinates.y) || calculateDistance(character.x, character.y, newCoordinates.x, newCoordinates.y) < stuckThreshold) {
			reverseKiteRotation = !reverseKiteRotation;
			rotationDegrees = rotationDegrees + 15;
			newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, rotationDegrees, 1);
			newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
		}
		
		//if (!can_move_to(newCoordinates.x, newCoordinates.y)) {
			//we are stuck in corner and need to go through them to get away
			//log("Trying smaller circle");
			//reverseKiteRotation = !reverseKiteRotation;
			//newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, 30, 0.5);
			//newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
		//}
	}
	
	if (calculateDistance(last_x, last_y, character.x, character.y) < stuckThreshold || calculateDistance(last_x2, last_y2, character.x, character.y) < stuckThreshold * 2) {
	    log("we are stuck");
	}
	
	if (!is_in_range(target)) {
		if (!seeking) {
			log("Moving towards target");
			smarter_move(
				target.x,
				target.y,
				character,
				target
			);
		}
	} else {
		seeking = false;
		if (newRelativeCoordinates) {
			last_x2 = last_x;
			last_y2 = last_y;
			last_x = character.x;
			last_y = character.y;
			move(
				newCoordinates.x,
				newCoordinates.y
			);
		}
	}		
}

function calculateDistance(last_x, last_y, new_x, new_y) {
	chx = new_x - last_x;
	chy = new_y - last_y;
	calcDistance = Math.sqrt(chx * chx + chy * chy);
	return calcDistance;
}

function getNextKiteCoordinates(character, target, reverse, angle, rangeScale) {
	if (!character || !target) return;
	var range = character.range * rangeScale;
	var x = character.x - target.x;
	var y = character.y - target.y;
	var currentAngleRadians =  Math.atan2(y, x);
	var currentAngleDegrees =  currentAngleRadians * 180 / Math.PI;
	var newAngleDegrees = currentAngleDegrees + angle * (reverse ? -1 : 1);
	var newAngleRadians = newAngleDegrees / 180 * Math.PI;
	var x2 = range * Math.cos(newAngleRadians);
	var y2 = range * Math.sin(newAngleRadians);
	return {'x': x2, 'y': y2};
}

function smarter_move(x,y,character,target) {
	seeking = true;
	if (!character || !target) return;
	if (can_move_to(x,y)) {
		//stop("smart");
		var range = character.range * 0.8;
		var x = character.x - target.x;
		var y = character.y - target.y;
		var currentAngleRadians =  Math.atan2(y, x);
		
		var x2 = range * Math.cos(currentAngleRadians);
		var y2 = range * Math.sin(currentAngleRadians);
		newCoordinates = {'x': target.x+x2, 'y': target.y+y2}
		seeking = false;
		last_x2 = last_x;
		last_y2 = last_y;
		last_x = character.x;
		last_y = character.y;
		return move(
			newCoordinates.x,
			newCoordinates.y
		);
	} else {
		last_x2 = last_x;
		last_y2 = last_y;
		last_x = character.x;
		last_y = character.y;
		return smart_move({x:x,y:y});
	}
}

function catchUpTo(target) {
	if (target) {
		log("Catching up to "+target.name);
		smarter_move(
			target.x,
			target.y,
			character,
			target
		);
		return;
	} else {
		log("No target to catch up to");
		return;
	}
}
/////////// END MOVEMENT
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// PARTY
//party management

//TODO: need to make the character list dynamic instead of hard-coding
var players = ['Beef','Pragmus','CohenPlaces','GoldRanger'];

function update_character_localstorage() {
	let data = {
		'name': character.name,
		'x': character.real_x,
		'y': character.real_y,
		'from_x': character.from_x,
		'from_y': character.from_y,
		'going_x': character.going_x,
		'going_y': character.going_y,
		'map': character.map,
		'max_hp': character.max_hp,
		'hp': character.hp,
		'max_mp': character.max_mp,
		'mp': character.mp,
		'level': character.level,
		'ctype': character.ctype,
		'range': character.range,
		'targets': character.targets,
		'target': character.target,
		'rip': character.rip,
		'party': character.party,
		'visible': character.visible,
		'moving': character.moving,
		'ts': Date.now(),
	}
	set("character_data_"+character.name, data);
}

function on_party_invite(name) {
	if (name == "Beef" || name == "Pragmus" || name == "CohenPlaces" || name == "GoldenRanger") {
		accept_party_invite(name);
	}
}

function on_party_request(name) {
	if (name == "Beef" || name == "Pragmus" || name == "CohenPlaces" || name == "GoldenRanger") {
		accept_party_request(name);
	}
}

function doInvites() {
	var mainLeaderName = "Beef";
	if (!character.party) {
		//log("We are not grouped");
		var groupLeader = "";
		//we are not grouped
		//check to see if any bros are online and already grouped
		var partyPlayer;
		for (let x in players) {
			if (players[x] != character.name) {
				let partyPlayer = get("character_data_"+(players[x]));
				if (partyPlayer) {
					if (partyPlayer.party && partyPlayer.ts > Date.now() - 2000) {
						groupLeader = partyPlayer.party;
						log("Not grouped. Found bro with group. Party leader "+groupLeader);
					}
				}
			}
		}
		
		//if a bro is grouped, request an invite
		if (groupLeader != "") {
			send_party_request(broGrouped);
		} else {
			//we are not in a party 
			//none of the bros are in a party
			
			//start a group if we are main leader
			if (character.name == mainLeaderName) {
				var partyPlayer;
				for (let i in players) {
					if (players[i] != character.name) {
						let partyPlayer = get("character_data_"+(players[i]));
						if (partyPlayer) {
							if (partyPlayer.name && partyPlayer && partyPlayer.ts > Date.now() - 2000) {
								log("Sending invite to "+partyPlayer.name);
								send_party_invite(partyPlayer.name);
							}
						}
					}
				}
			}
		}
	} else {
		//we are grouped.
		if (character.name == character.party) {
			//we are leader of current party, so do invites
			var partyPlayer;
			for (let p in players) {
				if (players[p] !== character.name) {
					let partyPlayer = get("character_data_"+(players[p]));
					if (partyPlayer) {
						if (!party[players[p]] && partyPlayer.ts > Date.now() - 2000) {
							send_party_invite(players[p]);
						}
					}
				}
			}
		}
	}
}
/////////// END PARTY
//////////////////////////////////////////////////////////////

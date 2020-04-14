//tank
//beef

var attack_mode = true
var last_heal = new Date();
var uc = false; //Enable Upgrading/Compounding/selling/exchanging of items = true, Disable Upgrading/Compounding/selling/exchanging of items = false
var upgrade_level = 8; //Max level it will stop upgrading items at if enabled
var compound_level = 3; //Max level it will stop compounding items at if enabled
swhitelist = []; //swhitelist is for the selling of items
ewhitelist = []; //ewhitelist is for the exchanging of items
uwhitelist = []; //uwhitelist is for the upgrading of items.
cwhitelist = ['wbook0', 'intamulet', 'stramulet', 'dexamulet', 'intearring', 'strearring', 'dexearring', 'hpbelt', 'hpamulet', 'ringsj', 'amuletofm', 'orbofstr', 'orbofint', 'orbofres', 'orbofhp'];

setInterval(function(){
	//use_hp_or_mp();
	doHeal();
	loot();
	doInvites();
	update_xptimer();

	if (!attack_mode || character.rip || is_moving(character)) {
		return;
	}

	var target = get_targeted_monster();
	if (!target) {
		if (character.targets > 0) {
			target=get_nearest_attacker();
			if (target) {
				change_target(target);
			} else {
				set_message("No Monsters");
				return;
			}
		} else {
			target=get_nearest_monster({min_xp:3000,max_att:600});
			if (target) {
				change_target(target);
			} else {
				set_message("No Monsters");
				return;
			}
		}
	}
	//if we get to here, we have a target.
	
	//even though we have a target, make sure we don't need to 
	//switch targets to b'tect a best buddy
	if (character.party) {
		var targetToTaunt = protect();
		if (targetToTaunt) {
			log("Taunt "+targetToTaunt.name);
			target = targetToTaunt;
		}
	}

	//try to attack the target
	if (!is_in_range(target)) {
		move(
			character.x+(target.x-character.x)/2,
			character.y+(target.y-character.y)/2
		);
		// Walk half the distance
	} else if (can_attack(target)) {
		set_message("Attacking");
		if (character.mp > 50) {
			if (!is_on_cooldown("attack")) {
				attack(target);
			}
			if (!is_on_cooldown("taunt")) {
				use_skill("taunt");
			}
		} else {
			if (!is_on_cooldown("use_mp")) {
				use_skill("regen_mp",character);
			}
		}
	}

},1000/4); // Loops every 1/4 seconds.

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

//Source code of: get_nearest_hostile
function get_nearest_attacker() {
	var min_d=999999;
	var target;
	for (id in parent.entities) {
		var current=parent.entities[id];
		if (current.type!="monster" || !current.visible || current.rip || current.invincible) continue;
		if (current.target != character.name) continue;
		var c_dist=parent.distance(character,current);
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

function on_party_invite(name) {
	// accept_party_invite(name)
	if (name == "Beef" || name == "Pragmus" || name == "CohenPlaces" || name == "GoldenRanger") {
		accept_party_invite(name);
	}
}

function on_party_request(name) {
	// accept_party_request(name)
	if (name == "Beef" || name == "Pragmus" || name == "CohenPlaces" || name == "GoldenRanger") {
		accept_party_request(name);
	}
}

function doInvites() {
	var mainLeaderName = "Beef";
	if (character.party == "") {
		log("We are not grouped");
		var groupLeader = "";
		//we are not grouped
		//check to see if any bros are online and already grouped
		var partyPlayer;
		var players = ['Beef','Pragmus','CohenPlaces','GoldRanger'];
		for (let x in players) {
			if (players[x] != character.name) {
				partyPlayer = get_player(players[x]);
				if (partyPlayer) {
					if (partyPlayer.party != "") {
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
				var players = ['Beef','Pragmus','CohenPlaces','GoldRanger'];
				for (let i in players) {
					if (players[i] != character.name) {
						partyPlayer = get_player(players[i]);
						if (partyPlayer) {
							if (partyPlayer.name) {
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
			var party = get_party();
			var players = ['Beef','Pragmus','CohenPlaces','GoldRanger'];
			for (let p in players) {
				if (players[p] !== character.name) {
					if (!party[players[p]]) {
						send_party_invite(players[p]);
					}
				}
			}
		}
	}
}

var minute_refresh; // how long before the clock resets

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

init_xptimer(5)


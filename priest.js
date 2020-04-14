//priest
//pragmus

var attack_mode = false
var last_regen = new Date();
var uc = false; //Enable Upgrading/Compounding/selling/exchanging of items = true, Disable Upgrading/Compounding/selling/exchanging of items = false
var upgrade_level = 8; //Max level it will stop upgrading items at if enabled
var compound_level = 3; //Max level it will stop compounding items at if enabled
swhitelist = []; //swhitelist is for the selling of items
ewhitelist = []; //ewhitelist is for the exchanging of items
uwhitelist = []; //uwhitelist is for the upgrading of items.
cwhitelist = ['wbook0', 'intamulet', 'stramulet', 'dexamulet', 'intearring', 'strearring', 'dexearring', 'hpbelt', 'hpamulet', 'ringsj', 'amuletofm', 'orbofstr', 'orbofint', 'orbofres', 'orbofhp'];

//sellExtraItems();
setInterval(function() {
	//use_hp_or_mp();
	use_regen();
	loot();
	doInvites();
	update_xptimer();
	
	if (character.rip || is_moving(character)) {
		return;
	}

	var partyKeys = Object.keys(get_party());
	var party = get_party();

	if (partyKeys.indexOf("Beef") >= 0 && get_player("Beef")) {
		var player = get_player("Beef");
		//log("Found Beef");
	} else if (partyKeys.indexOf("CohenPlaces") >= 0 && get_player("CohenPlaces")) {
		var player = get_player("CohenPlaces");
		//log("Found CohenPlaces");
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
		if (party) {
			var healedSomeone = healParty(partyKeys);
			if (!healedSomeone) {
				//we didn't heal someone, so lets try to assist
				var whatToAttack = parent.entities[get_player(player.name).target];
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
						//log("Attacking");
						attack(whatToAttack);
					}
				}
			}
		}
	}
},1000/4); // Loops every 1/4 seconds.

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

function catchUpTo(character, target) {
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

function use_regen() {
	if (safeties && mssince(last_regen) < min(200,character.ping*3)) return;
	var used = false;
	if (new Date() < parent.next_skill.use_hp) return;
	if (character.mp / character.max_mp < 0.5) use_skill('regen_mp'),used=true;
	else if (character.hp / character.max_hp < 0.7) use_skill('regen_hp'),used=true;
	else if (character.mp / character.max_mp < 0.8) use_skill('regen_mp'),used=true;
	else if (character.hp < character.max_hp) use_skill('regen_hp'),used=true;
	else if (character.mp < character.max_mp) use_skill('regen_mp'),used=true;
	if (used) last_regen = new Date();
	return;
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

function smarter_move(x,y,character,target) {
	seeking = true;
	if (!character || !target) return;
    if (can_move_to(x,y)) {
		var range = character.range * 0.8;
		var x = character.x - target.x;
		var y = character.y - target.y;
		var currentAngleRadians =  Math.atan2(y, x);
		
		var x2 = range * Math.cos(currentAngleRadians);
		var y2 = range * Math.sin(currentAngleRadians);
		newCoordinates = {'x': target.x+x2, 'y': target.y+y2}
		seeking = false;
		return move(
			target.x+x2,
			target.y+y2
		);
	} else {
		return smart_move({x:x,y:y});
	}
}

function countItems(itemName) {
	var itemCount = 0;
	if (!itemName) return itemCount;

	for (let i in character.items) {
		if (character.items[i].name == itemName) {
			itemCount++;
		}
	}
	return itemCount;
}

function sellExtraItems() {
	for (let i in character.items) {
		var item = character.items[i];
		
		if (item.name.includes("mpot") || item.name.includes("hpot") || item.name.includes("scroll")) continue;
		var count = countItems(item.name);
		if (count > 1) {
			//sell it
			var quantity = item.q ? item.q : 1;
			sell(i,quantity);
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
						if (is_character(players[p])) {
							send_party_invite(players[p]);
						}
						
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

//party management

//TODO: need to make the character list dynamic instead of hard-coding
var players = ['Beef','Pragmus','CohenPlaces','GoldRanger'];

setInterval(function() {
	update_character_localstorage();
}, 100);

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
		log("We are not grouped");
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

//party management

//TODO: need to make the character list dynamic instead of hard-coding
var players = ['Beef','Pragmus','CohenPlaces','GoldRanger'];

setInterval(function() {
	update_character_localstorage();
}, 100);

function update_character_localstorage() {
	let data = get_character_data();
	set("character_data_"+character.name, data);
}

function update_external_character_data(name) {
	if (name) {
		let request = {
			"command": "get_character_data",
		}
		send_cm(name,request)
	}
}

function on_cm(name,data) {
	if (players.indexOf(name) >= 0) {
		game_log("Received a code message from authorized user: "+name);
		if (data) {
			if (data.command == "get_character_data") {
				let charData = get_character_data();
				let data = {
					"command": "update_character_data",
					"data": data,
				}
				send_cm(name,data);
			} else if (data.command == "update_character_data") {
				let character_data = data.data;
				set("character_data_"+name, character_data);
			}
		}
	}
}

function get_character_data() {
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
	return data;
}

function on_party_invite(name) {
	if (players.indexOf(name) >= 0) {
		accept_party_invite(name);
	}
}

function on_party_request(name) {
	if (players.indexOf(name) >= 0) {
		accept_party_request(name);
	}
}

function doInvites() {
	var mainLeaderName = "Beef";
	if (!character.party) {
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
					}
				}
			}
		}
		
		//if a bro is grouped, request an invite
		if (groupLeader != "") {
			send_party_request(groupLeader);
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

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
			log("Taunt "+targetToTaunt.name);
			target = targetToTaunt;
			if (is_in_range(target) && !is_on_cooldown("taunt")) {
				use_skill("taunt");
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
/////////// END ENGAGEMENT
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
////////// GUI
//GUI components
var minute_refresh; // how long before the clock resets
var lastcc = 0;
var dpsInterval = 10000;
var damageSums = {};
var damageLog = [];

//minimap
//Where the map is drawn on the screen
var mapOrigin = {x: 175, y: 175};
//How large to make the minimap
var miniMapRadius = 100;
//The radius of the outer line around the minimap
var miniMapBorder = 5;
//What scale should the minimap be drawn to?
var scale = 1/7;
//variable for holding all minimap objects so that they can be tracked/destroyed
parent.miniMap = [];
//No need to draw the entire minimap every frame
//We'll count frames so that we can update the minimap every X frames
var drawCounter = 0;
var drawOnCount = 5;

init_xptimer(5);
init_ccmeter();
init_dpsmeter(5);

setInterval(function() {
	update_xptimer()
	update_ccmeter();
	update_dpsmeter();
}, 100);

setInterval(function(){
	new_render_party();
}, 1000);

function new_render_party() {
    var b = "";
    for (var a in parent.party) {
        var c = parent.party[a];
        b += " <div class='gamebutton' style='padding: 6px 8px 6px 8px; font-size: 24px; line-height: 18px' onclick='party_click(\"" + a + "\")'>";
        b += parent.sprite(c.skin, {
            cx: c.cx || [],
            rip: c.rip
        });
        if (c.rip) {
            b += "<div style='color:gray; margin-top: 1px'>RIP</div>"
        } else {
            b += "<div style='margin-top: 1px'>" + a.substr(0, 3).toUpperCase() + "</div>"
        }
		b += "<div style='margin-top: 1px'>" + (c.share*100).toFixed(0) + "%</div>"
        b += "</div>"
    }
    parent.$("#newparty").html(b);
    if (!parent.party_list.length) {
        parent.$("#newparty").hide()
    } else {
        parent.$("#newparty").show()
    }
}

function init_dpsmeter() {

  let $ = parent.$;
  let brc = $('#bottomrightcorner');

  brc.find('#dpsmeter').remove();

  let dps_container = $('<div id="dpsmeter"></div>').css({
    fontSize: '28px',
    color: 'white',
    textAlign: 'center',
    display: 'table',
    overflow: 'hidden',
    marginBottom: '-5px',
	width: "100%"
  });
	
  //vertical centering in css is fun
  let dpsmeter = $('<div id="dpsmetercontent"></div>')
    .css({
      //display: 'table-cell',
      verticalAlign: 'middle'
    })
    .html("")
    .appendTo(dps_container);

  brc.children().first().after(dps_container);
}



function updateTimerList()
{
	let $ = parent.$;
	
	var listString = '<table style="border-style: solid;" border="5px" bgcolor="black" align="right" cellpadding="5"><tr align="center"><td colspan="2">Damage Meter</td></tr><tr align="center"><td>Name</td><td>DPS</td></tr>';
	
	if(parent.party_list != null && character.party != null)
	{
		for(id in parent.party_list)
		{
			var partyMember = parent.party_list[id];
			var dps = getDPS(partyMember);
			listString = listString + '<tr align="left"><td align="center">' + partyMember + '</td><td>' + dps + '</td></tr>';
		}
	}
	else
	{
		var dps = getDPS(character.name);
		listString = listString + '<tr align="left"><td align="center">' + character.name + '</td><td>' + dps + '</td></tr>';
	}
	
	if(parent.party_list != null && character.party != null)
	{
		var dps = getTotalDPS();
		listString = listString + '<tr align="left"><td>' + "Total" + '</td><td>' + dps + '</td></tr>';
	}
	
	$('#' + "dpsmetercontent").html(listString);
}

function update_dpsmeter() {
	updateTimerList();
}

function getDPS(partyMember)
{
	var entry = damageSums[partyMember];
	var dps = 0;
	
	if(entry != null)
	{
		var elapsed = new Date() - entry.startTime;

		dps = parseFloat(Math.round((entry.sumDamage/(elapsed/1000)) * 100) / 100).toFixed(2);
	}
	return dps;
}

function getTotalDPS()
{	
	var minStart;
	var sumDamage  = 0;
	var dps = 0;
	for(var id in damageSums)
	{
		var entry = damageSums[id];
		
		if(minStart == null || entry.startTime < minStart)
		{
			minStart = entry.startTime;
		}
		
		sumDamage += entry.sumDamage;
	}
	
	if(minStart != null)
	{
		var elapsed = new Date() - minStart;

		dps = parseFloat(Math.round((sumDamage/(elapsed/1000)) * 100) / 100).toFixed(2);
	}
	
	return dps;
}

//Clean out an pre-existing listeners
if (parent.prev_handlersdpsmeter) {
    for (let [event, handler] of parent.prev_handlersdpsmeter) {
      parent.socket.removeListener(event, handler);
    }
}

parent.prev_handlersdpsmeter = [];

//handler pattern shamelessly stolen from JourneyOver
function register_dpsmeterhandler(event, handler) 
{
    parent.prev_handlersdpsmeter.push([event, handler]);
    parent.socket.on(event, handler);
};

function dpsmeterHitHandler(event)
{
	if(parent != null)
	{
		var attacker = event.hid;
		var attacked = event.id;

		var attackerEntity = parent.entities[attacker];
		
		
		
		if(attacker == character.name)
		{
			attackerEntity = character;
		}
		
		if((attackerEntity.party != null || attacker == character.name) || attackerEntity.party == character.party)
		{
			if(event.damage != null)
			{
				var attackerEntry = damageSums[attacker];
				
				if(attackerEntry == null)
				{
					var entry = {};
					entry.startTime = new Date();
					entry.sumDamage = 0;
					damageSums[attacker] = entry;
					attackerEntry = entry;
				}
				
				attackerEntry.sumDamage += event.damage;
				
				damageSums[attacker] = attackerEntry;
			}
		}
	}
}

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

//Called once per frame
function on_draw()
{
	drawCounter++;
	
	if(drawCounter >= drawOnCount)
	{
		drawCounter = 0;
		ClearMiniMap();
		
		if(parent.miniMap.length == 0)
		{
			e=new PIXI.Graphics();
			e.zIndex = 999;
			DrawMiniMap();
			DrawWalls();
			DrawEntities();
			DrawNPCs();
			DrawCharacter();
			parent.stage.addChild(e);
			parent.miniMap.push(e);
		}
	}
}

function on_destroy() // called just before the CODE is destroyed
{
	clear_drawings();
	clear_buttons();
	ClearMiniMap();
}

function ClearMiniMap()
{
	if(parent.miniMap.length > 0)
	{
		parent.miniMap.forEach(function(e){
			try{e.destroy({children:true})}catch(ex){}
		});
		parent.miniMap = [];
	}
}

//This will draw all walls on the map
function DrawWalls()
{
	var map_data = parent.G.maps[character.map].data;
    for (id in map_data.x_lines) {
        var line = map_data.x_lines[id];

        var x1 = line[0];
        var y1 = line[1];
        var x2 = line[0];
        var y2 = line[2];
		
		var localPoint1 = WorldToLocal(x1, y1, scale);
		var localPoint2 = WorldToLocal(x2, y2, scale);
		
		DrawWall(localPoint1, localPoint2);
    }

    for (id in map_data.y_lines) {
        var line = map_data.y_lines[id];

        var x1 = line[1];
        var y1 = line[0];
        var x2 = line[2];
        var y2 = line[0];
		
		var localPoint1 = WorldToLocal(x1, y1, scale);
		var localPoint2 = WorldToLocal(x2, y2, scale);
		
		DrawWall(localPoint1, localPoint2);
    }
}

//This will draw an individial wall, cutting it off where it touches the border of the mini-map
function DrawWall(point1, point2)
{
	var intersections = getIntersections([point1.x, point1.y], [point2.x, point2.y], [0,0,miniMapRadius - miniMapBorder/2]);
		
		var miniMapPoint1 = null;
		var miniMapPoint2 = null;
		
		if(miniMapDistance(point1.x, point1.y) < miniMapRadius - miniMapBorder/2)
		{
			miniMapPoint1 = point1;
		}
		
		if(miniMapDistance(point2.x, point2.y) < miniMapRadius - miniMapBorder/2)
		{
			miniMapPoint2 = point2;
		}
		
		if(intersections.points != false)
		{
			for(id in intersections.points)
			{
				var intersect = intersections.points[id];
				
				if(intersect.onLine)
				{
					var point = {x: intersect.coords[0], y: intersect.coords[1]};
					
					if(miniMapPoint1 == null)
					{
						miniMapPoint1 = point;
					}
					else if(miniMapPoint2 == null)
					{
						miniMapPoint2 = point;
					}
					
				}
			}
		}
		else
		{
			if(intersections.pointOnLine.onLine)
			{
				console.log(intersections);
			}
		}
		
		if(miniMapPoint1 != null && miniMapPoint2 != null)
		{
			DrawLine(miniMapPoint1, miniMapPoint2);
		}
}

//This draws the actual line that represents a wall
function DrawLine(point1, point2)
{
	var color=0x47474F;
	var size=1;
	e.lineStyle(size, color);
	e.moveTo(point1.x + mapOrigin.x,point1.y + mapOrigin.y);
	e.lineTo(point2.x + mapOrigin.x,point2.y + mapOrigin.y);
	e.endFill();
}

//Draws the background and outer rim of the mini map
function DrawMiniMap()
{
	var localPosition = WorldToLocal(mapOrigin.x, mapOrigin.y, 1);
	var color=0x47474F;
	var size= miniMapBorder;
	e.lineStyle(size, color);
	e.beginFill(0x40420);
	e.drawCircle(mapOrigin.x, mapOrigin.y, miniMapRadius);
	e.endFill();
}

//Draws your character at the center of the mini map
function DrawCharacter()
{
	var color=0xFFFFFF;
	var size=2;
	e.lineStyle(size, color);
	e.beginFill(color);
	e.drawCircle(mapOrigin.x, mapOrigin.y, 2);
	e.endFill();
}

//Draws all entities in parent.entities on the mini map
function DrawEntities()
{
	for(id in parent.entities)
	{
		var entity = parent.entities[id];
		
		var localPos = WorldToLocal(entity.real_x, entity.real_y, scale);
		
		if(miniMapDistance(localPos.x, localPos.y) < miniMapRadius - miniMapBorder)
		{
			var color=EntityColorMapping(entity);
			var fill = color;
			var size=2;
			var borderSize = 2;
			if(entity.mtype != null && (parent.G.monsters[entity.mtype].respawn == -1 || parent.G.monsters[entity.mtype].respawn > 60*2))
			{
				size = 5;
				fill = 0x40420;
			}
			
			
			e.lineStyle(borderSize, color);
			e.beginFill(fill);
			e.drawCircle(localPos.x + mapOrigin.x, localPos.y + mapOrigin.y, size);
			e.endFill();
		}
		
	}
}

//Draws all entities in parent.entities on the mini map
function DrawNPCs()
{
	for(id in parent.G.maps[character.map].npcs)
	{
		var npc = parent.G.maps[character.map].npcs[id];
		
		if(npc && !npc.loop && !npc.manual && npc.position)
		{
		var position = npc.position;
		
		if(position[0].length != null)
		{
			position = position[0];
		}
		
		if(position[0] != 0 && position[1] != 0)
		{
			var localPos = WorldToLocal(position[0], position[1], scale);

			if(miniMapDistance(localPos.x, localPos.y) < miniMapRadius - miniMapBorder)
			{
				var color=0x2341DB;
				var size=2;
				e.lineStyle(size, color);
				e.beginFill(color);
				e.drawCircle(localPos.x + mapOrigin.x, localPos.y + mapOrigin.y, 2);
				e.endFill();
			}
		}
		}
		
	}
}

//Based one what kind of entity it is, change the color!
function EntityColorMapping(entity)
{
	switch(entity.type)
	{
		case 'character':
		{
			if(parent.party_list.includes(entity.id))
			{
				return 0x1BD545;
			}
			else if(entity.npc == null)
			{
				return 0xDCE20F;
			}
			else
			{
				return 0x2341DB;
			}
			break;
		}
		case 'monster':
		{
			return 0xEE190E;
			break;
		}
			
	}
}

//How far away is something from the center of the mini map?
function miniMapDistance(x, y)
{
	return Math.sqrt(Math.pow(x - 0, 2) + Math.pow(y - 0, 2));
}

//Convert world coordinates into local coordinates in respect to your character.
function WorldToLocal(x, y, scale)
{
	var relativeX = (character.real_x - x)*scale * -1;
	var relativeY = (character.real_y - y)*scale * -1;
	
	return {x: relativeX, y: relativeY};
}

//Javascript Circle-Line Intersect: https://bl.ocks.org/milkbread/11000965
// GEOMETRIC function to get the intersections
//A = Point1 [x,y]
//B = Point2 [x,y]
//C = Circle [x,y,radius]
function getIntersections(a, b, c) {
	// Calculate the euclidean distance between a & b
	eDistAtoB = Math.sqrt( Math.pow(b[0]-a[0], 2) + Math.pow(b[1]-a[1], 2) );

	// compute the direction vector d from a to b
	d = [ (b[0]-a[0])/eDistAtoB, (b[1]-a[1])/eDistAtoB ];

	// Now the line equation is x = dx*t + ax, y = dy*t + ay with 0 <= t <= 1.

	// compute the value t of the closest point to the circle center (cx, cy)
	t = (d[0] * (c[0]-a[0])) + (d[1] * (c[1]-a[1]));

	// compute the coordinates of the point e on line and closest to c
    var e = {coords:[], onLine:false};
	e.coords[0] = (t * d[0]) + a[0];
	e.coords[1] = (t * d[1]) + a[1];

	// Calculate the euclidean distance between c & e
	eDistCtoE = Math.sqrt( Math.pow(e.coords[0]-c[0], 2) + Math.pow(e.coords[1]-c[1], 2) );

	// test if the line intersects the circle
	if( eDistCtoE < c[2] ) {
		// compute distance from t to circle intersection point
	    dt = Math.sqrt( Math.pow(c[2], 2) - Math.pow(eDistCtoE, 2));

	    // compute first intersection point
	    var f = {coords:[], onLine:false};
	    f.coords[0] = ((t-dt) * d[0]) + a[0];
	    f.coords[1] = ((t-dt) * d[1]) + a[1];
	    // check if f lies on the line
	    f.onLine = is_on(a,b,f.coords);

	    // compute second intersection point
	    var g = {coords:[], onLine:false};
	    g.coords[0] = ((t+dt) * d[0]) + a[0];
	    g.coords[1] = ((t+dt) * d[1]) + a[1];
	    // check if g lies on the line
	    g.onLine = is_on(a,b,g.coords);

		return {points: {intersection1:f, intersection2:g}, pointOnLine: e};

	} else if (parseInt(eDistCtoE) === parseInt(c[2])) {
		// console.log("Only one intersection");
		return {points: false, pointOnLine: e};
	} else {
		// console.log("No intersection");
		return {points: false, pointOnLine: e};
	}
}

// BASIC GEOMETRIC functions
function is_on(a, b, c) {
	return intersect_distance(a,c) + intersect_distance(c,b) == intersect_distance(a,b);
}

function intersect_distance(a,b) {
    return Math.sqrt( Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2) )
}

function getAngles(a, b, c) {
	// calculate the angle between ab and ac
	angleAB = Math.atan2( b[1] - a[1], b[0] - a[0] );
	angleAC = Math.atan2( c[1] - a[1], c[0] - a[0] );
	angleBC = Math.atan2( b[1] - c[1], b[0] - c[0] );
	angleA = Math.abs((angleAB - angleAC) * (180/Math.PI));
	angleB = Math.abs((angleAB - angleBC) * (180/Math.PI));
	return [angleA, angleB];
}

register_ccmeterhandler("player", ccmeter_playerhandler);    
register_dpsmeterhandler("hit", dpsmeterHitHandler);
parent.render_party = new_render_party;
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
var last_x2 = 99999;
var last_y2 = 99999;

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
/////////// END PARTY
//////////////////////////////////////////////////////////////

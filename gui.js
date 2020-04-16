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

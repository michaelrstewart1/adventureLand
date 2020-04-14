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

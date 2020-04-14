//movement

function kite(target) {
	//if we get to here, we know we have a target
	var howFarAway = distance(character,target);
	var howFarTheyCanHit = target.range;
	var newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, 30, 1);
	var newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
	
	if (!can_move_to(newCoordinates.x, newCoordinates.y)) {
		//cant move there, try the other way
		//log("Hit a wall. Reversing rotation.");
		reverseKiteRotation = !reverseKiteRotation;
		newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, 30, 1);
		newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
		
		if (!can_move_to(newCoordinates.x, newCoordinates.y)) {
			//we are stuck in corner and need to go through them to get away
			//log("Trying smaller circle");
			reverseKiteRotation = !reverseKiteRotation;
			newRelativeCoordinates = getNextKiteCoordinates(character, target, reverseKiteRotation, 30, 0.5);
			newCoordinates = {'x': target.x+newRelativeCoordinates.x, 'y': target.y+newRelativeCoordinates.y}
		}
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
		//set_message(distance(character,target));
		//set_message("Attacking");
		if (newRelativeCoordinates) {
			move(
				newCoordinates.x,
				newCoordinates.y
			);
		}
	}		
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
		return move(
			target.x+x2,
			target.y+y2
		);
	} else {
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

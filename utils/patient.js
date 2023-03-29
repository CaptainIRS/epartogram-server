const validateNewPatient = (req) => {
	const errors = [];
	let {
		name,
		age,
		parity,
		alive,
		edd,
		sb,
		nnd,
		riskFactors,
		contractionStartTime,
		membraneRuptureTime,
		height,
	} = req.body;
	age = parseInt(age, 10);
	parity = parseInt(parity, 10);
	alive = parseInt(alive, 10);
	sb = parseInt(sb, 10);
	nnd = parseInt(nnd, 10);
	height = parseInt(height, 10);
	if (age > 65 || age < 15) {
		errors.push("Age must be between 15 and 65");
	}
	if (parity > 10 || parity < 0) {
		errors.push("Parity must be between 0 and 10");
	}
	if (alive < 0) {
		errors.push("Alive must be greater than 0");
	}
	if (sb < 0) {
		errors.push("SB must be greater than 0");
	}
	if (nnd < 0) {
		errors.push("NND must be greater than 0");
	}
	if (height < 150 || height > 220) {
		errors.push("Height must be greater than 150 and less than 220");
	}
	membraneRuptureTime = new Date(membraneRuptureTime);
	contractionStartTime = new Date(contractionStartTime);
	if (membraneRuptureTime > Date.now()) {
		errors.push("Membrane rupture time must be in the past");
	}
	if (contractionStartTime > Date.now()) {
		errors.push("Contraction start time must be in the past");
	}

	return errors;
};

module.exports = {
	validateNewPatient,
};

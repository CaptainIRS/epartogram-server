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
	if (contractionStartTime >= membraneRuptureTime) {
		errors.push(
			"Contraction start time must be less than membrane rupture time"
		);
	}

	return errors;
};

const validatePatient = async (patient) => {
	let risks = [];
	let suggestions = [];
	try {
		// const patient = await Patient.findById(patientId);
		if (!patient) {
			return { risks, suggestions, patient: patient };
		}
		const measurements = patient.measurements;
		if (
			measurements.foetalHeartRate &&
			measurements.foetalHeartRate.length > 0
		) {
			// console.log('FHR', parseInt(patient.foetalHeartRate.slice(-1)[0].value));
			if (
				parseInt(measurements.foetalHeartRate.slice(-1)[0].value) > 160
			) {
				risks.push("Foetal heart rate is high");
				suggestions.push("Transfuse fluid");
				suggestions.push("Oxygen Supplementation");
				suggestions.push(
					"If no positive response observed refer urgently to referral unit"
				);
			} else if (
				parseInt(measurements.foetalHeartRate.slice(-1)[0].value) < 120
			) {
				risks.push("Foetal heart rate is low");
				suggestions.push("Transfuse fluid");
				suggestions.push("Oxygen Supplementation");
				suggestions.push(
					"If no positive response observed refer urgently to referral unit"
				);
			}
		}
		if (measurements.liquor && measurements.liquor.length > 0) {
			if (measurements.liquor.slice(-1)[0].value === "M") {
				risks.push("Miconium detected");
				suggestions.push("Take care of infection in baby after birth");
			}
			if (
				measurements.liquor.slice(-1)[0].value === "M1" ||
				measurements.liquor.slice(-1)[0].value === "M2" ||
				measurements.liquor.slice(-1)[0].value === "M3"
			) {
				risks.push("Dangerous Levels of Miconium detected");
				suggestions.push("Move the patient to referral unit");
			}
			if (measurements.liquor.length >= 3) {
				if (
					measurements.liquor.slice(-3)[0].value === "I" &&
					measurements.liquor.slice(-2)[0].value === "I" &&
					measurements.liquor.slice(-1)[0].value === "I"
				) {
					risks.push("Intact detected 3 times in a row");
				}
			}
		}
		if (measurements.moulding && measurements.moulding.length > 0) {
			if (measurements.moulding.slice(-1)[0].value === "3") {
				risks.push(
					"High moulding detected. Refer to higher health facility."
				);
				suggestions.push(
					"Refer to higher health facility as very high moulding detected. Possible vaginal obstruction."
				);
			}
			if (measurements.moulding.slice(-1)[0].value === "2") {
				risks.push("Medium moulding detected. Keep monitoring.");
			}
		}

		if (measurements.cervix && measurements.cervix.length > 1) {
			// calculate rate of cervical dilation
			// if rate is > 1cm/hour, suggest to call doctor
			// if rate is > 2cm/hour, suggest to call doctor immediately
			let recent = measurements.cervix.slice(-1)[0];
			let prev = measurements.cervix.slice(-2)[0];
			let recentDilation = parseInt(recent.value, 10);
			let prevDilation = parseInt(prev.value, 10);
			//   console.log(recent.timestamp - prev.timestamp);
			let rate =
				(recentDilation - prevDilation) /
				((recent.timeStamp - prev.timeStamp) / 3600000);
			console.log("Rate", rate);
			if (rate < 0.2) {
				suggestions.push("Contact specialist immediately because of slow progress");
				risks.push("Very low rate of cervical dilation");
			} else if (rate < 1) {
				suggestions.push("Monitor patient closely because of slow progress");
				risks.push("Low rate of cervical dilation");
			}
		}
		if (measurements.systolic && measurements.systolic.length > 0) {
			if (parseInt(measurements.systolic.slice(-1)[0].value) > 140) {
				risks.push("High systolic blood pressure");
			}
			if (parseInt(measurements.systolic.slice(-1)[0].value) < 110) {
				risks.push("Low systolic blood pressure");
			}
		}
		if (measurements.diastolic && measurements.diastolic.length > 0) {
			if (parseInt(measurements.diastolic.slice(-1)[0].value) > 80) {
				risks.push("High diastolic blood pressure");
			}
			if (parseInt(measurements.diastolic.slice(-1)[0].value) < 60) {
				risks.push("Low diastolic blood pressure");
			}
		}
		if (measurements.temperature && measurements.temperature.length > 0) {
			if (parseInt(measurements.temperature.slice(-1)[0].value) > 37) {
				risks.push("High temperature");
			}
			if (parseInt(measurements.temperature.slice(-1)[0].value) < 36) {
				risks.push("Low temperature");
			}
		}
		if (measurements.pulse && measurements.pulse.length > 0) {
			if (parseInt(measurements.pulse.slice(-1)[0].value) > 100) {
				risks.push("High pulse");
			}
			if (parseInt(measurements.pulse.slice(-1)[0].value) < 60) {
				risks.push("Low pulse");
			}
		}
		return { risks, suggestions, patient: measurements };
	} catch (err) {
		console.log(err);
		return { risks, suggestions, patient: null };
	}
};

module.exports = {
	validateNewPatient,
	validatePatient,
};

module.exports = (role) => {
  if (role === "Doctor") {
    return ["home", "add-patient", "add-measurement", "patient-history", "add-staff"];
  } else if (role === "Nurse") {
    return ["home", "add-patient", "add-measurement", "patient-history", "add-staff"];
  } else if (role === "Admin") {
    return ["home", "add-staff"];
  }
};

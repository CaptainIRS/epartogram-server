module.exports = (role) => {
  if (role === "Doctor") {
    return [
      "home",
      "add-patient",
      "add-measurement",
      "patient-history",
      "discharge-patient",
      "near-by-hospital",
    ];
  } else if (role === "Nurse") {
    return [
      "home",
      "add-patient",
      "add-measurement",
      "patient-history",
    ];
  } else if (role === "Admin") {
    return ["add-staff", "update-details", "Staff On Duty"];
  }
};

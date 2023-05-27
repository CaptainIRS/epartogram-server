module.exports = (role) => {
  if (role === "Doctor") {
    return [
      "home",
      "add-patient",
      "add-measurement",
      "patient-history",
      "discharge-patient",
      "near-by-hospital",
      "Risks & Suggestions"
    ];
  } else if (role === "Nurse") {
    return [
      "home",
      "add-patient",
      "add-measurement",
      "patient-history",
      "Risks & Suggestions"
    ];
  } else if (role === "Admin") {
    return ["update-details", "add-staff", "Staff On Duty"];
  }
};

export const campusAreas = [
  {
    id: "dangan",
    name: "Dangan Sports Grounds",
    polygon: [
      [53.29322609534812, -9.07000780105591],
      [53.29860142556751, -9.081358909606935],
      [53.29239887639669, -9.084105491638185],
      [53.289220381988244, -9.07273292541504],
    ],
    discoveryField: "danganDiscovered",
    displayName: "Dangan Sports Grounds",
    iconKey: "dangan",
    color: "#00e04bff",
    fillColor: "#00e04bff",
    fillOpacity: 0.15,

    // style after discovery (keep outline, no fill)
    discoveredColor: "#00e04bff",
    discoveredFillOpacity: 0,
  },
  {
    id: "southBuildings",
    name: "South Buildings",
    polygon: [
      [53.27878811877044, -9.05958634152167],
      [53.279096328315205, -9.058185678663133],
      [53.27788736769872, -9.057649963854322],
      [53.27756637077488, -9.058936018678516],
    ],
    discoveryField: "southBuildingsDiscovered",
    displayName: "South Buildings",
    iconKey: "southBuildings",
    color: "#ff8800",
    fillColor: "#ff8800",
    fillOpacity: 0.15,

    discoveredColor: "#ff8800",
    discoveredFillOpacity: 0,
  },
  // you can add e.g. "mainCampus", "northCampus" later
];

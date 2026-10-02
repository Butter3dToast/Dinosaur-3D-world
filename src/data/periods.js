// Continent layouts are artistic approximations of how the land was arranged, not maps.
//   blobs:   continent mask centres as [latitude°, longitude°, angular radius (rad)]
//   palette: land colours from lowland to peak (see STOPS in world/terrain.js)
//   color:   International Commission on Stratigraphy chart colour
export const PERIODS = [
  {
    name: 'Triassic', from: 252, to: 201, color: '#812B92',
    blurb: 'All land is joined in one supercontinent, Pangaea, with a hot, dry interior. The first dinosaurs appear late in this period.',
    blobs: [[15, -10, 1.0], [-20, 5, .9], [40, 30, .6], [-45, 40, .55], [5, -45, .55], [45, -40, .5]],
    palette: ['#d6b47a', '#8d8f46', '#b17a43', '#87593a', '#6c5b51'],
    treeColor: '#55703a', treeCount: 320,
    species: ['eoraptor', 'herrerasaurus', 'coelophysis', 'plateosaurus', 'eudimorphodon'],
  },
  {
    name: 'Jurassic', from: 201, to: 145, color: '#34B2C9',
    blurb: 'Pangaea splits into Laurasia in the north and Gondwana in the south. A warmer, wetter world where giant long-necked sauropods roam.',
    blobs: [[45, -15, .62], [40, 35, .55], [55, 85, .45], [-20, 10, .6], [-35, 55, .48], [-45, -20, .5], [-10, -35, .42]],
    palette: ['#d8c48b', '#3f7e35', '#2f5f2b', '#6e6a48', '#86806f'],
    treeColor: '#2e5a27', treeCount: 700,
    species: ['brachiosaurus', 'diplodocus', 'allosaurus', 'stegosaurus', 'rhamphorhynchus', 'plesiosaurus'],
  },
  {
    name: 'Cretaceous', from: 145, to: 66, color: '#7FC64E',
    blurb: 'The continents drift toward shapes we would recognise. Flowering plants spread, and the period ends with the asteroid impact 66 million years ago.',
    blobs: [[45, -100, .55], [-15, -60, .48], [5, 15, .55], [50, 60, .62], [-18, 78, .28], [-65, 110, .5], [45, 10, .28], [-28, 135, .3]],
    palette: ['#dccb92', '#4d8b3b', '#366c2d', '#6e7050', '#8b8478'],
    treeColor: '#3a6a2c', treeCount: 760,
    species: ['tyrannosaurus', 'triceratops', 'ankylosaurus', 'parasaurolophus', 'velociraptor', 'spinosaurus', 'pteranodon', 'mosasaurus'],
  },
];

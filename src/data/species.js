// Facts are kept conservative; say "about" or "estimates vary" when sources differ.
//   body:    model builder in life/models.js (biped, sauro, cera, stego, anky, ptero, sea)
//   size:    on-globe scale, deliberately exaggerated so animals are visible
//   notDino: pterosaurs and marine reptiles; the info card labels them as not dinosaurs
//   live:    gives birth to live young instead of laying eggs
//   Other flags (slim, thick, head, crest, sail, neck, ...) only shape the model.
export const SPECIES = {
  eoraptor: { name: 'Eoraptor', body: 'biped', slim: 1, size: .09, color: '#a07e52', accent: '#5d4630', diet: 'Omnivore', len: 'About 1 m',
    fact: 'One of the earliest known dinosaurs, around 231 million years old, discovered in Argentina.' },
  herrerasaurus: { name: 'Herrerasaurus', body: 'biped', size: .14, color: '#8d6a48', accent: '#4e3826', diet: 'Carnivore', len: 'About 4–6 m',
    fact: 'An early predatory dinosaur from Late Triassic Argentina.' },
  coelophysis: { name: 'Coelophysis', body: 'biped', slim: 1, size: .1, color: '#b89160', accent: '#6e5236', diet: 'Carnivore', len: 'About 3 m',
    fact: 'A light, fast hunter. Hundreds of skeletons were found together at Ghost Ranch in New Mexico.' },
  plateosaurus: { name: 'Plateosaurus', body: 'biped', longNeck: 1, size: .16, color: '#7c8150', accent: '#4c5030', diet: 'Herbivore', len: 'About 5–10 m',
    fact: 'An early relative of the giant sauropods. It walked on two legs and is common in European fossil sites.' },
  eudimorphodon: { name: 'Eudimorphodon', body: 'ptero', tail: 1, size: .09, color: '#6b5a4a', accent: '#a5643a', diet: 'Fish', len: 'Wingspan about 1 m', notDino: 1,
    fact: 'One of the oldest known pterosaurs, found in Italy.' },

  brachiosaurus: { name: 'Brachiosaurus', body: 'sauro', neck: 1.45, neckTilt: .3, frontLeg: 1.3, size: .3, color: '#7f8a7a', accent: '#56604f', diet: 'Herbivore', len: 'Over 20 m',
    fact: 'Its front legs were longer than its back legs, so it held its neck high, a little like a giraffe.' },
  diplodocus: { name: 'Diplodocus', body: 'sauro', neck: 1.4, neckTilt: 1.15, tailLen: 2.1, size: .28, color: '#8a7a62', accent: '#5c503e', diet: 'Herbivore', len: 'About 25 m',
    fact: 'A very long, slender sauropod with a whip-like tail, from Late Jurassic North America.' },
  allosaurus: { name: 'Allosaurus', body: 'biped', size: .18, head: 1.1, color: '#8f5a3c', accent: '#4a2c1e', diet: 'Carnivore', len: 'About 8.5–10 m',
    fact: 'The top predator of Late Jurassic North America.' },
  stegosaurus: { name: 'Stegosaurus', body: 'stego', size: .17, color: '#6e7a48', accent: '#c0703a', diet: 'Herbivore', len: 'About 7–9 m',
    fact: 'Known for two rows of plates along its back and a spiked tail. Its brain was very small for its body.' },
  rhamphorhynchus: { name: 'Rhamphorhynchus', body: 'ptero', tail: 1, size: .1, color: '#5a4f45', accent: '#8c4b3a', diet: 'Fish', len: 'Wingspan up to about 1.8 m', notDino: 1,
    fact: 'A long-tailed pterosaur from Late Jurassic Germany, probably a fish-catcher.' },
  plesiosaurus: { name: 'Plesiosaurus', body: 'sea', variant: 'plesio', size: .15, color: '#4f6470', accent: '#33444e', diet: 'Fish and squid-like animals', len: 'About 3–3.5 m', notDino: 1, live: 1,
    fact: 'A long-necked marine reptile from the Early Jurassic. Plesiosaurs gave birth to live young at sea.' },

  tyrannosaurus: { name: 'Tyrannosaurus', body: 'biped', size: .24, head: 1.35, tinyArms: 1, thick: 1, color: '#6f5a43', accent: '#3c2e22', diet: 'Carnivore', len: 'About 12 m',
    fact: 'One of the last non-bird dinosaurs, living about 68–66 million years ago in western North America.' },
  triceratops: { name: 'Triceratops', body: 'cera', size: .19, color: '#7d6a52', accent: '#a0582f', diet: 'Herbivore', len: 'About 8–9 m',
    fact: 'Three horns and a large bony frill. It lived at the same time and place as Tyrannosaurus.' },
  ankylosaurus: { name: 'Ankylosaurus', body: 'anky', size: .17, color: '#6d6a52', accent: '#4d4a3a', diet: 'Herbivore', len: 'About 6–8 m',
    fact: 'Covered in bony armour, with a heavy club at the end of its tail.' },
  parasaurolophus: { name: 'Parasaurolophus', body: 'biped', crest: 1, thick: 1, size: .18, color: '#6a7d58', accent: '#b0723a', diet: 'Herbivore', len: 'About 9.5 m',
    fact: 'A duck-billed dinosaur with a long hollow crest that may have worked like a resonating horn.' },
  velociraptor: { name: 'Velociraptor', body: 'biped', slim: 1, size: .08, color: '#9a7a58', accent: '#5a4232', diet: 'Carnivore', len: 'About 2 m',
    fact: 'Turkey-sized and feathered, from Mongolia. Much smaller than its film version.' },
  spinosaurus: { name: 'Spinosaurus', body: 'biped', sail: 1, size: .22, head: 1.15, color: '#7a6650', accent: '#b25a35', diet: 'Mostly fish', len: 'About 14 m (estimates vary)',
    fact: 'A tall sail on its back and a long snout. It lived in North Africa about 99–93 million years ago and likely hunted in and around water.' },
  pteranodon: { name: 'Pteranodon', body: 'ptero', crest: 1, size: .15, color: '#d9d2c3', accent: '#8e6f5a', diet: 'Fish', len: 'Wingspan over 6 m', notDino: 1,
    fact: 'A large, toothless, crested pterosaur that soared over Late Cretaceous seas.' },
  mosasaurus: { name: 'Mosasaurus', body: 'sea', variant: 'mosa', size: .2, color: '#3f5560', accent: '#2b3b44', diet: 'Fish, turtles, other marine reptiles', len: 'Roughly 12–17 m', notDino: 1, live: 1,
    fact: 'A giant marine reptile from the same group as lizards and snakes. It gave birth to live young.' },
};

// Movement class used by the simulation: 'land', 'fly' or 'sea'.
for (const sp of Object.values(SPECIES)) {
  sp.kind = sp.body === 'ptero' ? 'fly' : sp.body === 'sea' ? 'sea' : 'land';
}

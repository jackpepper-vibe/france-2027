import phrases from './phrases.json';
import { LACANAU_TIDES } from './tides.lacanau';

export type StopId =
  | 'ferry-out' | 'paris' | 'disney' | 'beauval' | 'loire'
  | 'lacanau' | 'rochelle' | 'granville' | 'ferry-home';

export interface Thing { title: string; text: string }

export interface Stop {
  id: StopId;
  num?: number;            // number on the route map
  name: string;            // short place name, as on a road sign
  tagline: string;
  stay: string;            // where we sleep
  stayNote: string;
  mapsQuery: string;       // Google Maps destination
  color: string;
  art: string;
  intro: string;
  things: Thing[];
  fact?: { title: string; text: string };
  ferry?: boolean;
}

export interface Day {
  date: string;            // YYYY-MM-DD
  stop: StopId;            // where we sleep that night
  plan: string;
  home?: boolean;          // arrival day, no night away
}

export const TRIP_START = '2027-06-29';
export const TRIP_END = '2027-07-21';

export const STOPS: Record<StopId, Stop> = {
  'ferry-out': {
    id: 'ferry-out', name: 'Cherbourg', tagline: 'A night at sea on the Oscar Wilde',
    stay: 'Irish Ferries · Oscar Wilde', stayNote: 'Dublin Port to Cherbourg, with the car on board.',
    mapsQuery: 'Irish Ferries Dublin Port Terminal 1, Dublin', color: '#2A9D8F', art: '/art/ferry.svg',
    intro: 'The holiday starts on the sea. We sail from Dublin with the car on board, sleep in a cabin, and wake up in France.',
    things: [
      { title: 'Explore the decks', text: 'Find the cabin, the restaurant and the best spot to watch Ireland disappear.' },
      { title: 'Dolphin watch', text: 'Keep an eye on the water in the Celtic Sea.' },
    ],
    ferry: true,
  },
  paris: {
    id: 'paris', num: 1, name: 'Paris', tagline: 'The City of Light',
    stay: 'Sandaya Paris Maisons-Laffitte', stayNote: 'Campsite beside the Seine with a pool. The RER A goes into central Paris in about 20 minutes.',
    mapsQuery: 'Sandaya Paris Maisons-Laffitte, Maisons-Laffitte, France', color: '#1D4F91', art: '/art/paris.svg',
    intro: 'Our base camp for the capital. Each morning we hop on the train into the middle of Paris, then come back to camp for an evening swim.',
    things: [
      { title: 'Eiffel Tower', text: 'Go up to the top, or picnic underneath and watch it sparkle at night.' },
      { title: 'Boat on the Seine', text: 'Cruise under the bridges and past Notre-Dame.' },
      { title: 'The Louvre', text: 'Find the Mona Lisa, the mummies and the glass pyramid.' },
      { title: 'Arc de Triomphe', text: 'Climb the 284 steps for a view over the craziest roundabout in Europe.' },
      { title: 'Champs-Élysées', text: 'The most famous avenue in Paris, running up to the Arc de Triomphe.' },
      { title: 'Notre-Dame', text: 'The great cathedral, rebuilt after the 2019 fire. Spot the gargoyles.' },
      { title: 'Montmartre', text: 'Hilltop village with street artists and the white Sacré-Cœur church.' },
      { title: 'Luxembourg Gardens', text: 'Push a little wooden sailboat across the pond with a stick.' },
    ],
    fact: { title: 'Did you know?', text: 'On hot summer days the Eiffel Tower’s metal expands and the tower grows up to 15 cm taller.' },
  },
  disney: {
    id: 'disney', num: 2, name: 'Disneyland Paris', tagline: '& Les Villages Nature',
    stay: 'Les Villages Nature Paris', stayNote: 'Holiday village a few minutes from Disneyland Paris, with its own water park.',
    mapsQuery: 'Les Villages Nature Paris, Villeneuve-le-Comte, France', color: '#6C4FB3', art: '/art/disney.svg',
    intro: 'Four nights of rollercoasters, parades, fireworks and water slides. Two theme parks side by side, and a giant water park back at the village.',
    things: [
      { title: 'Two theme parks', text: 'Disneyland Park and Disney Adventure World. See the ride guide below.' },
      { title: 'Night-time fireworks', text: 'The castle show at the end of the day.' },
      { title: 'Aqualagon', text: 'Indoor water park with slides, a wave pool and a warm outdoor lagoon.' },
      { title: 'La Belle Ferme', text: 'The village farm, where you can meet the animals.' },
      { title: 'Thrill-ride scorecard', text: 'Rate every coaster out of 10.' },
      { title: 'Bikes & lakes', text: 'Cycle round the lakes and gardens of the village.' },
    ],
    fact: { title: 'Top tip', text: 'The longest queues are quietest first thing in the morning and during the parade.' },
  },
  beauval: {
    id: 'beauval', num: 3, name: 'Beauval', tagline: 'One of the best zoos in the world',
    stay: 'Les Pagodes de Beauval', stayNote: 'Hotel right beside the zoo, designed like a Chinese temple.',
    mapsQuery: 'Les Pagodes de Beauval, Saint-Aignan, France', color: '#E58A2B', art: '/art/beauval.svg',
    intro: 'Staying next door means we can be first through the gates and stay right until closing time.',
    things: [
      { title: 'Giant pandas', text: 'A new pair from China is due in 2027. Fingers crossed they’ve arrived!' },
      { title: 'Cable car', text: 'Float over the zoo and look down on the animals.' },
      { title: 'Tropical dome', text: 'Hippos, crocodiles and manatees under one roof.' },
      { title: 'Bird show', text: 'Eagles, vultures and parrots swoop over the crowd.' },
      { title: 'The savanna', text: 'Giraffes, rhinos, lions and elephants.' },
      { title: 'Rare animals', text: 'Gorillas, koalas, Komodo dragons and white tigers.' },
    ],
    fact: { title: 'Did you know?', text: 'Beauval started in 1980 as a small bird park. Today it looks after around 35,000 animals.' },
  },
  loire: {
    id: 'loire', num: 4, name: 'Loire Valley', tagline: 'Land of a thousand castles',
    stay: 'Yelloh! Village Parc du Val de Loire', stayNote: 'Campsite among the vineyards at Mesland, between Blois and Amboise.',
    mapsQuery: 'Yelloh! Village Parc du Val de Loire, Mesland, France', color: '#2F7D4F', art: '/art/loire.svg',
    intro: 'Kings and queens built their fairy-tale castles along the River Loire. Our campsite is right in the middle of them.',
    things: [
      { title: 'Château de Chambord', text: 'The biggest castle, with a double spiral staircase.' },
      { title: 'Château de Chenonceau', text: 'A castle built right across a river, like a bridge.' },
      { title: 'Clos Lucé, Amboise', text: 'Leonardo da Vinci’s house, with life-size models of his inventions.' },
      { title: 'Maison de la Magie, Blois', text: 'Magic tricks, and dragons popping out of the windows.' },
      { title: 'Loire by bike', text: 'Flat cycle paths along the river, with ice cream stops.' },
      { title: 'Campsite pools', text: 'Slides and pools for a chilled afternoon.' },
    ],
    fact: { title: 'Spot it', text: 'At Chambord, two people can walk up the double staircase at the same time and never meet.' },
  },
  lacanau: {
    id: 'lacanau', num: 5, name: 'Lacanau', tagline: 'Surf, sand & pine forests',
    stay: 'Yelloh! Village Les Grands Pins', stayNote: 'Among the pine trees near the Atlantic beach at Lacanau-Océan.',
    mapsQuery: 'Yelloh! Village Les Grands Pins, Lacanau-Océan, France', color: '#1F8FB5', art: '/art/lacanau.svg',
    intro: 'A whole week on the Atlantic coast. Big waves, endless beaches, a calm lake and forest cycle paths.',
    things: [
      { title: 'Surf school', text: 'Lacanau is one of France’s most famous surf spots.' },
      { title: 'Lake Lacanau', text: 'Calm water for kayaks, pedalos and paddleboards.' },
      { title: 'Treetop adventure', text: 'Zip lines and rope bridges at La Forêt des Accromaniaques.' },
      { title: 'Bike rides', text: 'Miles of cycle paths through the pine forest.' },
      { title: 'Bastille Day', text: '14 July is France’s national day. Watch for fireworks!' },
      { title: 'Bordeaux day out', text: 'The water mirror fountain is the city’s giant splash zone.' },
    ],
    fact: { title: 'Beach safety', text: 'Swim between the flags. Green is safe, yellow means careful, red means no swimming.' },
  },
  rochelle: {
    id: 'rochelle', num: 6, name: 'La Rochelle', tagline: 'Old port & sea towers',
    stay: 'Ibis Styles La Rochelle Centre Gare', stayNote: 'Beside the train station, a short walk to the old port.',
    mapsQuery: 'Ibis Styles La Rochelle Centre Gare, La Rochelle, France', color: '#D3262B', art: '/art/rochelle.svg',
    intro: 'A seaside town with a harbour guarded by two old stone towers. One night, and lots to squeeze in.',
    things: [
      { title: 'The old port', text: 'Walk the harbour between the towers and pick a restaurant by the water.' },
      { title: 'Fort Boyard boat trip', text: 'Cruise from the old port to the sea fort from the TV game show.' },
      { title: 'Climb a tower', text: 'Views over the town and the sea.' },
      { title: 'Île de Ré', text: 'Over the long bridge to beaches, bike paths and salt marshes.' },
      { title: 'Yellow bikes', text: 'Ride along the seafront to the Minimes marina.' },
      { title: 'Ice cream crawl', text: 'Try the most unusual flavour you can find.' },
    ],
    fact: { title: 'Did you know?', text: 'A huge iron chain was once stretched between the towers at night to keep enemy ships out.' },
  },
  granville: {
    id: 'granville', num: 7, name: 'Granville', tagline: 'The corsair town on the rock',
    stay: 'Mercure Granville Le Grand Large', stayNote: 'High on the cliff above the sea. Two family duplex rooms with breakfast. Underground car park down a tight spiral ramp.',
    mapsQuery: 'Mercure Granville Le Grand Large, 5 rue de la Falaise, 50400 Granville, France', color: '#D4793A', art: '/art/granville.svg',
    intro: 'Our last night in France, in an old walled town on a rocky point. The sea rises about 9 metres between low and high tide.',
    things: [
      { title: 'Mont-Saint-Michel stop', text: 'On the drive up: an abbey on a rocky island, an hour south.' },
      { title: 'The Haute Ville', text: 'Explore the walled old town and its ramparts.' },
      { title: 'Pointe du Roc', text: 'Walk out to the lighthouse for sunset views.' },
      { title: 'Plat Gousset', text: 'The seafront promenade, with a sea-water pool.' },
      { title: 'High-tide watch', text: 'Be on the sea wall for the 20:58 high tide.' },
      { title: 'Crêpe supper', text: 'A galette, then one with salted caramel.' },
    ],
    fact: { title: 'Did you know?', text: 'Granville was home to corsairs: sea captains allowed by the King to capture enemy ships.' },
  },
  'ferry-home': {
    id: 'ferry-home', name: 'Dublin', tagline: 'Sailing home on the Oscar Wilde',
    stay: 'Irish Ferries · Oscar Wilde', stayNote: 'Cherbourg to Dublin, about 18 hours at sea.',
    mapsQuery: 'Gare Maritime, Cherbourg-en-Cotentin, France', color: '#2A9D8F', art: '/art/ferry.svg',
    intro: 'Round the tip of Cornwall while we sleep, then north across the Celtic Sea to Dublin Bay.',
    things: [
      { title: 'Last look at France', text: 'Wave goodbye from the top deck at 16:30.' },
      { title: 'Holiday memories', text: 'Fill in the back page of the brochure before we land.' },
    ],
    ferry: true,
  },
};

export const ROUTE: StopId[] = ['ferry-out', 'paris', 'disney', 'beauval', 'loire', 'lacanau', 'rochelle', 'granville', 'ferry-home'];

export const DAYS: Day[] = [
  { date: '2027-06-29', stop: 'ferry-out', plan: 'Sail 16:00 from Dublin. A night at sea!' },
  { date: '2027-06-30', stop: 'paris', plan: 'Land 11:30 in Cherbourg, drive to Paris' },
  { date: '2027-07-01', stop: 'paris', plan: 'Paris day' },
  { date: '2027-07-02', stop: 'paris', plan: 'Paris day' },
  { date: '2027-07-03', stop: 'disney', plan: 'Short hop to Disneyland country' },
  { date: '2027-07-04', stop: 'disney', plan: 'Disneyland Paris' },
  { date: '2027-07-05', stop: 'disney', plan: 'Disneyland Paris' },
  { date: '2027-07-06', stop: 'disney', plan: 'Aqualagon water park & the farm' },
  { date: '2027-07-07', stop: 'beauval', plan: 'Drive south to ZooParc de Beauval' },
  { date: '2027-07-08', stop: 'loire', plan: 'More zoo, then on to the Loire' },
  { date: '2027-07-09', stop: 'loire', plan: 'Château day' },
  { date: '2027-07-10', stop: 'loire', plan: 'Bikes, pool & the magic house' },
  { date: '2027-07-11', stop: 'lacanau', plan: 'Big drive to the Atlantic coast' },
  { date: '2027-07-12', stop: 'lacanau', plan: 'Beach & pool' },
  { date: '2027-07-13', stop: 'lacanau', plan: 'Surf school?' },
  { date: '2027-07-14', stop: 'lacanau', plan: 'Bastille Day! Fireworks' },
  { date: '2027-07-15', stop: 'lacanau', plan: 'Lake day: kayak & paddleboard' },
  { date: '2027-07-16', stop: 'lacanau', plan: 'Treetop adventure in the forest' },
  { date: '2027-07-17', stop: 'lacanau', plan: 'Last beach day' },
  { date: '2027-07-18', stop: 'rochelle', plan: 'Old port, towers & Fort Boyard boat trip' },
  { date: '2027-07-19', stop: 'granville', plan: 'Granville old town · high tide 20:58' },
  { date: '2027-07-20', stop: 'ferry-home', plan: 'Beach morning, then sail 16:30 from Cherbourg' },
  { date: '2027-07-21', stop: 'ferry-home', plan: 'Arrive Dublin 10:45. Home!', home: true },
];

/** Driving leg into each stop (from the previous one). */
export const LEGS: Partial<Record<StopId, { from: string; km: number; time: string }>> = {
  paris: { from: 'Cherbourg', km: 340, time: 'about 3½ hrs' },
  disney: { from: 'Maisons-Laffitte', km: 70, time: 'about 1 hr' },
  beauval: { from: 'Villages Nature', km: 250, time: 'about 2¾ hrs' },
  loire: { from: 'Beauval', km: 50, time: 'under 1 hr' },
  lacanau: { from: 'Mesland', km: 430, time: 'about 4½ hrs' },
  rochelle: { from: 'Lacanau', km: 230, time: 'about 3 hrs' },
  granville: { from: 'La Rochelle', km: 400, time: 'about 4 hrs' },
  'ferry-home': { from: 'Granville', km: 110, time: 'about 1½ hrs' },
};

export const SAILINGS = [
  { label: 'Outward', date: 'Tue 29 Jun', from: 'Dublin', dep: '16:00', to: 'Cherbourg', arr: '11:30', arrDay: 'Wed 30 Jun' },
  { label: 'Home', date: 'Tue 20 Jul', from: 'Cherbourg', dep: '16:30', to: 'Dublin', arr: '10:45', arrDay: 'Wed 21 Jul' },
];

export interface TideDay { date: string; day: string; high: string[]; low: string[] }
export interface TideTable { place: string; note: string; days: TideDay[] }

export const TIDES: Partial<Record<StopId, TideTable>> = {
  lacanau: {
    place: 'Lacanau',
    note: 'French time, predicted for the beach at Lacanau-Océan (to within about 10 minutes). Swim between the flags: the baïnes (channels in the sand) pull hardest as the tide goes out.',
    days: LACANAU_TIDES,
  },
  granville: {
    place: 'Granville',
    note: 'French time. The sea rises about 9 m, and comes in fast across the sand.',
    days: [
      { date: '2027-07-19', day: 'Mon 19 Jul', high: ['08:44', '20:58'], low: ['03:22', '15:40'] },
      { date: '2027-07-20', day: 'Tue 20 Jul', high: ['09:18', '21:30'], low: ['04:00', '16:15'] },
    ],
  },
};

export interface Ride { name: string; thrill: number; height: string | null; text: string }
export const RIDES: { park: string; rides: Ride[] }[] = [
  { park: 'Disneyland Park', rides: [
    { name: 'Star Wars Hyperspace Mountain', thrill: 5, height: '1.20 m', text: 'Launched coaster with loops, in the dark.' },
    { name: 'Indiana Jones and the Temple of Peril', thrill: 4, height: '1.40 m', text: 'Short, sharp jungle coaster with a loop.' },
    { name: 'Big Thunder Mountain', thrill: 3, height: '1.02 m', text: 'Runaway mine train out to an island.' },
    { name: 'Star Tours', thrill: 3, height: '1.02 m', text: 'Bumpy flight simulator.' },
    { name: 'Phantom Manor', thrill: 2, height: null, text: 'Spooky haunted-house ride.' },
    { name: 'Pirates of the Caribbean', thrill: 2, height: null, text: 'Boat ride with drops in the dark.' },
    { name: 'Buzz Lightyear Laser Blast', thrill: 1, height: null, text: 'Shoot targets for the top score.' },
  ] },
  { park: 'Disney Adventure World', rides: [
    { name: 'Avengers Assemble: Flight Force', thrill: 5, height: '1.20 m', text: 'Rocket-fast launch into loops.' },
    { name: 'Tower of Terror', thrill: 5, height: '1.02 m', text: 'A haunted hotel lift that drops… and drops.' },
    { name: 'Crush’s Coaster', thrill: 4, height: '1.07 m', text: 'Spinning coaster. Ride it first, queues build fast.' },
    { name: 'RC Racer', thrill: 4, height: '1.20 m', text: 'Giant toy car on a U-shaped track.' },
    { name: 'Frozen Ever After', thrill: 2, height: null, text: 'New in 2026: a boat ride through Arendelle.' },
    { name: 'Ratatouille: The Adventure', thrill: 1, height: null, text: '3D dash through a Paris kitchen.' },
    { name: 'Spider-Man W.E.B. Adventure', thrill: 1, height: null, text: 'Sling webs and compete for the best score.' },
  ] },
];

export interface Phrase { fr: string; en: string }
// Phrases live in JSON so tools/speech/phrases.py can record audio for them.
export const PHRASES: Phrase[] = phrases;

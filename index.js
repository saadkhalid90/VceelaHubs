const mapboxParams = {
  accessToken: 'pk.eyJ1Ijoic2FhZGtoYWxpZDkwIiwiYSI6ImNqbHJuNzRxNTA2bHMzd25tNTJ5dHlhb20ifQ.JG2i_ohQ9kuIoSotC9UvWA',

  center: [69.3451, 30.3753], // picked a center coordinate and Zoom value for Pakistan
  initZoomVal: 5.0,

  styleMap: 'mapbox://styles/saadkhalid90/ckqrpk75a3uf318pd8rk8spdy'
}

const VceelaHubs = 'VceelaHubs.csv';

// Use multilocs to focus on different regions within Pakistan
const multiLocs = [
  {
    id: 'All',
    center: [69.3451, 30.3753],
    zoom: 5.0,
  },
  {
    id: 'Punjab',
    center: [72.7097, 31.1704],
    zoom: 6.0
  }
];

// Keep multilocs empty if the multilocs feature is not required
// const multiLocs = []

// takes in three arguments
// 1. city Data
// 2. Array with multiple location center and zoom values (Empty if not required)
// 3. Mapbox params object that holds key info to initialize mapbox
readAndMap(VceelaHubs, multiLocs, mapboxParams);

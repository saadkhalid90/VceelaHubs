const mapboxParams = {
  accessToken: 'pk.eyJ1Ijoic2FhZGtoYWxpZDkwIiwiYSI6ImNqbHJuNzRxNTA2bHMzd25tNTJ5dHlhb20ifQ.JG2i_ohQ9kuIoSotC9UvWA',
  center: [74.65398, 36.320094], // picked a center coordinate for Multan city
  initZoomVal: 12.40,
  styleMap: 'mapbox://styles/saadkhalid90/ckks4soz90paw17qdyge1lgi9'
}

const cityData = 'HunzaHubs.csv';

// takes in two arguments
// 1. city Data
// 2. Array with multiple location center and zoom values (Empty if not required)
readAndMap(cityData, [
  {
    id: 'karimabad',
    center: [74.65398, 36.320094],
    zoom: 12.4
  },
  {
    id: 'gulmit',
    center: [74.86398, 36.388594],
    zoom: 13.4
  }
], mapboxParams);

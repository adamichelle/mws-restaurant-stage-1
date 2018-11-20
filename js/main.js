let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []
const mapContainer = document.getElementById("map-container");
const toggleMapButton = document.getElementById("toggle-map-button");

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  //registerServiceWorker();

  setTimeout( () => {
    mapContainer.style.position = "absolute";
    mapContainer.style.left = "-2000px";
    mapContainer.style.visibility = "hidden";
  }, 1500);

  toggleMapButton.addEventListener('click', () => {
    toggleMap();
  });

  toggleMapButton.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      mapContainer.removeAttribute('style');
      toggleMap();
    }
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiYWRhb2JpIiwiYSI6ImNqazc2aWw2dzBheG8za3A4MG1kbWxxbzUifQ.emUZ_CaU1hzBunAfvtgnrw',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
    markAsFavorite(restaurant.id);

  });
  addMarkersToMap();
  
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  //Get the image source from the JSON File
  const imageSourceUrl = DBHelper.imageUrlForRestaurant(restaurant);

  //Get the name associated with the image using regular expression
  let imageName = imageSourceUrl.match(/\d/g);
  imageName = imageName.join("");

  const picContainer = document.createElement('div');
  picContainer.className = 'pic-container';

  //Create a picture element for alternative sources of image
  const picture = document.createElement('picture');
  const source1 = document.createElement('source');
  source1.setAttribute('media', "(max-width: 600px)");
  source1.setAttribute('srcset', `./images/${imageName}_medium.jpg`);
  picture.appendChild(source1);
  const img = document.createElement('img');
  img.src = `./images/${imageName}_small.jpg`;
  img.classList.add('lazy','restaurant-img');
  img.setAttribute('alt', `A picture from ${restaurant.name}`);
  img.setAttribute('title', `A picture from ${restaurant.name}'s`);
  picture.appendChild(img);

  const favoriteButton = document.createElement('button');
  favoriteButton.className = 'favorite-button';
  favoriteButton.id = `favorite-button-${restaurant.id}`;
  favoriteButton.setAttribute('aria-label', `add ${restaurant.name} to favorites`);
  favoriteButton.innerHTML = '❤';
  picContainer.appendChild(favoriteButton);
  picContainer.appendChild(picture);
 
  li.append(picContainer);


  const name = document.createElement('h2');

  name.id = `restaurant-name-label-${imageName}`;
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.id = `restaurant-neighborhood-label-${imageName}`;
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.id = `more-btn-${imageName}`;
  more.setAttribute('aria-labelledby', `${name.id} ${neighborhood.id} ${more.id}`);
  li.append(more);

  return li;
}

markAsFavorite = (id) => {
  const favoriteBtn = document.getElementById(`favorite-button-${id}`);

  favoriteBtn.addEventListener("click", () => {
    let isFavorite = favoriteBtn.classList.contains('is-favorite');

    if(isFavorite === true) {
      favoriteBtn.classList.remove('is-favorite');
      
    } else {
      favoriteBtn.classList.add('is-favorite');
    }

  })
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }

    L.DomEvent.on(marker._icon, 'focus', function(ev) {
      const element = ev.srcElement || ev.target,
      id = element.getAttribute('id');
      element.setAttribute('role', 'link');
      element.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          window.location.href = marker.options.url;
        }
      })
    });
    
    self.markers.push(marker);
  });

}
 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */



toggleMap = () => {
  if(mapContainer.style.visibility === "hidden"){
    mapContainer.style.position = "relative";
    mapContainer.style.left = '0';
    mapContainer.style.width = '100%';
    mapContainer.style.visibility = "visible";
  } else {
    mapContainer.style.position = "absolute";
    mapContainer.style.left = "-2000px";
    mapContainer.style.visibility = "hidden";
  }
}


registerServiceWorker = () => {
  if(!navigator.serviceWorker) return;
  navigator.serviceWorker.register('./sw.js', {scope: './'})
  .then( () => {
      console.log("Service Worker Registered!");
  })
  .catch( () => {
      console.log("Service Worker Not registered!");
  });
}
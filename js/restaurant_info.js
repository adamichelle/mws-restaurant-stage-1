let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
  // registerServiceWorker();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.setAttribute('aria-describedby', 'restaurant-address-help');
  const addressDesc = document.createElement('span');
  addressDesc.id = 'restaurant-address-help';
  addressDesc.className = 'sr-only';
  addressDesc.innerHTML = ` ${restaurant.name}'s address`;
  address.append(addressDesc);
  address.append(`${restaurant.address}`);


  //Get the image source url from the JSON File
  const imageSourceUrl = DBHelper.imageUrlForRestaurant(restaurant);
  //Get the name associated with the image using regular expression
  let imageName = imageSourceUrl.match(/\d/g);
  imageName = imageName.join("");
  const image = document.getElementById('restaurant-img');
  const source1 = document.createElement('source');
  source1.setAttribute('media', "(min-width: 750px)");
  source1.setAttribute('srcset', `./images/${imageName}-1000_large_2x.jpg 2x, ./images/${imageName}-800_large_1x.jpg 1x`);
  image.appendChild(source1);
  const source2 = document.createElement('source');
  source2.setAttribute('media', "(min-width: 500px)");
  source2.setAttribute('srcset', `./images/${imageName}_medium.jpg`);
  image.appendChild(source2);
  const img = document.createElement('img');
  img.className ='restaurant-img';
  img.setAttribute('alt', `A picture from ${restaurant.name}`);
  img.setAttribute('title', `A picture from ${restaurant.name}`);
  img.src = `./images/${imageName}_small.jpg`;
  image.appendChild(img);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('aria-describedby', 'restaurant-cuisine-help');
  cuisine.innerHTML = restaurant.cuisine_type;
  
  const cuisineDesc = document.createElement('span');
  cuisineDesc.id = 'restaurant-cuisine-help';
  cuisineDesc.className = 'sr-only';
  cuisineDesc.innerHTML = `${restaurant.name}'s cuisine specialty`;
  cuisine.appendChild(cuisineDesc);

  // fill operating hours
  if (restaurant.operating_hours) {
    const hours = document.getElementById('restaurant-hours');
    hours.setAttribute('aria-describedby', `restaurant-hours-help`);
    const hoursDesc = document.getElementById('restaurant-hours-help');
    hoursDesc.innerHTML = `${restaurant.name}'s Operating Hours`;
  
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.className = 'review-item';

  const header = document.createElement('h4');
  header.className = 'review-item-header';
  header.innerHTML = `${review.name} `;

  const span = document.createElement('span');
  span.className = 'review-item-date';
  span.innerHTML = review.date;

  header.appendChild(span);
  li.appendChild(header);

  const body = document.createElement('div');
  body.className = 'review-item-body';
  
  const rating = document.createElement('p');
  rating.className = 'review-item-rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  body.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  body.appendChild(comments);

  li.appendChild(body);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

//register service worker
registerServiceWorker = () => {
  if(!navigator.serviceWorker) return;
  navigator.serviceWorker.register('./sw.js', {scope: './'})
  .then( function(){
      console.log("Service Worker Successfully Registered!");
  })
  .catch( function(){
      console.log("Service Worker Not registered!");
  });
}
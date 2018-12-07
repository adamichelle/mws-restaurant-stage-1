let restaurant;
var newMap;
let isOnline;
const statusDiv = document.getElementById("status");
const mapContainer = document.getElementById('map-container');
const notificationBox = document.getElementById('notification');
//Check if user is connected or not
window.addEventListener('offline', () => {
  statusDiv.style.display = "block";
  statusDiv.style.padding = '0.6em';
  statusDiv.innerHTML = "You're Offline."
  mapContainer.style.top = '176px';
}, false);

window.addEventListener('online', sendFailedPost, false);

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
  registerServiceWorker();
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
  img.classList.add('lazy','restaurant-img');
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
  toggleNewReviewForm();
  addNewReview();
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
fillReviewsHTML = (restaurant_id = self.restaurant.id) => {
  const container = document.getElementById('reviews-container');
  const reviewForm = document.getElementById('new-review-form');
  const restaurantIdField = document.getElementById('restaurant-id');
  restaurantIdField.value = restaurant_id;

  const reviewsSectionHeader = document.createElement('div');
  reviewsSectionHeader.id = 'reviews-section-header';
  reviewsSectionHeader.className = 'reviews-section-header';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'title';
  titleDiv.id = 'title';
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  titleDiv.appendChild(title);
  reviewsSectionHeader.appendChild(titleDiv);

  const btnDiv = document.createElement('div');
  btnDiv.className = 'new-review-btn-div';
  btnDiv.id = 'new-review-btn-div';
  const newReviewBtn = document.createElement('button');
  newReviewBtn.className = 'new-review-btn';
  newReviewBtn.id = 'new-review-btn';
  newReviewBtn.innerHTML = 'Add New Review';
  btnDiv.appendChild(newReviewBtn);
  reviewsSectionHeader.appendChild(btnDiv);

  //insert the header before the form
  reviewForm.insertAdjacentElement("beforebegin", reviewsSectionHeader);

  //hide the form
  reviewForm.style.display = 'none';

  DBHelper.fetchReviews(restaurant_id, (error, reviews) => {
    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      if (review.restaurant_id == restaurant_id){
        ul.appendChild(createReviewHTML(review)); 
      }
    });
    container.appendChild(ul);
  })
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const createdAt = review.createdAt;
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  let date = '';

  if(typeof createdAt === 'number') {
    date = new Intl.DateTimeFormat('en-US', options).format(review.createdAt);
  } else {
    const dateString = review.createdAt;
    date = new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
  }
  
  const li = document.createElement('li');
  li.className = 'review-item';

  const header = document.createElement('h4');
  header.className = 'review-item-header';
  header.innerHTML = `${review.name} `;

  const span = document.createElement('span');
  span.className = 'review-item-date';
  span.innerHTML = date;

  
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

toggleNewReviewForm = () => {
  const newReviewBtn = document.getElementById('new-review-btn');
  const form = document.getElementById('new-review-form');
  newReviewBtn.addEventListener("click", () => {
    if(form.style.display === 'none'){
      form.style.display = 'block';
    }
    else {
      form.style.display = 'none';
    }
  });
}

addNewReview = () => {
  const newReviewForm = document.getElementById('new-review-form');
  newReviewForm.addEventListener('submit', (event) => {
    const name = document.getElementById('name').value;
    const restaurantId = document.getElementById('restaurant-id').value;
    const rating = document.querySelector('input[name="rating"]:checked').value;
    const comments = document.getElementById('comments').value;
    
    const parameters = {
      "restaurant_id": parseInt(restaurantId),
      "name": name,
      "rating": parseInt(rating),
      "comments": comments
    }
    const parametersArray = [];
    parametersArray.push(parameters);   
    DBHelper.addNewReview(parameters);
    listenForFailedPost(parametersArray);
    
    event.preventDefault();
    
  });
}

listenForFailedPost = (parametersArray) => {
  navigator.serviceWorker.addEventListener('message', event => {
    //alert(event.data.msg);
    const newReviewForm = document.getElementById('new-review-form');
    const restaurantIdField = document.getElementById('restaurant-id');
    const restaurantId = restaurantIdField.value;
    newReviewForm.reset();
    restaurantIdField.value = restaurantId;

    DBHelper.openDatabase().then(function(db) {
      if(!db) return;
        
      const ul = document.getElementById('reviews-list');

      let tx = db.transaction('form-data', 'readwrite');
      let formDataStore = tx.objectStore('form-data');
      parametersArray.forEach(function(parameters) {
        formDataStore.put(parameters);
        ul.appendChild(createOfflineReviewHTML(parameters))
      })

    })
  })
}

createOfflineReviewHTML = (parameters) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Intl.DateTimeFormat('en-US', options).format(new Date());
  const li = document.createElement('li');
  li.className = 'review-item';

  const header = document.createElement('h4');
  header.className = 'review-item-header';
  header.innerHTML = `${parameters.name} `;

  const span = document.createElement('span');
  span.className = 'review-item-date';
  span.innerHTML = date;

  
  header.appendChild(span);
  li.appendChild(header);

  const body = document.createElement('div');
  body.className = 'review-item-body';
  
  const rating = document.createElement('p');
  rating.className = 'review-item-rating';
  rating.innerHTML = `Rating: ${parameters.rating}`;
  body.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = parameters.comments;
  body.appendChild(comments);

  li.appendChild(body);

  return li;
}

function sendFailedPost (event) {
  if(event.type == "online") {
    statusDiv.style.display = "none";
    mapContainer.style.top = '130px';
    DBHelper.openDatabase().then(function(db) {
      const index = db.transaction('form-data')
      .objectStore('form-data').index('by-Name');

      index.getAll().then((offlineReviews) => {
          console.log(offlineReviews);
          offlineReviews.forEach((review) => {
            let response = fetch(DBHelper.DATABASE_URL[1], {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(review)
            })
            response.then(() => {
              DBHelper.openDatabase().then(function(db){
                const tx = db.transaction('form-data', 'readwrite');
                const formDataStore = tx.objectStore('form-data');
                formDataStore.clear();
              })
            });
          })
      });
    })
  }
}

//register service worker
registerServiceWorker = () => {
  if(!navigator.serviceWorker) return;
  navigator.serviceWorker.register('./sw.js', {scope: './'})
  .then( function(reg){
      if (!navigator.serviceWorker.controller) {
        return;
      }
      console.log("Service Worker Successfully Registered!");      
  })
  .catch( function(){
      console.log("Service Worker Not registered!");
  });
}
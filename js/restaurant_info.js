let restaurant;
var newMap;

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
fillReviewsHTML = (reviews = self.restaurant.reviews, restaurant = self.restaurant) => {
  const container = document.getElementById('reviews-container');
  
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

  container.appendChild(reviewsSectionHeader);

  //add form to the page
  container.appendChild(createNewReviewForm());

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

createNewReviewForm = (restaurant = self.restaurant) => {
  //create form for new review
  const form = document.createElement('form');
  form.className = 'new-review-form';
  form.id = 'new-review-form';
  const formHeading = document.createElement('h4');
  formHeading.className = 'review-form-heading';
  formHeading.innerHTML = 'Add a New Review';
  const div1 = document.createElement('div');
  div1.className = 'form-elements';
  const label1 = document.createElement('label');
  label1.setAttribute('for', 'name');
  label1.className = 'label-col';
  label1.innerHTML = 'Name: '
  const subDiv1 = document.createElement('div');
  subDiv1.className = 'input-col';
  const input1 = document.createElement('input');
  input1.type = 'text';
  input1.id = 'name';
  input1.placeholder = 'Name'
  input1.required = true;
  subDiv1.appendChild(input1);
  div1.appendChild(label1);
  div1.appendChild(subDiv1);
  

  const div2 = document.createElement('div');
  div2.className = 'form-elements';
  const label2 = document.createElement('label');
  label2.setAttribute('for', 'restaurant-id');
  label2.className = 'label-col';
  label2.innerHTML = 'Restaurant: '
  const subDiv2 = document.createElement('div');
  subDiv2.className = 'input-col';
  const input2 = document.createElement('input');
  input2.type = 'text';
  input2.id = 'restaurant-id';
  input2.value = restaurant.id;
  input2.readOnly = true;
  subDiv2.appendChild(input2);
  div2.appendChild(label2);
  div2.appendChild(subDiv2);

  const fieldset = document.createElement('fieldset');
  const div3 = document.createElement('div');
  div3.className = 'form-elements';
  const legend = document.createElement('legend');
  legend.setAttribute('for', 'rating');
  legend.className = 'legend-col';
  legend.innerHTML = 'Rating: ';
  const subDiv3 = document.createElement('div');
  subDiv3.className = 'radio-group-col';
  const subInput1 = document.createElement('input');
  subInput1.type = 'radio';
  subInput1.name = 'rating';
  subInput1.id = '1star';
  subInput1.value = '1';
  subInput1.required = true;
  const subLabel1 = document.createElement('label');
  subLabel1.setAttribute('for', `${subInput1.id}`);
  subLabel1.innerHTML = '1 Star';


  const subInput2 = document.createElement('input');
  subInput2.type = 'radio';
  subInput2.name = 'rating';
  subInput2.id = '2stars';
  subInput2.value = '2';
  subInput2.required = true;
  const subLabel2 = document.createElement('label');
  subLabel2.setAttribute('for', `${subInput2.id}`);
  subLabel2.innerHTML = '2 stars';

  const subInput3 = document.createElement('input');
  subInput3.type = 'radio';
  subInput3.name = 'rating';
  subInput3.id = '3stars';
  subInput3.value = '3';
  subInput3.required = true;
  const subLabel3 = document.createElement('label');
  subLabel3.setAttribute('for', `${subInput3.id}`);
  subLabel3.innerHTML = '3 Stars';

  const subInput4 = document.createElement('input');
  subInput4.type = 'radio';
  subInput4.name = 'rating';
  subInput4.id = '4stars';
  subInput4.value = '4';
  subInput4.required = true;
  const subLabel4 = document.createElement('label');
  subLabel4.setAttribute('for', `${subInput4.id}`);
  subLabel4.innerHTML = '4 Stars';

  const subInput5 = document.createElement('input');
  subInput5.type = 'radio';
  subInput5.name = 'rating';
  subInput5.id = '5stars';
  subInput5.value = '5';
  subInput5.required = true;
  const subLabel5 = document.createElement('label');
  subLabel5.setAttribute('for', `${subInput5.id}`);
  subLabel5.innerHTML = '5 stars';

  subDiv3.appendChild(subInput1);
  subDiv3.appendChild(subLabel1);
  subDiv3.appendChild(subInput2);
  subDiv3.appendChild(subLabel2);
  subDiv3.appendChild(subInput3);
  subDiv3.appendChild(subLabel3);
  subDiv3.appendChild(subInput4);
  subDiv3.appendChild(subLabel4);
  subDiv3.appendChild(subInput5);
  subDiv3.appendChild(subLabel5);
  fieldset.appendChild(legend);
  fieldset.appendChild(subDiv3);
  div3.appendChild(fieldset);

  const div4 = document.createElement('div');
  div4.className = 'form-elements';
  const label3 = document.createElement('label');
  label3.setAttribute('for', 'comments');
  label3.className = 'label-col';
  label3.innerHTML = 'Comments: ';
  const subDiv4 = document.createElement('div');
  subDiv4.className = 'input-col';
  const textarea = document.createElement('textarea');
  textarea.id = 'comments';
  textarea.placeholder = 'Enter your comments';
  textarea.required = true;
  subDiv4.appendChild(textarea);
  div4.appendChild(label3);
  div4.appendChild(subDiv4);


  const div5 = document.createElement('div');
  div5.className = 'form-elements';
  const button = document.createElement('button');
  button.className = 'add-review';
  button.id = 'add-review';
  button.innerHTML = 'Add Review';;
  div5.appendChild(button);

  const div6 = document.createElement('div');
  div6.className = 'error-msg';
  div6.id = 'error-msg';

  form.appendChild(formHeading);
  form.appendChild(div1);
  form.appendChild(div2);
  form.appendChild(div3);
  form.appendChild(div4);
  form.appendChild(div5);
  form.appendChild(div6);
 
  return form;
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
      "restaurant_id": `${restaurantId}`,
      "name": `${name}`,
      "rating": `${rating}`,
      "comments": `${comments}`
    }
    
    event.preventDefault();
    
  });
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
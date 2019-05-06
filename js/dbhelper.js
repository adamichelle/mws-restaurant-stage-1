/**
 * Common database helper functions.
 */
class DBHelper {

  /* constructor(){ 
    this.dbPromise = DBHelper.openDatabase();
  }
 */
  static openDatabase() {
    // If the browser doesn't support service worker,
    // then no need to have a database
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }
    
    return idb.open('restaurants-reviews-app', 1, function(upgradeDb) {
        let restaurantsListStore = upgradeDb.createObjectStore('restaurants-list', {
        keyPath: 'id'
        });
        restaurantsListStore.createIndex('by-ID', 'id');

        let reviewsListStore = upgradeDb.createObjectStore('reviews-list', {
          keyPath: 'id'
        });
        reviewsListStore.createIndex('by-Review-ID', 'id');
        let formDataStore = upgradeDb.createObjectStore('form-data', {
          keyPath: 'name'
        });
        formDataStore.createIndex('by-Name', 'name');
    });
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000 // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;
    // return `./data/restaurants.json`;
    const databaseUrls = [
      `https://my-restaurant-reviews-backend.herokuapp.com/restaurants/`,
      `https://my-restaurant-reviews-backend.herokuapp.com/reviews/`
    ]
    return databaseUrls;
  }

  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL[0])
    .then(response => response.json())
    .then(restaurants => {
      console.log("Retriving restaurants from api!");
      DBHelper.openDatabase().then(function(db){
                
        if(!db) return;

        let tx = db.transaction('restaurants-list', 'readwrite');
        let restaurantsListStore = tx.objectStore('restaurants-list');
        restaurants.forEach(function(restaurant) {
          restaurantsListStore.put(restaurant);
        });
      });

      callback(null, restaurants);
    })
    .catch((e) => {
      console.log(`Request failed. Returned ${e}. Now fetching from index db!!"`);
      DBHelper.openDatabase().then(function(db) {
        
        const index = db.transaction('restaurants-list')
        .objectStore('restaurants-list').index('by-ID');

        index.getAll().then((restaurants) => {
          callback(null, restaurants);
        });
      });
    });
  }

  static fetchReviews(id, callback) {
    const reviewsUrl = `${DBHelper.DATABASE_URL[1]}?restaurant_id=${id}`;
    fetch(reviewsUrl)
    .then((response) => response.json())
    .then((reviews) => {
      console.log("Retriving reviews from api!");
      DBHelper.openDatabase().then(function(db){
                
        if(!db) return;

        let tx = db.transaction('reviews-list', 'readwrite');
        let reviewsListStore = tx.objectStore('reviews-list');
        reviews.forEach(function(review) {
          reviewsListStore.put(review);
        });
      });

      callback(null, reviews);
    })
    .catch((e) => {
      console.log(`Request failed. Returned ${e}. Now fetching from index db!!"`);
      DBHelper.openDatabase().then(function(db) {
        
        const index = db.transaction('reviews-list')
        .objectStore('reviews-list').index('by-Review-ID');

        index.getAll().then((reviews) => {
          callback(null, reviews);
        });
      });
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    marker._icon.id =restaurant.id;
    return marker;
  } 

  
  static addToFavorites(id) {
    const addToFavoritesUrl = `${DBHelper.DATABASE_URL[0]}${id}/?is_favorite=true`;
    fetch(addToFavoritesUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((response) => response.json())
    .then((data) => {
      console.log('Request succeeded', data)
    })
    .catch((error) => {
      console.log('Request failed', error)
    })
  }

  static removeFromFavorites(id) {
    const removeFromFavoritesUrl = `${DBHelper.DATABASE_URL[0]}${id}/?is_favorite=false`;
    fetch(removeFromFavoritesUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((response) => response.json())
    .then((data) => {
      console.log('Request succeeded', data)
    })
    .catch((error) => {
      console.log('Request failed', error)
    })
  }

  static addNewReview(form_parameters) {
    fetch(DBHelper.DATABASE_URL[1], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(form_parameters)
    }).then((res) => res.json())
    .then((data) => window.location.reload(true))
    .catch((err) => console.log(err))
  }

  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}


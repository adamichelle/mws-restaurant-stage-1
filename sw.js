const appPrefix = 'RestaurantReviews_'; //name of the app
const version = 'v_10';    //version of cache
const staticCacheName = `${appPrefix}_static_${version}`; //cache name for the page layout
const dynamicCacheName = `${appPrefix}_dynamic_${version}`; //cache name for dynamic pages
const allCaches = [
    staticCacheName,
    dynamicCacheName
]

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then( function(cache){
            return cache.addAll(
                [
                    './',
                    './restaurant.html',
                    './data/restaurants.json',
                    './js/dbhelper.js',
                    './js/main.js',
                    './js/restaurant_info.js',
                    './css/styles.css',
                    './css/custom.css',
                    './css/responsive.css',
                    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
                    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
                    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
                    'https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png'
                ]
            );
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith(appPrefix) &&
                   !allCaches.includes(cacheName);
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
});

self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
        event.respondWith(caches.match('/'));
        return;
        }
        

    }

    event.respondWith(
      caches.match(event.request).then(function(response) {
        // return response || fetch(event.request);
        if(response) return response;

        return fetch(event.request)
                .then( function(res) {
                    return caches.open(dynamicCacheName)
                    .then( function(cache) {
                        cache.put(requestUrl, res.clone());
                        return res;
                    });
                });
      })
    );
});
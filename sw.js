const appPrefix = 'RestaurantReviews_'; //name of the app
const version = 'v_01';    //version of cache
const staticCacheName = `${appPrefix}static_${version}`; //cache name for the page layout
const dynamicCacheName = `${appPrefix}dynamic_${version}`; //cache name for dynamic pages
const imagesCacheName = `${appPrefix}images_${version}`; //cache name for images
const allCaches = [
    staticCacheName,
    dynamicCacheName,
    imagesCacheName
]

self.addEventListener('install', (event) => {
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

self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName.startsWith(`${appPrefix}`) &&
                   !allCaches.includes(cacheName);
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
        event.respondWith(caches.match('/'));
        return;
        }
        
        if(/\/images\/\d{1,2}_/.test(requestUrl.pathname)){
            event.respondWith(serveSmallerImages(event.request));
            return;
        }

        if(/\/images\/\d{1,2}-\d{1,4}_/.test(requestUrl.pathname)){
            event.respondWith(serveLargeImages(event.request));
            return;
        }

    }

    

    event.respondWith(
      caches.match(event.request).then((cacheResponse) => {
        return cacheResponse || fetch(event.request)
        .then((networkResponse) => {
            return caches.open(dynamicCacheName)
            .then((dynamicCache) => {
                dynamicCache.put(event.request.url, networkResponse.clone());
                return networkResponse;
            })
        });
      })
    );
});


const serveSmallerImages = async (request) => {
    const imageStorageUrl = request.url.replace(/(_small\.jpg|_medium\.jpg)/, '');

    return await caches.open(imagesCacheName)
    .then((imageCache) => {
        return imageCache.match(imageStorageUrl)
        .then((imageCacheResponse) => {
            const networkFetch = fetch(request).then(async (networkResponse) => {
                await imageCache.put(imageStorageUrl, networkResponse.clone());
                return networkResponse;
            });
            return imageCacheResponse || networkFetch;
        });
    });
    
}

const serveLargeImages = async (request) => {
    const imageStorageUrl = request.url.replace(/(-\d{1,4}_large_1x\.jpg|-\d{1,4}_large_2x\.jpg)/, '_large');
    
    return await caches.open(imagesCacheName)
    .then((imageCache) => {
        return imageCache.match(imageStorageUrl)
        .then((imageCacheResponse) => {
            const networkFetch = fetch(request).then(async (networkResponse) => {
                await imageCache.put(imageStorageUrl, networkResponse.clone());
                return networkResponse;
            });
            return imageCacheResponse || networkFetch;
        });
    });
    
}
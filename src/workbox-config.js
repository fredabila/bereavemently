// workbox-config.js
module.exports = {
    globDirectory: 'public/', // Replace with your build directory
    globPatterns: [
      '**/*.{html,js,css,png,jpg,svg}', // Include the file types you want to cache
    ],
    swDest: '../public/sw.js', // Output location for the generated service worker
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/, // Cache image files
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 20, // Limit the number of cached images
          },
        },
      },
      {
        urlPattern: new RegExp('https://v1.api.buzzchat.site/ember/'), // Cache API responses
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-calls',
          networkTimeoutSeconds: 10, // If the network fails, use the cache after 10 seconds
        },
      },
    ],
  };
  
const CACHE_NAME = 'ubo-academic-hub-v114';
const APP_ASSETS = ['./', './index.html', './styles.css?v=110', './app.js?v=113', './config/institution.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
const DEMO_SHELL_ASSETS = [
  './modules/professor/teacher-dashboard.html',
  './modules/professor/teacher-dashboard.css',
  './modules/professor/teacher-dashboard.js',
  './modules/professor/dashboard.js',
  './modules/admin/admin-dashboard.html',
  './modules/admin/admin-dashboard.css',
  './modules/admin/admin-dashboard.js',
  './services/course-service.js',
  './services/professor-service.js',
  './services/student-service.js',
  './services/admin-service.js',
  './services/admin-actions/administrative-action-service.js',
  './core/permissions.js',
  './core/session.js',
  './core/demo-identity-session.js',
  './core/demo-route-guard.js',
  './data/users.js',
  './data/courses.js',
  './data/professors.js',
  './data/students.js',
  './data/university/analytics.js',
  './data/university/careers.js',
  './data/university/courses.js',
  './data/university/rooms.js',
  './data/university/schedules.js'
];
const OFFLINE_DOCUMENTS = {
  '/modules/professor/teacher-dashboard.html': './modules/professor/teacher-dashboard.html',
  '/modules/admin/admin-dashboard.html': './modules/admin/admin-dashboard.html'
};
const PRECACHE_ASSETS = [...APP_ASSETS, ...DEMO_SHELL_ASSETS];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS)));self.skipWaiting()});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch', event => {if(event.request.method !== 'GET')return;const isDocument=event.request.mode==='navigate'||event.request.destination==='document';if(isDocument){event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response}).catch(()=>{const pathname=new URL(event.request.url).pathname;return caches.match(event.request).then(cached=>cached||caches.match(OFFLINE_DOCUMENTS[pathname]||'./index.html'))}));return}event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)))});

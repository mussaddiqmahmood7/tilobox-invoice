/* ===========================================================
 * TiloBox Invoice - Progressive Web App Service Worker
 * Production-ready, offline-first caching & background sync
 * =========================================================== */

const CACHE_NAME = "tilobox-invoice-v1";
const OFFLINE_FALLBACK_URL = "/";

// Core static assets to precache on install
const PRECACHE_ASSETS = [
    "/",
    "/manifest.webmanifest",
    "/icon.svg",
    "/assets/img/tilobox-logo.svg",
    "/assets/favicon/icon-192x192.png",
    "/assets/favicon/icon-512x512.png",
    "/assets/favicon/icon-maskable-512x512.png",
    "/assets/favicon/apple-touch-icon.png",
    "/assets/favicon/favicon-32x32.png",
    "/assets/favicon/favicon-16x16.png",
];

// 1. Install event: Precache core shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn("[SW] Precache partial error (continuing):", err);
            });
        })
    );
    self.skipWaiting();
});

// 2. Activate event: Clean up stale caches and claim clients
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Message event: Support SKIP_WAITING from client
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// Helper: Check if request is for Next.js static asset
function isStaticAsset(url) {
    return (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/assets/") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".ico") ||
        url.pathname.endsWith(".woff2") ||
        url.pathname.endsWith(".woff")
    );
}

// 4. Fetch event: Strategic caching
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Don't intercept non-GET requests (e.g. POST to /api)
    if (request.method !== "GET") {
        return;
    }

    // A. External Currency API: Stale-While-Revalidate
    if (url.hostname.includes("openexchangerates.org")) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(request);
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }

    // Skip other cross-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }

    // B. Static Assets (_next/static, images, fonts): Cache-First
    if (isStaticAsset(url)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                }).catch(() => {
                    return new Response("", { status: 408, statusText: "Offline" });
                });
            })
        );
        return;
    }

    // C. HTML Navigation Requests: Network-First with Cache Fallback
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    // Network failed -> return cached version of this page
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    // Fallback to root or default cached navigation
                    const fallback = await caches.match(OFFLINE_FALLBACK_URL);
                    if (fallback) return fallback;

                    return new Response(
                        `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Offline - TiloBox Invoice</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f8fafc;color:#1e293b;"><h1>You are offline</h1><p>Please check your internet connection or reload the app.</p><button onclick="location.reload()" style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;">Reload</button></body></html>`,
                        { headers: { "Content-Type": "text/html" } }
                    );
                })
        );
        return;
    }

    // Default: Network with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.status === 200 && response.type === "basic") {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

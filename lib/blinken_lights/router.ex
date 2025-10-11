defmodule BlinkenLights.Router do
  use Plug.Router

  plug Plug.Static, at: "/static", from: "priv/static/assets"

  plug :match
  plug :dispatch

  get "/" do
    conn
    |> put_resp_header("content-type", "text/html; charset=UTF-8")
    |> send_resp(200, """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <meta name="theme-color" content="#000">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Hepta+Slab:wght@600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/static/app.css" />
        <title>Lights</title>
      </head>
      <body class="--bg-gray-900">
        <div id="root"></div>
        <script>
          window.addEventListener('beforeinstallprompt', (e) => {
          });
          const manifest = {
            name: 'BlinkenLights',
            display: 'standalone',
            theme_color: '#B3BBBF',
            background_color: '#263238',
            start_url: window.location.href,
            // png icon will be converted from SVG
          };

          (async function() {
            // const svgIconLink = document.querySelector('link[rel="icon"]');

            // // convert from SVG string to PNG data URL
            // const pngDataUrl = await svgToPng(svgIconLink.href, iconSize);

            // // set the icon meta tags to the new PNG
            // setIcon("link[rel='icon']", pngDataUrl, iconSize);
            // setIcon("link[rel='apple-touch-icon']", pngDataUrl);

            // // dynamically create manifest
            // manifest.icons =  [{
            //   src: pngDataUrl,
            //   sizes: `${iconSize}x${iconSize}`,
            //   type: 'image/png'
            // }]

            // set the manifest meta tag data url
            setManifest(manifest);

            // generate and set the iOS startup image
            // const startupImageDataUrl = await createStartupImage(
            //   svgIconLink.href,
            //   manifest.background_color
            // );
            // const startupLink = document.createElement('link');
            // startupLink.rel = 'apple-touch-startup-image';
            // startupLink.href = startupImageDataUrl;
            // document.head.appendChild(startupLink);
          })();
          function setManifest(manifest) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            const b64manifest = btoa(JSON.stringify(manifest));
            link.href = "data:application/json;base64," + b64manifest;
            document.head.appendChild(link);
          }
        </script>
        <script>
          document.body.addEventListener('touchmove', function(e) {
            e.preventDefault();
          });
          /*! iNoBounce - v0.2.0
            * https://github.com/lazd/iNoBounce/
            * Copyright (c) 2013 Larry Davis <lazdnet@gmail.com>; Licensed BSD */
          (function(global) {
            // Stores the Y position where the touch started
            var startY = 0;

            // Store enabled status
            var enabled = false;

            var supportsPassiveOption = false;
            try {
            var opts = Object.defineProperty({}, 'passive', {
            get: function() {
            supportsPassiveOption = true;
            }
            });
            window.addEventListener('test', null, opts);
            } catch (e) {}

            var handleTouchmove = function(evt) {
            // Get the element that was scrolled upon
            var el = evt.target;

            // Allow zooming
            var zoom = window.innerWidth / window.document.documentElement.clientWidth;
            if (evt.touches.length > 1 || zoom !== 1) {
            return;
            }

            // Check all parent elements for scrollability
            while (el !== document.body && el !== document) {
            // Get some style properties
            var style = window.getComputedStyle(el);

            if (!style) {
            // If we've encountered an element we can't compute the style for, get out
            break;
            }

            // Ignore range input element
            if (el.nodeName === 'INPUT' && el.getAttribute('type') === 'range') {
            return;
            }

            var scrolling = style.getPropertyValue('-webkit-overflow-scrolling');
            var overflowY = style.getPropertyValue('overflow-y');
            var height = parseInt(style.getPropertyValue('height'), 10);

            // Determine if the element should scroll
            var isScrollable = scrolling === 'touch' && (overflowY === 'auto' || overflowY === 'scroll');
            var canScroll = el.scrollHeight > el.offsetHeight;

            if (isScrollable && canScroll) {
            // Get the current Y position of the touch
            var curY = evt.touches ? evt.touches[0].screenY : evt.screenY;

            // Determine if the user is trying to scroll past the top or bottom
            // In this case, the window will bounce, so we have to prevent scrolling completely
            var isAtTop = (startY <= curY && el.scrollTop === 0);
            var isAtBottom = (startY >= curY && el.scrollHeight - el.scrollTop === height);

            // Stop a bounce bug when at the bottom or top of the scrollable element
            if (isAtTop || isAtBottom) {
              evt.preventDefault();
            }

            // No need to continue up the DOM, we've done our job
            return;
            }

            // Test the next parent
            el = el.parentNode;
            }

            // Stop the bouncing -- no parents are scrollable
            evt.preventDefault();
            };

            var handleTouchstart = function(evt) {
            // Store the first Y position of the touch
            startY = evt.touches ? evt.touches[0].screenY : evt.screenY;
            };

            var enable = function() {
            // Listen to a couple key touch events
            window.addEventListener('touchstart', handleTouchstart, supportsPassiveOption ? { passive : false } : false);
            window.addEventListener('touchmove', handleTouchmove, supportsPassiveOption ? { passive : false } : false);
            enabled = true;
            };

            var disable = function() {
            // Stop listening
            window.removeEventListener('touchstart', handleTouchstart, false);
            window.removeEventListener('touchmove', handleTouchmove, false);
            enabled = false;
            };

            var isEnabled = function() {
            return enabled;
            };

            // Enable by default if the browser supports -webkit-overflow-scrolling
            // Test this by setting the property with JavaScript on an element that exists in the DOM
            // Then, see if the property is reflected in the computed style
            var testDiv = document.createElement('div');
            document.documentElement.appendChild(testDiv);
            testDiv.style.WebkitOverflowScrolling = 'touch';
            var isScrollSupported = 'getComputedStyle' in window && window.getComputedStyle(testDiv)['-webkit-overflow-scrolling'] === 'touch';
            document.documentElement.removeChild(testDiv);

            if (isScrollSupported) {
            enable();
            }

            // A module to support enabling/disabling iNoBounce
            var iNoBounce = {
            enable: enable,
            disable: disable,
            isEnabled: isEnabled,
            isScrollSupported: isScrollSupported
            };

            global.iNoBounce = iNoBounce;
          }(this));
        </script>
        <script src="/static/app.js"></script>
      </body>
    </html>
    """)
  end

  get "/websocket" do
    conn
    |> WebSockAdapter.upgrade(BlinkenLights.Websocket, [], timeout: 600_000)
    |> halt()
  end

  match _ do
    send_resp(conn, 404, "Not found")
  end
end

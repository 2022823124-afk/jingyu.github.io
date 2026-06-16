# Design QA

final result: passed

Prototype: `prototype`

Verified:
- Production build completed with Vite.
- Local dev URL returned HTTP 200 at `http://127.0.0.1:5173`.
- Main mobile flows are implemented: navigation map, lost mode, Bluetooth stopover connection, human map point details, environment recognition, upload review queue, stopover station, and profile center.
- Profile center removes delivery-count framing and uses navigation/contribution metrics instead.
- Lost mode now auto-connects the nearest station mock and reveals uploaded landmark points.
- Map view now uses Leaflet with OpenStreetMap tiles centered around Guangzhou Shipai Village, with an OSRM route request and local fallback route.
- Upload view now keeps type selection hidden until a photo is selected, then shows the photo preview above the type picker.
- Recognition view now uses the browser camera through `getUserMedia`, with photo capture, fallback image upload, and multiple confidence candidates.
- Order screenshot recognition now opens an image picker/camera first, then shows an uploaded screenshot preview and recognized destination feedback.
- Added a branded DOORI launch screen with orange-accented navigation iconography.

Notes:
- Pixel screenshot comparison was not run because no standard Browser/Chrome capture tool was available in this session. Playwright exists locally, but the Product Design workflow asks for user confirmation before using it.
- External map actions are implemented as replaceable links for Google Maps and AMap URI; production use should swap in an API key based map SDK.

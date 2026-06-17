const AMAP_SCRIPT_ID = "amap-jsapi";

export function isAmapEnabled() {
  return import.meta.env.VITE_AMAP_ENABLED === "true";
}

export function hasAmapCredentials() {
  return Boolean(import.meta.env.VITE_AMAP_KEY && import.meta.env.VITE_AMAP_SECURITY_CODE);
}

export function getAmapStatus() {
  if (!isAmapEnabled()) {
    return "disabled";
  }
  return hasAmapCredentials() ? "ready" : "missing-credentials";
}

export function loadAmap() {
  if (!isAmapEnabled()) {
    return Promise.reject(new Error("AMap integration is disabled."));
  }

  if (!hasAmapCredentials()) {
    return Promise.reject(new Error("AMap credentials are missing."));
  }

  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }

  const existingScript = document.getElementById(AMAP_SCRIPT_ID);
  if (existingScript) {
    return waitForAmap();
  }

  window._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
  };

  const script = document.createElement("script");
  script.id = AMAP_SCRIPT_ID;
  script.async = true;
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(
    import.meta.env.VITE_AMAP_KEY,
  )}&plugin=AMap.Geocoder,AMap.Driving,AMap.Walking`;
  document.head.appendChild(script);

  return waitForAmap();
}

function waitForAmap() {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (window.AMap) {
        window.clearInterval(timer);
        resolve(window.AMap);
        return;
      }

      if (Date.now() - startedAt > 10000) {
        window.clearInterval(timer);
        reject(new Error("AMap script load timed out."));
      }
    }, 120);
  });
}

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAmapStatus } from "./amapGateway.js";
import {
  BadgeCheck,
  BatteryCharging,
  Bell,
  Bluetooth,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Compass,
  Crosshair,
  ImagePlus,
  Layers3,
  Map,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Wifi,
  Zap,
} from "lucide-react";

const defaultDestination = {
  name: "金龙巷18号",
  detail: "从永兴茶餐店旁小巷进入，楼道在左手边第一个铁门",
  eta: "约8分钟",
  distance: "380m",
  lat: 23.12965,
  lng: 113.34042,
};

const landmarks = [
  {
    id: "l1",
    type: "门",
    color: "orange",
    title: "金龙巷18号门牌",
    subtitle: "门牌、楼号、单元号",
    distance: "约15m",
    uploader: "骑手阿明",
    status: "已收录",
    image: "door",
    x: 51,
    y: 24,
  },
  {
    id: "l2",
    type: "店",
    color: "green",
    title: "永兴茶餐店外墙",
    subtitle: "店招、转角参照物",
    distance: "约28m",
    uploader: "居民林姐",
    status: "已收录",
    image: "shop",
    x: 35,
    y: 58,
  },
  {
    id: "l3",
    type: "巷",
    color: "blue",
    title: "B栋楼道入口",
    subtitle: "巷口、楼道方向牌",
    distance: "约55m",
    uploader: "骑手小陈",
    status: "已收录",
    image: "alley",
    x: 67,
    y: 47,
  },
  {
    id: "l4",
    type: "楼",
    color: "purple",
    title: "A栋3单元楼道",
    subtitle: "楼道口、单元标识",
    distance: "约72m",
    uploader: "社区志愿者",
    status: "审核中",
    image: "stair",
    x: 76,
    y: 28,
  },
];

const stations = [
  {
    id: "s1",
    name: "金龙市场停靠站",
    range: "50m范围",
    distance: "120m",
    status: "信号强",
    signal: 92,
    address: "金龙路与华安路交汇处",
    hints: ["金龙超市门口", "平安路牌红柱旁", "永兴茶餐店对面"],
  },
  {
    id: "s2",
    name: "平安广场停靠站",
    range: "80m范围",
    distance: "380m",
    status: "信号中",
    signal: 61,
    address: "平安路68号广场南侧",
    hints: ["便利店侧墙", "老榕树旁", "货架停车位附近"],
  },
];

const initialUploads = [
  { title: "金龙巷18号门牌", type: "门牌号码", time: "刚刚", state: "已收录" },
  { title: "永兴茶餐店招牌", type: "店铺招牌", time: "2小时前", state: "已收录" },
  { title: "平安路B巷入口", type: "巷口标识", time: "昨天", state: "审核中" },
  { title: "A栋3单元楼道", type: "楼道入口", time: "3天前", state: "已收录" },
];

const tabs = [
  { id: "map", label: "地图", icon: Map },
  { id: "scan", label: "识别", icon: Camera },
  { id: "upload", label: "上传", icon: Upload },
  { id: "station", label: "停靠站", icon: Radio },
  { id: "profile", label: "我的", icon: CircleUserRound },
];

const uploadTypes = [
  { id: "door", label: "门牌号码", note: "楼号、门牌、单元号" },
  { id: "alley", label: "巷口标识", note: "巷口名称、方向牌" },
  { id: "shop", label: "店铺招牌", note: "商店、餐厅招牌" },
  { id: "stair", label: "楼道入口", note: "楼道门、单元入口" },
];

const currentLocation = [23.12872, 113.33966];
const searchPresets = [
  defaultDestination,
  {
    name: "石牌村牌坊",
    detail: "石牌东路入口附近，适合作为进村定位点",
    eta: "约6分钟",
    distance: "310m",
    lat: 23.12896,
    lng: 113.33792,
  },
  {
    name: "永兴茶餐店",
    detail: "金龙巷口附近，店招明显，可作为环境识别参照",
    eta: "约4分钟",
    distance: "220m",
    lat: 23.12912,
    lng: 113.34002,
  },
  {
    name: "金龙市场停靠站",
    detail: "停靠站 S1，支持蓝牙辅助定位与充电",
    eta: "约3分钟",
    distance: "120m",
    lat: 23.12938,
    lng: 113.34038,
  },
];

function createFallbackRoute(target) {
  return [
    currentLocation,
    [23.12895, 113.33976],
    [23.12918, 113.33988],
    [23.12934, 113.34008],
    [target.lat, target.lng],
  ];
}

const landmarkCoordinates = [
  [23.1295, 113.34025],
  [23.12912, 113.34002],
  [23.12928, 113.34058],
  [23.12972, 113.34072],
];

const recognitionCandidates = [
  {
    id: "c1",
    title: "永兴杂货店外墙",
    address: "金龙巷12号旁",
    distance: "约15m",
    confidence: 94,
    hint: "沿右侧窄巷前进，第二个巷口左转进入金龙巷。",
  },
  {
    id: "c2",
    title: "永兴茶餐店招牌",
    address: "金龙巷口东侧",
    distance: "约42m",
    confidence: 68,
    hint: "可能在同一巷口附近，建议再靠近门牌或店招拍一张。",
  },
  {
    id: "c3",
    title: "平安路B巷入口",
    address: "平安路与金龙巷交界",
    distance: "约88m",
    confidence: 51,
    hint: "相似度较低，仅作为备用候选，可结合停靠站信号确认。",
  },
];

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function AppHeader({ title, subtitle, onScanOrder }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">9:41</p>
        <h1>{title}</h1>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {onScanOrder ? (
        <label className="round ghost header-camera" aria-label="订单截图识别">
          <Camera size={18} />
          <input type="file" accept="image/*" capture="environment" onChange={onScanOrder} />
        </label>
      ) : null}
    </header>
  );
}

function BottomNav({ active, setActive }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={cx("nav-item", active === tab.id && "active")}
            type="button"
            onClick={() => setActive(tab.id)}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MiniMap({
  lostMode,
  selectedPoi,
  setSelectedPoi,
  connectedStation,
  onToggleLost,
  destinationData,
  onRouteUpdate,
}) {
  const mapNodeRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!mapNodeRef.current || mapInstanceRef.current) return;

    const map = L.map(mapNodeRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      tap: true,
    }).setView([23.12925, 113.34012], 17);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    overlayLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    const map = mapInstanceRef.current;
    if (!routeLayer) return;
    routeLayer.clearLayers();
    const destinationLocation = [destinationData.lat, destinationData.lng];
    const fallbackRoute = createFallbackRoute(destinationData);

    const drawRoute = (coords) => {
      L.polyline(coords, {
        color: "#ff7417",
        weight: 6,
        opacity: 0.95,
        dashArray: "12 10",
        lineCap: "round",
      }).addTo(routeLayer);
      if (map) {
        map.fitBounds(L.latLngBounds(coords), { padding: [54, 54], maxZoom: 18 });
      }
    };

    drawRoute(fallbackRoute);
    onRouteUpdate?.({ eta: destinationData.eta, distance: destinationData.distance, source: "本地路线" });

    const controller = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/foot/${currentLocation[1]},${currentLocation[0]};${destinationData.lng},${destinationData.lat}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const route = data?.routes?.[0];
        const coordinates = route?.geometry?.coordinates;
        if (!coordinates?.length) return;
        routeLayer.clearLayers();
        drawRoute(coordinates.map(([lng, lat]) => [lat, lng]));
        onRouteUpdate?.({
          eta: `约${Math.max(1, Math.round(route.duration / 60))}分钟`,
          distance: route.distance >= 1000 ? `${(route.distance / 1000).toFixed(1)}km` : `${Math.round(route.distance)}m`,
          source: "OSRM步行路线",
        });
      })
      .catch(() => {});

    return () => controller.abort();
  }, [destinationData, onRouteUpdate]);

  useEffect(() => {
    const overlayLayer = overlayLayerRef.current;
    if (!overlayLayer) return;
    overlayLayer.clearLayers();

    const createPin = (label, className) =>
      L.divIcon({
        className: `osm-pin ${className}`,
        html: `<span>${label}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

    L.marker(currentLocation, { icon: createPin("起", "start") }).addTo(overlayLayer);
    L.marker([destinationData.lat, destinationData.lng], { icon: createPin("终", "finish") }).addTo(overlayLayer);

    if (lostMode) {
      landmarks.forEach((point, index) => {
        const marker = L.marker(landmarkCoordinates[index], {
          icon: createPin(point.type, point.color),
        }).addTo(overlayLayer);
        marker.on("click", () => setSelectedPoi(point));
      });

      L.marker([23.12938, 113.34038], {
        icon: createPin("电", "station"),
      }).addTo(overlayLayer);
    }
  }, [lostMode, setSelectedPoi, destinationData]);

  return (
    <section className={cx("mini-map", lostMode && "lost")}>
      <div className="leaflet-map" ref={mapNodeRef} />
      <div className="real-map-badge">
        <MapPin size={13} />
        OpenStreetMap · 石牌村
      </div>

      {lostMode ? (
        <button className="map-station-tag" type="button" onClick={() => setSelectedPoi(landmarks[1])}>
          <BatteryCharging size={15} />
          充电站金龙A区
        </button>
      ) : null}

      <div className="map-actions">
        <button className="round dark" type="button" aria-label="放大地图">
          <Search size={16} />
        </button>
        <button className="round dark" type="button" aria-label="定位">
          <Crosshair size={16} />
        </button>
      </div>

      <button className="locate-fab" type="button" aria-label="当前位置">
        <Navigation size={22} />
      </button>

      <button className={cx("lost-pill", lostMode && "active")} type="button" onClick={onToggleLost}>
        {lostMode ? <CheckCircle2 size={17} /> : <ShieldCheck size={16} />}
        {lostMode ? "退出迷路" : "迷路？"}
      </button>

      {lostMode && connectedStation ? (
        <div className="map-chip bluetooth">
          <Bluetooth size={14} />
          已连接 {connectedStation.name}
        </div>
      ) : null}
    </section>
  );
}

function LandmarkSheet({ point, onClose }) {
  if (!point) return null;
  return (
    <aside className="poi-sheet">
      <div className={cx("thumb", point.image)} />
      <div className="sheet-copy">
        <strong>{point.title}</strong>
        <span>{point.subtitle}</span>
        <small>{point.uploader}上传 · {point.distance}</small>
      </div>
      <button className="round ghost" type="button" onClick={onClose} aria-label="关闭照片点位">
        <ChevronRight size={18} />
      </button>
    </aside>
  );
}

function MapScreen({
  lostMode,
  setLostMode,
  connectedStation,
  setConnectedStation,
  selectedPoi,
  setSelectedPoi,
  setActive,
  onScanOrder,
  destinationData,
  setDestinationData,
}) {
  const [query, setQuery] = useState(destinationData.name);
  const [searchState, setSearchState] = useState("idle");
  const [searchResults, setSearchResults] = useState(searchPresets);
  const [routeInfo, setRouteInfo] = useState({
    eta: destinationData.eta,
    distance: destinationData.distance,
    source: "OSRM步行路线",
  });
  const handleRouteUpdate = useCallback((info) => setRouteInfo(info), []);

  async function searchDestination(event) {
    event?.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;
    setSearchState("searching");

    const localMatches = searchPresets.filter((item) => item.name.includes(keyword));
    try {
      const params = new URLSearchParams({
        q: `${keyword} 广州 石牌村`,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const data = response.ok ? await response.json() : [];
      const remoteMatches = data.map((item) => ({
        name: item.name || keyword,
        detail: item.display_name,
        eta: "正在计算",
        distance: "路线计算中",
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
      const nextResults = [...localMatches, ...remoteMatches].filter((item) => item.lat && item.lng);
      setSearchResults(nextResults.length ? nextResults : searchPresets);
      if (nextResults[0]) {
        selectDestination(nextResults[0]);
      }
      setSearchState(nextResults[0] ? "done" : "empty");
    } catch {
      setSearchResults(localMatches.length ? localMatches : searchPresets);
      if (localMatches[0]) {
        selectDestination(localMatches[0]);
      }
      setSearchState(localMatches[0] ? "done" : "empty");
    }
  }

  function selectDestination(place) {
    setDestinationData(place);
    setQuery(place.name);
    setRouteInfo({ eta: place.eta, distance: place.distance, source: "路线计算中" });
  }

  return (
    <div className="screen-content map-screen">
      <form className="map-search-card" onSubmit={searchDestination}>
        <MapPin size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="输入目的地、门牌、店铺或巷口"
          aria-label="输入目的地"
        />
        <button className="round dark" type="submit" aria-label="搜索目的地">
          <Search size={17} />
        </button>
        <label className="round orange header-camera" aria-label="订单地址截图识别">
          <Camera size={17} />
          <input type="file" accept="image/*" capture="environment" onChange={onScanOrder} />
        </label>
      </form>

      {lostMode && connectedStation ? (
        <div className="connection-banner">
          <Bluetooth size={15} />
          已连接 S1·{connectedStation.name}
          <button type="button" onClick={() => setLostMode(false)}>关闭</button>
        </div>
      ) : null}

      <div className="map-quick-filters">
        {["门牌", "店铺", "巷口", "停靠站"].map((item) => (
          <button key={item} type="button" onClick={() => setQuery(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="map-provider-chip">
        {getAmapStatus() === "ready" ? "高德已启用" : "高德预留 · 当前使用开源导航"}
      </div>

      <MiniMap
        lostMode={lostMode}
        selectedPoi={selectedPoi}
        setSelectedPoi={setSelectedPoi}
        connectedStation={connectedStation}
        destinationData={destinationData}
        onRouteUpdate={handleRouteUpdate}
        onToggleLost={() => {
          const nextLostMode = !lostMode;
          setLostMode(nextLostMode);
          setSelectedPoi(nextLostMode ? landmarks[0] : null);
          if (nextLostMode && !connectedStation) {
            setConnectedStation(stations[0]);
          }
        }}
      />

      <LandmarkSheet point={selectedPoi} onClose={() => setSelectedPoi(null)} />

      {searchResults.length ? (
        <div className="map-result-strip">
          {searchResults.slice(0, 3).map((place) => (
            <button
              key={`${place.name}-${place.lat}-${place.lng}`}
              className={place.name === destinationData.name ? "active" : ""}
              type="button"
              onClick={() => selectDestination(place)}
            >
              <strong>{place.name}</strong>
              <span>{place.distance}</span>
            </button>
          ))}
        </div>
      ) : null}

      {lostMode ? (
        <section className="panel warning-panel map-floating-panel">
          <div className="panel-title">
            <div>
              <h2>迷路辅助模式</h2>
              <p>范围已显示附近门牌、巷口、店铺、楼道及充电站</p>
            </div>
            <Zap size={18} />
          </div>
          <div className="near-list">
            {landmarks.slice(0, 3).map((point) => (
              <button key={point.id} type="button" onClick={() => setSelectedPoi(point)}>
                <span className={cx("dot", point.color)} />
                <strong>{point.title}</strong>
                <small>{point.distance}</small>
              </button>
            ))}
          </div>
          <div className="action-row">
            <button className="primary subtle" type="button">
              <Bluetooth size={16} />
              S1已连接
            </button>
            <button className="primary amber" type="button" onClick={() => setActive("station")}>
              <Zap size={16} />
              2个充电站
            </button>
          </div>
        </section>
      ) : (
        <section className="panel destination-panel map-bottom-sheet">
          <div className="sheet-handle" />
          <InfoLine icon={MapPin} label="当前终点" value={destinationData.name} />
          <InfoLine icon={Layers3} label="入口提示" value={destinationData.detail} />
          <InfoLine icon={Compass} label="预计路线" value={`${routeInfo.eta} · ${routeInfo.distance} · ${routeInfo.source}`} />
          <button className="end-button" type="button">
            {searchState === "searching" ? "正在搜索目的地..." : "结束导航"}
          </button>
        </section>
      )}
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="info-line">
      <Icon size={15} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ScanScreen({ scanState, setScanState, setActive, setLostMode, onScanOrder }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("c1");
  const scanning = scanState === "scanning";
  const result = scanState === "result";
  const selectedCandidate =
    recognitionCandidates.find((candidate) => candidate.id === selectedCandidateId) ||
    recognitionCandidates[0];

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("当前浏览器不支持直接调用摄像头，请使用上传照片识别。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCapturedImage("");
      setScanState("idle");
    } catch {
      setCameraError("摄像头权限未开启，可允许权限后重试，或上传环境照片识别。");
    }
  }

  function runRecognition(imageUrl) {
    setCapturedImage(imageUrl);
    setSelectedCandidateId("c1");
    setScanState("scanning");
    window.setTimeout(() => setScanState("result"), 1050);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !cameraReady) {
      startCamera();
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    runRecognition(canvas.toDataURL("image/jpeg", 0.88));
  }

  function handleEnvironmentUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    runRecognition(URL.createObjectURL(file));
    event.target.value = "";
  }

  return (
    <div className="screen-content">
      <AppHeader title="环境识别" subtitle="对准周围环境，自动匹配数据库照片定位" onScanOrder={onScanOrder} />

      <section className={cx("camera-view", scanning && "is-scanning", result && "has-result")}>
        <button className="round dark flash" type="button" aria-label="闪光灯">
          <Zap size={17} />
        </button>
        {capturedImage ? (
          <img className="camera-capture" src={capturedImage} alt="识别截图" />
        ) : (
          <video className="camera-live" ref={videoRef} muted playsInline autoPlay />
        )}
        {!cameraReady && !capturedImage ? (
          <div className="camera-empty">
            <Camera size={38} />
            <strong>打开摄像头识别周围环境</strong>
            <span>对准门牌、店招、巷口或楼道入口</span>
          </div>
        ) : null}
        <div className="scan-corner tl" />
        <div className="scan-corner tr" />
        <div className="scan-corner bl" />
        <div className="scan-corner br" />
        {scanning ? <div className="scan-toast">正在识别环境...</div> : null}
        {result ? (
          <div className="recognition-card">
            <BadgeCheck size={25} />
            <div>
              <strong>{selectedCandidate.title}</strong>
              <span>{selectedCandidate.address} · 距您 {selectedCandidate.distance} · 骑手_阿明 上传</span>
              <small>{selectedCandidate.confidence}%可信度 · {selectedCandidate.confidence >= 80 ? "可定位" : "建议复核"}</small>
            </div>
            <strong className="confidence">{selectedCandidate.confidence}%</strong>
          </div>
        ) : null}
      </section>

      <div className="camera-actions">
        <button className="primary wide" type="button" onClick={cameraReady ? captureFrame : startCamera}>
          <Camera size={17} />
          {cameraReady ? (result ? "重新拍照识别" : scanning ? "识别中..." : "拍照识别") : "打开摄像头"}
        </button>
        <label className="round dark upload-camera" aria-label="上传环境照片识别">
          <ImagePlus size={18} />
          <input type="file" accept="image/*" capture="environment" onChange={handleEnvironmentUpload} />
        </label>
        <button
          className="round dark"
          type="button"
          onClick={() => {
            setScanState("idle");
            setCapturedImage("");
          }}
          aria-label="刷新"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {cameraError ? <div className="camera-error">{cameraError}</div> : null}

      {result ? (
        <section className="panel result-panel">
          <div className="candidate-tabs">
            {recognitionCandidates.map((candidate, index) => (
              <button
                key={candidate.id}
                className={cx(candidate.id === selectedCandidateId && "active")}
                type="button"
                onClick={() => setSelectedCandidateId(candidate.id)}
              >
                候选{index + 1}
                <span>{candidate.confidence}%</span>
              </button>
            ))}
          </div>
          <h2>定位建议</h2>
          <p>{selectedCandidate.hint}</p>
          <div className="action-row">
            <button
              className="primary"
              type="button"
              onClick={() => {
                setLostMode(true);
                setActive("map");
              }}
            >
              <Navigation size={16} />
              带我过去
            </button>
            <button className="secondary" type="button" onClick={() => setActive("upload")}>
              <ImagePlus size={16} />
              补充照片
            </button>
          </div>
        </section>
      ) : null}

      <section className="recent">
        <div className="section-head">
          <h2>近期识别记录</h2>
          <button type="button">全部</button>
        </div>
        {["福荣路23号门牌", "B栋楼道入口", "菜巷口"].map((item, index) => (
          <div className="recent-row" key={item}>
            <span className={cx("dot", index === 2 ? "red" : "green")} />
            <strong>{item}</strong>
            <small>{index === 0 ? "10分钟前" : index === 1 ? "35分钟前" : "1小时前"}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

function UploadScreen({ uploads, setUploads, selectedUploadType, setSelectedUploadType }) {
  const [previewName, setPreviewName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submitUpload() {
    if (!previewUrl) return;
    const type = uploadTypes.find((item) => item.id === selectedUploadType);
    setUploads((items) => [
      {
        title: previewName || "金龙巷新环境照片",
        type: type?.label || "环境照片",
        time: "刚刚",
        state: "审核中",
      },
      ...items,
    ]);
    setSubmitted(true);
  }

  function resetPhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setPreviewName("");
    setSubmitted(false);
  }

  function handlePhotoPick(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewName(file.name.replace(/\.[^.]+$/, ""));
    setSubmitted(false);
  }

  return (
    <div className="screen-content">
      <AppHeader title="上传地图" subtitle="居民和骑手共建石牌村人文地图" />

      <section className={cx("upload-drop", previewUrl && "has-preview")}>
        {previewUrl ? (
          <>
            <div className="preview-toolbar">
              <label className="round dark" aria-label="重新选择照片">
                <RefreshCw size={16} />
                <input type="file" accept="image/*" onChange={handlePhotoPick} />
              </label>
              <button className="round dark" type="button" onClick={resetPhoto} aria-label="移除照片">
                <span>×</span>
              </button>
            </div>
            <img src={previewUrl} alt="照片预览" />
            <span className="preview-caption">照片预览</span>
          </>
        ) : (
          <>
            <Camera size={34} />
            <h2>拍照上传</h2>
            <p>对准门牌、巷口、招牌或楼道入口</p>
            <label className="file-button">
              从相册选取
              <input type="file" accept="image/*" onChange={handlePhotoPick} />
            </label>
          </>
        )}
      </section>

      {previewUrl ? (
        <>
          <section className="type-grid" aria-label="照片类型">
            <h2>这张照片是什么类型？</h2>
            <div>
              {uploadTypes.map((type) => (
                <button
                  key={type.id}
                  className={cx(selectedUploadType === type.id && "selected")}
                  type="button"
                  onClick={() => setSelectedUploadType(type.id)}
                >
                  <span className={cx("type-thumb", type.id)} />
                  <strong>{type.label}</strong>
                  <small>{type.note}</small>
                </button>
              ))}
            </div>
          </section>

          <input className="location-input" value="补充位置描述（可选） 如：金龙巷18号旁" readOnly />
          <button className="submit-button" type="button" onClick={submitUpload}>
            <CheckCircle2 size={17} />
            {submitted ? "已提交审核" : "提交入库"}
          </button>
        </>
      ) : null}

      <StatsCard />
      <UploadList uploads={uploads} />
    </div>
  );
}

function StatsCard() {
  return (
    <section className="stats-card">
      <h2>我的贡献</h2>
      <div className="stats-grid">
        <strong>47张<span>上传照片</span></strong>
        <strong>44张<span>已收录</span></strong>
        <strong>1.2k次<span>被调用</span></strong>
      </div>
    </section>
  );
}

function UploadList({ uploads }) {
  return (
    <section className="recent">
      <div className="section-head">
        <h2>最近上传</h2>
        <button type="button">查看全部</button>
      </div>
      {uploads.map((item) => (
        <div className="upload-row" key={`${item.title}-${item.time}`}>
          <span className="small-thumb" />
          <div>
            <strong>{item.title}</strong>
            <small>{item.type} · {item.time}</small>
          </div>
          <em className={item.state === "审核中" ? "pending" : "ok"}>{item.state}</em>
        </div>
      ))}
    </section>
  );
}

function StationScreen({ connectedStation, setConnectedStation }) {
  return (
    <div className="screen-content">
      <AppHeader title="停靠站" subtitle="通过蓝牙信号辅助确认当前位置，提高识别效率" />
      <section className="station-hero">
        <div className="signal-rings">
          <Radio size={28} />
        </div>
        <div>
          <span>当前检测到的区域</span>
          <h2>{connectedStation ? connectedStation.name : "金龙市场停靠站"}</h2>
          <p>信号强度：{connectedStation ? connectedStation.signal : 92} · S1区域</p>
        </div>
        <strong>{connectedStation ? "已连接" : "120m"}</strong>
      </section>

      <button
        className="primary wide"
        type="button"
        onClick={() => setConnectedStation(stations[0])}
      >
        <Zap size={17} />
        签到此停靠站（提升定位精度）
      </button>

      <section className="station-list">
        <h2>附近停靠站</h2>
        {stations.map((station, index) => (
          <article key={station.id} className={cx("station-card", connectedStation?.id === station.id && "active")}>
            <div className="station-top">
              <span>S{index + 1}</span>
              <div>
                <h3>{station.name}</h3>
                <small>{station.range}</small>
              </div>
              <strong>{station.distance}<small>{station.status}</small></strong>
            </div>
            <p><MapPin size={14} />{station.address}</p>
            <p><Wifi size={14} />{station.signal > 80 ? "信号强，适合精准定位" : "信号中，建议靠近后连接"}</p>
            <div className="hint-list">
              {station.hints.map((hint, hintIndex) => (
                <span key={hint}>{hintIndex + 1}. {hint}</span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="screen-content">
      <AppHeader title="骑手中心" subtitle="金龙城中村配送区" />
      <section className="profile-card">
        <div className="avatar" />
        <div>
          <h2>骑手_阿明</h2>
          <p>贡献等级 Lv.4 · 地图先锋</p>
          <div className="score-line"><Star size={14} /> 4.96 · 本周活跃</div>
        </div>
        <button className="round dark" type="button" aria-label="进入设置">
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="progress-card">
        <div><span>贡献等级 Lv.4</span><strong>235 / 500 积分</strong></div>
        <div className="progress-track"><span /></div>
        <p>再获得265积分升至Lv.5，成为共建专家</p>
      </section>

      <section className="profile-stats">
        <Metric icon={MapPin} value="1,248" label="导航被调用" />
        <Metric icon={Upload} value="47" label="上传照片" />
        <Metric icon={Camera} value="326" label="识别次数" />
        <Metric icon={Star} value="235" label="贡献积分" />
      </section>

      <section className="badge-row">
        {["地图先锋", "精准导航", "社区贡献", "全域探索"].map((badge, index) => (
          <div key={badge} className={index < 2 ? "earned" : ""}>
            <Star size={17} />
            <span>{badge}</span>
          </div>
        ))}
      </section>

      <section className="weekly-card">
        <h2>本周贡献趋势</h2>
        <div className="bars">
          {[18, 20, 14, 28, 22, 52, 31].map((height, index) => (
            <span key={index} style={{ height: `${height}px` }} />
          ))}
        </div>
      </section>

      <section className="settings-list">
        <button type="button"><Bell size={16} />消息通知<ChevronRight size={16} /></button>
        <button type="button"><ShieldCheck size={16} />隐私设置<ChevronRight size={16} /></button>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, value, label }) {
  return (
    <div>
      <Icon size={18} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SplashScreen({ onEnter }) {
  return (
    <section className="splash-screen">
      <div className="splash-dot" />
      <div className="splash-logo" aria-label="DOORI">
        <div className="door-mark" />
        <div className="route-mark" />
        <MapPin size={34} />
      </div>
      <div className="splash-copy">
        <h1>DOORI</h1>
        <p>城中村外卖骑手导航系统</p>
        <span>门牌、巷口、停靠站和人文地图，一起把最后50米走清楚。</span>
      </div>
      <button className="splash-enter" type="button" onClick={onEnter}>
        <Navigation size={18} />
        进入 DOORI
      </button>
      <small className="install-hint">手机浏览器菜单中选择“添加到主屏幕”即可安装</small>
    </section>
  );
}

export function App() {
  const [active, setActive] = useState("map");
  const [showSplash, setShowSplash] = useState(true);
  const [lostMode, setLostMode] = useState(false);
  const [connectedStation, setConnectedStation] = useState(null);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [navDestination, setNavDestination] = useState(defaultDestination);
  const [scanState, setScanState] = useState("idle");
  const [uploads, setUploads] = useState(initialUploads);
  const [selectedUploadType, setSelectedUploadType] = useState("door");
  const [toast, setToast] = useState("");
  const [orderPreview, setOrderPreview] = useState(null);

  function scanOrderAddress(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (orderPreview?.url) {
      URL.revokeObjectURL(orderPreview.url);
    }
    setOrderPreview({ url: previewUrl, name: file.name });
    setNavDestination(defaultDestination);
    setToast("正在识别订单截图...");
    setActive("map");
    window.setTimeout(() => setToast("已识别订单截图：目的地为金龙巷18号"), 800);
    window.setTimeout(() => setToast(""), 2600);
    event.target.value = "";
  }

  return (
    <main className="app-shell">
      <div className="phone">
        <div className="dynamic-island" />
        <div className="status-icons" />
        {toast ? <div className="toast">{toast}</div> : null}
        {orderPreview ? (
          <aside className="order-preview">
            <img src={orderPreview.url} alt="订单截图预览" />
            <div>
              <strong>订单截图已识别</strong>
              <span>目的地：金龙巷18号</span>
            </div>
          </aside>
        ) : null}

        {active === "map" ? (
          <MapScreen
            lostMode={lostMode}
            setLostMode={setLostMode}
            connectedStation={connectedStation}
            setConnectedStation={setConnectedStation}
            selectedPoi={selectedPoi}
            setSelectedPoi={setSelectedPoi}
            setActive={setActive}
            onScanOrder={scanOrderAddress}
            destinationData={navDestination}
            setDestinationData={setNavDestination}
          />
        ) : null}
        {active === "scan" ? (
          <ScanScreen
            scanState={scanState}
            setScanState={setScanState}
            setActive={setActive}
            setLostMode={setLostMode}
            onScanOrder={scanOrderAddress}
          />
        ) : null}
        {active === "upload" ? (
          <UploadScreen
            uploads={uploads}
            setUploads={setUploads}
            selectedUploadType={selectedUploadType}
            setSelectedUploadType={setSelectedUploadType}
          />
        ) : null}
        {active === "station" ? (
          <StationScreen connectedStation={connectedStation} setConnectedStation={setConnectedStation} />
        ) : null}
        {active === "profile" ? <ProfileScreen /> : null}

        <BottomNav active={active} setActive={setActive} />
        {showSplash ? <SplashScreen onEnter={() => setShowSplash(false)} /> : null}
      </div>
    </main>
  );
}

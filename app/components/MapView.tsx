'use client';

import { useState, useRef, useEffect } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    useMap,
    useMapEvents,
    Popup,
    LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaRoute, FaCar, FaWalking, FaBicycle, FaArrowLeft, FaArrowRight, FaUndo, FaArrowUp } from 'react-icons/fa';
import RoutingControl from '../components/RoutingControl';
import 'leaflet-routing-machine';


// ---- Fix default Leaflet marker icon ----
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ---- Custom colored icons for route start/end ----
const startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const endIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

// ---- Helper to generate circle points for Polyline ----
const generateCirclePoints = (start: [number, number], end: [number, number]): [number, number][] => {
    const centerLat = (start[0] + end[0]) / 2;
    const centerLng = (start[1] + end[1]) / 2;
    const radiusLat = Math.abs(start[0] - end[0]) / 2;
    const radiusLng = Math.abs(start[1] - end[1]) / 2;
    const points: [number, number][] = [];
    const steps = 60;

    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        points.push([centerLat + radiusLat * Math.sin(angle), centerLng + radiusLng * Math.cos(angle)]);
    }

    return points;
};

// ---- Map view setter ----
const MapViewSetter = ({ position }: { position: [number, number] | null }) => {
    const map = useMap();
    if (position) map.setView(position, 13);
    return null;
};

// ---- Zoom + Up/Down controls ----
const ZoomUpDownControl = () => {
    const map = useMap();

    const zoomIn = () => map.zoomIn();
    const zoomOut = () => map.zoomOut();
    const moveUp = () => {
        const c = map.getCenter();
        map.setView([c.lat + 1, c.lng], map.getZoom());
    };
    const moveDown = () => {
        const c = map.getCenter();
        map.setView([c.lat - 1, c.lng], map.getZoom());
    };

    return (
        <div className="absolute top-[70px] right-2.5 z-1000 flex flex-col bg-white border border-gray-300 rounded">
            <button onClick={zoomIn} className="px-3 py-1.5 border-0 bg-[#f0f0f0] font-bold text-xl hover:bg-gray-200">+</button>
            <button onClick={zoomOut} className="px-3 py-1.5 border-0 bg-[#f0f0f0] font-bold text-xl hover:bg-gray-200">-</button>
            <button onClick={moveUp} className="px-3 py-1.5 border-0 bg-[#f0f0f0] font-bold text-xl hover:bg-gray-200">↑</button>
            <button onClick={moveDown} className="px-3 py-1.5 border-0 bg-[#f0f0f0] font-bold text-xl hover:bg-gray-200">↓</button>
        </div>

    );
};

// ---- Location Picker + Draw Controls ----
const PickDrawControl = (props: {
    activatePicker: () => void;
    toggleDrawLine: () => void;
    toggleDrawPolygon: () => void;
    toggleDrawRectangle: () => void;
    toggleDrawCircle: () => void;
}) => {
    const { activatePicker, toggleDrawLine, toggleDrawPolygon, toggleDrawRectangle, toggleDrawCircle } = props;
    return (
        <div className="absolute top-[250px] right-2.5 z-1000 flex flex-col bg-white border border-gray-300 rounded-sm">
            <button onClick={activatePicker} className="px-3 py-2 border-b border-gray-300 bg-[#f0f0f0] text-black flex justify-center">
                <FaMapMarkerAlt size={20} />
            </button>

            <button onClick={toggleDrawLine} className="px-3 py-2 bg-[#f0f0f0] text-black flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 9 12 15 6 21 12" />
                </svg>
            </button>

            <button onClick={toggleDrawPolygon} className="px-3 py-2 bg-[#f0f0f0] text-black flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="4,10 10,4 20,10 16,20 4,16" />
                </svg>
            </button>

            <button onClick={toggleDrawRectangle} className="px-3 py-2 bg-[#f0f0f0] text-black flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" />
                </svg>
            </button>

            <button onClick={toggleDrawCircle} className="px-3 py-2 bg-[#f0f0f0] text-black flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="8" />
                </svg>
            </button>
        </div>
    );
};

// ---- Map click handler ----
const LocationPickerMarker = (props: {
    active: boolean;
    onPick: (lat: number, lng: number) => void;
    startRectangle: [number, number] | null;
    setCurrentRectangle: (pos: [number, number] | null) => void;
    startCircle: [number, number] | null;
    setCurrentCircle: (pos: [number, number] | null) => void;
}) => {
    const { active, onPick, startRectangle, setCurrentRectangle, startCircle, setCurrentCircle } = props;
    useMapEvents({
        click(e) {
            if (active) onPick(e.latlng.lat, e.latlng.lng);
        },
        mousemove(e) {
            if (startRectangle) setCurrentRectangle([e.latlng.lat, e.latlng.lng]);
            if (startCircle) setCurrentCircle([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
};

// ---- Main Map Component ----
const Map = () => {
    const mapRef = useRef<any>(null);

    const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
    const [markerName, setMarkerName] = useState<string | null>(null);

    const [pickerActive, setPickerActive] = useState(false);
    const [drawLineActive, setDrawLineActive] = useState(false);
    const [drawPolygonActive, setDrawPolygonActive] = useState(false);
    const [drawRectangleActive, setDrawRectangleActive] = useState(false);
    const [drawCircleActive, setDrawCircleActive] = useState(false);

    const [pickedPositions, setPickedPositions] = useState<[number, number][]>([]);
    const [linePoints, setLinePoints] = useState<[number, number][]>([]);
    const [finalLines, setFinalLines] = useState<[number, number][][]>([]);
    const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
    const [finalPolygons, setFinalPolygons] = useState<[number, number][][]>([]);
    const [startRectangle, setStartRectangle] = useState<[number, number] | null>(null);
    const [currentRectangle, setCurrentRectangle] = useState<[number, number] | null>(null);
    const [finalRectangles, setFinalRectangles] = useState<[number, number][][]>([]);
    const [startCircle, setStartCircle] = useState<[number, number] | null>(null);
    const [currentCircle, setCurrentCircle] = useState<[number, number] | null>(null);
    const [finalCircles, setFinalCircles] = useState<[number, number][][]>([]);

    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showDirections, setShowDirections] = useState(false);

    // routing states
    const [fromText, setFromText] = useState('');
    const [toText, setToText] = useState('');
    const [fromPos, setFromPos] = useState<[number, number] | null>(null);
    const [toPos, setToPos] = useState<[number, number] | null>(null);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [routePanelVisible, setRoutePanelVisible] = useState(false);
    const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
    const [transportMode, setTransportMode] = useState<'car' | 'walk' | 'bike'>('car');

    // ---- Finalize any active drawing ----
    const finalizeCurrentDrawing = () => {
        if (drawLineActive && linePoints.length > 1) {
            setFinalLines(prev => [...prev, [...linePoints]]);
            setLinePoints([]);
        }
        if (drawPolygonActive && polygonPoints.length > 2) {
            setFinalPolygons(prev => [...prev, [...polygonPoints]]);
            setPolygonPoints([]);
        }
        if (drawRectangleActive && startRectangle && currentRectangle) {
            setFinalRectangles(prev => [...prev, [startRectangle, currentRectangle]]);
            setStartRectangle(null);
            setCurrentRectangle(null);
        }
        if (drawCircleActive && startCircle && currentCircle) {
            setFinalCircles(prev => [...prev, generateCirclePoints(startCircle, currentCircle)]);
            setStartCircle(null);
            setCurrentCircle(null);
        }
    };

    // ---- Toggle functions ----
    const toggleDrawLine = () => {
        finalizeCurrentDrawing();
        setDrawLineActive(prev => !prev);
        setDrawPolygonActive(false);
        setDrawRectangleActive(false);
        setDrawCircleActive(false);
        setPickerActive(false);
    };
    const toggleDrawPolygon = () => {
        finalizeCurrentDrawing();
        setDrawPolygonActive(prev => !prev);
        setDrawLineActive(false);
        setDrawRectangleActive(false);
        setDrawCircleActive(false);
        setPickerActive(false);
    };
    const toggleDrawRectangle = () => {
        finalizeCurrentDrawing();
        setDrawRectangleActive(prev => !prev);
        setDrawLineActive(false);
        setDrawPolygonActive(false);
        setDrawCircleActive(false);
        setPickerActive(false);
    };
    const toggleDrawCircle = () => {
        finalizeCurrentDrawing();
        setDrawCircleActive(prev => !prev);
        setDrawLineActive(false);
        setDrawPolygonActive(false);
        setDrawRectangleActive(false);
        setPickerActive(false);
    };
    const activatePicker = () => {
        finalizeCurrentDrawing();
        setPickerActive(true);
        setDrawLineActive(false);
        setDrawPolygonActive(false);
        setDrawRectangleActive(false);
        setDrawCircleActive(false);
    };

    const handleDrawClick = (lat: number, lng: number) => {
        if (pickerActive) {
            setPickedPositions(prev => [...prev, [lat, lng]]);
            setPickerActive(false);
        } else if (drawLineActive) {
            setLinePoints(prev => [...prev, [lat, lng]]);
        } else if (drawPolygonActive) {
            setPolygonPoints(prev => [...prev, [lat, lng]]);
        } else if (drawRectangleActive) {
            if (!startRectangle) {
                setStartRectangle([lat, lng]);
                setCurrentRectangle([lat, lng]);
            } else {
                setFinalRectangles(prev => [...prev, [startRectangle, [lat, lng]]]);
                setStartRectangle(null);
                setCurrentRectangle(null);
            }
        } else if (drawCircleActive) {
            if (!startCircle) {
                setStartCircle([lat, lng]);
                setCurrentCircle([lat, lng]);
            } else {
                setFinalCircles(prev => [...prev, generateCirclePoints(startCircle, [lat, lng])]);
                setStartCircle(null);
                setCurrentCircle(null);
            }
        }
    };


    const getDirectionIcon = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes("left")) return <FaArrowLeft className="text-blue-600" />;
        if (lower.includes("right")) return <FaArrowRight className="text-blue-600" />;
        if (lower.includes("u-turn") || lower.includes("u turn"))
            return <FaUndo className="text-blue-600" />;
        return <FaArrowUp className="text-blue-600" />; // default straight
    };


    // ---- Search Handler ----
    const fetchSuggestions = async (q: string) => {
        if (q.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        setSuggestions(data);
    };

    // ---- Search & suggestions while typing ----
    const handleChange = (val: string) => {
        setSearchText(val);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            fetchSuggestions(val);
            await handleSearch(val);
        }, 250);
    };

    // ---- Dropdown click ----
    const handleSelect = (item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setMarkerPos([lat, lon]);
        setMarkerName(item.display_name);
        setSearchText(item.display_name);
        setSuggestions([]);
        if (mapRef.current?.setView) mapRef.current.setView([lat, lon], 12);
    };

    // ---- Direct search (first match) ----
    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMarkerPos([lat, lon]);
                setMarkerName(data[0].display_name);
                if (mapRef.current?.setView) mapRef.current.setView([lat, lon], 13);
            }
        } catch (err) {
            console.error(err);
        }
    };


    async function geocode(place: string): Promise<[number, number]> {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`
        );
        const data = await res.json();
        if (!data.length) throw new Error(`Location not found: ${place}`);
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }

    const handleRoute = async () => {
        try {
            setRouteError(null);
            const f = await geocode(fromText);
            const t = await geocode(toText);
            setFromPos(f);
            setToPos(t);
            if (mapRef.current?.setView) mapRef.current.setView(f, 12);
        } catch (e: any) {
            setRouteError(e.message);
        }
    };

    // small helper to set transport mode (no heavy logic change)
    const selectTransport = (mode: 'car' | 'walk' | 'bike') => {
        setTransportMode(mode);
        // If you want routing provider to change with mode, modify RoutingControl accordingly.
    };

    return (
        <div className="flex h-screen w-screen">
            {/* ---------------- Floating Search + Route UI (Left Side, Route Outside) ---------------- */}
            <div className="absolute top-4 left-4 z-1001 flex flex-col items-start gap-2">
                {/* --- Search Bar Row --- */}
                <div className="flex items-center ">
                    {/* Search Input */}
                    <div className="bg-white rounded-lg shadow-md border px-3 py-2 flex items-center w-[300px]">
                        <input
                            type="text"
                            className="flex-1 outline-none text-sm"
                            placeholder="Search location..."
                            value={searchText}
                            onChange={(e) => handleChange(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchText)}
                        />
                    </div>

                    {/* Route Button - OUTSIDE the search bar */}
                    <button
                        onClick={() => setShowDirections((prev) => !prev)}
                        className={`p-3 rounded-lg shadow-md border transition ${showDirections ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                            }`}
                        title="Toggle Directions"
                    >
                        <FaRoute />
                    </button>
                </div>

                {/* --- Search Suggestions Dropdown --- */}
                {suggestions.length > 0 && (
                    <ul className="bg-white border rounded-lg shadow-md w-[300px] max-h-60 overflow-auto z-1002">
                        {suggestions.map((s, i) => (
                            <li
                                key={i}
                                onClick={() => handleSelect(s)}
                                className="p-2 hover:bg-gray-100 text-sm cursor-pointer"
                            >
                                {s.display_name}
                            </li>
                        ))}
                    </ul>
                )}

                {/* --- Directions Box (only when route icon active) --- */}
                {showDirections && (
                    <div className="bg-white shadow-lg border rounded-lg p-3 w-[300px]">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">Get Directions</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => selectTransport("car")}
                                    className={`p-2 rounded ${transportMode === "car"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    <FaCar />
                                </button>
                                <button
                                    onClick={() => selectTransport("walk")}
                                    className={`p-2 rounded ${transportMode === "walk"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    <FaWalking />
                                </button>
                                <button
                                    onClick={() => selectTransport("bike")}
                                    className={`p-2 rounded ${transportMode === "bike"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    <FaBicycle />
                                </button>
                            </div>
                        </div>

                        {/* From Input */}
                        <div className="flex items-center border px-3 py-2 rounded mb-2">
                            <FaMapMarkerAlt className="text-green-500 mr-2" />
                            <input
                                value={fromText}
                                onChange={(e) => setFromText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRoute()}
                                placeholder="From"
                                className="w-full outline-none text-sm"
                            />
                        </div>

                        {/* To Input */}
                        <div className="flex items-center border px-3 py-2 rounded mb-2">
                            <FaMapMarkerAlt className="text-red-500 mr-2" />
                            <input
                                value={toText}
                                onChange={(e) => setToText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRoute()}
                                placeholder="To"
                                className="w-full outline-none text-sm"
                            />
                        </div>

                        {/* Buttons Row */}
                        <div className="flex justify-between items-center mb-2">
                            <button
                                onClick={handleRoute}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm mr-2"
                            >
                                Get Route
                            </button>

                            {/* ❌ Clear Route Button */}
                            <button
                                onClick={() => {
                                    setFromText('');
                                    setToText('');
                                    setFromPos(null);
                                    setToPos(null);
                                    setRouteInstructions([]);
                                }}
                                className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300 text-sm"
                                title="Clear Route"
                            >
                                ✖
                            </button>
                        </div>

                        {/* Error Message */}
                        {routeError && (
                            <div className="text-red-600 text-xs mt-1">{routeError}</div>
                        )}

                        {/* Directions List */}
                        {routeInstructions.length > 0 && (
                            <div className="mt-3 border-t pt-2 max-h-130 overflow-y-auto">
                                <h4 className="font-semibold text-xs mb-1 text-gray-600">
                                    Directions:
                                </h4>
                                <ul className="text-xs space-y-1">
                                    {routeInstructions.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            {getDirectionIcon(step)}
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

            </div>


            {/* --------------------- RIGHT: MAP AREA --------------------- */}
            <div className="flex-1 relative">
                <MapContainer
                    center={[20, 80]}
                    zoom={3}
                    className="h-full w-full"
                    zoomControl={false}
                    ref={(el) => {
                        // react-leaflet v4 stores instance differently; assign map instance if available
                        // keep reference to setView from handlers
                        if (!el) return;
                        // el may be a Map instance or react-leaflet element — accommodate both
                        try {
                            // @ts-ignore
                            mapRef.current = el instanceof L.Map ? el : (el as any).getMap?.() || el;
                        } catch {
                            // fallback
                            mapRef.current = el;
                        }
                    }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <ZoomUpDownControl />
                    <MapViewSetter position={markerPos} />
                    {markerPos && markerName && <Marker position={markerPos}><Popup>{markerName}</Popup></Marker>}

                    {/* ✅ Route on map + colored markers */}
                    {fromPos && <Marker position={fromPos} icon={startIcon}><Popup>From: {fromText}</Popup></Marker>}
                    {toPos && <Marker position={toPos} icon={endIcon}><Popup>To: {toText}</Popup></Marker>}
                    {fromPos && toPos && (
                        <RoutingControl from={fromPos} to={toPos} onRouteFound={setRouteInstructions} />
                    )}


                    <LocationPickerMarker
                        active={pickerActive || drawLineActive || drawPolygonActive || drawRectangleActive || drawCircleActive}
                        onPick={handleDrawClick}
                        startRectangle={startRectangle}
                        setCurrentRectangle={setCurrentRectangle}
                        startCircle={startCircle}
                        setCurrentCircle={setCurrentCircle}
                    />

                    {/* Draw elements */}
                    {linePoints.length > 0 && linePoints.map((pos, idx) => (
                        <Marker key={`line-${idx}`} position={pos} icon={L.divIcon({ className: 'bg-red-500 rounded-full w-4 h-4 border-2 border-red-700' })} />
                    ))}
                    {linePoints.length > 1 && drawLineActive && <Polyline positions={linePoints} pathOptions={{ color: 'red', weight: 2, dashArray: '4 6' }} />}
                    {finalLines.map((line, idx) => <Polyline key={`final-line-${idx}`} positions={line} pathOptions={{ color: 'black', weight: 3 }} />)}

                    {polygonPoints.length > 0 && polygonPoints.map((pos, idx) => (
                        <Marker key={`poly-${idx}`} position={pos} icon={L.divIcon({ className: 'bg-red-500 rounded-full w-4 h-4 border-2 border-red-700' })} />
                    ))}
                    {polygonPoints.length > 2 && drawPolygonActive && <Polyline positions={[...polygonPoints, polygonPoints[0]]} pathOptions={{ color: 'red', weight: 2, dashArray: '4 6' }} />}
                    {finalPolygons.map((poly, idx) => <Polyline key={`final-poly-${idx}`} positions={[...poly, poly[0]]} pathOptions={{ color: 'black', weight: 3 }} />)}

                    {startRectangle && currentRectangle && drawRectangleActive && (
                        <Polyline positions={[
                            [startRectangle[0], startRectangle[1]],
                            [startRectangle[0], currentRectangle[1]],
                            [currentRectangle[0], currentRectangle[1]],
                            [currentRectangle[0], startRectangle[1]],
                            [startRectangle[0], startRectangle[1]],
                        ]} pathOptions={{ color: 'red', weight: 2, dashArray: '4 6' }} />
                    )}
                    {finalRectangles.map((rect, idx) => (
                        <Polyline key={`final-rect-${idx}`} positions={[
                            [rect[0][0], rect[0][1]],
                            [rect[0][0], rect[1][1]],
                            [rect[1][0], rect[1][1]],
                            [rect[1][0], rect[0][1]],
                            [rect[0][0], rect[0][1]],
                        ]} pathOptions={{ color: 'black', weight: 3 }} />
                    ))}

                    {startCircle && currentCircle && drawCircleActive && <Polyline positions={generateCirclePoints(startCircle, currentCircle)} pathOptions={{ color: 'red', weight: 2, dashArray: '4 6' }} />}
                    {finalCircles.map((circle, idx) => <Polyline key={`final-circle-${idx}`} positions={circle} pathOptions={{ color: 'black', weight: 3 }} />)}

                    {pickedPositions.map((pos, idx) => <Marker key={`pick-${idx}`} position={pos} />)}

                    {/* Layer control inside map */}
                    <div>
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="Street">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                            </LayersControl.BaseLayer>

                            <LayersControl.BaseLayer name="Satellite">
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri — Source: Esri, etc." />
                            </LayersControl.BaseLayer>

                            <LayersControl.BaseLayer name="Terrain / Topographic">
                                <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="© OpenTopoMap (CC-BY-SA) & OpenStreetMap contributors" />
                            </LayersControl.BaseLayer>

                            <LayersControl.BaseLayer name="Dark">
                                <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png" attribution="© Stadia Maps, OpenMapTiles & OpenStreetMap contributors" />
                            </LayersControl.BaseLayer>
                        </LayersControl>
                    </div>
                </MapContainer>

                <PickDrawControl
                    activatePicker={activatePicker}
                    toggleDrawLine={toggleDrawLine}
                    toggleDrawPolygon={toggleDrawPolygon}
                    toggleDrawRectangle={toggleDrawRectangle}
                    toggleDrawCircle={toggleDrawCircle}
                />
            </div>


            {/* JSON */}
            {/* ✅ RIGHT SIDEBAR (Only visible when something is drawn) */}
            {(pickedPositions.length > 0 ||
                finalLines.length > 0 ||
                finalPolygons.length > 0 ||
                finalRectangles.length > 0 ||
                finalCircles.length > 0) && (
                    <aside className="w-[320px] bg-white shadow-md border-l border-gray-300 p-4 overflow-auto max-h-screen">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">Drawn Data (JSON)</h3>
                            <button
                                onClick={() => {
                                    setPickedPositions([]);
                                    setFinalLines([]);
                                    setFinalPolygons([]);
                                    setFinalRectangles([]);
                                    setFinalCircles([]);
                                }}
                                className="text-xs text-gray-500 border px-2 py-1 rounded hover:bg-gray-100"
                            >
                                Clear All ✖
                            </button>
                        </div>

                        <pre className="text-xs bg-gray-50 border rounded p-2 overflow-auto">
                            {JSON.stringify(
                                {
                                    points: pickedPositions.map(([lat, lng]) => ({
                                        type: "Feature",
                                        properties: { shape: "Point" },
                                        geometry: { type: "Point", coordinates: [lng, lat] },
                                    })),
                                    lines: finalLines.map((line) => ({
                                        type: "Feature",
                                        properties: { shape: "LineString" },
                                        geometry: {
                                            type: "LineString",
                                            coordinates: line.map(([lat, lng]) => [lng, lat]),
                                        },
                                    })),
                                    polygons: finalPolygons.map((poly) => ({
                                        type: "Feature",
                                        properties: { shape: "Polygon" },
                                        geometry: {
                                            type: "Polygon",
                                            coordinates: [poly.map(([lat, lng]) => [lng, lat])],
                                        },
                                    })),
                                    rectangles: finalRectangles.map((rect) => ({
                                        type: "Feature",
                                        properties: { shape: "Rectangle" },
                                        geometry: {
                                            type: "Polygon",
                                            coordinates: [
                                                [
                                                    [rect[0][1], rect[0][0]],
                                                    [rect[1][1], rect[0][0]],
                                                    [rect[1][1], rect[1][0]],
                                                    [rect[0][1], rect[1][0]],
                                                    [rect[0][1], rect[0][0]],
                                                ],
                                            ],
                                        },
                                    })),
                                    circles: finalCircles.map((circle) => ({
                                        type: "Feature",
                                        properties: { shape: "Circle" },
                                        geometry: {
                                            type: "Polygon",
                                            coordinates: [circle.map(([lat, lng]) => [lng, lat])],
                                        },
                                    })),
                                },
                                null,
                                2
                            )}
                        </pre>
                    </aside>
                )}

        </div>
    );
};

export default Map;





'use client';

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

interface RoutingControlProps {
  from: [number, number];
  to: [number, number];
  onRouteFound?: (instructions: string[]) => void;
}

// ✅ Extend the type to include missing LRM options
interface CustomRoutingOptions extends L.Routing.RoutingControlOptions {
  draggableWaypoints?: boolean;
  createMarker?: (i: number, wp: L.Routing.Waypoint, nWps: number) => L.Marker | null;
}

export default function RoutingControl({ from, to, onRouteFound }: RoutingControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    let routingControl: L.Control | null = null;

    const initRouting = async () => {
      await import("leaflet-routing-machine");

      // Remove any previous routing instance
      if (routingControl) map.removeControl(routingControl);

      const options: CustomRoutingOptions = {
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        lineOptions: {
          styles: [{ color: "blue", opacity: 0.7, weight: 5 }],
          extendToWaypoints: false,
          missingRouteTolerance: 0,
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        containerClassName: "hidden",
        createMarker: () => null, // ✅ Now properly typed
      };

      routingControl = L.Routing.control(options);

      // ✅ Attach event safely
      (routingControl as unknown as L.Evented).on("routesfound", (e: any) => {
        const route = e.routes?.[0];
        if (!route || !onRouteFound) return;

        const summaryInfo: string[] = [
          `Total Distance: ${(route.summary.totalDistance / 1000).toFixed(2)} km`,
          `Estimated Time: ${(route.summary.totalTime / 60).toFixed(1)} min`,
        ];

        const instructions: string[] = [];
        if (route.instructions && Array.isArray(route.instructions)) {
          for (const instr of route.instructions) {
            instructions.push(instr.text);
          }
        }

        const finalData = instructions.length > 0 ? instructions : summaryInfo;
        onRouteFound(finalData);
      });

      routingControl.addTo(map);
    };

    initRouting();

    return () => {
      if (routingControl) map.removeControl(routingControl);
    };
  }, [from, to, map, onRouteFound]);

  return null;
}

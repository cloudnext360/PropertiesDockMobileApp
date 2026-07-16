import Constants from "expo-constants";
import { useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { Region } from "react-native-maps";
import Supercluster from "supercluster";

import { Text } from "@/components/ui";
import type { PropertyMapProps } from "@/features/property/PropertyMap.types";

// Android's Google Maps provider crashes at mount without a Maps SDK key. When
// the key isn't configured (extra.googleMapsApiKey), render a fallback instead
// of MapView so the screen doesn't crash. iOS uses Apple Maps (no key needed).
const HAS_ANDROID_MAPS_KEY = Boolean(
  (Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined)?.googleMapsApiKey,
);
const MAPS_AVAILABLE = Platform.OS !== "android" || HAS_ANDROID_MAPS_KEY;

// Oman (Muscat) default view.
const OMAN_REGION: Region = {
  latitude: 23.588,
  longitude: 58.3829,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

function shortOmr(n: number): string {
  if (n >= 1_000_000) return `OMR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `OMR ${Math.round(n / 1_000)}k`;
  return `OMR ${n}`;
}

interface PointProps {
  propertyId: string;
  price: number;
}

export function PropertyMap(props: PropertyMapProps) {
  // Guard in a wrapper (no hooks) so the inner component's hooks stay unconditional.
  if (!MAPS_AVAILABLE) {
    return (
      <View className="flex-1 items-center justify-center bg-muted px-8">
        <Text className="text-center text-sm text-muted-foreground">
          Map isn&apos;t available in this build.
        </Text>
      </View>
    );
  }
  return <PropertyMapView {...props} />;
}

function PropertyMapView({ properties, onSelectProperty }: PropertyMapProps) {
  const mapRef = useRef<MapView>(null);

  const withCoords = useMemo(
    () => properties.filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number"),
    [properties],
  );
  const byId = useMemo(() => new Map(withCoords.map((p) => [p.id, p])), [withCoords]);

  const index = useMemo(() => {
    const sc = new Supercluster<PointProps>({ radius: 60, maxZoom: 18 });
    sc.load(
      withCoords.map((p) => ({
        type: "Feature" as const,
        properties: { propertyId: p.id, price: p.price },
        geometry: {
          type: "Point" as const,
          coordinates: [p.longitude as number, p.latitude as number],
        },
      })),
    );
    return sc;
  }, [withCoords]);

  const [region, setRegion] = useState<Region>(() =>
    withCoords.length === 1
      ? {
          latitude: withCoords[0].latitude as number,
          longitude: withCoords[0].longitude as number,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : OMAN_REGION,
  );

  const clusters = useMemo(() => {
    const zoom = Math.round(Math.log2(360 / region.longitudeDelta));
    const bbox: [number, number, number, number] = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ];
    try {
      return index.getClusters(bbox, zoom);
    } catch {
      return [];
    }
  }, [index, region]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
      >
        {clusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const props = c.properties as {
            cluster?: boolean;
            cluster_id?: number;
            point_count?: number;
            propertyId?: string;
            price?: number;
          };

          if (props.cluster && props.cluster_id != null) {
            const clusterId = props.cluster_id;
            return (
              <Marker
                key={`cluster-${clusterId}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => {
                  const expZoom = Math.min(index.getClusterExpansionZoom(clusterId), 18);
                  const delta = 360 / Math.pow(2, expZoom);
                  mapRef.current?.animateToRegion(
                    { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
                    300,
                  );
                }}
              >
                <View className="h-11 min-w-11 items-center justify-center rounded-full border-2 border-white bg-brand px-2">
                  <Text className="text-sm font-jakarta-bold text-brand-foreground">
                    {props.point_count}
                  </Text>
                </View>
              </Marker>
            );
          }

          const property = props.propertyId ? byId.get(props.propertyId) : undefined;
          if (!property) return null;
          return (
            <Marker
              key={property.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => onSelectProperty?.(property)}
            >
              <View className="rounded-full border border-white bg-brand px-2.5 py-1">
                <Text className="text-xs font-jakarta-bold text-brand-foreground">
                  {shortOmr(props.price ?? property.price)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {withCoords.length === 0 ? (
        <View pointerEvents="none" className="absolute inset-x-0 bottom-6 items-center">
          <View className="rounded-full border border-border bg-card/95 px-4 py-2">
            <Text className="text-sm text-muted-foreground">
              No mapped locations for these results
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

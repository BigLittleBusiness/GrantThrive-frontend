import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import api from '../../utils/api.js';
import CommunityNavbar from '../../components/layout/CommunityNavbar.jsx';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Calendar,
  DollarSign,
  Filter,
  Info,
  Layers,
  Map,
  MapPin,
  Search,
  X,
} from 'lucide-react';

const MAP_SOURCE_ID = 'published-grants';
const MAP_LAYER_ID = 'grant-points';
const CLUSTER_LAYER_ID = 'grant-clusters';
const CLUSTER_HIT_AREA_ID = 'grant-cluster-hit-area';
const DEFAULT_CENTER = [134.0, -25.0];
const DEFAULT_ZOOM = 3.5;

// Vite needs an explicit worker asset for MapLibre in production builds.
setWorkerUrl(workerUrl);

// OpenFreeMap's MapLibre style includes the required OpenMapTiles and
// OpenStreetMap attribution. A council can replace this with an approved,
// public provider style URL at build time; never put a secret in a VITE_ value.
const mapStyleUrl = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

const emptyCollection = { type: 'FeatureCollection', features: [] };

function normaliseFeatureCollection(data) {
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) return emptyCollection;

  return {
    type: 'FeatureCollection',
    features: data.features.filter((feature) => {
      const coordinates = feature?.geometry?.coordinates;
      return feature?.geometry?.type === 'Point'
        && Array.isArray(coordinates)
        && Number.isFinite(Number(coordinates[0]))
        && Number.isFinite(Number(coordinates[1]));
    }),
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function displayStatus(status) {
  return status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : 'Published';
}

function statusClass(status) {
  if (status === 'open') return 'bg-green-100 text-green-800';
  if (status === 'closed') return 'bg-slate-100 text-slate-700';
  return 'bg-blue-100 text-blue-800';
}

const PublicGrantMap = ({ user, onNavigate, onLogout, council }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState('');
  const [dataError, setDataError] = useState('');
  const [grantCollection, setGrantCollection] = useState(emptyCollection);
  const [selectedGrantId, setSelectedGrantId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const loadGrantData = useCallback(async () => {
    setIsLoading(true);
    setDataError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (council?.id) params.set('council_id', String(council.id));
      const data = await api.get(`/mapping/grants-geojson?${params.toString()}`);
      setGrantCollection(normaliseFeatureCollection(data));
    } catch (error) {
      setGrantCollection(emptyCollection);
      setDataError(error.message || 'The mapped grants could not be loaded. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [council?.id]);

  useEffect(() => {
    loadGrantData();
  }, [loadGrantData]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return undefined;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyleUrl,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 2,
      maxZoom: 19,
      attributionControl: true,
    });

    mapInstanceRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      map.addSource(MAP_SOURCE_ID, {
        type: 'geojson',
        data: emptyCollection,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 48,
      });

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: MAP_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0f766e',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 23, 50, 28],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: CLUSTER_HIT_AREA_ID,
        type: 'circle',
        source: MAP_SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 25, 10, 30, 50, 35],
          'circle-color': '#000000',
          'circle-opacity': 0,
        },
      });

      map.addLayer({
        id: MAP_LAYER_ID,
        type: 'circle',
        source: MAP_SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#1d4ed8',
          'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'total_budget'], 0], 0, 8, 50000, 11, 500000, 15],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      map.on('click', CLUSTER_HIT_AREA_ID, (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource(MAP_SOURCE_ID);
        if (!feature || clusterId === undefined || !source?.getClusterExpansionZoom) return;

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (!error) {
            map.easeTo({ center: feature.geometry.coordinates, zoom });
          }
        });
      });

      map.on('click', MAP_LAYER_ID, (event) => {
        const id = event.features?.[0]?.properties?.id;
        if (id === undefined) return;
        setSelectedGrantId(Number(id));
        map.flyTo({ center: event.features[0].geometry.coordinates, zoom: Math.max(map.getZoom(), 12), essential: true });
      });

      for (const layerId of [CLUSTER_HIT_AREA_ID, MAP_LAYER_ID]) {
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
      }

      setIsMapReady(true);
    });

    map.on('error', (event) => {
      if (event?.error && map.isStyleLoaded()) {
        setMapError('The map tiles could not be loaded. Please check your connection and try again.');
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const filteredCollection = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return {
      type: 'FeatureCollection',
      features: grantCollection.features.filter((feature) => {
        const properties = feature.properties || {};
        const searchable = [properties.title, properties.description, properties.location_name, properties.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return (!needle || searchable.includes(needle))
          && (category === 'all' || properties.category === category)
          && (status === 'all' || properties.status === status);
      }),
    };
  }, [category, grantCollection, search, status]);

  const grants = filteredCollection.features;
  const categories = useMemo(
    () => [...new Set(grantCollection.features.map((feature) => feature.properties?.category).filter(Boolean))].sort(),
    [grantCollection],
  );
  const statuses = useMemo(
    () => [...new Set(grantCollection.features.map((feature) => feature.properties?.status).filter(Boolean))].sort(),
    [grantCollection],
  );
  const selectedGrant = grants.find((feature) => Number(feature.properties?.id) === selectedGrantId) || null;

  useEffect(() => {
    if (selectedGrantId !== null && !selectedGrant) setSelectedGrantId(null);
  }, [selectedGrant, selectedGrantId]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isMapReady || !map) return;

    const source = map.getSource(MAP_SOURCE_ID);
    if (source?.setData) source.setData(filteredCollection);

    if (filteredCollection.features.length === 0) {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 500 });
      return;
    }

    const bounds = new LngLatBounds();
    filteredCollection.features.forEach((feature) => bounds.extend(feature.geometry.coordinates));
    if (filteredCollection.features.length === 1) {
      map.easeTo({ center: filteredCollection.features[0].geometry.coordinates, zoom: 12, duration: 500 });
    } else {
      map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 500 });
    }
  }, [filteredCollection, isMapReady]);

  const selectGrant = (feature) => {
    setSelectedGrantId(Number(feature.properties.id));
    const map = mapInstanceRef.current;
    if (map) map.flyTo({ center: feature.geometry.coordinates, zoom: Math.max(map.getZoom(), 12), essential: true });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
  };

  const mapTitle = council?.name ? `${council.name} Grant Map` : 'Community Grant Map';

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <CommunityNavbar user={user} onNavigate={onNavigate} onLogout={onLogout} activePage="grant-map" />

      <main className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Map className="h-6 w-6" aria-hidden="true" /></div>
              <div>
                <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">{mapTitle}</h1>
                <p className="mt-0.5 text-sm text-slate-600">Explore published grants that councils have approved for map display.</p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800">
              <MapPin className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {grants.length} mapped grant{grants.length === 1 ? '' : 's'}
            </Badge>
          </div>
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
          <aside className="z-10 w-full shrink-0 border-b border-slate-200 bg-white lg:w-96 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900"><Filter className="h-4 w-4" aria-hidden="true" />Filter grants</div>
                {(search || category !== 'all' || status !== 'all') && (
                  <button type="button" onClick={clearFilters} className="text-sm font-medium text-blue-700 hover:text-blue-900">Clear</button>
                )}
              </div>
              <div className="space-y-3">
                <label className="relative block">
                  <span className="sr-only">Search mapped grants</span>
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search grants or locations"
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Category
                    <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                      <option value="all">All categories</option>
                      {categories.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                      <option value="all">All statuses</option>
                      {statuses.map((value) => <option key={value} value={value}>{displayStatus(value)}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="max-h-[34vh] overflow-y-auto p-4 lg:max-h-none lg:h-[calc(100dvh-17rem)]">
              {isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading mapped grants…</p>}
              {!isLoading && dataError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p>{dataError}</p>
                  <button type="button" onClick={loadGrantData} className="mt-2 font-semibold underline">Try again</button>
                </div>
              )}
              {!isLoading && !dataError && grants.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <Layers className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
                  <h2 className="mt-2 font-semibold text-slate-800">No mapped grants yet</h2>
                  <p className="mt-1 text-sm text-slate-600">A grant appears here after it is published, has valid coordinates, and is approved for map display.</p>
                </div>
              )}
              <div className="space-y-3">
                {grants.map((feature) => {
                  const properties = feature.properties || {};
                  const isSelected = Number(properties.id) === selectedGrantId;
                  return (
                    <button
                      key={properties.id}
                      type="button"
                      onClick={() => selectGrant(feature)}
                      className={`w-full rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold leading-snug text-slate-900">{properties.title}</h2>
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge className={statusClass(properties.status)}>{displayStatus(properties.status)}</Badge>
                        {properties.category && <Badge variant="outline" className="border-slate-300 text-slate-700">{properties.category}</Badge>}
                      </div>
                      {properties.location_name && <p className="mt-2 text-xs text-slate-600">{properties.location_name}</p>}
                      <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-800"><DollarSign className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />{formatCurrency(properties.total_budget)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="relative min-h-[52vh] flex-1 lg:min-h-0" aria-label="Interactive grant map">
            <div ref={mapContainerRef} className="absolute inset-0" />
            {!isMapReady && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-100/80" aria-live="polite">
                <div className="rounded-xl bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow">Loading interactive map…</div>
              </div>
            )}
            {mapError && (
              <div className="absolute left-4 top-4 max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 shadow">
                {mapError}
                <button type="button" className="ml-2 font-semibold underline" onClick={() => setMapError('')}>Dismiss</button>
              </div>
            )}
            {!isLoading && !dataError && grants.length === 0 && isMapReady && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
                <Card className="max-w-md border-slate-200 bg-white/95 text-center shadow-lg">
                  <CardContent className="p-6">
                    <MapPin className="mx-auto h-9 w-9 text-blue-700" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-bold text-slate-900">The map is ready for council grants</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">No published grants have been approved for map display yet. Markers will appear here once eligible grants include valid map coordinates.</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGrant && (
              <div className="absolute bottom-4 left-4 right-4 max-w-xl">
                <Card className="border-slate-200 bg-white shadow-xl">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <Badge className={statusClass(selectedGrant.properties.status)}>{displayStatus(selectedGrant.properties.status)}</Badge>
                          {selectedGrant.properties.category && <Badge variant="outline">{selectedGrant.properties.category}</Badge>}
                        </div>
                        <h2 className="text-lg font-bold text-slate-950">{selectedGrant.properties.title}</h2>
                        {selectedGrant.properties.location_name && <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{selectedGrant.properties.location_name}</p>}
                      </div>
                      <button type="button" onClick={() => setSelectedGrantId(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close grant details"><X className="h-5 w-5" /></button>
                    </div>
                    {selectedGrant.properties.description && <p className="mt-3 text-sm leading-6 text-slate-700">{selectedGrant.properties.description}</p>}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div><p className="text-xs text-slate-500">Funding</p><p className="font-semibold text-slate-900">{formatCurrency(selectedGrant.properties.total_budget)}</p></div>
                      <div><p className="text-xs text-slate-500">Applications funded</p><p className="font-semibold text-slate-900">{selectedGrant.properties.approved_project_count || 0}</p></div>
                      <div><p className="text-xs text-slate-500">Closes</p><p className="font-semibold text-slate-900">{formatDate(selectedGrant.properties.closes_at)}</p></div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" onClick={() => onNavigate(`grant-details/${selectedGrant.properties.id}`)}><Info className="mr-1.5 h-4 w-4" />View grant details</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default PublicGrantMap;

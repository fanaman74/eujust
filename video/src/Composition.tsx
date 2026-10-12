import {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';
import maplibregl, {type Map} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {portrait: boolean; accent: string};

/** A fixed, real geographic map. Frame-driven colour passes make a seamless loop. */
export const EuropeMap: React.FC<Props> = ({portrait, accent}) => {
  const container = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const {delayRender, continueRender} = useDelayRender();
  const [loading] = useState(() => delayRender('Loading bundled Europe geography'));
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
    if (!container.current) return;
    maplibregl.setWorkerUrl(staticFile('maplibre-worker.js'));
    const instance = new maplibregl.Map({
      container: container.current,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      renderWorldCopies: false,
      canvasContextAttributes: {preserveDrawingBuffer: true},
      style: {
        version: 8,
        // eslint-disable-next-line @remotion/non-pure-animation -- Zero disables MapLibre browser-timed interpolation; frames own all motion.
        transition: {duration: 0},
        sources: {countries: {type: 'geojson', data: staticFile('countries.geojson')}},
        layers: [
          {id: 'water', type: 'background', paint: {'background-color': '#fcfff7'}},
          {id: 'land', type: 'fill', source: 'countries', paint: {'fill-color': '#e4ecdc', 'fill-opacity': .8}},
          {id: 'eu', type: 'fill', source: 'countries', filter: ['==', ['get', 'eu'], true], paint: {'fill-color': accent, 'fill-opacity': .55}},
          {id: 'borders', type: 'line', source: 'countries', paint: {'line-color': '#a7b89b', 'line-width': 1.15, 'line-opacity': .7}},
        ]
      }
    });
    instance.on('load', () => {
      instance.fitBounds([[-15, 34], [37, 71]], {
        padding: portrait ? {top: 530, bottom: 100, left: 45, right: 45} : {top: 70, bottom: 60, left: 720, right: 80},
        animate: false
      });
      instance.once('idle', () => {setMap(instance); continueRender(loading);});
    });
  }, [accent, continueRender, loading, portrait]);

  useEffect(() => {
    if (!map) return;
    const handle = delayRender('Painting deterministic map frame');
    const phase = 2 * Math.PI * frame / durationInFrames;
    // A geographic colour pass, not an activity/traffic/coverage indicator.
    map.setPaintProperty('eu', 'fill-opacity', ['+', .50, ['*', .27, ['cos', ['-', phase, ['get', 'phase']]]]]);
    map.once('idle', () => continueRender(handle));
    map.triggerRepaint();
  }, [continueRender, delayRender, durationInFrames, frame, map]);

  return <AbsoluteFill style={{backgroundColor: '#fcfff7'}}><div ref={container} style={{width, height, position: 'absolute'}} /></AbsoluteFill>;
};

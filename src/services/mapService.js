import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import store from '../../store';

// find which polygon in a FeatureCollection
export function findContainingFeature({ long, lat }) {
  const { sections: Sections } = store.getState().sections;
  console.log(Sections);
  if (!Sections) return null;
  const pt = point([long, lat]);
  return Sections?.features?.find(f => booleanPointInPolygon(pt, f)) ?? null;
}

import Sections from '../constants/Sections.json';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

// find which polygon in a FeatureCollection
export function findContainingFeature({ long, lat }) {
  const pt = point([long, lat]);
  return Sections.features.find(f => booleanPointInPolygon(pt, f));
}

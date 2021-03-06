// @flow

import {
  bisectRight,
  max,
  min,
} from 'd3-array';

import {
  entries,
} from 'd3-collection';

import {
  scaleBand,
  scaleLinear,
} from 'd3-scale';


function isObject<T>(o: T): boolean {
  return Object.prototype.toString.call(o) === '[object Object]';
}

// deep clone an object
function clone(obj: {[key: string]: any}): {[key: string]: any} {
  if (obj === null || typeof obj !== 'object') return obj;
  const copy = obj.constructor();
  Object.keys(obj).forEach((attr) => {
    copy[attr] = clone(obj[attr]);
  });
  return copy;
}

// extend target object with source object
// overriding target values with source ones
function extend(
  target: {[key: string]: mixed},
  source: {[key: string]: mixed},
): {[key: string]: any} {
  if (!isObject(target) || !isObject(source)) {
    throw new Error('extend only accepts objects');
  }

  const targetClone = clone(target);
  Object.keys(source).forEach((prop) => {
    targetClone[prop] = source[prop];
  });
  return targetClone;
}

// $FlowNoD3
function getOrdinalBandScale(domain, range) {
  return scaleBand()
    .rangeRound(range, 0.1)
    .padding(0.1)
    .domain(domain);
}

// $FlowNoD3
function getQuantitativeScale(scaleType, domain, range) {
  let scale;
  switch (scaleType) {
    case 'linear':
      scale = scaleLinear();
      break;
    default:
      scale = scaleLinear();
  }

  return scale
    .range(range)
    .domain(domain);
}

// for each attribute in `state` it sets a getter-setter function on `f`
function getset(
  f: (Array<mixed>) => mixed,
  state: {[key: string]: mixed},
): (Array<mixed>) => mixed {
  entries(state).forEach((o) => {
    /* eslint no-param-reassign:0 */
    f[o.key] = function getSetCallback(x) {
      if (x === undefined) return state[o.key];
      if (isObject(o.value)) {
        state[o.key] = extend(o.value, x);
      } else {
        state[o.key] = x;
      }
      return f;
    };
  });
  return f;
}

function snapBrushToBandScale(
  extent: [number, number],
  scale: (any) => any,
): {newDomain: [number, number], newExtent: [number, number]} {
  const steps = [0].concat(scale.domain().map((d, i) => scale.step() * (i + 1)));
  const padding = Math.round((scale.step() * scale.paddingInner()) / 2);
  const idxInsertionLeft = bisectRight(steps, extent[0]);
  const idxInsertionRight = bisectRight(steps, extent[1]);
  let idx0;
  let idx1;

  if (extent[0] - steps[idxInsertionLeft - 1] >= steps[idxInsertionLeft] - extent[0]) {
    // ...|.....x..|...
    idx0 = idxInsertionLeft;
  } else {
    // ...|..x.....|...
    idx0 = idxInsertionLeft - 1;
  }

  if (extent[1] - steps[idxInsertionRight - 1] >= steps[idxInsertionRight] - extent[1]) {
    idx1 = idxInsertionRight;
  } else {
    idx1 = idxInsertionRight - 1;
  }

  const newDomain = scale.domain().filter((d, i) => {
    if (i >= idx0 && i < idx1) {
      return true;
    }
    return false;
  });

  const p0 = steps[idx0] + padding;
  const p1 = steps[idx1] + padding;
  const newExtent = [p0, p1];

  return { newDomain, newExtent };
}

function stackMax<T>(serie: Array<T>): T {
  return max(serie, d => d[1]);
}

function stackMin<T>(serie: Array<T>): T {
  return min(serie, d => d[0]);
}


export default {
  clone,
  extend,
  getOrdinalBandScale,
  getQuantitativeScale,
  getset,
  isObject,
  snapBrushToBandScale,
  stackMax,
  stackMin,
};

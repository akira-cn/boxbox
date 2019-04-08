import greenlet from 'greenlet';

export default greenlet((data) => {
  const TREE = -1,
    EMPTY = 0,
    BUCKET = 1;

  const BOUND_X = 15;
  const BOUND_Y = 10;

  function record(map, x, y) {
    const key = JSON.stringify({x, y, map: map.map((m, i) => [m, i]).filter(a => a[0] === BUCKET)});
    return key;
  }

  function moveLeft(map, x, y) {
    if(x < 1) return false;
    const next = y * BOUND_X + x - 1;
    if(map[next] === EMPTY) {
      return true;
    }
    if(map[next] === BUCKET) {
      if(x < 2) return false;
      const nextnext = next - 1;
      if(map[nextnext] === EMPTY) {
        map[next] = EMPTY;
        map[nextnext] = BUCKET;
        return [next, nextnext];
      }
    }
    return false;
  }

  function moveUp(map, x, y) {
    if(y < 1) return false;
    const next = (y - 1) * BOUND_X + x;
    if(map[next] === EMPTY) {
      return true;
    }
    if(map[next] === BUCKET) {
      if(y < 2) return false;
      const nextnext = next - BOUND_X;
      if(map[nextnext] === EMPTY) {
        map[next] = EMPTY;
        map[nextnext] = BUCKET;
        return [next, nextnext];
      }
    }
    return false;
  }

  function moveRight(map, x, y) {
    if(x >= BOUND_X - 1) return false;
    const next = y * BOUND_X + x + 1;
    if(map[next] === EMPTY) {
      return true;
    }
    if(map[next] === BUCKET) {
      if(x >= BOUND_X - 2) return false;
      const nextnext = next + 1;
      if(map[nextnext] === EMPTY) {
        map[next] = EMPTY;
        map[nextnext] = BUCKET;
        return [next, nextnext];
      }
    }
    return false;
  }

  function moveDown(map, x, y) {
    if(y >= BOUND_Y - 1) return false;
    const next = (y + 1) * BOUND_X + x;
    if(map[next] === EMPTY) {
      return true;
    }
    if(map[next] === BUCKET) {
      if(y >= BOUND_Y - 2) return false;
      const nextnext = next + BOUND_X;
      if(map[nextnext] === EMPTY) {
        map[next] = EMPTY;
        map[nextnext] = BUCKET;
        return [next, nextnext];
      }
    }
    return false;
  }

  function checkSpots(map, spots) {
    return spots.every((a) => {
      return map[a[1] * BOUND_X + a[0]] === BUCKET;
    });
  }

  const map = Array((BOUND_X + 1) * (BOUND_Y + 1)).fill(0);

  data.trees.forEach((t) => {
    map[t[1] * BOUND_X + t[0]] = TREE;
  });

  const spots = data.spots;

  data.buckets.forEach((t) => {
    map[t[1] * BOUND_X + t[0]] = BUCKET;
  });

  const steps = [];

  const recordSet = new Map();

  let results = null;

  function step(map, x, y) {
    if(results && steps.length >= results.length) return;

    const mapRecord = record(map, x, y);
    if(recordSet.has(mapRecord)) {
      const len = recordSet.get(mapRecord);
      if(len <= steps.length) {
        return;
      }
    }
    recordSet.set(mapRecord, steps.length);

    if(checkSpots(map, spots)) {
      if(!results || results.length > steps.length) {
        results = steps.slice(0);
      }
    }
    let check;
    check = moveLeft(map, x, y);
    if(check) {
      steps.push('left');
      step(map, x - 1, y);
      if(check.length) {
        map[check[0]] = BUCKET;
        map[check[1]] = EMPTY;
      }
      steps.pop();
    }
    check = moveRight(map, x, y);
    if(check) {
      steps.push('right');
      step(map, x + 1, y);
      if(check.length) {
        map[check[0]] = BUCKET;
        map[check[1]] = EMPTY;
      }
      steps.pop();
    }
    check = moveUp(map, x, y);
    if(check) {
      steps.push('up');
      step(map, x, y - 1);
      if(check.length) {
        map[check[0]] = BUCKET;
        map[check[1]] = EMPTY;
      }
      steps.pop();
    }
    check = moveDown(map, x, y);
    if(check) {
      steps.push('down');
      step(map, x, y + 1);
      if(check.length) {
        map[check[0]] = BUCKET;
        map[check[1]] = EMPTY;
      }
      steps.pop();
    }
  }

  step(map, Number(data.man[0]), Number(data.man[1]));

  return results;
});

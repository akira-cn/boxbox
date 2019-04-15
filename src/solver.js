import greenlet from 'greenlet';

export default greenlet((data) => {
  const TREE = 1,
    EMPTY = 0;

  const BOUND_X = 15;
  const BOUND_Y = 10;

  const map = Array((BOUND_X + 1) * (BOUND_Y + 1)).fill(0);

  data.trees.forEach((t) => {
    map[t[1] * BOUND_X + t[0]] = TREE;
  });

  const buckets = new Set(data.buckets.map(b => b[1] * BOUND_X + b[0]));
  const spots = data.spots.map(s => s[1] * BOUND_X + s[0]);

  function record(x, y) {
    const key = JSON.stringify({x, y, b: Array.from(buckets).sort()});
    return key;
  }

  function isEmpty(idx) {
    return map[idx] === EMPTY && !buckets.has(idx);
  }

  function isBucketInSpot(idx) {
    return spots.some(spot => spot === idx);
  }

  function deadBucket(bucket) {
    const fixed = new Set();

    function isImmovable(idx) {
      return map[idx] === TREE || map[idx] == null
       || buckets.has(idx) && !canMove(idx);
    }

    function canMove(idx) {
      if(fixed.has(idx)) return false;
      fixed.add(idx);

      const left = isImmovable(idx - 1),
        right = isImmovable(idx + 1),
        top = isImmovable(idx - BOUND_X),
        down = isImmovable(idx + BOUND_X);

      if((left && top)
        || (top && right)
        || (right && down)
        || (down && left)) {
        return false;
      }
      fixed.delete(idx);
      return true;
    }

    const movable = canMove(bucket);
    if(movable) return false;
    if(isBucketInSpot(bucket)) {
      return Array.from(fixed).some(bucket => !isBucketInSpot(bucket));
    }
    return true;
  }

  function testMove(nextnext, next) {
    buckets.delete(next);
    buckets.add(nextnext);
    if(deadBucket(nextnext)) {
      buckets.delete(nextnext);
      buckets.add(next);
      return false;
    }
    return [next, nextnext];
  }

  function moveLeft(x, y) {
    if(x < 1) return false;
    const next = y * BOUND_X + x - 1;
    if(isEmpty(next)) {
      return true;
    }
    if(buckets.has(next)) {
      if(x < 2) return false;
      const nextnext = next - 1;
      if(isEmpty(nextnext)) {
        return testMove(nextnext, next);
      }
    }
    return false;
  }

  function moveUp(x, y) {
    if(y < 1) return false;
    const next = (y - 1) * BOUND_X + x;
    if(isEmpty(next)) {
      return true;
    }
    if(buckets.has(next)) {
      if(y < 2) return false;
      const nextnext = next - BOUND_X;
      if(isEmpty(nextnext)) {
        return testMove(nextnext, next);
      }
    }
    return false;
  }

  function moveRight(x, y) {
    if(x >= BOUND_X - 1) return false;
    const next = y * BOUND_X + x + 1;
    if(isEmpty(next)) {
      return true;
    }
    if(buckets.has(next)) {
      if(x >= BOUND_X - 2) return false;
      const nextnext = next + 1;
      if(isEmpty(nextnext)) {
        return testMove(nextnext, next);
      }
    }
    return false;
  }

  function moveDown(x, y) {
    if(y >= BOUND_Y - 1) return false;
    const next = (y + 1) * BOUND_X + x;
    if(isEmpty(next)) {
      return true;
    }
    if(buckets.has(next)) {
      if(y >= BOUND_Y - 2) return false;
      const nextnext = next + BOUND_X;
      if(isEmpty(nextnext)) {
        return testMove(nextnext, next);
      }
    }
    return false;
  }

  function checkSpots() {
    return spots.every((s) => {
      return buckets.has(s);
    });
  }

  const steps = [];

  const recordSet = new Map();

  let results = null;

  function step(x, y) {
    if(results && steps.length >= results.length) return;

    const mapRecord = record(x, y);
    if(recordSet.has(mapRecord)) {
      const len = recordSet.get(mapRecord);
      if(len <= steps.length) {
        return;
      }
    }
    recordSet.set(mapRecord, steps.length);

    if(checkSpots()) {
      if(!results || results.length > steps.length) {
        results = steps.slice(0);
      }
    }
    let check;
    check = moveLeft(x, y);
    if(check) {
      steps.push('left');
      step(x - 1, y);
      if(check.length) {
        buckets.add(check[0]);
        buckets.delete(check[1]);
      }
      steps.pop();
    }
    check = moveRight(x, y);
    if(check) {
      steps.push('right');
      step(x + 1, y);
      if(check.length) {
        buckets.add(check[0]);
        buckets.delete(check[1]);
      }
      steps.pop();
    }
    check = moveUp(x, y);
    if(check) {
      steps.push('up');
      step(x, y - 1);
      if(check.length) {
        buckets.add(check[0]);
        buckets.delete(check[1]);
      }
      steps.pop();
    }
    check = moveDown(x, y);
    if(check) {
      steps.push('down');
      step(x, y + 1);
      if(check.length) {
        buckets.add(check[0]);
        buckets.delete(check[1]);
      }
      steps.pop();
    }
  }

  step(Number(data.man[0]), Number(data.man[1]));

  return results;
});

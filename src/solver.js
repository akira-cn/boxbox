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

  const allBuckets = new Set(data.buckets.map(b => b[1] * BOUND_X + b[0]));
  const spots = data.spots.map(s => s[1] * BOUND_X + s[0]);

  function record(buckets, x, y) {
    const key = JSON.stringify({x, y, b: Array.from(buckets).sort()});
    return key;
  }

  function isEmpty(buckets, idx) {
    return map[idx] === EMPTY && !buckets.has(idx);
  }

  function isBucketInSpot(idx) {
    return spots.some(spot => spot === idx);
  }

  function deadBucket(buckets, bucket) {
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

  const MOVE_MAN = 1,
    MOVE_BOX = 2;

  function testMove(buckets, nextnext, next) {
    buckets.delete(next);
    buckets.add(nextnext);
    if(deadBucket(buckets, nextnext)) {
      buckets.delete(nextnext);
      buckets.add(next);
      return 0;
    }
    return MOVE_BOX;
  }

  function moveLeft(buckets, x, y) {
    if(x < 1) return 0;
    const next = y * BOUND_X + x - 1;
    if(isEmpty(buckets, next)) {
      return MOVE_MAN;
    }
    if(buckets.has(next)) {
      if(x < 2) return 0;
      const nextnext = next - 1;
      if(isEmpty(buckets, nextnext)) {
        return testMove(buckets, nextnext, next);
      }
    }
    return 0;
  }

  function moveUp(buckets, x, y) {
    if(y < 1) return 0;
    const next = (y - 1) * BOUND_X + x;
    if(isEmpty(buckets, next)) {
      return MOVE_MAN;
    }
    if(buckets.has(next)) {
      if(y < 2) return 0;
      const nextnext = next - BOUND_X;
      if(isEmpty(buckets, nextnext)) {
        return testMove(buckets, nextnext, next);
      }
    }
    return 0;
  }

  function moveRight(buckets, x, y) {
    if(x >= BOUND_X - 1) return 0;
    const next = y * BOUND_X + x + 1;
    if(isEmpty(buckets, next)) {
      return MOVE_MAN;
    }
    if(buckets.has(next)) {
      if(x >= BOUND_X - 2) return 0;
      const nextnext = next + 1;
      if(isEmpty(buckets, nextnext)) {
        return testMove(buckets, nextnext, next);
      }
    }
    return 0;
  }

  function moveDown(buckets, x, y) {
    if(y >= BOUND_Y - 1) return 0;
    const next = (y + 1) * BOUND_X + x;
    if(isEmpty(buckets, next)) {
      return MOVE_MAN;
    }
    if(buckets.has(next)) {
      if(y >= BOUND_Y - 2) return 0;
      const nextnext = next + BOUND_X;
      if(isEmpty(buckets, nextnext)) {
        return testMove(buckets, nextnext, next);
      }
    }
    return 0;
  }

  function checkSpots(buckets) {
    return spots.every((s) => {
      return buckets.has(s);
    });
  }

  const recordSet = new Set();
  let results = null;
  const x = Number(data.man[0]),
    y = Number(data.man[1]);

  const list = [{buckets: allBuckets, steps: [], x, y}];

  for(let i = 0; i < list.length; i++) {
    const {buckets, steps, x, y} = list[i];
    let mvb = new Set(buckets);
    let check = moveLeft(mvb, x, y);
    if(check) {
      const mapRecord = record(mvb, x - 1, y);
      if(check === MOVE_BOX && checkSpots(mvb)) {
        results = steps.concat('left');
        break;
      }
      if(!recordSet.has(mapRecord)) {
        list.push({buckets: mvb, steps: steps.concat('left'), x: x - 1, y});
        recordSet.add(mapRecord);
      }
    }
    mvb = new Set(buckets);
    check = moveRight(mvb, x, y);
    if(check) {
      const mapRecord = record(mvb, x + 1, y);
      if(check === MOVE_BOX && checkSpots(mvb)) {
        results = steps.concat('right');
        break;
      }
      if(!recordSet.has(mapRecord)) {
        list.push({buckets: mvb, steps: steps.concat('right'), x: x + 1, y});
        recordSet.add(mapRecord);
      }
    }
    mvb = new Set(buckets);
    check = moveUp(mvb, x, y);
    if(check) {
      const mapRecord = record(mvb, x, y - 1);
      if(check === MOVE_BOX && checkSpots(mvb)) {
        results = steps.concat('up');
        break;
      }
      if(!recordSet.has(mapRecord)) {
        list.push({buckets: mvb, steps: steps.concat('up'), x, y: y - 1});
        recordSet.add(mapRecord);
      }
    }
    mvb = new Set(buckets);
    check = moveDown(mvb, x, y);
    if(check) {
      const mapRecord = record(mvb, x, y + 1);
      if(check === MOVE_BOX && checkSpots(mvb)) {
        results = steps.concat('down');
        break;
      }
      if(!recordSet.has(mapRecord)) {
        list.push({buckets: mvb, steps: steps.concat('down'), x, y: y + 1});
        recordSet.add(mapRecord);
      }
    }
  }

  return results;
});

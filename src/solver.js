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

  function rec(buckets) {
    return `${Array.from(buckets).sort()}`;
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

  function makeDirectionXY(direction, delta = 1) {
    const getXYs = [
      (x, y) => [x - delta, y],
      (x, y) => [x + delta, y],
      (x, y) => [x, y - delta],
      (x, y) => [x, y + delta],
    ];
    return getXYs[direction];
  }

  function getPos(x, y, direction) {
    if(x < 0 || x >= BOUND_X) return null;
    if(y < 0 || y >= BOUND_Y) return null;
    return y * BOUND_X + x;
  }

  function makeMove(direction) {
    const getNextXY = makeDirectionXY(direction);
    const getNextNextXY = makeDirectionXY(direction, 2);
    return (buckets, x, y) => {
      let pos = getNextXY(x, y);
      const next = getPos(pos[0], pos[1]);
      if(next && isEmpty(buckets, next)) {
        return MOVE_MAN;
      }
      if(next && buckets.has(next)) {
        pos = getNextNextXY(x, y);
        const nextnext = getPos(pos[0], pos[1]);
        if(nextnext && isEmpty(buckets, nextnext)) {
          return testMove(buckets, nextnext, next);
        }
      }
      return 0;
    };
  }

  function checkSpots(buckets) {
    return spots.every((s) => {
      return buckets.has(s);
    });
  }

  const LEFT = 0,
    RIGHT = 1,
    UP = 2,
    DOWN = 3;

  let results = null;
  const x = Number(data.man[0]),
    y = Number(data.man[1]);
  const recordSet = new Map();

  recordSet.set(rec(allBuckets), new Set([getPos(x, y)]));

  const list = [{buckets: allBuckets, steps: [], x, y}];

  function bfs(buckets, steps, x, y, direction) {
    const move = makeMove(direction);
    const getPosByXY = makeDirectionXY(direction);

    const mvb = new Set(buckets);
    const check = move(mvb, x, y);
    if(check) {
      const pos = getPosByXY(x, y);
      // const mapRecord = record(mvb, pos[0], pos[1]);
      const mapRecord = rec(mvb);
      if(check === MOVE_BOX && checkSpots(mvb)) {
        results = steps.concat(direction);
        return true;
      }
      if(!recordSet.has(mapRecord)) {
        list.push({buckets: mvb, steps: steps.concat(direction), x: pos[0], y: pos[1]});
        recordSet.set(mapRecord, new Set([getPos(pos[0], pos[1])]));
      } else {
        const poss = recordSet.get(mapRecord);
        const idx = getPos(pos[0], pos[1]);
        if(!poss.has(idx)) {
          list.push({buckets: mvb, steps: steps.concat(direction), x: pos[0], y: pos[1]});
          poss.add(idx);
        }
      }
    }
    return false;
  }

  for(let i = 0; i < list.length; i++) {
    const {buckets, steps, x, y} = list[i];
    if(bfs(buckets, steps, x, y, LEFT)
    || bfs(buckets, steps, x, y, RIGHT)
    || bfs(buckets, steps, x, y, UP)
    || bfs(buckets, steps, x, y, DOWN)) break;
  }
  const m = ['left', 'right', 'up', 'down'];
  return results.map(r => m[r]);
});

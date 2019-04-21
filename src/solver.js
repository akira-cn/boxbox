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

      const left = idx % BOUND_X > 0 && isImmovable(idx - 1),
        right = idx % BOUND_X < BOUND_X - 1 && isImmovable(idx + 1),
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

  const recordSet = {};
  function getRecord(b1, b2) {
    if(recordSet[b1] == null) return null;
    return recordSet[b1][b2];
  }

  function setRecord(b1, b2, pos) {
    const poss = getRecord(b1, b2) || [0, 0, 0, 0, 0];
    setPos(poss, pos);
    recordSet[b1] = recordSet[b1] || {};
    recordSet[b1][b2] = poss;
  }

  function hasPos(poss, pos) {
    let idx = 0;
    while(pos >= 30) {
      pos -= 30;
      idx++;
    }
    return poss[idx] & (1 << pos);
  }

  function setPos(poss, pos) {
    let idx = 0;
    while(pos >= 30) {
      pos -= 30;
      idx++;
    }
    poss[idx] |= (1 << pos);
  }

  function pack({buckets, x, y, step, pre}) {
    const arr = new Uint32Array(4);
    buckets = Array.from(buckets).sort();
    for(let i = 0; i < 8; i++) {
      let bucket = buckets[i];
      if(bucket == null) bucket = 0xff;
      if(i < 4) {
        arr[0] |= bucket << (8 * i);
      } else {
        arr[1] |= bucket << (8 * (i - 4));
      }
    }
    arr[2] |= x;
    arr[2] |= y << 8;
    if(pre !== 0xffffffff) {
      arr[2] |= step << 16;
    }
    arr[3] = pre;
    return arr;
  }

  function unpack(a, b, c, d) {
    let buckets = [
      a & 0xff,
      (a >>> 8) & 0xff,
      (a >>> 16) & 0xff,
      (a >>> 24) & 0xff,
      b & 0xff,
      (b >>> 8) & 0xff,
      (b >>> 16) & 0xff,
      (b >>> 24) & 0xff,
    ];
    buckets = new Set(buckets.filter(b => b !== 0xff));
    const x = c & 0xff;
    const y = (c >> 8) & 0xff;
    let step = -1;
    if(d !== 0xffffffff) {
      step = (c >> 16) & 0xff;
    }
    return {buckets, x, y, step, pre: d};
  }

  // 以两位Uint32来表示所有的8个buckets，以一位Uint32来表示x,y,direction，以一位Uint32来表示preIndex
  const list = new Uint32Array(256 * 1024 * 1024);
  const packed = pack({buckets: allBuckets, pre: -1, x, y});
  list[0] = packed[0];
  list[1] = packed[1];
  list[2] = packed[2];
  list[3] = packed[3];

  setRecord(list[0], list[1], getPos(x, y));

  function getSteps(idx) {
    const data = unpack(list[idx], list[idx + 1], list[idx + 2], list[idx + 3]);
    if(data.step >= 0) {
      return getSteps(data.pre).concat(data.step);
    }
    return [];
  }

  let count = 4;

  function bfs(buckets, i, x, y, direction) {
    const move = makeMove(direction);
    const getPosByXY = makeDirectionXY(direction);

    const mvb = new Set(buckets);
    const check = move(mvb, x, y);
    if(check) {
      const pos = getPosByXY(x, y);
      if(check === MOVE_BOX && checkSpots(mvb)) {
        results = getSteps(i).concat(direction);
        return true;
      }
      const packed = pack({buckets: mvb, pre: i, step: direction, x: pos[0], y: pos[1]});
      const poss = getRecord(packed[0], packed[1]);
      if(!poss) {
        list[count] = packed[0];
        list[count + 1] = packed[1];
        list[count + 2] = packed[2];
        list[count + 3] = packed[3];
        count += 4;
        setRecord(packed[0], packed[1], getPos(pos[0], pos[1]));
      } else {
        const idx = getPos(pos[0], pos[1]);
        if(!hasPos(poss, idx)) {
          list[count] = packed[0];
          list[count + 1] = packed[1];
          list[count + 2] = packed[2];
          list[count + 3] = packed[3];
          count += 4;
          setPos(poss, idx);
        }
      }
    }
    return false;
  }

  for(let i = 0; i < list.length; i += 4) {
    if(list[i] === 0) {
      break;
    }
    const {buckets, x, y} = unpack(list[i], list[i + 1], list[i + 2], list[i + 3]);
    if(bfs(buckets, i, x, y, LEFT)
      || bfs(buckets, i, x, y, RIGHT)
      || bfs(buckets, i, x, y, UP)
      || bfs(buckets, i, x, y, DOWN)) break;
  }

  const m = ['left', 'right', 'up', 'down'];
  return results.map(r => m[r]);
});

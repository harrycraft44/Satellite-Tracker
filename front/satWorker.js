// webworker. as the sat calcs are done localy using a webworker to not make the page stutter the sats calcs are done sperately to the main render thread
importScripts('https://cdnjs.cloudflare.com/ajax/libs/satellite.js/1.3.0/satellite.min.js');
importScripts('/attemptlib/index.js');

let sats = [];
let buf;
let maxSize = 0;

self.onmessage = ({data}) => {
  const {type} = data;

  if (type === 'init') {
    maxSize = data.maxSize;
    buf = new Float32Array(maxSize * 2);
    return;
  }

  if (type === 'add') {
        console.log('Adding satellites:', data.sats.length); // Add this line

    if (data.sats && data.sats.length > 0) {
        if (sats.length + data.sats.length <= maxSize) {
            for (const sat of data.sats) {
                sat.satrec = satellite.twoline2satrec(sat.TLE_LINE1, sat.TLE_LINE2);
                sats.push(sat);
            }
        }
    }
    return; 
  }

  if (type === 'tick') {
    const count = sats.length;
    if (count === 0) return;

    const now = new Date();
    const gmst = satellite.gstimeFromDate(now);

    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const second = now.getUTCSeconds();

    for (let i = 0; i < count; i++) {
        const sat = sats[i];

        if (!sat.satrec || sat.satrec.error > 0) {
            buf[i * 2] = NaN;
            buf[i * 2 + 1] = NaN;
            continue;
        }

        const positionAndVelocity = satellite.propagate(
            sat.satrec, year, month, day, hour, minute, second
        );
        const positionEci = positionAndVelocity.position;

        if (!positionEci) {
            buf[i * 2] = NaN;
            buf[i * 2 + 1] = NaN;
            continue;
        }

        const geodetic = satellite.eciToGeodetic(positionEci, gmst);
        const lat = satellite.degreesLat(geodetic.latitude);
        const lon = satellite.degreesLong(geodetic.longitude);
        
        const MAX_LAT = 85.05113;
        let wrappedLon = ((lon + 540) % 360) - 180;
        let clampedLat = Math.max(Math.min(lat, MAX_LAT), -MAX_LAT);
        buf[i * 2] = wrappedLon;
        buf[i * 2 + 1] = clampedLat;
    }

    for (let i = 0; i < Math.min(10, count); i++) {
        console.log('sat', i, buf[i * 2], buf[i * 2 + 1]);
    }
    
    const out = buf.slice(0, count * 2);
    self.postMessage({buffer: out.buffer, count: count}, [out.buffer]);
  }
}; 

import * as fs from 'fs';
import _, { matches } from 'lodash';

const groupWithToArray = function<T,TGroup>(collection: T[], getGroup: (a:T) => TGroup, comparator?:(a:TGroup,b:TGroup) => boolean)
{
    const result:{g:TGroup,v:T[]}[] = [];

    const withGroups = collection.map(c=>[getGroup(c),c] as [TGroup,T]);
    const groups = _.uniqWith(withGroups.map(wg=>wg[0]),comparator);

    comparator = comparator ?? _.isEqual;
    _.forEach(groups, group => {
        result.push({g:group,v:withGroups.filter(wg=>comparator!(wg[0],group)).map(wg=>wg[1])});
    })

    return result;
}

const countByToArray = function<T>(collection: T[], comparator?:(a:T,b:T) => boolean)
{
    const result:{v:T,c:number}[] = [];

    const groups = _.uniqWith(collection,comparator);

    comparator = comparator ?? _.isEqual;
    _.forEach(groups, group => {
        result.push({v:group,c:collection.filter(c=>comparator!(c,group)).length});
    })

    return result;
}

interface coord {x:number,y:number,z:number};
const areCoordsEqual = (a:coord,b:coord) =>{
    if(!!!a) return !!!b;
    if(!!!b) return false;
    return a.x === b.x && a.y === b.y && a.z === b.z;
}
interface delta {a:number, b:number, d:[number,number,number]};
const areDeltasEqual = (a:delta,b:delta) => {
    if(!!!a) return !!!b;
    if(!!!b) return false;
    return a.d[0]===b.d[0]&&a.d[1]===b.d[1]&&a.d[2]===b.d[2];
}
const orientations:coord[] = [{x:0,y:1,z:2},{x:0,y:2,z:1},{x:1,y:0,z:2},{x:1,y:2,z:0},{x:2,y:0,z:1},{x:2,y:1,z:0}];
const directions:coord[] = [{x:1,y:1,z:1},{x:1,y:1,z:-1},{x:1,y:-1,z:1},{x:1,y:-1,z:-1},{x:-1,y:1,z:1},{x:-1,y:1,z:-1},{x:-1,y:-1,z:1},{x:-1,y:-1,z:1},{x:-1,y:-1,z:-1}];
interface ab {a:number, b:number};
interface abc {a:number, b:number, c:number};
interface deltaMatches {o:number, m:ab[]};
interface interScanMatch {a:number,b:number,o:number,c:number};
interface scannerLocation {s:number,p:coord,o:coord,d:coord};

const parseCord = (line:string) => {
    const a = line.split(',').map(s=>parseInt(s));
    return {x:a[0],y:a[1],z:a[2]};
}

const getDelta = (a:number, b:number) => {
    return (a>b) ? (a-b) : (b-a);
}

const getDeltas = (coords:coord[],includeOutOfBounds=false) => {
    const deltas:delta[] = [];
    for(let a=0;a<coords.length;a++)
    {
        const from = coords[a];
        for(let b=a+1;b<coords.length;b++)
        {
            const to = coords[b];
            const delta:delta = {a,b,d:[getDelta(from.x,to.x),getDelta(from.y,to.y),getDelta(from.z,to.z)]};
            if(includeOutOfBounds || _.max(delta.d)! <= 2000)
                deltas.push(delta);
        }
    }
    return deltas;
}

const getDeltaMatchesByOrientation = (as:delta[],bs:delta[]) => {
    const allMatches:deltaMatches[] = [];
    const aCoords:coord[] = as.map(d=>reorientCoordinate(d.d,orientations[0]));
    _.forEach(orientations, (o,io) => {
        const abMatches:ab[] = [];
        const bCoords:coord[] = bs.map(d=>reorientCoordinate(d.d,o));
        _.forEach(bCoords, (b,ib) => {
            _.forEach(aCoords, (a,ia) => {
            if(areCoordsEqual(a,b))
                abMatches.push({a:ia,b:ib});
            });
        });
        if(abMatches.length > 0)
            allMatches.push({o:io,m:abMatches});
    });
    return _.orderBy(allMatches,m=>-1*m.m.length);
}

const reorientCoordinate = (c:number[],o:coord) => {
    return {x:c[o.x],y:c[o.y],z:c[o.z]};
}

const reorientCoordinates = (cs:coord[],orientation:coord) => {
    return cs.map(c=>reorientCoordinate([c.x,c.y,c.z], orientation));
}

// returns coordinate 'c' relative to {x:0,y:0,z:0}
// a = anchor. This is the same coordinate  relative to 0
// d = direction.
// ({x:5,y:5,z:5},{x:1,y:2,z:3},{x:1,y:1,z:1}) => {x:(5-1),y:(5-2),z:(5-3)}
// ({x:5,y:5,z:5},{x:1,y:2,z:3},{x:-1,y:-1,z:-1}) => {x:-(5-1),y:-(5-2),z:-(5-3)}
function resolveCoordinateRelativeToZero(c: coord, a: coord, d: coord) {
    return {x:a.x-(d.x*c.x),y:a.y-(d.y*c.y),z:a.z-(d.z*c.z)};
}

function redirectBeaconAndOffset(c:coord, o:coord, d:coord){
    return {x:(d.x*c.x)+o.x,y:(d.y*c.y)+o.y,z:(d.z*c.z)+o.z};
}

export const run = () => {
    const file = fs.readFileSync('./src/day19.txt','utf8').split('\r\n');
    
    const scans:coord[][] = [];
    _.forEach(file, line => {
        if(line.startsWith('---'))
            scans.push([]);
        else if(line.length>0)
            scans[scans.length-1].push(parseCord(line));
    });

    
    for(let i=0;i<scans.length;i++){
        console.log(`scan: ${i} has ${scans[i].length} beacons.`);
    }
    
    const deltas:delta[][] = [];
    _.forEach(scans, (scan) => {
        deltas.push(getDeltas(scan));
    });

    const getFirstScansToReduce = () => {
        const interScanMatches: interScanMatch[] = [];

        for(let a=0;a<scans.length;a++)
            for(let b=a+1;b<scans.length;b++)
                _.forEach(getDeltaMatchesByOrientation(deltas[a],deltas[b]), abMatch => interScanMatches.push({a,b,o:abMatch.o,c:abMatch.m.length}));
        console.log(interScanMatches);
        // { a: 0, b: 1, o: 0, c: 66 },
        // { a: 0, b: 1, o: 2, c: 1 }, 
        // { a: 0, b: 2, o: 1, c: 3 }, 
        // { a: 0, b: 4, o: 3, c: 15 },
        // { a: 1, b: 2, o: 1, c: 15 },
        // { a: 1, b: 3, o: 0, c: 66 },
        // { a: 1, b: 4, o: 3, c: 66 },
        // { a: 2, b: 3, o: 1, c: 3 }, 
        // { a: 2, b: 4, o: 2, c: 66 },
        // { a: 3, b: 4, o: 3, c: 15 }

        const maxMatches = _.max(interScanMatches.map(m=>m.c));
        return interScanMatches.filter(m=>m.c === maxMatches)[0];
    };

    const firstReduce = getFirstScansToReduce();
    const resolvedScanners:scannerLocation[] = [{s:firstReduce.a,p:{x:0,y:0,z:0},d:directions[0],o:orientations[0]}];
    const resolvedBeacons:coord[] = [...scans[firstReduce.a]];

    const getNextScanToReduce = (allDeltas:delta[]) => {

        if(resolvedScanners.length === 1) return firstReduce.b;

        const interScanMatches: interScanMatch[] = [];
        for(let s=0;s<scans.length;s++){
            if(resolvedScanners.filter(sl => sl.s === s).length > 0) continue;
            const sDeltaMatches = getDeltaMatchesByOrientation(allDeltas,deltas[s]);
            _.forEach(sDeltaMatches, deltaMatch => interScanMatches.push({a:0,b:s,o:deltaMatch.o,c:deltaMatch.m.length}));
        }
        
        const maxMatches = _.max(interScanMatches.map(m=>m.c));
        return interScanMatches.filter(m=>m.c === maxMatches)[0].b;
    }

    const getDeltasByCoordinate = (cs:coord[], ds:delta[]) => {
        const result: delta[][] = [];

        for(let i=0;i<cs.length;i++)
            result.push(ds.filter(d=>d.a === i || d.b === i).map(d=>d.a === i ? d : {a:d.b, b:d.a, d:[...(d.d)]}));

        return result;
    }

    const getBeaconMappings = (reorientedBeacons:coord[], allDeltas:delta[], log:boolean = false) => {

        const deltasByA = getDeltasByCoordinate(resolvedBeacons, allDeltas);
        const deltasByB = getDeltasByCoordinate(reorientedBeacons, getDeltas(reorientedBeacons));

        const beaconMatches:abc[] = [];
        for(let a=0;a<deltasByA.length;a++)
        {
            for(let b=0;b<deltasByB.length;b++)
            {
                const matches = _.intersectionWith(deltasByA[a],deltasByB[b],areDeltasEqual);
                if(log && matches.length > 0)
                    console.log(matches);
                if(matches.length > 2)
                    beaconMatches.push({a,b,c:matches.length});
            }
        }

        if(log)
            console.log(beaconMatches);
        
        const beaconMappings:ab[] = [];
        const processedBeacons:number[] = [];
        _.forEach(beaconMatches, m => {
            if(processedBeacons.indexOf(m.b) >= 0)
                return;
            processedBeacons.push(m.b);
            beaconMappings.push({a:m.a,b:m.b});
        });

        
        if(log)
            console.log(beaconMatches);

        return beaconMappings.map(bm => [resolvedBeacons[bm.a],reorientedBeacons[bm.b]]as [coord,coord]);
    };

    const getScannerPosition = (bms:[coord,coord][], log:boolean) => {
        const dps:{d:coord,p:coord,c:number}[] = [];
        if(log) console.log('getScannerPosition');
        _.forEach(directions, direction => {
            if(log)
                console.log(`${[direction.x,direction.y,direction.z]}`);
            const scannerLocations = bms.map(bm => resolveCoordinateRelativeToZero(bm[1],bm[0],direction));
            if(log)
                console.log(scannerLocations);
            const countByPosition = _.orderBy(countByToArray(scannerLocations,areCoordsEqual).filter(c=>c.c>1),g=>-1*g.c);
            if(countByPosition.length > 0)
                dps.push({d:direction,p:countByPosition[0].v,c:countByPosition[0].c});
        });
        return dps.length > 0 ? _.orderBy(dps,dp=>-1*dp.c)[0] : null;
    }
    

    while(resolvedScanners.length < scans.length)
    {
        const allDeltas = getDeltas(resolvedBeacons);
        
        const scanner = getNextScanToReduce(allDeltas);
        console.log(`Resolving ${scanner}`);

        let log = false

        let resolved = false;
        const orientationMatches = getDeltaMatchesByOrientation(allDeltas,deltas[scanner]);
        for(let o=0;!resolved && o<orientationMatches.length;o++){
            const orientation = orientationMatches[o];
            const scannerOrientation = orientations[orientation.o];
            const reorientedBeacons = reorientCoordinates(scans[scanner],scannerOrientation);
            const beaconMappings = getBeaconMappings(reorientedBeacons, allDeltas,);
            const scannerPosition = getScannerPosition(beaconMappings, log);
            if(!!scannerPosition){
                _.forEach(reorientedBeacons, b => {
                    const rb = redirectBeaconAndOffset(b,scannerPosition.p,scannerPosition.d);
                    if(!_.find(resolvedBeacons,b=>areCoordsEqual(b,rb))){
                        resolvedBeacons.push(rb);
                    }
                });
                resolvedScanners.push({s:scanner,d:scannerPosition.d,p:scannerPosition.p,o:scannerOrientation});
                
                resolved = true;
            }
        }

        if(!resolved){
            resolvedScanners.push({s:scanner,p:{x:0,y:0,z:0},o:orientations[0],d:directions[0]});
        }

        console.log(`After reducing scanner ${scanner}, there are now ${resolvedBeacons.length} beacons.`);
    }

    const scannerDeltas = getDeltas(resolvedScanners.map(s=>s.p),true);
    const byMD = _.orderBy(scannerDeltas, d=>_.sum(d.d));
    const farthest = byMD[byMD.length-1];
    const from = resolvedScanners[farthest.a].p;
    const to = resolvedScanners[farthest.b].p;
    console.log(`Largest Manhattan Distance: ${_.sum(farthest.d)} (from ${[from.x,from.y,from.z]} to ${[to.x,to.y,to.z]})`);
}

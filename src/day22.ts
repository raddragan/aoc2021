import * as fs from 'fs';
import _ from 'lodash';

type range = [number,number];
type block = {x:range,y:range,z:range};

const reduceRanges = (sorted:range[]): range[] => {
    for(let i=0;i<sorted.length-1;i++)
    {
        const reduced = reduceTwo(sorted[i],sorted[i+1]);
        if(reduced.length === 1)
            return reduceRanges(_.take(sorted,i).concat(reduced).concat(_.slice(sorted,i+2)));
    }
    
    return sorted;
} 

const reduceTwo = (a: range, b: range):range[] => {
    if(b[0]<=a[1])
        return [[a[0],_.max([a[1],b[1]])!]];
    return [a,b];
}

export const run = () => {
    const instructions = fs.readFileSync('./src/day22.txt','utf8').split('\r\n')
        .map(s=>s.split(' ') as ['on'|'off',string])
        .map(s=>{return {op:s[0],r:s[1].split(',').map(i=>_.sortBy(i.substring(2).split('..').map(j=>parseInt(j)))as range) as range[]};})
        .map(s=>{return {op:s.op,r:{x:s.r[0],y:s.r[1],z:s.r[2]}}});

    let initialization = 0;

        for(let x=-50; x<=50; x++)
        {
            const xInstructions = instructions.filter(i=>i.r.x[0] <= x && i.r.x[1] >= x);
            if(xInstructions.length === 0) continue;

                for(let y=-50; y<=50; y++)
                {
                    const yInstructions = xInstructions.filter(i=>i.r.y[0] <= y && i.r.y[1] >= y);
                    if(yInstructions.length === 0) continue;

                    for(let z=-50; z<=50; z++)
                    {
                        const zInstructions = yInstructions.filter(i=>i.r.z[0] <= z && i.r.z[1] >= z);
                        if(zInstructions.length === 0) continue;
                        if(zInstructions[zInstructions.length-1].op === 'on')
                        {
                            initialization++;
                        }
                    }
                }
        }

    console.log(`initialization:${initialization}`);

    const getArea = (a:block) => {
        return ((a.x[1]-a.x[0])+1)*((a.y[1]-a.y[0])+1)*((a.z[1]-a.z[0])+1);
    }
    const getPoints = (b:block) => {
        const points:[number,number,number][] = [];
        for(let x=b.x[0];x<=b.x[1];x++)
        for(let y=b.y[0];y<=b.y[1];y++)
        for(let z=b.z[0];z<=b.z[1];z++)
        points.push([x,y,z]);
        return points;
    }

    // [10,12],[11,13] => [11,12]
    const rangeIntersect = (r1: range, r2:range): range | null => {
        const a = r1[0] < r2[0] ? r1 : r2;
        const b = r1[0] < r2[0] ? r2 : r1;
        if(b[0] <= a[1])
            return [b[0],_.min([a[1],b[1]])!];
        return null;
    }

    // because this is called from the intersect logic, (a[0] === b[0] || a[1] == b[1] || (a[0] < b[0] && b[1] < a[1]) will always be true
    // [1,5],[1,3] => [1,3],[4,5]
    // [1,5],[1,5] => [1,5]
    // [1,5],[3,5] => [1,2],[3,5]
    // [1,5]
    const rangeSplit = (a:range, b:range): range[] => {
        if(a[0] === b[0])
        {
            if(b[1] < a[1])
                return [[b[0],b[1]],[b[1]+1,a[1]]];
            else if(b[1] === a[1])
                return [a];
        }else if(a[1] === b[1])
            return [[a[0],b[0]-1],[b[0],a[1]]];
        else
            return [[a[0],b[0]-1],[b[0],b[1]],[b[1]+1,a[1]]];
        return [a];
    }

    /// removes b from a, making space for it
    const removeFromBlock = (a:block, b:block): block[] | null => {
        const xIntersect = rangeIntersect(a.x,b.x);
        if(!xIntersect) return null;
        const yIntersect = rangeIntersect(a.y,b.y);
        if(!yIntersect) return null;
        const zIntersect = rangeIntersect(a.z,b.z);
        if(!zIntersect) return null;

        const intersect:block={x:xIntersect,y:yIntersect,z:zIntersect};
        if(_.isEqual(a,intersect))
            return [];
        
        const xRanges = rangeSplit(a.x,intersect.x);
        const yRanges = rangeSplit(a.y,intersect.y);
        const zRanges = rangeSplit(a.z,intersect.z);
        const blocks = _.flatMap(xRanges, x=> _.flatMap(yRanges, y=>zRanges.map(z=>{return {x:x,y:y,z:z} as block})));
        return blocks.filter(b=>!_.isEqual(b,intersect));
    }

    const removeFromBlocks = (a:block, blocks:block[]): block[] => {
        for(let i=0;i<blocks.length;i++){
            const inter = removeFromBlock(blocks[i],a);
            if(inter !== null){
                return _.take(blocks,i).concat(inter).concat(removeFromBlocks(a,_.slice(blocks,i+1)))
            }
        }
        return blocks;
    }

    let onBlocks: block[] = [];
    for(let i=0;i<instructions.length;i++)
    {
        const ins = instructions[i];
        if(ins.op === 'on'){
            onBlocks = removeFromBlocks(ins.r,onBlocks).concat([ins.r]);
        }else{
            onBlocks = removeFromBlocks(ins.r,onBlocks);
        }

        console.log(`pass ${i+1}, totalArea: ${_.sum(onBlocks.map(b=>getArea(b)))}`)
    }

    // console.log(onBlocks.length);
    // const pointsByBlock = onBlocks.map(b=>getPoints(b));
    // console.log(pointsByBlock);

    // const allPoints = _.flatten(pointsByBlock);
    // console.log(allPoints.length);
    // const uniquePoints = _.uniqBy(allPoints,p=>p.join(','))
    // console.log(`unique ${uniquePoints.length}`);
}
import * as fs from 'fs';
import _ from 'lodash';

interface coord {x:number,y:number};
interface bounds {min:coord,max:coord};

const isLit = (a:coord, c:coord[]) => {
    for(let i=0;i<c.length;i++){
        const b = c[i];
        if(b.x === a.x && b.y === a.y)
            return 1;
    }
    return 0;
}

const getBounds = (cs:coord[]) : bounds => {
    return {min:{x:_.min(cs.map(c=>c.x))!,y:_.min(cs.map(c=>c.y))!},max:{x:_.max(cs.map(c=>c.x))!,y:_.max(cs.map(c=>c.y))!}}
}

const fromBinary = (b:(0|1)[]) =>{
    return _.sum(b.map((v,i)=> v*(2**((b.length-1)-i))));
}

const print = (lit:coord[]) => {
    const bounds = getBounds(lit);
    console.log(bounds);
    for(let y=bounds.max.y;y>=bounds.min.y;y--)
    {
        const line:string[] = [];
        for(let x=bounds.min.x;x<=bounds.max.x;x++)
            isLit({x,y},lit) ? line.push('#') : line.push('.');
        console.log(line.join(''));
    }
    console.log(`${lit.length} pixels are lit`);
}

export const run = () => {
    const file = fs.readFileSync('./src/day20.txt','utf8').split('\r\n');
    const instructions = file.shift()!.split('').map(s=>s==='#');
    console.log(instructions.length);
    file.shift();
    
    const initial:coord[] = [];
    for(let y=0;y<file.length;y++)
    {
        const line = file[(file.length-y)-1];
        for(let x=0;x<line.length;x++)
        {
            if(line[x] === '#')
                initial.push({x,y});
        }
    }

    const isOutOfBounds = (c:coord,b:bounds) => {
        return c.x >= b.max.x || c.x <= b.min.x || c.y >= b.max.y || c.y <= b.min.y;
    }

    const render = (image:coord[],r:number) => {
        const newImage:coord[] = [];
        const bounds = getBounds(image);
        bounds.min.x-=1;
        bounds.max.x+=1;
        bounds.min.y-=1;
        bounds.max.y+=1;

        for(let y=bounds.min.y;y<=bounds.max.y;y++)
        {
            for(let x=bounds.min.x;x<=bounds.max.x;x++)
            {
                var binary:(0|1)[] = [];
                for(let by=y+1;by>=y-1;by--){
                    for(let bx=x-1;bx<=x+1;bx++){
                        if(isOutOfBounds({x:bx,y:by},bounds))
                            binary.push((instructions[0] && (((r-1)%2)==1)) ? 1:0);
                        else
                            binary.push(isLit({x:bx,y:by},image));
                    }
                }
                instructions[fromBinary(binary)] && newImage.push({x,y});
            }
        }

        return newImage;
    }

    const renderX = (image: coord[], times:number):coord[] => {
        let rendered = [...image];
        for(let r=1;r<=times; r++)
        {
            console.log(`render ${r}`);
            rendered= render(rendered,r);
        }
        return rendered;
    }
    
    print(renderX(initial,2));
    // good things come to those who wait
    print(renderX(initial,50));
}
import * as fs from 'fs';
import _ from 'lodash';

type space = '>'|'v'|'.';

export const run = () => {
    const map = fs.readFileSync('./src/day25.txt','utf8').split('\r\n').map(s=>s.split('') as space[]);
    const height = map.length;
    const width = map[0].length;

    let xMoves: [number, number, number][] = [];
    let yMoves: [number, number, number][] = [];
    let step=0;

    while(step=== 0 || (xMoves.length + yMoves.length) > 0)
    {
        step++;
        xMoves = [];
        yMoves = [];

        for(let y=0; y<height; y++)
        {
            for(let x=0; x<width; x++)
            {
                if(map[y][x] !== '>')
                    continue;
                const newX = (x+1)%width;
                if(map[y][newX] === '.')
                    xMoves.push([y,x,newX]);
            }
        }

        _.forEach(xMoves, xMove => {
            map[xMove[0]][xMove[1]] = '.';
            map[xMove[0]][xMove[2]] = '>';
        })
        
        for(let y=0; y<height; y++)
        {
            for(let x=0; x<width; x++)
            {
                if(map[y][x] !== 'v')
                    continue;
                const newY = (y+1)%height;
                if(map[newY][x] === '.')
                    yMoves.push([x,y,newY]);
            }
        }
        
        _.forEach(yMoves, yMove => {
            map[yMove[1]][yMove[0]] = '.';
            map[yMove[2]][yMove[0]] = 'v';
        })
    }

    console.log(`step ${step}`);
    // for(let y=0; y<height; y++)
    //     console.log(map[y].join(''));
    console.log('');
}
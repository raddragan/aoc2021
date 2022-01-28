import * as fs from 'fs';
import _ from 'lodash';

export const day01 = () => {
    const input = fs.readFileSync('./src/day01.txt','utf8').split('\r\n').map(i=>parseInt(i));
    
    const increases = input.filter((v,i) => i>0 && v>input[i-1]);

    console.log(`increases ${increases.length}`)
    
    const groupIncreases = input.filter((v,i) => i>2 && v>input[i-3]);

    console.log(`group increases ${groupIncreases.length}`)
}

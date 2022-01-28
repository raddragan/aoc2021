import * as fs from 'fs';
import _ from 'lodash';

type direction = 'forward'|'up'|'down';

export const run = () => {
    const input = fs.readFileSync('./src/day02.txt','utf8').split('\r\n').map(s=>s.split(' ')).map(s=>[s[0], parseInt(s[1])] as [direction, number]);
    
    let height = _.sum(input.filter(c => c[0] === 'down').map(c=>c[1])) - _.sum(input.filter(c => c[0] === 'up').map(c=>c[1]));
    let forward = _.sum(input.filter(c => c[0] === 'forward').map(c=>c[1]))

    console.log(`height ${height}`);
    console.log(`forward ${forward}`);
    console.log(`multiplied ${height * forward}`);

    let aim = 0;
    height = 0;
    forward = 0;
    _.forEach(input, d => {
        switch(d[0])
        {
            case 'down':
                aim+=d[1];
            break;
            case 'up':
                aim-=d[1];
            break;
            case 'forward':
                forward+=d[1];
                height+=aim*d[1];
            break;
        }
    });

    console.log(`height ${height}`);
    console.log(`forward ${forward}`);
    console.log(`multiplied ${height * forward}`);
}

import * as fs from 'fs';
import _, { Dictionary } from 'lodash';

export const day14 = () => {
    const input = fs.readFileSync('./src/day14.txt','utf8').split('\r\n');
    let template = input.shift()!;
    input.shift();
    
    const rules = _.fromPairs(_.map(input, r => [r.substr(0,2),[(r[0]+r[6]),(r[6]+r[1])]]));

    let pairs = _.map(_.take(template, template.length-1), (t,i) => t+template[i+1]);
    const uniquePairs = _.uniq(pairs);
    let pairCount = _.fromPairs(uniquePairs.map(u=>[u,(_.filter(pairs,p=>p===u).length)] as [string,number]));
    console.log(pairCount);

    for(let step=1; step <= 40; step++)
    {
        const newPairCount: Dictionary<number> = {};

        _.forEach(_.toPairs(pairCount), (p) => {
        
            const newPairs = rules[p[0]];
            if(!!newPairs){
                newPairCount[newPairs[0]] = p[1] + (newPairCount[newPairs[0]] || 0);
                newPairCount[newPairs[1]] = p[1] + (newPairCount[newPairs[1]] || 0);
            }else
            {
                newPairCount[p[0]] = p[1] + (newPairCount[p[0]] || 0);
            }
        }); 

        pairCount = newPairCount; 
        console.log(`Step ${step}:`);
    }

    const pairCountAsPairs = _.toPairs(pairCount);
    console.log(pairCountAsPairs);

    const uniqueChars = _.uniq(_.flatten(pairCountAsPairs.map(p=>[p[0][0],p[0][1]])));
    console.log(uniqueChars);

    var charCount = _.map(uniqueChars, c=>[c,_.sumBy(pairCountAsPairs.filter(p=>p[0][0]===c),p=>p[1])] as [string, number]);
    _.forEach(charCount, (c) => {
        if(c[0] === template[template.length -1])
            c[1] = c[1] + 1;
    });
    console.log(charCount);

    var max = _.maxBy(charCount,c=>c[1])![1];
    var min = _.minBy(charCount,c=>c[1])![1];
    console.log(`${max} - ${min} = ${(max-min).toString()}`);
}

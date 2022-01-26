import _ from "lodash";

const getXVelocity = (initial:number, iteration:number) => 
    (iteration > initial ? 0 : initial - iteration);

const getYVelocity = (initial:number, iteration:number) => 
    initial + (iteration * -1);

export const day17 = () => {
    //const targetXMin = 20, targetXMax = 30, targetYMin=-10, targetYMax=-5;
    const targetXMin = 81, targetXMax = 129, targetYMin=-150, targetYMax=-108;

    const hitsByX: [number, number[]][] = [];
    const foreversByX: [number,number][] = [];
    for(let initialX = 1;initialX<=targetXMax;initialX+=1)
    {
        let t = 0;
        let experimentCompleted = false;
        let currentX = 0;
        const hits: number[] = [];
        while(!experimentCompleted)
        {
            const nextX = currentX + getXVelocity(initialX, t);
            if(nextX >= targetXMin && nextX <= targetXMax){
                if(nextX === currentX)
                    foreversByX.push([initialX,t-1]);
                else
                    hits.push(t);
            }
            if(nextX > targetXMax)
                experimentCompleted = true;
            if(nextX === currentX)
                experimentCompleted = true;
            currentX = nextX;
            t++;
        }
        if(hits.length > 0)
            hitsByX.push([initialX, hits]);
    }
    console.log(hitsByX);
    console.log('forevers:');
    console.log(foreversByX);

    const hitsByY: [number, number[]][] = [];
    for(let initialY = targetYMin;initialY<=-1*targetYMin;initialY+=1)
    {
        let t = 0;
        let experimentCompleted = false;
        let logged0 = true;
        let currentY = 0;
        const hits: number[] = [];
        while(!experimentCompleted)
        {
            const nextY = currentY + getYVelocity(initialY, t);
            if(nextY >= targetYMin && nextY <= targetYMax)
                hits.push(t);
            if(nextY<= 0 && !logged0){
                console.log(`${initialY} reached ${nextY} after ${t}`);
                logged0 = true;
            }
            if(nextY < targetYMin){
                experimentCompleted = true;
                //console.log(`${initialY} out of bounds at ${nextY} after ${t}`);
            }
            currentY = nextY;
            t++;
        }
        if(hits.length > 0)
            hitsByY.push([initialY, hits]);
    }

    console.log(hitsByY);

    const velocities: [number, number][] = [];

    for(let iY = hitsByY.length-1; iY >= 0; iY--)
    {
        const initialY = hitsByY[iY][0];
        const yHits = hitsByY[iY][1];

        _.forEach(foreversByX.filter(fbx=> yHits.filter(h=>fbx[1]<=h).length > 0), 
            matchForever =>
                velocities.push([matchForever[0], initialY])
        );

        for(let iX = 0; iX < hitsByX.length; iX++)
        {
            const initialX = hitsByX[iX][0];
            const xHits = hitsByX[iX][1];

            const intersect = _.intersection(yHits, xHits);
            if(intersect.length > 0){
                if(velocities.filter(v=>v[0] == initialX && v[1] == initialY).length === 0)
                    velocities.push([initialX,initialY]);
            }
        }
    }

    console.log(`Found ${velocities.length} velocities`);
    console.log(velocities);

    const finalAnswerY = velocities[0][1];

    if(finalAnswerY%2 === 0){
        const height = (finalAnswerY+1)*(finalAnswerY/2);
        console.log(`Height ${height}`);
    }else
    {
        const middle = (finalAnswerY+1)/2;
        const height = middle*(middle-1)*2 + middle;
        console.log(`Height ${height}`);
    }
}
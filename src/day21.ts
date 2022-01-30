import _ from "lodash";

export const run = () => {
    const isSample=false;
    const boardSize = 10;
    const startingPositions=[(isSample?4:8),(isSample?8:1)];

    const getNewPosition = (current: number, roll: number) => {
        const newPosition = (current+roll) % boardSize;
        return newPosition === 0 ? boardSize : newPosition;
    }

    const partOne = () => {
        let dieValue = 0;
        let dieRolls = 0;
        const winAt=1000;
        const dieSize = 100;
        let scores=[0,0];
        let positions=[...startingPositions];

        const nextDieRoll=()=>{
            dieRolls++;
            dieValue+=1;
            if(dieValue>dieSize)
                dieValue = dieValue % dieSize;
            return dieValue;
        }
    
        const takeTurns = () => {
            while(true){
                for(let i=0;i<2;i++){
                    const roll = nextDieRoll()+nextDieRoll()+nextDieRoll();
                    const newPosition = getNewPosition(positions[i],roll)
                    positions[i] = newPosition;
                    scores[i]+=newPosition;
                    // console.log(`Player ${i+1} rolls ${roll} and moves to space ${newPosition} for a total score of ${scores[i]}.`)
                    if(scores[i]>=winAt)
                        return;
                }
            }
        }
        takeTurns();

        console.log(`${scores[0]} and ${scores[1]} after ${dieRolls} rolls`);
        const losingScore = _.min(scores)!;
        console.log(`${losingScore} * ${dieRolls} = ${losingScore*dieRolls}`);
    }
    partOne();

    const partTwo = () => {
        const possibleDieOutcomes = _.range(3,10); //3..9
        const frequencies = [1, 3, 6, 7, 6, 3, 1]; //3 will occur once; 4 will occur 3 times; ... 9 will occur once
        const winAt=21;

        interface turnState {p:number,s:number,c:number} // [position,score,count,turns];
        interface turnOutcome {t:number, sc:{s:number, c:number}[]}; //[turns,{score,count}[]]
        
        const nextTurnOutcomes = (s: turnState): turnState[] => {
            return possibleDieOutcomes.map((r,i)=> {
                const np = getNewPosition(s.p,r);
                return {p:np,s:s.s+np,c:s.c*frequencies[i]} as turnState;
            })
        }

        const getOutcomes = (startingPosition: number) => {
            const outcomes:turnOutcome[] = [];
            let activeStates:turnState[] = [{p:startingPosition,s:0,c:1}];
            let turn=0;
            while(activeStates.length>0)
            {
                turn+=1;
                const newStates = activeStates.flatMap(s=>nextTurnOutcomes(s));
                activeStates = [];
                const turnOutcomes:turnOutcome = {t:turn,sc:[]};
                _.forEach(newStates,s=>{
                    if(s.s<winAt)
                        activeStates.push(s);
                    const sci = _.findIndex(turnOutcomes.sc,sc=>sc.s === s.s);
                    if(sci>=0)
                        turnOutcomes.sc[sci].c+=s.c;
                    else
                        turnOutcomes.sc.push({s:s.s,c:s.c});
                })
                outcomes.push(turnOutcomes);
            }
            return outcomes;
        }

        const player1Outcomes = getOutcomes(startingPositions[0]);
        console.log(player1Outcomes);
        const player2Outcomes = getOutcomes(startingPositions[1]);
        console.log(player2Outcomes);

        let player1Wins = 0;
        _.forEach(player1Outcomes, o1=> {
            player1Wins += _.sum(o1.sc.filter(sc=>sc.s >= winAt).map(sc=>sc.c)) * _.sum(player2Outcomes.filter(o2=>o2.t===(o1.t-1)).map(o2=>_.sum(o2.sc.filter(sc2=>sc2.s<winAt).map(sc2=>sc2.c))));
        })
        console.log(`Player 1 wins ${player1Wins}`);

        let player2Wins = 0;
        _.forEach(player2Outcomes, o2=> {
            player2Wins += _.sum(o2.sc.filter(sc2=>sc2.s >= winAt).map(sc2=>sc2.c)) * _.sum(player1Outcomes.filter(o1=>o1.t===(o2.t)).map(o1=>_.sum(o1.sc.filter(sc1=>sc1.s<winAt).map(sc1=>sc1.c))));
        })
        console.log(`Player 2 wins ${player2Wins}`);
    };
    partTwo();
}
import * as fs from 'fs';
import _ from 'lodash';

type op = 'add'|'mul'|'div'|'mod'|'eql';
type opInstruction = [op,'w'|'x'|'y'|'z',string];
type inInstruction = ['inp',string];
interface condition {var:string, expression:string, func:Function};
type formula = {[index:string]: string};
interface program {condition?:condition, pass:formula; passFunc?:Function, fail?:formula, failFunc?: Function}

const isNum = (val:string) => !!val.match(/^[\-]?\d+$/);

const createCondition = (variable:string, hasPreviousOutput: boolean, expression:string) : condition => {
    const functionArgs = (!hasPreviousOutput ? [variable] : [variable, `_p_z`]).concat(`return ${expression};`);
    const condition:condition = {var:variable, expression:expression, func: new Function(...functionArgs)};
    return condition;
}

const formulate = (ins: opInstruction, formula: formula, hasPreviousOutput:boolean) : [condition, formula] | null => {
    const out = ins[1];
    const src = ins[2];
    const srcValue = (isNum(src)) ? src : formula[src];

    switch(ins[0])
    {
        case 'add':
            if (formula[out] === '0') 
                formula[out] = srcValue;
            else if(srcValue === '0')
                formula[out] = formula[out];
            else{
                if(!!isNum(formula[out]) && !!isNum(srcValue))
                    formula[out] = `${parseInt(formula[out])+parseInt(srcValue)}`;
                else if(!!isNum(formula[out]) && formula[out].startsWith('-'))
                    formula[out] = `(${srcValue}${formula[out]})`;
                else if(!!isNum(srcValue) && srcValue.startsWith('-'))
                    formula[out] = `(${formula[out]}${srcValue})`;
                else
                    formula[out] = `(${formula[out]}+${srcValue})`;
            }
            break;
        case 'div':
            if (formula[out] === '0') 
                formula[out] = '0';
            else if(srcValue === '1')
                formula[out] = formula[out];
            else
                formula[out] = `Math.floor(${formula[out]}/${srcValue})`;
            break;
        case 'eql':
            if(src === 'w' && isNum(formula[out]) && formula[out].length > 1)
                formula[out] = `0`;
            else if(src === 'w' && formula[out] === '0')
                formula[out] = `0`;
            else if(srcValue === formula[out])
                formula[out] = '1';
            else if(isNum(formula[out]) && isNum(srcValue))
                formula[out] = formula[out] === srcValue ? '1' : '0';
            else{
                const condition = createCondition(srcValue, hasPreviousOutput, `${srcValue} === (${formula[out]})`);

                const formulaIfFalse = _.cloneDeep(formula);
                formulaIfFalse[out] = '0';
                formula[out] = '1';
                
                return [condition, formulaIfFalse];
            }
            break;
        case 'mod':
            if (formula[out] === '0') 
                formula[out] = '0';
            else
                formula[out] = `(${formula[out]}%${srcValue})`;
            break;
        case 'mul':
            if (formula[out] === '0' || srcValue === '0') 
                formula[out] = '0';
            else if(formula[out] === '1')
                formula[out] = srcValue;
            else if(srcValue === '1')
                formula[out] = formula[out];
            else
                formula[out] = `${formula[out]}*${srcValue}`;
            break;
    }

    return null;
}

export const run = () => {
    const instructions = fs.readFileSync('./src/day24.txt','utf8').split('\r\n').map(s=>s.split(' ') as opInstruction | inInstruction);

    let programs: {[index:string]:program} = {};
    let programVar = '';
    _.forEach(instructions, (instruction, index) => {
        if(instruction[0] === 'inp'){
            programVar = programVar === '' ? 'a' : String.fromCharCode(programVar.charCodeAt(0)+1);
            if(programVar === 'a'){
                programs[programVar] = {pass: {'w':`_${programVar}`, 'x':`0`, 'y':`0`, 'z':`0`} };
            }else{
                programs[programVar] = {pass: {'w':`_${programVar}`, 'x':`_p_x`, 'y':`_p_y`, 'z':`_p_z`} };
            }
        } else {
            const program = programs[programVar];
            const splitFormula = formulate(instruction as opInstruction, program.pass, programVar !== 'a');
            if(!!splitFormula)
            {
                if(!!program.condition)
                    console.log(`We got a problem with ${program}`);
                program.condition = splitFormula[0];
                program.fail = splitFormula[1];
            }else if(!!program.fail)
            {
                const splitFormulaFail = formulate(instruction as opInstruction, program.fail, programVar !== 'a');
                if(!!splitFormulaFail)
                    console.log(`We got a REAL problem with ${program}`);
            }
        }
    });

    _.forEach(programs, (program,programVar) => {
        const funcParams = programVar === 'a' ? [`_${programVar}`] : [`_${programVar}`, `_p_z`];
        const passFunctionArgs = funcParams.concat(`return ${program.pass.z};`);
        program.passFunc = new Function(...passFunctionArgs);

        if(!!program.fail)
        {
            const failFunctionArgs = funcParams.concat(`return ${program.fail.z};`);
            program.failFunc = new Function(...failFunctionArgs);
        }
    });

    console.log(_.values(programs).map(g=>[g.condition?.expression, g.pass.z, g.fail?.z]));

    // once analyzed the above, the below can be formulated, based on whether the condition for each program can or should pass or fail;

    const successes: string[] = [];

    for(let a=1;a<10;a++)
    {
        const aResult = programs['a'].passFunc!(a);
        for(let b=1;b<10;b++)
        {
            const bResult = programs['b'].failFunc!(b,aResult);
            for(let c=1;c<10;c++)
            {
                const cResult = programs['c'].failFunc!(c,bResult);
                for(let d=1;d<10;d++)
                {
                    const dResult = programs['d'].failFunc!(d,cResult);
                    for(let e=1;e<10;e++)
                    {
                        if(!programs['e'].condition!.func(e,dResult))
                            continue;
                        const eResult = programs['e'].passFunc!(e,dResult);
                        for(let f=1;f<10;f++)
                        {
                            const fResult = programs['f'].failFunc!(f,eResult);
                            for(let g=1;g<10;g++)
                            {
                                if(!programs['g'].condition!.func(g,fResult))
                                    continue;
                                const gResult = programs['g'].passFunc!(g,fResult);
                                for(let h=1;h<10;h++)
                                {
                                    const hResult = programs['h'].failFunc!(h,gResult);
                                    for(let i=1;i<10;i++)
                                    {
                                        if(!programs['i'].condition!.func(i,hResult))
                                            continue;
                                        const iResult = programs['i'].passFunc!(i,hResult);
                                        for(let j=1;j<10;j++)
                                        {
                                            if(!programs['j'].condition!.func(j,iResult))
                                                continue;
                                            const jResult = programs['j'].passFunc!(j,iResult);
                                            for(let k=1;k<10;k++)
                                            {
                                                const kResult = programs['k'].failFunc!(k,jResult);
                                                for(let l=1;l<10;l++)
                                                {
                                                    if(!programs['l'].condition!.func(l,kResult))
                                                        continue;
                                                    const lResult = programs['l'].passFunc!(l,kResult);
                                                    for(let m=1;m<10;m++)
                                                    {
                                                        if(!programs['m'].condition!.func(m,lResult))
                                                            continue;
                                                        const mResult = programs['m'].passFunc!(m,lResult);
                                                        for(let n=1;n<10;n++)
                                                        {
                                                            if(!programs['n'].condition!.func(n,mResult))
                                                                continue;
                                                            const nResult = programs['n'].passFunc!(n,mResult);
                                                            if(nResult === 0)
                                                                successes.push([a,b,c,d,e,f,g,h,i,j,k,l,m,n].join(''));
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    console.log(successes.length);
    console.log(successes[0]);
    console.log(successes[successes.length-1]);
}
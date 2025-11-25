const N=5000;
let zoom=1.3;
function generatePoints(){
    inst=new Array();
    for(let k=0; k<2400000; ++k){
        const c=new Float32Array(2);
        c[0]=(2*Math.random()-1)*zoom+camera[0];
        c[1]=(2*Math.random()-1)*zoom+camera[1];
        const z=new Array(0,0);
        for(let i=0; i<N; ++i){
            let x=z[2*i];
            let y=z[2*i+1];
            let wx=x*x-y*y+c[0];
            let wy=2*x*y+c[1];
            if((wx-x)*(wx-x)+(wy-y)*(wy-y)<0.0001){
                break;
            }
            z[2*i+2]=wx;
            z[2*i+3]=wy;
            if(wx*wx+wy*wy>4){
                for(let k=0; k<z.length/2; ++k){
                    const viewx=(z[2*k]-camera[0])/zoom;
const viewy=(z[2*k+1]-camera[1])/zoom;
                if(-1<viewx && viewx<1 && -1<viewy && viewy<1){
                //発散した。
                inst.push(k/N);
                inst.push(viewx);
                inst.push(viewy);
                }
                }
                break;
            }
        }
    }
}
async function draw(){
    if(!gpuinitialized){
        await init();
    }
    generatePoints();
    render();
}
draw();
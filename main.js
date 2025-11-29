const N=5000;
let zoom=1.3;
let exports;
WebAssembly.instantiateStreaming(fetch("mandelbrot.wasm"),{}).then((obj)=>{
    exports=obj.instance.exports;
    draw();
});
let r=screen.height/2;
function generatePoints(){
    canvas.width=r;
    canvas.height=r;
    inst=[];
    for(let x=0; x<r; ++x){
    for(let y=0; y<r; ++y){
        const len=exports.mandelbrot(x/r*2-1,y/r*2-1,N);
        inst.push(...new Float32Array(exports.mem.buffer,0,len));
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
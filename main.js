const N=5000;
let zoom=1.3;
let exports;
WebAssembly.instantiateStreaming(fetch("mandelbrot.wasm"),{}).then((obj)=>{
    exports=obj.instance.exports;
    draw();
});
function generatePoints(){
    inst=[];
    for(let k=0; k<1200000; ++k){
        const len=exports.mandelbrot(Math.random()*2-1,Math.random()*2-1,N);
        inst.push(...new Float32Array(exports.mem.buffer,0,len));
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
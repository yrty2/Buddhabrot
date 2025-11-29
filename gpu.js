const size=0.001;
let inst=new Array();
let camera=new Float32Array([-0.25,0]);
const canvas=document.querySelector(".canvas");
var g_device,g_adapter,presentationFormat,context,WGSL;
var gpuinitialized=false;
async function init(){
    gpuinitialized=true;
// webgpuコンテキストの取得
context = canvas.getContext('webgpu');
// deviceの取得
g_adapter = await navigator.gpu.requestAdapter();
g_device = await g_adapter.requestDevice();
//デバイスを割り当て
presentationFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device: g_device,
  format: presentationFormat,
  alphaMode: 'premultiplied'
});
WGSL=`
struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragColor : vec4<f32>
}
fn hsl2rgb(h:f32,s:f32,l:f32)->vec3<f32>{
        let H:f32=(h%360)/60;
        let C:f32=(1-abs(2*l-1))*s;
        let X:f32=C*(1-abs(H%2-1));
        let m:f32=l-C/2;
        if(h<60){
            return vec3<f32>(m+C,m+X,m);
        }else if(h<120){
            return vec3<f32>(m+X,m+C,m);
        }else if(h<180){
            return vec3<f32>(m,m+C,m+X);
        }else if(h<240){
            return vec3<f32>(m,m+X,m+C);
        }else if(h<300){
            return vec3<f32>(m+X,m,m+C);
        }else{
            return vec3<f32>(m+C,m,m+X);
        }
}
@vertex
fn main(@location(0) position: vec3<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position=vec4<f32>(position.yz,0,1);
  output.fragColor=vec4<f32>(hsl2rgb(position.x+150,1,0.05),0.999);
  return output;
}
@fragment
fn fragmain(@location(0) fragColor: vec4<f32>) -> @location(0) vec4<f32> {
  return fragColor;
}
`;
}
function render(){
//頂点配列
// 頂点データを作成.
const verticesBuffer = g_device.createBuffer({
  size: 4*inst.length,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true,
});
new Float32Array(verticesBuffer.getMappedRange()).set(new Float32Array(inst));
verticesBuffer.unmap();

//レンダーパイプラインの設定
const pipeline = g_device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: g_device.createShaderModule({
      code: WGSL,
    }),
    entryPoint: 'main',
    buffers: [
      {
        arrayStride: 4*3,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
          }
        ],
      }
    ],
  },
  fragment: {
    module: g_device.createShaderModule({
      code: WGSL,
    }),
    entryPoint: 'fragmain',
    //canvasのフォーマットを指定
    targets: [
      {
        format: presentationFormat,
          blend: {
              color: {
                  operation: 'add',
                srcFactor: 'one',
                dstFactor: 'src-alpha'
              },
              alpha: {
                  operation: 'reverse-subtract',
                srcFactor: 'zero',
                dstFactor: 'src-alpha'
              },
            },
      }
    ]
  },
  primitive: {
    topology: 'point-list',
  }
});
//コマンドバッファの作成
const commandEncoder = g_device.createCommandEncoder();
//レンダーパスの設定
const textureView = context.getCurrentTexture().createView();
  const renderPassDescriptor= {
    colorAttachments: [
      {
        view: textureView,
        clearValue: {r:0,g:0,b:0,a:1},
        loadOp: 'clear',
        storeOp: 'store',
      },
    ]
  };
  //エンコーダー
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  passEncoder.setPipeline(pipeline);
  passEncoder.setVertexBuffer(0, verticesBuffer);
  passEncoder.draw(inst.length/3);
  passEncoder.end();
  g_device.queue.submit([commandEncoder.finish()]);
}
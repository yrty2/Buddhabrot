const size=0.001;
let inst=new Array();
let camera=new Float32Array([-0.25,0]);
const canvas=document.querySelector(".canvas");
canvas.width=screen.width;
canvas.height=screen.width;
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
struct Uniforms {
  camera : vec4<f32>
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;
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
fn main(@location(0) position: vec2<f32>,@location(1) iter: f32,@location(2) pos: vec2<f32>) -> VertexOutput {
  var output : VertexOutput;
  output.Position=vec4<f32>(pos.x+position.x,(pos.y+position.y)*uniforms.camera.z,0,1);
  output.fragColor=vec4<f32>(hsl2rgb(iter*720+20,1,0.1),0.9);
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
  size: 4*8,
  usage: GPUBufferUsage.VERTEX,
  mappedAtCreation: true,
});
    const s=size/2;
new Float32Array(verticesBuffer.getMappedRange()).set(new Float32Array([
    -s,-s,
    s,-s,
    -s,s,
    s,s
]));
verticesBuffer.unmap();

//インデックス配列
const quadIndexArray = new Uint16Array([0,1,2,2,1,3]);
const indicesBuffer = g_device.createBuffer({
  size: quadIndexArray.byteLength,
  usage: GPUBufferUsage.INDEX,
  mappedAtCreation: true,
});
//マップしたバッファデータをセット
new Uint16Array(indicesBuffer.getMappedRange()).set(quadIndexArray);
indicesBuffer.unmap();

//Uniformバッファ
const uniformBufferSize = 4*(4);
  const uniformBuffer = g_device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
var bufferPosition=0;
function bind(a){
const p=new Float32Array(a);
g_device.queue.writeBuffer(
  uniformBuffer,
  bufferPosition,
  p.buffer,
  p.byteOffset,
  p.byteLength
);
bufferPosition+=p.byteLength;
}
bind(camera);
bind([canvas.width/canvas.height,0]);

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
        arrayStride: 4*2,
        attributes: [
          {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x2',
          }
        ],
      },
        {//インスタンス
       	  arrayStride: 4*(1+2),
          stepMode: 'instance',
          attributes: [
            {
			  shaderLocation: 1,
              offset: 0,
              format: 'float32'
            },
            {
            shaderLocation: 2,
            offset: 4*(1),
            format: 'float32x2',
            }
          ]
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
    topology: 'triangle-list',
  }
});

//インスタンスバッファを作成
const instancePositions=new Float32Array(inst);
  const instancesBuffer = g_device.createBuffer({
    size: instancePositions.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true
  });
  new Float32Array(instancesBuffer.getMappedRange()).set(instancePositions);
  instancesBuffer.unmap();

//バインドグループを作成
const bindGroup = g_device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: {
        buffer: uniformBuffer,
      }
    }
  ]
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
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.setVertexBuffer(0, verticesBuffer);
  passEncoder.setIndexBuffer(indicesBuffer, 'uint16');
  passEncoder.setVertexBuffer(1, instancesBuffer);
  passEncoder.drawIndexed(quadIndexArray.length,Math.floor(instancePositions.length/(1+2)));
  passEncoder.end();
  g_device.queue.submit([commandEncoder.finish()]);
}
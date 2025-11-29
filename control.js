const keys={
    space:false,
    shift:false
}
function control(){
    var controling=false;
    /*if(keys.space){
        zoom*=1.1;
        controling=true;
    }
    if(keys.shift){
        zoom*=1/1.1;
        controling=true;
    }
    if(controling){
        draw();
    }*/
    requestAnimationFrame(control);
}
control();
/*window.addEventListener("keydown",e=>{
    e.preventDefault();
    if(e.code=="Space"){
        keys.space=true;
    }
    if(e.code=="ShiftLeft"){
        keys.shift=true;
    }
});
window.addEventListener("keyup",e=>{
    if(e.code=="Space"){
        keys.space=false;
    }
    if(e.code=="ShiftLeft"){
        keys.shift=false;
    }
});*/

var canvas;
var ctx;
var circlex = 250;
var circley = 350;
var deltay = 0;
var deltax = 0;
var keylist = []

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    document.onkeydown = (e) => {
        /*switch (e.code) {
            case "KeyW":
                deltay=-1;
                break;
            case "KeyS":
                deltay=+1;
                break;
            case "KeyA":
                deltax=-1;
                break;
            case "KeyD":
                deltax=+1;
                break;
        }*/
        if (!keylist.includes(e.code)) {
            keylist.push(e.code)
        }
    }
    document.onkeyup = (e) => {
        /*switch (e.code) {
            case "KeyW":
                deltay=0;
                break;
            case "KeyS":
                deltay=0;
                break;
            case "KeyA":
                deltax=0;
                break;
            case "KeyD":
                deltax=0;
                break;
        }*/
        ind = keylist.indexOf(e.code)
        if (keylist.includes(e.code)) {
            keylist.splice(ind)
        }
    }
    gameloop();
}

function render() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,500,500);

    ctx.fillStyle = "#bada55";
    ctx.fillRect(150, 150, 200, 200);
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillRect(350, 0, 150, 150);
    ctx.fillRect(0, 350, 150, 150);
    ctx.fillRect(350, 350, 150, 150);

    ctx.fillStyle = "hotpink";
    ctx.beginPath();
    ctx.arc(circlex, circley, 40, 0, Math.PI*2);
    ctx.fill();
}

function gameloop() {
    render();
    flytta();
    requestAnimationFrame(gameloop);
}
function flytta() {
    deltay=0;
    deltax=0;
    keylist.forEach( key => {
        switch (key) {
            case "KeyW":
                deltay += -1;
                break;
            case "KeyS":
                deltay += 1;
                break;
            case "KeyA":
                deltax += -1;
                break;
            case "KeyD":
                deltax += 1;
                break;
        }
    });
}
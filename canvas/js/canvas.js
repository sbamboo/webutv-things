var canvas;
var ctx;
var circlex = 250;

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    canvas.onmousemove = () => {
        circlex++;
    }

    setInterval(render, 30);
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
    ctx.arc(circlex, 350, 40, 0, Math.PI*2);
    ctx.fill();
}
var canvas;
var ctx;

// #region Defaults
const player_baseSpeed = 0.5;
const player_baseSprintSpeed = 1;
const player_baseRadius = 20;
const player_baseX = 250;
const player_baseY = 250;
const player_baseColor = "hotpink";
const player_baseDX = 0;
const player_baseDY = 0;
const player_baseFrictX = 0.97;
const player_baseFrictY = 0.97;
const player_baseGrav = 0.1;
const player_baseCollSub = 0.9;
var player_hasFriction = true;
var player_hasGravity = false;
var player_hasCollSub = true;

const enemy_baseSpeed = 0.5;
const enemy_baseRadius = 20;
const enemy_baseX = 250;
const enemy_baseY = 250;
const enemy_baseColor = "green";
const enemy_baseDX = 10;
const enemy_baseDY = 10;
const enemy_baseFrictX = 0.97;
const enemy_baseFrictY = 0.97;
const enemy_baseGrav = 0.1;
const enemy_baseCollSub = 0.9;
var enemy_hasFriction = false;
var enemy_hasGravity = false;
var enemy_hasCollSub = false;
// #endregion

var keylist = []
var circles = []

var max_x = 500;
var min_x = 0;
var max_y = 500;
var min_y = 0;

var dead = false;

// #region debug
// Function to draw text with diffrent colors on the same line
function drawText(ctx, segments, x, y, fontSize=30, font="Arial", roundTo=3) {
    ctx.font = `${fontSize}px ${font}`
    segments.forEach( segment => {
        var val = segment[0]
        bgColor = false;
        bgColor_color = "white";
        if (3 >= 0 && 3 < segment.length) {
            bgColor = true;
            bgColor_color = segment[3]
        } else if (2 >= 0 && 2 < segment.length) {
            if (segment[2] == true) {
                try {
                    val = val.toFixed(roundTo);
                } catch (error) {}
            }
        } 

        // Draw background color if provided
        if (bgColor) {
            ctx.fillStyle = bgColor_color;
            var textWidth = ctx.measureText(val).width;
            ctx.fillRect(x, y - fontSize + 5, textWidth, fontSize); // Adjust y position for better appearance
        }

        val = val.toString();
        val = val.replace(".00","");
        ctx.fillStyle = segment[1];
        ctx.fillText(val, x, y);
        x += ctx.measureText(val).width;
    });
}

// Function to cast a value to a datatype dynamicly
function castValue(value, dataType) {
    switch(dataType) {
        case 'string':
            return String(value);
        case 'number':
            return Number(value);
        case 'boolean':
            return Boolean(value);
        default:
            return value;
    }
}

// Function for the debugger to change a variables value (either global or object-property)
function chnGlob() {
    value = document.getElementById("ovv-cmd").value;
    parts = value.split(";");
    parts.forEach(value2 => {
        p = value2.split("=");
        cmd = p[0];
        val = p[1];
        dt = "number";
        if (val.includes(":")) {
            p2 = val.split(":");
            val = p2[0];
            dt = p2[1];
        }
        val = castValue(val, dt);
        if (cmd.includes(".")) {
            p3 = cmd.split(".");
            host = p3[0];
            property = p3[1];
            if (host.includes("%")) {
                p4 = host.split("%");
                host = p4[0];
                if (p4[1] == "*") {
                    ind = 0;
                    window[host].forEach( o => {
                        if (window[host][ind]) {
                            window[host][ind][property] = val;
                            console.log(`Attempted set of ${property} with value ${val} on ${host} at index ${ind}.`);
                        } else {
                            console.log(`Failed set of ${property} with value ${val} on ${host} at index ${ind}, object dosen't exist!`);
                        }
                        ind += 1;
                    });
                } else {
                    ind = parseInt(p4[1]);
                    if (window[host][ind]) {
                        window[host][ind][property] = val;
                        console.log(`Attempted set of ${property} with value ${val} on ${host} at index ${ind}.`);
                    } else {
                        console.log(`Failed set of ${property} with value ${val} on ${host} at index ${ind}, object dosen't exist!`);
                    }
                }
            } else {
                if (window[host]) {
                    window[host][property] = val;
                    console.log(`Attempted set of ${property} with value ${val} on ${host}.`);
                } else {
                    console.log(`Failed set of ${property} with value ${val} on ${host}, object dosen't exist!`);
                }
            }
        } else {
            window[cmd] = val;
            console.log(`Attempted set of ${cmd} with value ${val} on window/global.`);
        }
    });
}

var debug = new URLSearchParams(window.location.search).has("debug") // Grab bool for debug mode
// #endregion

// Main circle object for player and enemies
function circle(x,y,dx,dy,radie,speed,frictX,frictY,grav,collSub,hasFrict,hasGrav,hasCollSub, color, isPlayer=false) {
    // Asign variables to object
    this.isPlayer = isPlayer
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radie = radie;
    this.color = color;
    this.speed = speed;
    this.frictX = frictX;
    this.frictY = frictY;
    this.grav = grav;
    this.collSub = collSub;
    this.hasFrict = hasFrict;
    this.hasGrav = hasGrav;
    this.hasCollSub = hasCollSub
    // Draw method
    this.draw = (ctx) =>{
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x,this.y,radie,0, Math.PI*2);
        ctx.fill();
    }
    // Move method
    this.move = ()=>{
        // Apply gravity if enabled for object
        if (this.hasGrav == true) {
            this.dy += this.grav;
        }
        // Apply friction if enabled for object
        if (this.hasFrict == true) {
            this.dx *= this.frictX;
            this.dy *= this.frictY;
        }
        // SmalVal clamp the deltas
        if (this.dx<0.1 && this.dx>-0.1) {
            this.dx = 0;
        }
        if (this.dy<0.1 && this.dy>-0.1) {
            this.dy = 0;
        }

        // Clamp x to inside canvas
        tempXleft = this.x + this.dx - this.radie;
        tempXright = this.x + this.dx + this.radie;

        safeRight = max_x - this.radie - 1;
        safeLeft = min_x + this.radie + 1;

        if(tempXleft<min_x || tempXright>max_x){
            this.x = tempXleft<min_x?safeLeft+tempXleft*-1:safeRight-(max_x-tempXright);
            // If collisionSubstract is enabled for object do that aswell as inverting the delta
            if (this.hasCollSub == true) {
                this.dx *= -this.collSub;
            } else {
                this.dx *= -1;
            }
        }
        else{
            this.x += this.dx * this.speed;
        }
    
        // Clamp y to inside canvas
        tempYlow = this.y + this.dy + radie;
        tempYupp = this.y + this.dy - radie;

        safeLower = max_y - radie - 1;
        safeUpper = min_y + radie + 1;

        if(tempYupp<min_y || tempYlow>max_y){
            this.y = tempYupp<min_y?safeUpper+tempYupp*-1:safeLower-(max_y-tempYlow);
            // If collisionSubstract is enabled for object do that aswell as inverting the delta
            if (this.hasCollSub == true) {
                this.dy *= -this.collSub;
            } else {
                this.dy *= -1;
            }
        }
        else{
            this.y += this.dy;
        }
    }
    // CollisionChecker method
    this.checkCollisionCirc = (circleObj) => {
        xval = this.x - circleObj.x;
        yval = this.y - circleObj.y;
        dist = Math.sqrt( xval*xval + yval*yval ); // a^2+b^2=c^2
        if (this.radie + circleObj.radie > dist) {
            return true;
        }
        return false;
    }
}

// Function to create an enemy with defaults values
function makeEnemy(offsetX=0, offsetY=0, offsetDX=0, offsetDY=0, frictXOvv=null,frictYOvv=null,gravOvv=null,collSubOvv=null,hasFrictOvv=null,hasGravOvv=null,hasCollSub=null,radiusOvv=null,speedOvv=null,colorOvv=null) {
    if (radiusOvv == null) { rad = enemy_baseRadius; } else { rad = radiusOvv; }
    if (speedOvv == null) { speed = enemy_baseSpeed; } else { speed = speedOvv; }
    if (colorOvv == null) { color = enemy_baseColor; } else { color = colorOvv; }
    if (frictXOvv == null) { frictX = enemy_baseFrictX; } else { frictX = frictXOvv; }
    if (frictYOvv == null) { frictY = enemy_baseFrictY; } else { frictY = frictYOvv; }
    if (gravOvv == null) { grav = enemy_baseGrav; } else { grav = gravOvv; }
    if (collSubOvv == null ) { collSub = enemy_baseCollSub } else { collSub = collSubOvv }
    if (hasFrictOvv == null) { hasFrict = enemy_hasFriction; } else { hasFrict = hasFrictOvv; }
    if (hasGravOvv == null) { hasGrav = enemy_hasGravity; } else { hasGrav = hasGravOvv; }
    if (hasCollSub == null) { hasCollSub = enemy_hasCollSub; } else { hasCollSub = hasCollSub; }
    return new circle(
        enemy_baseX+offsetX,
        enemy_baseY+offsetY,
        enemy_baseDX+offsetDX,
        enemy_baseDY+offsetDY,
        rad,
        speed,
        frictX,
        frictY,
        grav,
        collSub,
        hasFrict,
        hasGrav,
        hasCollSub,
        color,
        isPlayer = false
    )
}

// Main setup code
window.onload = () => {
    // Grab canvas
    canvas = document.getElementById("canvas");
    // If debug show debug-elems on page
    if (debug == true) {
        div = document.createElement("div");
        div.id = "debug-elems";
        document.body.appendChild(div);
        input = document.createElement("input");
        input.id = "ovv-cmd";
        input.type = "text";
        input.placeholder = "<var>=<val> / <obj.var>=<val> / <obj>%<ind>=<val>; wh val = <val> / <val:type>";
        input.style.width = "500px";
        button = document.createElement("button");
        button.id = "ovv-sub";
        button.onclick = chnGlob;
        button.innerHTML = "Run";
        div.appendChild(input);
        div.appendChild(button);
        canvas.width = 1670;
        canvas.height = 850;
    }
    // Grab min/max incase diffrent from default (if debug changed it)
    max_x = canvas.width;
    max_y = canvas.height;
    // Grab context
    ctx = canvas.getContext("2d");

    // Setup keypress listeners
    document.onkeydown = (e) => {
        if (!keylist.includes(e.code)) {
            keylist.push(e.code)
        }
    }
    document.onkeyup = (e) => {
        if (keylist.includes(e.code)) {
            var ind = keylist.indexOf(e.code)
            if (ind>-1) {
                keylist.splice(ind, 1)
            }
        }
    }

    // Create player
    player = new circle(
        player_baseX,
        player_baseY,
        player_baseDX,
        player_baseDY,
        player_baseRadius,
        player_baseSpeed,
        player_baseFrictX,
        player_baseFrictY,
        player_baseGrav,
        player_baseCollSub,
        player_hasFriction,
        player_hasGravity,
        player_hasCollSub,
        player_baseColor,
        isPlayer = true
    );
    circles.push(player);

    // Create enemies
    circles.push( makeEnemy(50,25,  3, 4,  null,null,null,null,null,null,null,null,null,"darkgreen") );
    circles.push( makeEnemy(68,123, 2, 6,  null,null,null,null,null,null,null,null,null,"red") );
    circles.push( makeEnemy(-34,41, -2, 1, null,null,null,null,null,null,null,null,null,"goldenrod") );

    // Begin
    gameloop();
}

// Main render function
function render() {
    // Start with filling the canvas (clear)
    ctx.fillStyle = "#333333";
    ctx.fillRect(min_x,min_y,max_x,max_y);

    // Draw al circles (player & enemies)
    circles.forEach(c => {
        c.draw(ctx);
    });

    // If debug is enabled also show the debug-text
    if (debug == true) {
        drawText(
            ctx = ctx,
            segments = [
                ["Gravity:","black"],
                [player.grav,"red"],
                [", Friction:","black"],
                ["x","darkgreen"],
                [player.frictX,"red"],
                [",","black"],
                ["y","darkgreen"],
                [player.frictY,"red"],
                [", CollisionSub:","black"],
                [player.collSub,"red"],
                [", PlayerPos:","black"],
                [player.x,"blue",true],
                ["x","black"],
                [player.y,"blue",true],
                [", PlayerDX:","black"],
                [player.dx,"blue",true],
                [", PlayerDY:","black"],
                [player.dy,"blue",true],
                [", PlayerSp:","black"],
                [player.speed,"blue",true]
            ],
            x = 10,
            y = 50,
            fontSize = 28,
            font = "Arial",
            roundTo = 2
        )
    }
}

// Gameloop
function gameloop() {
    flytta();
    render();
    theEndIfMet();
}

// GameStates
function theEndIfMet() {
    circles.forEach(c => {
        if (!c.isPlayer) {
            if (c.checkCollisionCirc(player) == true) {
                dead = true;
            }
        }
    })
    if (!dead) {
        requestAnimationFrame(gameloop);
    } else {
        drawText(
            ctx = ctx,
            segments = [
                ["You died!","red",false,"#333333"]
            ],
            x = Math.round(canvas.width / 3),
            y = Math.round(canvas.width / 2),
            fontSize = 38,
            font = "Arial",
            roundTo = 2
        )
    }
}

// Main mover function (posUpdate)
function flytta() {
    // Apply shift speed increse (TODO: fix that shit)
    if(keylist.includes("ShiftLeft")) {
        player.speed = player_baseSprintSpeed;
    }

    // set player deltas based on key-input
    keylist.forEach( key => {
        switch (key) {
            case "KeyW":
                player.dy += -player.speed;
                break;
            case "KeyS":
                player.dy += player.speed;
                break;
            case "KeyA":
                player.dx += -player.speed;
                break;
            case "KeyD":
                player.dx += player.speed;
                break;

            default:
                break;
        }
    });

    // Call move method on al circles
    circles.forEach(c => {
        c.move();
    });
}
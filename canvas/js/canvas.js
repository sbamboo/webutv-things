//Todo: Add fixedRate delta comparison

var canvas;
var ctx;

// #region Defaults
const player_baseSpeed = 0.6;
const player_speedBoostFactor = 1.5;
const player_baseRadius = 20;
const player_baseShieldDistance = 7;
const player_baseShieldWidthDeg = 90;
const player_baseShieldThickness = 5;
const player_baseX = 250;
const player_baseY = 250;
const player_baseColor = "hotpink";
const player_baseShieldColor = "blue";
const player_baseDX = 0;
const player_baseDY = 0;
const player_baseFrictX = 0.9;
const player_baseFrictY = 0.9;
const player_baseGrav = 0.1;
const player_baseCollSub = 0.9;
var player_lastSpeed = null;
var player_hasFriction = true;
var player_hasGravity = false;
var player_hasCollSub = true;

const enemy_baseSpeed = 0.2;
const enemy_baseRadius = 20;
const enemy_baseShieldDistance = 2;
const enemy_baseShieldWidthDeg = 90;
const enemy_baseShieldThickness = 5;
const enemy_baseX = 250;
const enemy_baseY = 250;
const enemy_baseColor = "green";
const enemy_baseShieldColor = "red";
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

var player_image = null;
_player_image = new Image();
_player_image.src = "./images/favicon.png";
_player_image.onload = () => {
    player_image = _player_image;
}

var keylist = []
var circles = []

var max_x = 500;
var min_x = 0;
var max_y = 500;
var min_y = 0;

const smalDeltaLim = 0.1;

var dead = false;
var canDie = true;
var isPaused = false;
var lastState_shieldUp = null;
var timeElapsed = performance.now();

var mPosX = 0;
var mPosY = 0;

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
        if (val == null) {
            val = "null";
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
    switch(value.toLowerCase()) {
        case 'true':
            dataType = "bool";
            value = true;
        case 'false':
            dataType = "bool";
            value = false;
    }
    switch(dataType) {
        case 'string':
            return String(value);
        case 'number':
            return Number(value);
        case 'boolean':
            return Boolean(value);
        case 'bool':
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

function updateMousePos(e) {
    // Update mouse pos    
    mPosX = e.clientX;
    mPosY = e.clientY;
}

// Main circle object for player and enemies
function circle(x,y,dx,dy,radie,speed,frictX,frictY,grav,collSub,hasFrict,hasGrav,hasCollSub, image, color, shieldColor, shieldDis, shieldWdeg, shieldThickness, isPlayer=false) {
    // Asign variables to object
    this.isPlayer = isPlayer
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radie = radie;
    this.color = color;
    this.shieldColor = shieldColor;
    this.speed = speed;
    this.frictX = frictX;
    this.frictY = frictY;
    this.grav = grav;
    this.collSub = collSub;
    this.hasFrict = hasFrict;
    this.hasGrav = hasGrav;
    this.hasCollSub = hasCollSub;
    this.image = image;
    this.shieldUp = false;
    this.shieldDis = shieldDis;
    this.shieldWrad = shieldWdeg*(Math.PI/180)
    this.shieldThickness = shieldThickness
    this.setShieldWidth = (degrees) => {
        this.shieldWrad = degrees*(Math.PI/180)
    }
    this.shieldRad1 = 0;
    this.shieldRad2 = Math.PI;
    // Draw method
    this.draw = (ctx) =>{
        // Draw shield
        if (!isPaused && this.shieldUp == true) {
            // Draw
            ctx.strokeStyle = this.shieldColor;
            ctx.lineWidth = this.shieldThickness;
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.radie+this.shieldDis, this.shieldRad1, this.shieldRad2);
            ctx.stroke();
        }
        if (this.image == null || this.image == undefined) {
            // Draw color
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.radie, 0,Math.PI*2);
            ctx.fill();
        } else {
            // Draw image
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.radie, 0,Math.PI*2);
            ctx.fill();
            ctx.clip();
            ctx.drawImage(this.image, this.x-this.radie, this.y-this.radie, this.radie*2, this.radie*2);
            ctx.restore();
        }
    }
    // Update method
    this.update = () => {
        // Calc angle to mouse
        angleRadians = Math.atan2(mPosY-this.y, mPosX-this.x);
        // Get radians for resulting shield
        this.shieldRad1 = angleRadians-(this.shieldWrad/2);
        this.shieldRad2 = angleRadians+(this.shieldWrad/2);
    }
    // Move method
    this.move = (deltaFactor=1)=>{

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
        if (this.dx<smalDeltaLim && this.dx>-smalDeltaLim) {
            this.dx = 0;
        }
        if (this.dy<smalDeltaLim && this.dy>-smalDeltaLim) {
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
                if (this.dx<smalDeltaLim && this.dx>-smalDeltaLim) { this.dx = 0; }
            } else {
                this.dx *= -1;
            }
        }
        else{
            this.x += this.dx * this.speed * deltaFactor;
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
                if (this.dy<smalDeltaLim && this.dy>-smalDeltaLim) { this.dy = 0; }
            } else {
                this.dy *= -1;
            }
        }
        else{
            this.y += this.dy * this.speed * deltaFactor;
        }

        //Final clamp incase "fly-out"
        if (this.y<min_y-radie) {
            this.y = min_y;
        } else if (this.y>max_y+radie) {
            this.y = max_y;
        } else if (this.x>max_x+radie) {
            this.x = max_x;
        } else if (this.x<min_x-radie) {
            this.x = min_x;
        }
    }
    // CollisionChecker method
    this.checkCollisionCirc = (circleObj) => {
        xval = this.x - circleObj.x;
        yval = this.y - circleObj.y;
        dist = Math.sqrt( xval*xval + yval*yval ); // a^2+b^2=c^2
        if (this.radie + circleObj.radie > dist) {
            // Check for shield?
            if (circleObj.isPlayer == true) {
                if (circleObj.shieldUp == true) {
                    angleRadians = Math.atan2(this.y-circleObj.y, this.x-circleObj.x);
                    console.log(`\nsr1:${circleObj.shieldRad1*(180/Math.PI)}\n ar:${angleRadians*(180/Math.PI)}\n sr2:${circleObj.shieldRad2*(180/Math.PI)}`)
                    if (circleObj.shieldRad1 > angleRadians < circleObj.shieldRad2) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    }
}

// Function to create an enemy with defaults values
function makeEnemy(offsetX=0, offsetY=0, offsetDX=0, offsetDY=0, frictXOvv=null,frictYOvv=null,gravOvv=null,collSubOvv=null,hasFrictOvv=null,hasGravOvv=null,hasCollSub=null,radiusOvv=null,speedOvv=null,image=null,colorOvv=null,shieldColorOvv=null,shieldDisOvv=null,shieldWdegOvv=null,shieldThicknessOvv=null) {
    if (radiusOvv == null) { rad = enemy_baseRadius; } else { rad = radiusOvv; }
    if (speedOvv == null) { speed = enemy_baseSpeed; } else { speed = speedOvv; }
    if (colorOvv == null) { color = enemy_baseColor; } else { color = colorOvv; }
    if (shieldColorOvv == null) { shieldColor = enemy_baseShieldColor; } else { color = shieldColorOvv; }
    if (frictXOvv == null) { frictX = enemy_baseFrictX; } else { frictX = frictXOvv; }
    if (frictYOvv == null) { frictY = enemy_baseFrictY; } else { frictY = frictYOvv; }
    if (gravOvv == null) { grav = enemy_baseGrav; } else { grav = gravOvv; }
    if (collSubOvv == null ) { collSub = enemy_baseCollSub } else { collSub = collSubOvv }
    if (hasFrictOvv == null) { hasFrict = enemy_hasFriction; } else { hasFrict = hasFrictOvv; }
    if (hasGravOvv == null) { hasGrav = enemy_hasGravity; } else { hasGrav = hasGravOvv; }
    if (hasCollSub == null) { hasCollSub = enemy_hasCollSub; } else { hasCollSub = hasCollSub; }
    if (shieldDisOvv == null) { shieldDis = enemy_baseShieldDistance } else { shieldDis = shieldDisOvv }
    if (shieldWdegOvv == null) { shieldWdeg = enemy_baseShieldWidthDeg } else { shieldWdeg = shieldWdegOvv }
    if (shieldThicknessOvv == null) { shieldThickness = enemy_baseShieldThickness } else { shieldThickness = shieldThicknessOvv }
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
        image,
        color,
        shieldColor,
        shieldDis,
        shieldWdeg,
        shieldThickness,
        isPlayer = false
    )
}

// Main setup code
window.onmousemove = updateMousePos
window.onload = () => {
    // Grab canvas
    canvas = document.getElementById("canvas");

    // If debug show debug-elems on page
    if (debug == true) {
        wrapper = document.getElementById("canvasWrapper");
        div = document.createElement("div");
        div.id = "debug-elems";
        wrapper.appendChild(div);
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
        player_image,
        player_baseColor,
        player_baseShieldColor,
        player_baseShieldDistance,
        player_baseShieldWidthDeg,
        player_baseShieldThickness,
        isPlayer = true
    );
    circles.push(player);

    // Create enemies
    circles.push( makeEnemy(50,25,  3, 4,  null,null,null,null,null,null,null,null,null,null,"darkgreen",null,null,null,null) );
    circles.push( makeEnemy(68,123, 2, 6,  null,null,null,null,null,null,null,null,null,null,"red",null,null,null,null) );
    circles.push( makeEnemy(-34,41, -2, 1, null,null,null,null,null,null,null,null,null,null,"goldenrod",null,null,null,null) );

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
    _txCol = "white";
    _constCol = "#f05959";
    _valCol = "#007acc";
    _boolCol = "#a463d6";
    _axiCol = "#6a8a35";
    _tX = 10;
    _tY = 20;
    _fontSize = 18;
    _font = "Arial";
    _roundTo = 2;
    if (debug == true) {
        _segments =[
            ["Gravity:",_txCol],
            [player.grav,_constCol],
            [", Friction:",_txCol],
            ["x",_axiCol],
            [player.frictX,_constCol],
            [",",_txCol],
            ["y",_axiCol],
            [player.frictY,_constCol],
            [", CollisionSub:",_txCol],
            [player.collSub,_constCol],
            [", PlayerPos:",_txCol],
            [player.x,_valCol,true],
            ["x",_txCol],
            [player.y,_valCol,true],
            [", PlayerSp:",_txCol],
            [player.speed,_valCol,true],
            [", PlayerLSp:",_txCol],
            [player_lastSpeed,_valCol],
            [", PlayerDX:",_txCol],
            [player.dx,_valCol,true],
            [", PlayerDY:",_txCol],
            [player.dy,_valCol,true],
            [", CanDie:",_txCol],
            [canDie,_boolCol],
            [", Shield:",_txCol],
            [player.shieldUp,_boolCol],
            [", timeElaps:",_txCol],
            [timeElapsed/1000,_valCol,true],
            ["s",_valCol],
            [", Mouse:",_txCol],
            ["x",_axiCol],
            [mPosX,_valCol],
            ["y",_axiCol],
            [mPosY,_valCol]
        ]
    } else {
        _segments = [
            ["TimeElapsed: ",_txCol],
            [timeElapsed/1000,_valCol,true]
        ]
    }
    drawText( ctx=ctx, segments=_segments, x=_tX, y=_tY, fontSize=_fontSize, font=_font ,roundTo=_roundTo)
}

// Gameloop
function gameloop() {
    // Apply pause if debug is enabled and P is given
    if(debug == true && keylist.includes("KeyP")) {
        if (!isPaused) {
            console.log("DEBUG: Paused game!")
            isPaused = true;
        } else {
            console.log("DEBUG: Unpaused game!")
            timeElapsed = performance.now();
            isPaused = false;
        }
        var ind = keylist.indexOf("KeyP")
        if (ind>-1) {
            keylist.splice(ind, 1)
        }
    }
    // Move
    if (!isPaused) {
        flytta();
    }
    // Update
    circles.forEach(c => {
        c.update();
    });
    // Render
    render();
    // StateChecks
    theEndIfMet();
}

// GameStates
function theEndIfMet() {
    circles.forEach(c => {
        if (!c.isPlayer) {
            if (c.checkCollisionCirc(player) == true) {
                if (canDie) {
                    dead = true;
                }
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
            y = Math.round(canvas.height / 2),
            fontSize = 38,
            font = "Arial",
            roundTo = 2
        )
    }
}

// Main mover function (posUpdate)
function flytta() {
    // Apply shift speed increse (TODO: fix that shit)
    if (keylist.includes("ShiftLeft")) {
        if (player_lastSpeed == null) {
            player_lastSpeed = player.speed;
            player.speed *= player_speedBoostFactor;
        }
    } else {
        if (player_lastSpeed != null) {
            player.speed = player_lastSpeed;
            player_lastSpeed = null;
        }
    }
    // Fix incase above logic buggs (failsafe)
    if (player.speed == null) {
        player.speed = player_baseSpeed;
    }

    // Toggle shield
    if (keylist.includes("KeyH")) {
        if (lastState_shieldUp == null) {
            lastState_shieldUp = true;
            player.shieldUp = true;
        }
    } else {
        if (lastState_shieldUp != null) {
            lastState_shieldUp = null;
            player.shieldUp = false;
        }
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

    // Get deltaFactor
    currentTime = performance.now();
    const targetTimeMs = 10;
    const deltaFactor = (timeElapsed+targetTimeMs / currentTime) / 1000;
    timeElapsed = currentTime;

    // Call move method on al circles
    circles.forEach(c => {
        //c.move(deltaFactor);
        c.move();
    });
}
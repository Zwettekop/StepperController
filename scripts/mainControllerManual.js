import { setupBLE, schrijfUint32Value, setLogging } from "./module/ble.js";
import { amplitudeToTicks, speedToDelta, setLead } from "./module/stepper.js";

let speed = 1;
let busy = false;
let isMoving = false;
let speedLastTransmitted = 0;

//Setup service en char names
let karRichting;
let karDelta;
let karMode;
let serviceNaam = "00000000-0000-0000-0000-000deadbeef1";
let karakteristiekNamen = [
    "00000000-0000-0000-0000-000deadbeef2",
    "00000000-0000-0000-0000-000deadbeef3",
    "00000000-0000-0000-0000-000deadbeef4"
];
let mobileVersion = false

//Stepper motor conf
setLead(0.2);

//*Event listeners
//Change to mobile version and back
document.getElementById("chkMobile").onchange = function (dit) {
    mobileVersion = dit.target.checked;
    console.log(mobileVersion ? "Switch to mobile" : "Switch to desktop");
    let size = mobileVersion ? 2.5 : 1.3;
    document.querySelectorAll(".resp").forEach(element => {
        element.style = `font-size: ${size}em`;
    });
}

//Clicked on start button
document.getElementById('btnBLE').onclick = function () {
    let label = document.getElementById("lblStatus");
    label.innerHTML = "Trying to connect";
    setupBLE(serviceNaam, karakteristiekNamen).then(res => {
        karRichting = res[0];
        karDelta = res[1];
        karMode = res[2];
        label.innerHTML = "Connected";
        updateSpeed();
        schrijfUint32Value(karMode, 0);
    }).catch(function (problem) {
        label.innerHTML = "Failed";
        console.log("Failed: " + problem);
    });
};


function goUp() {
    console.log("Go up");
    isMoving = true;
    writeCommand(1);
}
function goDown() {
    console.log("Go down");
    isMoving = true;
    writeCommand(-1);
}
function stopMoving() {
    if (isMoving) {
        console.log("Stop moving");
        isMoving = false;
    }
}


//*Movement controls

//? For touch events you have to use .addEventlistener() or it won't work: .ontouchdown doesn't do anything!

//Keys
document.addEventListener("keydown", (event) => {
    if (event.key === 'ArrowLeft') {
        goDown();
    } if (event.key === 'ArrowRight') {
        goUp();
    }
});

document.addEventListener("keyup", (event) => {
    stopMoving();
})

//Buttons
document.getElementById("btnGoUp").onmousedown = goUp;
document.getElementById("btnGoDown").onmousedown = goDown;
window.addEventListener("mouseup", stopMoving);
document.getElementById("btnGoUp").addEventListener('touchstart', goUp);
document.getElementById("btnGoUp").addEventListener('touchend', stopMoving);
document.getElementById("btnGoDown").addEventListener('touchstart', goDown);
document.getElementById("btnGoDown").addEventListener('touchend', stopMoving);


//SVG's
document.getElementById("svgBtnGoUp").onmousedown = goUp;
document.getElementById("svgBtnGoUp").onmouseup = stopMoving;
document.getElementById("svgBtnGoDown").onmousedown = goDown;
document.getElementById("svgBtnGoDown").onmouseup = stopMoving;

document.getElementById("svgBtnGoUp").addEventListener('touchstart', goUp);
document.getElementById("svgBtnGoUp").addEventListener('touchend', stopMoving);
document.getElementById("svgBtnGoDown").addEventListener('touchstart', goDown);
document.getElementById("svgBtnGoDown").addEventListener('touchend', stopMoving);


//Send move command
function writeCommand(nr) {
    /* Legend:
    -1 go down
    0 don't move  
    1 go up*/
    schrijfUint32Value(karRichting, nr)
        .then(() => {
            if (isMoving)
                writeCommand(nr);
            else
                schrijfUint32Value(karRichting, 0);
        });
}

//*Speed max adjustment
document.getElementById("iptSpeed").onchange = function (ding) {
    document.getElementById("sldSpeed").max = ding.target.value;
    updateSpeed();
};

//*Slider speed
document.getElementById("sldSpeed").oninput = updateSpeed;

function updateSpeed() {
    speed = document.getElementById("sldSpeed").value;
    document.getElementById("lblSpeed").innerHTML = `${speed} cm/s`;
    if (busy === false) {
        busy = true;
        schrijfRealTimeSpeed(speed);
    }
}

async function schrijfRealTimeSpeed(waarde) {
    if (speedLastTransmitted === waarde)
        busy = false;
    else {
        // console.log(`Stuur value ${waarde}`);
        speedLastTransmitted = waarde;
        schrijfUint32Value(karDelta, speedToDelta(waarde))
            .then(() => {
                speedLastTransmitted = waarde;
                schrijfRealTimeSpeed(speed);
            })
            .catch((err) => {
                console.log(err)
            });
    }
}
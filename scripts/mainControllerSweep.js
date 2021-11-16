import { setupBLE, schrijfUint32Value, setLogging } from "./module/ble.js";
import { amplitudeToTicks, speedToDelta, setLead } from "./module/stepper.js";
//altijd let gebruiken!!

//Setup service en char names
let serviceNaam = "19b10000-e8f2-537e-4f6c-d104768a1214";
let karakteristiekNamen = [
    "19b10001-e8f2-537e-4f6c-d104768a1214",
    "19b10002-e8f2-537e-4f6c-d104768a1214"
];
let karTicks;
let karDelta;
let mobileVersion = false

let busy = false;
let speed;
let speedLastTransmitted = 0;
let amplitude;
let amplitudeLastTransmitted = 0;

//setLogging(false);

//Stepper motor conf
setLead(0.2);

//! Add event listeners
//Change to mobile version and back
document.getElementById("chkMobile").onchange = function (dit) {
    mobileVersion = dit.target.checked;
    console.log(mobileVersion ? "Switch to mobile" : "Switch to desktop");
    let elementen = document.querySelectorAll(".resp");
    let size = mobileVersion ? 2.5 : 1.3;
    elementen.forEach(element => {
        element.style = `font-size: ${size}em`;
    });
}

//Clicked on start button
document.getElementById('btnBLE').onclick = function () {
    let label = document.getElementById("lblStatus");
    label.innerHTML = "Trying to connect";
    setupBLE(serviceNaam, karakteristiekNamen).then(res => {
        karTicks = res[0];
        karDelta = res[1];
        label.innerHTML = "Connected";
    }).catch(function (problem) {
        label.innerHTML = "Failed";
        console.log("Failed: " + problem);
    });
};

//*Slider amplitude
document.getElementById("sldAmplitude").oninput = updateAmplitude;

document.getElementById("iptAmplitude").onchange = function (ding) {
    document.getElementById("sldAmplitude").max = ding.target.value;
    updateAmplitude();
};

function updateAmplitude() {
    amplitude = document.getElementById("sldAmplitude").value;
    amplitude = parseInt(amplitude);
    document.getElementById("lblAmplitude").innerHTML = `${amplitude} cm`;
    if (busy === false) {
        busy = true;
        schrijfRealTimeAmplitude(amplitude);
    }
};


//Schrijf up to date
/*De slider stuurt bij beweging een nieuwe waarde door. Er kan echter maar 1 waarde om de 50ms kunnen worden gestuurd. 
Deze waarde wordt gestuurd en er wordt dan gekeken of de waarde die doorgestuurd is nog steeds de meest recent waarde is. 
Indien niet wordt er opnieuw gestuurd.*/

async function schrijfRealTimeAmplitude(waarde) {
    if (amplitudeLastTransmitted === waarde)
        busy = false;
    else {
        schrijfUint32Value(karTicks, amplitudeToTicks(waarde))
            .then(() => {
                amplitudeLastTransmitted = waarde;
                schrijfRealTimeAmplitude(amplitude);
            })
            .catch((err) => {
                console.log(err)
            });
    }
}

//*Slider speed
document.getElementById("sldSpeed").oninput = updateSpeed;

document.getElementById("iptSpeed").onchange = function (ding) {
    document.getElementById("sldSpeed").max = ding.target.value;
    updateSpeed();
};

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
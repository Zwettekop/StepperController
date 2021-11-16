import { setupBLE, leesValue, schrijfUint32Value } from "./module/ble.js";
//altijd let gebruiken!!

let schrijfKar;
let serviceNaam = "19b10000-e8f2-537e-4f6c-d104768a1214";
let karakteristiekNamen = ["19b10001-e8f2-537e-4f6c-d104768a1214"];
let mobileVersion = false

//! Add event listeners

document.getElementById("chkMobile").onchange = function (dit) {
    mobileVersion = dit.target.checked;
    console.log(mobileVersion ? "Switch to mobile" : "Switch to desktop");
    let elementen = document.querySelectorAll(".resp");
    let size = mobileVersion ? 2.5 : 1.3;
    elementen.forEach(element => {
        element.style = `font-size: ${size}em`;
    });
}

document.getElementById("iptService").onchange = function () {
    serviceNaam = this.value;
};

document.getElementById("iptCharacteristic").onchange = function () {
    karakteristiekNamen[this.value];
};

//Clicked on start button
document.getElementById('btnBLE').onclick = function () {
    let label = document.getElementById("lblStatus");
    label.innerHTML = "Trying to connect";
    setupBLE(serviceNaam, karakteristiekNamen).then(res => {
        schrijfKar = res;
        label.innerHTML = "Connected";
    }).catch(function (problem) {
        label.innerHTML = "Failed";
        console.log("Failed: " + problem);
    });
};

//Clicked on read
document.getElementById("btnRead").onclick = function () {
    leesValue(schrijfKar).then(nummer => {
        document.getElementById("lblRes").value = nummer;
    });
};

//Clicked on write data button
document.getElementById("btnWrite").onclick = function () {
    schrijfUint32Value(schrijfKar, parseInt(iptWaarde.value));
};

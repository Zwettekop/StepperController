export { amplitudeToTicks, speedToDelta, setLead };

let driver = "TMC2208";
let microStepRes = 2; //2 micro steps are 1 real step
let lead = 0.8;//Lead of the lead shaft in cm. How much does the shaft travel if you rotate it once
let stepsPerRot = 200;

function setLead(getal) {
    lead = getal;
}

/*
* Calculations to convert between:
    - Amplitude (cm) -> Ticks (amount of ticks between direction changes)
    - Speed (cm/s) -> Delta (ms between each tick)
*/

function amplitudeToTicks(amplitude) {
    let rotationsTotal = amplitude / lead;
    let ticksTotal = rotationsTotal * stepsPerRot * microStepRes;
    return Math.round(ticksTotal);
}

function speedToDelta(speed) {
    let rotationsPerSec = speed / lead;
    let ticksPerSec = rotationsPerSec * stepsPerRot * microStepRes;
    let delta = 1000 * 1000 / ticksPerSec; // Delta is now in microseconds!
    return Math.round(delta);
}


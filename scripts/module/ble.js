export { setupBLE, leesValue, schrijfUint32Value, setLogging };

let logging = true;

//!Implementaties functies

function setLogging(yes) {
    logging = yes;
}

async function setupBLE(serviceNaam, karakteristiekNamen) {
    log("Setting up BLE");
    let options = {
        filters: [
            { services: [serviceNaam] },
            { name: 'Stepper motor control' }
        ]
    };
    let device = await navigator.bluetooth.requestDevice(options);
    let server = await device.gatt.connect();
    let service = await server.getPrimaryService(serviceNaam);

    let characteristics = [];
    for (let i = 0; i < karakteristiekNamen.length; i++)
        characteristics[i] = await service.getCharacteristic(karakteristiekNamen[i]);

    log("BLE started: ");
    return characteristics;
}

//Read data from BLE device
async function leesValue(karakteristiek) {
    log("Requesting data");
    let dataView = await karakteristiek.readValue();
    let arrBuffer = dataView.buffer;
    let nummer = new Uint32Array(arrBuffer, 0, 1)[0];
    log("Received: 0x" + parseInt(nummer, 10).toString(16) + " or " + nummer);
    return nummer;
}

//Write data to BLE device
async function schrijfUint32Value(karakteristiek, nummer) {
    log("Writing data: 0x" + nummer.toString(16) + " or " + nummer);
    let arr = new Uint32Array(1);
    arr[0] = nummer;
    let byteArr = new Uint8Array(arr.buffer, 0, 4);
    return schrijfValue(karakteristiek, byteArr);
}

async function schrijfValue(karakteristiek, byteArr) {
    return karakteristiek.writeValueWithResponse(byteArr)
}

function log(tekst) {
    if (logging === true)
        console.log(tekst);
}
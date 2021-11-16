export { startScherm, addPoint, removePoint, setDebugging, setInterpolationMethod };
import { generateRicos, generateX2Polynomials, generateX3polynomials } from "./splineGenerator.js";

//implement sending the data to the stepper motor box: 
//TODO Fix amplitude slider
//TODO Fix periode slider
//TODO Try to send speed to arduino
//TODO Try to send periode to arduino
//TODO Try to send X3 spline to arduino (a,b,c values arr)
//TODO Write code on arduino

let context;
let canvas;
let width;
let height;
let margin = 30;

let mouseX = 0;
let mouseY = 0;

let dotSize = 10;
let draggingDot = false;
let draggedDotIndex = 0;

let debugging = false;

let points = [];
let param = [];

let interpolationMethods = {
    "Linear interpolation": {
        generate: function () { },
        draw: drawPolyline
    },
    "2nd degree polynomial": {
        generate: generateX2Polynomials,
        draw: drawSplineX2
    },
    "3rd degree polynomial": {
        generate: generateX3polynomials,
        draw: drawSplineX3
    }
};

let generateSpline = generateX3polynomials;
let drawSpline = drawSplineX3;

function setDebugging(val) {
    debugging = val;
}

function setInterpolationMethod(naam) {
    let method = interpolationMethods[naam];
    generateSpline = method.generate;
    drawSpline = method.draw;
    param = generateSpline(points);
}

//*Setup canvas
function startScherm(canvas1) {
    canvas = canvas1;
    width = canvas.width - 2 * margin;
    height = canvas.height - 2 * margin;

    context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    console.log(`Started canvas with: ${width} and ${height}`)

    context.lineWidth = 1;
    context.strokeStyle = "#FFFFFF";
    context.fillStyle = "white";

    canvas.onmousedown = () => {
        clickCanvas();
    };
    canvas.onmousemove = () => {
        let rect = canvas.getBoundingClientRect();
        mouseX = parseInt((event.clientX - rect.left) - margin);
        mouseY = parseInt(height - (event.clientY - rect.top) + margin);
    };
    canvas.onmouseup = () => {
        if (draggingDot)
            draggingDot = false;
    };

    fillPoints([140, 200, 110, 140]);
    param = generateSpline(points);
    setInterval(update, 10);
}

function update() {
    if (draggingDot)
        dragDot();
    // console.log(points);
    draw();
}

function fillPoints(val) {
    points = [];
    for (let i = 0; i < val.length; i++)
        points[i] = { x: i * (width / (val.length - 1)), y: val[i] };
}

function draw() {
    context.clearRect(0, 0, width + 2 * margin, height + 2 * margin);
    drawCircles(points);
    drawSpline();
    if (debugging)
        drawRicos();
}

function drawPolyline() {
    context.beginPath();
    context.moveTo(margin + points[0].x, margin + height - points[0].y);
    for (let i = 1; i < points.length; i++)
        context.lineTo(margin + points[i].x, margin + height - points[i].y);
    context.stroke();
}

function drawCircles(points) {
    for (let i = 0; i < points.length; i++) {
        context.beginPath();
        context.arc(margin + points[i].x, margin + height - points[i].y, dotSize, 0, 2 * Math.PI);
        context.fill();
    }
}

function drawRicos(lineSize = 20) {
    for (let i = 0; i < points.length; i++) {
        context.beginPath();
        let ricos = generateRicos(points);
        let r = ricos[i];
        let dx = lineSize / Math.sqrt(r * r + 1);
        let dy = lineSize * r / Math.sqrt(r * r + 1);

        context.moveTo(margin + points[i].x - dx, margin + height - points[i].y + dy);
        context.lineTo(margin + points[i].x + dx, margin + height - points[i].y - dy);
        context.stroke();
    }
}

//*Draw the spline using y=ax^2 + bx + c
function drawSplineX2(steps = 20) {
    for (let i = 0; i < param.length; i++) {
        let a = param[i].a;
        let b = param[i].b;

        let x1 = points[i].x;
        let y1 = points[i].y;
        let x2 = points[i + 1].x;

        context.beginPath();
        context.moveTo(margin + x1, margin + height - y1);
        for (let i1 = 0; i1 <= steps; i1++) {
            let x = (x2 - x1) / steps * i1;
            let y = a * x * x + b * x;
            x = Math.max(0, Math.min(x + x1, width));
            y = Math.max(0, Math.min(y + y1, height));
            context.lineTo(margin + x, margin + height - y);
        }
        context.stroke();
    }
}

//*Draw the spline using y = ax^3 + bx^2 +cx +d
function drawSplineX3(steps = 30) {
    context.beginPath();
    for (let i = 0; i < param.length; i++) {
        let a = param[i].a;
        let b = param[i].b;
        let c = param[i].c

        context.moveTo(margin + points[i].x, margin + height - points[i].y);
        for (let i1 = 0; i1 <= steps; i1++) {
            //dx and dy are the offset compared to x and y
            let dx = (points[i + 1].x - points[i].x) / steps * i1;
            let dy = a * dx * dx * dx + b * dx * dx + c * dx;

            let x = Math.max(0, Math.min(points[i].x + dx, width));
            let y = Math.max(0, Math.min(points[i].y + dy, height));
            context.lineTo(margin + x, margin + height - y);
        }
    }
    context.stroke();
}

//*Draw the spline using the velocity of a 3rd degree polynomial
//?For accuracy improvement: increase steps
function drawSplineX3Vel(steps = 500) {
    context.beginPath();
    context.moveTo(margin + points[0].x, margin + height - points[0].y);
    let dx = (points[points.length - 1].x - points[0].x) / steps;

    let x = points[0].x;
    let y = points[0].y;
    let a = param[0].a;
    let b = param[0].b;
    let c = param[0].c
    let i1 = 0;
    for (let i = 0; i < steps; i++) {
        x += dx;

        let xoffset = x - points[i1].x;
        let vel = 3 * a * xoffset * xoffset + 2 * b * xoffset + c;
        y += vel * dx;

        let xf = Math.max(0, Math.min(x, width));
        let yf = Math.max(0, Math.min(y, height));
        context.lineTo(margin + xf, margin + height - yf);
        if (x > points[i1 + 1].x) {
            i1++;
            a = param[i1].a;
            b = param[i1].b;
            c = param[i1].c
        }
    }
    context.stroke();
}

//* Punten verslepen
function clickCanvas() {
    for (let i = 0; i < points.length; i++)
        if (distance(mouseX, mouseY, points[i].x, points[i].y) < dotSize) {
            draggingDot = true;
            // console.log(`Clicked dot nr. ${i + 1}`);
            draggedDotIndex = i;
        }
}

function dragDot() {
    //Put point within bounds
    points[draggedDotIndex] = {
        x: Math.min(Math.max(0, mouseX), width),
        y: Math.min(Math.max(0, mouseY), height)
    };

    //Fix begin and end point to border
    points[0].x = 0;
    points[points.length - 1].x = width;

    //Put beginning and end point at same y level
    if (draggedDotIndex === 0)
        points[points.length - 1].y = points[0].y;
    else
        points[0].y = points[points.length - 1].y;

    //Check the order of the points
    let puntOud = points[draggedDotIndex];
    points.sort((p1, p2) => (p1.x >= p2.x) ? 1 : -1);
    draggedDotIndex = points.findIndex((p) => p.x === puntOud.x && p.y === puntOud.y);

    param = generateSpline(points);
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

//Buttons, sliders etc
function addPoint() {
    let p = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2
    };
    points.splice(1, 0, p);
    param = generateSpline(points);
}

function removePoint() {
    if (points.length > 2)
        points.splice(1, 1);
    param = generateSpline(points);
}
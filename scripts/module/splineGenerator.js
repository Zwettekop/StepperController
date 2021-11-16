export { generateRicos, generateX2Polynomials, generateX3polynomials };

function generateRicos(points) {
    let ricos = [];
    for (let i = 1; i < points.length - 1; i++) {
        let ABx = points[i].x - points[i - 1].x;
        let ABy = points[i].y - points[i - 1].y;
        let AB = Math.hypot(ABx, ABy);

        let ACx = points[i + 1].x - points[i].x;
        let ACy = points[i + 1].y - points[i].y;
        let AC = Math.hypot(ACx, ACy);

        let rico = (ABy * AC + ACy * AB) / (ABx * AC + ACx * AB);
        ricos[i] = rico;
    }
    //Set start and end ricos to 0 (flat)
    ricos[0] = 0;
    ricos[points.length - 1] = 0;
    return ricos;
}

//*Generate a spline based on 2nd degree polynimials: y=ax^2+bx+c
//The rico (deriviative) of the spline in the first point is zero (flat).
function generateX2Polynomials(points) {
    let param = [];
    let r1 = 0;//rico at the start of one spline segment
    for (let i = 0; i < points.length - 1; i++) {
        let x2 = points[i + 1].x - points[i].x;
        let y2 = points[i + 1].y - points[i].y;
        param[i] = {
            a: (y2 - r1 * x2) / x2 / x2,
            b: r1
        };
        r1 = 2 * x2 * param[i].a + r1;
    }
    return param;
}

//*Generate a spline based on 3rd degree polynimials: y=ax^3 + bx^2 +cx +d
/*d will always be zero
We calculate a set of parameters (a,b and c) for the curves between 2 points
In total there are (points.length -1) sets of parameters a,b,c
We work from the first point to the last*/

function generateX3polynomials(points) {
    let ricos = generateRicos(points);
    let param = [];
    for (let i = 0; i < points.length - 1; i++) {
        let r1 = ricos[i];
        let r2 = ricos[i + 1];
        let x2 = points[i + 1].x - points[i].x;
        let y2 = points[i + 1].y - points[i].y;
        param[i] = {
            a: (r1 * x2 + r2 * x2 - 2 * y2) / (x2 * x2 * x2),
            b: 3 * y2 / (x2 * x2) - (2 * r1 + r2) / x2,
            c: r1
        };
    }
    return param;
}
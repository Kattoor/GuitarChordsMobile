const canvas = document.getElementsByTagName('canvas')[0];
const ctx = canvas.getContext('2d');

const p = document.getElementById('p');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.ontouchstart = startHandler;
canvas.ontouchmove = moveHandler;
canvas.ontouchend = endHandler;

const amountOfSnares = 6;
const amountOfNuts = 4;
const snareDeltaWidth = (canvas.width - 50) / (amountOfSnares - 1);
const nutDeltaHeight = (canvas.height - 200) / amountOfNuts;

const snares = {
    [25]: 'E',
    [25 + snareDeltaWidth]: 'A',
    [25 + snareDeltaWidth * 2]: 'D',
    [25 + snareDeltaWidth * 3]: 'G',
    [25 + snareDeltaWidth * 4]: 'B',
    [25 + snareDeltaWidth * 5]: 'e'
};

const nuts = {
    [200]: 1,
    [200 + nutDeltaHeight]: 2,
    [200 + nutDeltaHeight * 2]: 3,
    [200 + nutDeltaHeight * 3]: 4,
    [200 + nutDeltaHeight * 4]: 5
};

const chords = {
    'E': [
        {snare: 3, fret: 0},
        {snare: 2, fret: 1},
        {snare: 1, fret: 1}
    ],
    'A': [
        {snare: 2, fret: 1},
        {snare: 3, fret: 1},
        {snare: 4, fret: 1}
    ]
};

const touches = [];

function startHandler(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const id = e.changedTouches[i].identifier;
        const key = {x: e.changedTouches[i].clientX, y: e.changedTouches[i].clientY};
        touches.push({id, key});
    }
}

function moveHandler(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++)
        touches[getTouchIndex(e.changedTouches[i].identifier)].key = {
            x: e.changedTouches[i].clientX,
            y: e.changedTouches[i].clientY
        };
}

function endHandler(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const index = getTouchIndex(e.changedTouches[i].identifier);
        if (index >= 0)
            touches.splice(index, 1);
    }
}

function getTouchIndex(id) {
    for (let i = 0; i < touches.length; i++) {
        if (touches[i].id === id)
            return i;
    }
    return -1;
}

let currentChord = "NO CHORD";

function drawGuitar() {
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e67e22';
    ctx.fillRect(+Object.keys(snares)[0], 0, snareDeltaWidth * (amountOfSnares - 1), nutDeltaHeight * amountOfNuts + nutDeltaHeight);

    Object.keys(nuts).forEach(nutY => {
        ctx.fillStyle = '#34495e';
        ctx.fillRect(+Object.keys(snares)[0], +nutY - 5, canvas.width - 50, 10);
    });

    Object.entries(snares).forEach(entry => {
        /* Snares */
        ctx.fillStyle = '#34495e';
        ctx.fillRect(entry[0] - 5, 0, 10, canvas.height);
        /* Letter box */
        ctx.fillStyle = '#34495e';
        ctx.fillRect(entry[0] - 50, 0, 100, 100);
        /* Letter */
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '100px Calibri';
        ctx.fillText(entry[1], entry[0] - 30, 85);
        /* Note box */
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 100, canvas.width, 100);
        /* Note */
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText(currentChord, canvas.width / 2 - ctx.measureText(currentChord).width / 2, 190);
    });
}

setInterval(() => {
    drawGuitar();

    p.innerHTML = JSON.stringify(touches);

    touches.forEach(touch => {
        const closestSnare = findClosestSnare(touch.key);
        const closestFret = findClosestFret(touch.key);

        ctx.beginPath();
        ctx.arc(closestSnare, closestFret, 75, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        ctx.closePath();
    });

    checkChords();
}, 10);

function findClosestSnare(point) {
    return Object.keys(snares).reduce((snareX, closest) => {
        const distanceWithTouch = Math.abs(snareX - point.x);
        const distanceWithClosest = Math.abs(closest - point.x);
        return distanceWithTouch < distanceWithClosest ? snareX : closest;
    });
}

function getSnareIndex(snareX) {
    return (snareX - 25) / snareDeltaWidth;
}

function getFretIndex(fretY) {
    return Math.floor((fretY - 200) / nutDeltaHeight);
}

function findClosestFret(point) {
    return Object.keys(nuts).slice(1).map(nutY => nutY - nutDeltaHeight / 2).reduce((fretY, closest) => {
        const distanceWithTouch = Math.abs(fretY - point.y);
        const distanceWithClosest = Math.abs(closest - point.y);
        return distanceWithTouch < distanceWithClosest ? fretY : closest;
    });
}

function checkChords() {
    const touches2 = touches.map(touch => {
        const closestSnare = findClosestSnare(touch.key);
        const closestFret = findClosestFret(touch.key);
        return {snare: getSnareIndex(closestSnare), fret: getFretIndex(closestFret)};
    });

    const successFull = Object.entries(JSON.parse(JSON.stringify(chords))).filter(chord => {
        const chordName = chord[0];
        const chordHits = chord[1];

        let count = 0;

        function contains(arr, item) {
            for (const arrItem of arr) {
                if (arrItem.snare === item.snare && arrItem.fret === item.fret)
                    return true;
            }
            return false;
        }

        function removeDoubles(array) {
            const arr = [];
            for (const item of array) {
                if (!contains(arr, item)) {
                    arr.push(item);
                }
            }
            return arr;
        }

        const touches3 = removeDoubles(touches2);

        if (touches3.length !== chordHits.length)
            return;

        touches3.forEach(touch => {
            for (const chordHit of chordHits) {
                if (chordHit.snare === touch.snare && chordHit.fret === touch.fret) {
                    count++;
                    break;
                }
            }
        });

        if (count === touches3.length) {
            currentChord = "CHORD: " + chordName;
            return true;
        } else return false;
    });
    if (successFull.length === 0)
        currentChord = "NO CHORD";
}

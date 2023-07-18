class RainApplication {
    VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        void main() {
            gl_Position = a_Position;
            v_Color = a_Color;
        }
    `;
    FSHADER_SOURCE = `
        precision mediump float;
        varying vec4 v_Color;
        void main() {
            gl_FragColor = v_Color;
        }
    `;

    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl");
        if (!this.gl) {
            console.log("Failed to get webgl context");
            return;
        }
    }

    fitScreen() {
        const gl = this.gl;
        const canvas = this.canvas;
        // check if the canvas is not the same size as screen
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            // set canvas full screen
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // set viewport
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }

    springPostion = [];
    springVelocity = [];
    startPostion = -0.1;
    // sample number
    waveNumber = 400;
    // actually k/m
    k = 0.10;
    // dampening factor
    density = 0.15;
    // spread factor
    spread = 0.30;
    // spread times
    spreadTimes = 8;
    // raindrops position and size
    raindropsPositionX = [];
    raindropsPositionY = [];
    raindropsSize = [];
    // wind velocity
    windVelocity = -0.01;
    raindropVelocity = 0.1;

    init() {
        // init spring
        this.springPostion = Array(this.waveNumber).fill(this.startPostion);
        this.springVelocity = Array(this.waveNumber).fill(0);
        // init shader
        const gl = this.gl;
        // create shader object
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        // set shader source
        gl.shaderSource(vertexShader, this.VSHADER_SOURCE);
        gl.shaderSource(fragmentShader, this.FSHADER_SOURCE);
        // compile shader
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);
        // check compile status
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.log("Failed to compile vertex shader");
            return;
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.log("Failed to compile fragment shader");
            return;
        }
        // create program object
        const program = gl.createProgram();
        // attach shader object
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // link program
        gl.linkProgram(program);
        // check link status
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log("Failed to link program");
            return;
        }
        // use program
        gl.useProgram(program);
        // store program object
        this.program = program;
        // set vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // get attribute location
        this.a_Position = gl.getAttribLocation(this.program, "a_Position");
        this.a_Color = gl.getAttribLocation(this.program, "a_Color");
        // set vertices
        const verticesArray = [];
        for (let i = 0; i < this.waveNumber; i++) {
            verticesArray.push(...[-1.0 + 2.0 * i / (this.waveNumber - 1), this.startPostion, 0.6, 0.6, 0.6]);
            verticesArray.push(...[-1.0 + 2.0 * i / (this.waveNumber - 1), -1.0, 0.6, 0.6, 0.6]);
        }
        this.vertices = new Float32Array(verticesArray);
        // set vertex attribute pointer
        const FSIZE = this.vertices.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(this.a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
        gl.vertexAttribPointer(this.a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
        // enable vertex attribute array
        gl.enableVertexAttribArray(this.a_Position);
        gl.enableVertexAttribArray(this.a_Color);
    }

    lastTime = -1;
    fps = 60;
    tolerance = 0.1;
    requestAnimationFrameHandle = null;
    vertices = new Float32Array([]);
    vertexBuffer = null;
    a_Position = null;
    a_Color = null;
    piova = 50;
    maxRaindrops = 1000;

    start() {
        this.requestAnimationFrameHandle = requestAnimationFrame((timeStamp) => {
            this.update(timeStamp);
        });
    }

    drawWater() {
        const gl = this.gl;
        const vertices = this.vertices;
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // draw triangle
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.waveNumber * 2);
    }

    drawRaindrops() {
        const gl = this.gl;
        const rainSizeFactor = 1920 / this.canvas.width * 0.01;
        for (let i = 0; i < this.raindropsPositionX.length; i++) {
            const x = this.raindropsPositionX[i];
            const y = this.raindropsPositionY[i];
            const size = this.raindropsSize[i];
            const vertices = new Float32Array([
                x - size * rainSizeFactor, y, 0.6, 0.6, 0.6,
                x, y - size * rainSizeFactor, 0.6, 0.6, 0.6,
                x + size * rainSizeFactor, y, 0.6, 0.6, 0.6,
                x - size * rainSizeFactor * 20 * this.windVelocity / this.raindropVelocity, y + size * rainSizeFactor * 20, 0.7, 0.7, 0.7,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            // draw triangle
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    update(timeStamp) {
        this.fitScreen();
        const gl = this.gl;
        // cancelAnimationFrame(this.requestAnimationFrameHandle);
        if (this.lastTime === -1) {
            this.lastTime = timeStamp;
        }
        if (timeStamp - this.lastTime > 1000 / this.fps - this.tolerance) {
            this.lastTime = timeStamp;
            // update raindrops
            const rainPosibility = this.piova / this.fps;
            const rainNumber = Math.floor(rainPosibility) + (Math.random() < rainPosibility - Math.floor(rainPosibility) ? 1 : 0);
            for (let i = 0; i < rainNumber; i++) {
                this.raindropsPositionX.push(-1.0 + 2.0 * (1 + Math.abs(this.windVelocity / this.raindropVelocity)) * Math.random());
                this.raindropsPositionY.push(1.0 + this.fps * this.raindropVelocity * Math.random());
                this.raindropsSize.push(0.1 + 0.2 * Math.random());
            }
            const newRaindropsPositionX = [];
            const newRaindropsPositionY = [];
            const newRaindropsSize = [];
            const fpsFactor = 30 / this.fps;
            console.log(this.raindropsPositionX.length)
            if (this.raindropsPositionX.length < this.maxRaindrops) {
                for (let i = 0; i < this.raindropsPositionY.length; i++) {
                    this.raindropsPositionY[i] -= this.raindropVelocity * fpsFactor;
                    this.raindropsPositionX[i] += this.windVelocity * fpsFactor;
                    let index = Math.floor((this.raindropsPositionX[i] + 1.0) / 2.0 * this.waveNumber);
                    if (index < 0) {
                        index = 0;
                    }
                    else if (index >= this.waveNumber) {
                        index = this.waveNumber - 1;
                    }
                    if (this.raindropsPositionY[i] < this.springPostion[index]) {
                        this.splash(this.raindropsPositionX[i], -this.raindropsSize[i]);
                    } else {
                        newRaindropsPositionX.push(this.raindropsPositionX[i]);
                        newRaindropsPositionY.push(this.raindropsPositionY[i]);
                        newRaindropsSize.push(this.raindropsSize[i]);
                    }
                }
                this.raindropsPositionX = newRaindropsPositionX;
                this.raindropsPositionY = newRaindropsPositionY;
                this.raindropsSize = newRaindropsSize;
            }
            // spring
            for (let i = 1; i < this.waveNumber - 1; i++) {
                const x = this.springPostion[i] - this.startPostion;
                const a = -this.k * x - this.density * this.springVelocity[i];
                // Euler method
                this.springPostion[i] += this.springVelocity[i];
                this.springVelocity[i] += a;
            }
            const leftDeltas = Array(this.waveNumber).fill(0);
            const rightDeltas = Array(this.waveNumber).fill(0);
            // relax
            for (let j = 0; j < this.spreadTimes; j++) {
                for (let i = 0; i < this.waveNumber; i++) {
                    if (i > 0) {
                        leftDeltas[i] = this.spread * (this.springPostion[i] - this.springPostion[i - 1]);
                        this.springVelocity[i - 1] += leftDeltas[i];
                    }
                    if (i < this.waveNumber - 1) {
                        rightDeltas[i] = this.spread * (this.springPostion[i] - this.springPostion[i + 1]);
                        this.springVelocity[i + 1] += rightDeltas[i];
                    }
                }
                for (let i = 0; i < this.waveNumber; i++) {
                    if (i > 0) {
                        this.springPostion[i - 1] += leftDeltas[i];
                    }
                    if (i < this.waveNumber - 1) {
                        this.springPostion[i + 1] += rightDeltas[i];
                    }
                }
            }
            // update vertices
            const vertices = this.vertices;
            for (let i = 0; i < this.waveNumber; i++) {
                vertices[i * 10 + 1] = this.springPostion[i];
            }
            // clear canvas with #cfcfcf
            this.gl.clearColor(0xcf / 255, 0xcf / 255, 0xcf / 255, 1.0);
            this.gl.clear(gl.COLOR_BUFFER_BIT);
            this.drawWater();
            this.drawRaindrops();
        }

        this.requestAnimationFrameHandle = requestAnimationFrame((timeStamp) => {
            this.update(timeStamp);
        });
    }

    splash(position, speed) {
        // sample
        const index = Math.floor((position + 1.0) / 2.0 * this.waveNumber);
        this.springVelocity[index] += speed;
    }

    reset() {
        this.springPostion = Array(this.waveNumber).fill(this.startPostion);
        this.springVelocity = Array(this.waveNumber).fill(0);
    }

    stop() {
        cancelAnimationFrame(this.requestAnimationFrameHandle);
        clearInterval(this.rainingHandle);
    }
}

function main() {
    // set canvas full screen
    const canvas = document.getElementById("canvas");
    const application = new RainApplication(canvas);
    application.init();
    application.start();
    canvas.addEventListener("click", (event) => {
        const x = event.clientX;
        const y = event.clientY;
        const rect = event.target.getBoundingClientRect();
        const canvasX = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
        const canvasY = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
        application.splash(canvasX, -canvasY);
    });
    window.application = application;
}

main();
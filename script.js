

// helper function for loading shader sources
function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}


function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
 
    // Set up texture so we can render any size image and so we are
    // working with pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 
    return texture;
  }

function main() {

    const width = 800;
    const height = 800;

    var settings =  { laplace: 40.0,
        cubic: 0.6,
        identity: 0.05,
        derivative: 0.01,
        noise: 0.003,
        inputStrength: 40.0,
        inputRadius: 15,
        colorSensitivity: 10.0,
        colorMixRatio: 0.1,
        colorPattern: 1,
        scaleX: 1.0,
        scaleY: 1.0,
        scaleT: 0.05,
        maxVal: 100000.0,
        speed: 1,
        delay: 1,
        boundaryCondition: 1};

    console.log("hi");
    // setup an OpenGL context
    var body = document.getElementsByTagName("body")[0];
    var canvas = document.getElementById("canvas");
    
    body.setAttribute("style","-ms-touch-action: none;");

    var gl = canvas.getContext("webgl2");

    if (!gl) {
        console.log('your browser/OS/drivers do not support WebGL2');
    } else {
        console.log('webgl2 works!');
    }
    gl.getExtension( 'EXT_color_buffer_float' );

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    /*
    var floatTextures = gl.getExtension('OES_texture_float');
    if (!floatTextures) {
        alert('no floating point texture support');
        return;
    }
    */
    


    // build the vertex shader

    var vertexShaderSource = `
    precision mediump float;
    attribute vec2 a_position;

    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    uniform vec2 u_resolution;
    uniform float u_flipY;
    
    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;
    
       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;
    
       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;
    
       gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
    
       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points.
       v_texCoord = a_texCoord;
    }`;

    var fragmentShaderColorSource = `
    precision mediump float;
            
    varying vec2 v_texCoord;

    // our texture
    uniform sampler2D u_image_color;

    uniform float u_colorSensitivity;
    uniform float u_colorMixRatio;
    uniform int u_colorPattern;
    uniform float u_maxVal_color;

    
    // the texCoords passed in from the vertex shader.

    float data_to_u(float x, float maxVal) {
        return (x - 0.5) * maxVal;
    }
    float u_to_data(float x, float maxVal) {
        return x / maxVal + 0.5;
    }
    vec4 vec_data_to_u(vec4 X, float maxVal) {
        return vec4((X.r - 0.5) * maxVal,
                    (X.g - 0.5) * maxVal,
                    (X.b - 0.5) * maxVal,
                    1.0);
    }
    vec4 vec_u_to_data(vec4 X, float maxVal) {
        return vec4(X.r / maxVal + 0.5,
                    X.g / maxVal + 0.5,
                    X.b / maxVal + 0.5,
                    1.0);
    }
    
    void main() {

        vec4 data = texture2D(u_image_color, v_texCoord);

        float u = data.r;

        vec4 color = vec4(0.0, 1.0, 0.0, 1.0);
        if (u_colorPattern == 0) {
            if (u >= 0.0) {
                color = vec4(   (1.0 - (1.0 / (1.0 + u_colorSensitivity * u))),
                                (1.0 - (1.0 / (1.0 + u_colorMixRatio * u_colorSensitivity * u))),
                                0.0,
                                1.0);
            }
            if (u < 0.0){
                color = vec4(   0.0, 
                                (1.0 - (1.0 / (1.0 - u_colorMixRatio * u_colorSensitivity * u))),
                                (1.0 - (1.0 / (1.0 - u_colorSensitivity * u))),
                                1.0);
            }
        }
        else if (u_colorPattern == 1) {
            if (u >= 0.0) {
                color = vec4(   0.0,
                                (1.0 - (1.0 / (1.0 + u_colorSensitivity * u))),
                                (1.0 - (1.0 / (1.0 + u_colorMixRatio * u_colorSensitivity * u))),
                                1.0);
            }
            if (u < 0.0){
                color = vec4(   (1.0 - (1.0 / (1.0 - u_colorSensitivity * u))), 
                                0.0,
                                (1.0 - (1.0 / (1.0 - u_colorMixRatio * u_colorSensitivity * u))),
                                1.0);
            }
        }
        /*
        else if (u_colorPattern == 2) {
            if (u >= 0.0) {
                color = vec4(   (1.0 - (1.0 / (1.0 + u_colorMixRatio * u_colorSensitivity * u))),
                                (1.0 - (1.0 / (1.0 + u_colorSensitivity * u))),
                                0.0,
                                1.0);
            }
            if (u < 0.0){
                color = vec4(   (1.0 - (1.0 / (1.0 - u_colorMixRatio * u_colorSensitivity * u))),
                                0.0,
                                (1.0 - (1.0 / (1.0 - u_colorSensitivity * u))), 
                                1.0);
            }
        }
        */
       else if (u_colorPattern == 2) {
        if (u >= 0.0) {
            color = vec4(   (1.0 / (1.0 + u_colorSensitivity * u)),
                            (1.0 / (1.0 + u_colorMixRatio * u_colorSensitivity * u)),
                            1.0,
                            1.0);
        }
        if (u < 0.0){
            color = vec4(   1.0, 
                            (1.0 / (1.0 - u_colorMixRatio * u_colorSensitivity * u)),
                            (1.0 / (1.0 - u_colorSensitivity * u)),
                            1.0);
        }
    }
        

        gl_FragColor = color;
    }`;

    var fragmentShaderComputeSource = `
    precision mediump float;

    varying vec2 v_texCoord;
            
    // our texture
    uniform sampler2D u_image;
    uniform sampler2D u_image_input;

    uniform vec2 u_resolution;

    uniform vec2 u_mouse;

    uniform float u_laplace;
    uniform float u_identity;
    uniform float u_derivative;
    uniform float u_cubic;
    uniform float u_noise;
    uniform float u_inputStrength;

    uniform float u_colorSensitivity;
    uniform float u_maxVal;

    uniform float u_scaleX;
    uniform float u_scaleY;
    uniform float u_scaleT;

    uniform int u_boundaryCondition;
    
    // the texCoords passed in from the vertex shader.

    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float data_to_u(float x, float maxVal) {
        return ((x - 0.5) * maxVal);
    }
    float u_to_data(float x, float maxVal) {
        return (x / maxVal + 0.5);
    }
    vec4 vec_data_to_u(vec4 X, float maxVal) {
        return vec4((X.r - 0.5) * maxVal,
                    (X.g - 0.5) * maxVal,
                    (X.b - 0.5) * maxVal,
                    1.0);
    }
    vec4 vec_u_to_data(vec4 X, float maxVal) {
        return vec4(X.r / maxVal + 0.5,
                    X.g / maxVal + 0.5,
                    X.b / maxVal + 0.5,
                    1.0);
    }

    void main() {
        
        vec4 data = texture2D(u_image, v_texCoord);
        float u = data.r;
        float u_t = data.g;
        float u_tt = data.b;

        vec2 pixelSize = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);

        if ((u_boundaryCondition == 0) || (v_texCoord.x > 0.5 * pixelSize.x && v_texCoord.y > 0.5 * pixelSize.y)) {
            float u_above = texture2D(u_image, v_texCoord + vec2(0, pixelSize.y)).r;
            float u_below = texture2D(u_image, v_texCoord + vec2(0, -pixelSize.y)).r;
            float u_right = texture2D(u_image, v_texCoord + vec2(pixelSize.x, 0)).r;
            float u_left = texture2D(u_image, v_texCoord + vec2(-pixelSize.x, 0)).r;
            float u_right_above = texture2D(u_image, v_texCoord + vec2(pixelSize.x, pixelSize.y)).r;
            float u_right_below = texture2D(u_image, v_texCoord + vec2(pixelSize.x, -pixelSize.y)).r;
            float u_left_above = texture2D(u_image, v_texCoord + vec2(-pixelSize.x, pixelSize.y)).r;
            float u_left_below = texture2D(u_image, v_texCoord + vec2(-pixelSize.x, -pixelSize.y)).r;

            float sqrt_two = sqrt(2.0);
            float laplacian = (u_right - 2.0 * u + u_left) / (2.0 * u_scaleX)
                            + (u_above - 2.0 * u + u_below) / (2.0 * u_scaleY)
                            + (u_right_above - 2.0 * u + u_left_below) / (2.0 * sqrt_two * u_scaleX)
                            + (u_left_above - 2.0 * u + u_right_below) / (2.0 * sqrt_two * u_scaleY);

            u_tt =  u_laplace * laplacian
                    - u_identity * u
                    - u_derivative * u_t
                    - u_cubic * u * u * u
                    + u_noise * 0.0
                    + u_inputStrength * texture2D(u_image_input, v_texCoord + pixelSize * (u_mouse - 0.5 * u_resolution)).b;

            u_t += u_scaleT * u_tt;
            u += u_scaleT * u_t;
        }
        else {
            if (u_boundaryCondition == 1) {
                u_tt = 0.0;
                u_t = 0.0;
                u = 0.0;
            }
        }

        gl_FragColor = vec4(u, u_t, u_tt, 1.0);
    }`; 

    



    var nb_textures = 3;
    var textures = [];
    var framebuffers = [];
    for (var k = 0; k < nb_textures; k++) {
        var texture = createAndSetupTexture(gl);
        textures.push(texture);
        
        var textureData = new Float32Array(4 * width * height);
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {

                if (Math.pow(i - width/3, 2) + Math.pow(j - height/4, 2) < Math.pow(40,2)) {
                    textureData[i * height * 4 + j * 4 + 0] = 0.0;
                }
                else {
                    textureData[i * height * 4 + j * 4 + 0] = 0.0;
                }
                
                if (Math.pow(i - width/3, 2) + Math.pow(j - height/4, 2) < Math.pow(40,2)) {
                    textureData[i * height * 4 + j * 4 + 1] = 0.0;
                }
                else {
                    textureData[i * height * 4 + j * 4 + 1] = 0.0;
                }
                textureData[i * height * 4 + j * 4 + 2] = 0.0;
                textureData[i * height * 4 + j * 4 + 3] = 1.0;
                
            }
        }
        
        //console.log(textureData);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, textureData);
        
        // Create a framebuffer
        var fbo = gl.createFramebuffer();
        framebuffers.push(fbo);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Attach a texture to it.
        var attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.log("attachment error");
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT)  {
                console.log("incomplete attachment");
            }
        }
        


    }

    var inputTexture = createAndSetupTexture(gl);
    var inputTextureData = new Float32Array(4 * width * height);

    for(var i = 0; i < width; i++) {
        for(var j = 0; j < height; j++) {
            inputTextureData[i * height * 4 + j * 4 + 0] = 0.0;
            inputTextureData[i * height * 4 + j * 4 + 1] = 0.0;

            var R_squared = Math.pow(settings.inputRadius,2);
            var r_squared = Math.pow(i - width/2, 2) + Math.pow(j - height/2, 2);
            if (r_squared < R_squared) {
                
                inputTextureData[i * height * 4 + j * 4 + 2] = Math.pow(2, -R_squared / (R_squared - r_squared));
            }
            else {
                inputTextureData[i * height * 4 + j * 4 + 2] = 0.0;
            }
            
            inputTextureData[i * height * 4 + j * 4 + 3] = 1.0;

        }
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, inputTextureData);
    

    // send the vertex positions to the GPU
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    setRectangle(gl, 0, 0, width, height);

    // define vertex texcoords
    var texCoords = new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0,
    ]);

    // send the vertex texcoords to the GPU
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShaderCompute = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderComputeSource);
    var fragmentShaderColor = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderColorSource);

    var shaderProgramCompute = createProgram(gl, vertexShader, fragmentShaderCompute);
    var shaderProgramColor = createProgram(gl, vertexShader, fragmentShaderColor);   

    gl.useProgram(shaderProgramCompute);

    var positionAttribute = gl.getAttribLocation(shaderProgramCompute, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    var texcoordAttribute = gl.getAttribLocation(shaderProgramCompute, "a_texCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordAttribute);
    gl.vertexAttribPointer(texcoordAttribute, 2, gl.FLOAT, false, 0, 0);

    var imageUniform = gl.getUniformLocation(shaderProgramCompute, "u_image")
    gl.uniform1i(imageUniform, 0);
    var imageInputUniform = gl.getUniformLocation(shaderProgramCompute, "u_image_input")
    gl.uniform1i(imageInputUniform, 1);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    var resolutionLocation = gl.getUniformLocation(shaderProgramCompute, "u_resolution");
    gl.uniform2f(resolutionLocation, width, height);
    
    var flipYLocation = gl.getUniformLocation(shaderProgramCompute, "u_flipY");
    gl.uniform1f(flipYLocation, 1.0);


    applyComputeSettings(gl, shaderProgramCompute, settings);

    gl.useProgram(shaderProgramColor);

    var positionAttribute = gl.getAttribLocation(shaderProgramColor, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    var texcoordAttribute = gl.getAttribLocation(shaderProgramColor, "a_texCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordAttribute);
    gl.vertexAttribPointer(texcoordAttribute, 2, gl.FLOAT, false, 0, 0);

    var imageUniform = gl.getUniformLocation(shaderProgramColor, "u_image_color")
    gl.uniform1i(imageUniform, 0);

    var resolutionLocation = gl.getUniformLocation(shaderProgramColor, "u_resolution");
    gl.uniform2f(resolutionLocation, width, height);
    
    var flipYLocation = gl.getUniformLocation(shaderProgramColor, "u_flipY");
    gl.uniform1f(flipYLocation, 1.0);

    applyColorSettings(gl, shaderProgramColor, settings);
    
    
    /*
    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log("logging pixels: ");
    console.log(pixels);
    */


    gl.useProgram(shaderProgramCompute);
    var mouseLocation = gl.getUniformLocation(shaderProgramCompute, "u_mouse");
    gl.uniform2f(mouseLocation, 0, 0);

    var inputStrengthLocation = gl.getUniformLocation(shaderProgramCompute, "u_inputStrength");
    gl.uniform1f(inputStrengthLocation, 0);

    var time = 0;
    
    gl.bindTexture(gl.TEXTURE_2D, textures[time % 2]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[(time + 1) % 2]);


    var update = function(){
        gl.useProgram(shaderProgramCompute);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[time % 2]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[(time + 1) % 2]);
        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.useProgram(shaderProgramColor);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[(time + 1) % 2]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        time += 1;

        

    }
    update();

    terminate = setInterval(function() {
        for (var k = 0; k < settings.speed; k++) {
            update();
        }
    }, settings.delay);

    var toggle = 1.0;
    var onmousedown = function(e) {
        gl.useProgram(shaderProgramCompute);
        if (e.button == 0) {
            gl.uniform2f(mouseLocation, -e.offsetX, e.offsetY);
            gl.uniform1f(inputStrengthLocation, toggle * settings.inputStrength);
            toggle *= -1.0;
        }
        if (e.button == 2) {
            if (terminate != 0) {
                clearInterval(terminate);
                terminate = 0;
            }
            else {
                terminate = setInterval(function() {
                    for (var k = 0; k < settings.speed; k++) {
                        update();
                    }
                }, settings.delay);
            }
            
        }
    }
    var onmouseup = function(e) {
        gl.useProgram(shaderProgramCompute);

        gl.uniform1f(inputStrengthLocation, 0.0);

    }
    var onmousemove = function(e) {
        gl.useProgram(shaderProgramCompute);

        gl.uniform2f(mouseLocation, -e.offsetX, e.offsetY);

    }

    canvas.onmousedown = onmousedown;
    canvas.ontouchstart = onmousedown;
    canvas.onmouseup = onmouseup;
    canvas.ontouchend = onmouseup;
    canvas.onmousemove = onmousemove;
    canvas.ontouchmove = onmousemove;


}

window.onload = main;

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}


function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function applyComputeSettings(gl, shaderProgram, settings) {
    var laplaceLocation = gl.getUniformLocation(shaderProgram, "u_laplace");
    gl.uniform1f(laplaceLocation, settings.laplace);

    var identityLocation = gl.getUniformLocation(shaderProgram, "u_identity");
    gl.uniform1f(identityLocation, settings.identity);

    var derivativeLocation = gl.getUniformLocation(shaderProgram, "u_derivative");
    gl.uniform1f(derivativeLocation, settings.derivative);

    var cubicLocation = gl.getUniformLocation(shaderProgram, "u_cubic");
    gl.uniform1f(cubicLocation, settings.cubic);

    var noiseLocation = gl.getUniformLocation(shaderProgram, "u_noise");
    gl.uniform1f(noiseLocation, settings.noise);

    var inputStrengthLocation = gl.getUniformLocation(shaderProgram, "u_inputStrength");
    gl.uniform1f(inputStrengthLocation, settings.inputStrength);

    var scaleXLocation = gl.getUniformLocation(shaderProgram, "u_scaleX");
    gl.uniform1f(scaleXLocation, settings.scaleX);

    var scaleYLocation = gl.getUniformLocation(shaderProgram, "u_scaleY");
    gl.uniform1f(scaleYLocation, settings.scaleY);

    var scaleTLocation = gl.getUniformLocation(shaderProgram, "u_scaleT");
    gl.uniform1f(scaleTLocation, settings.scaleT);

    var maxValLocation = gl.getUniformLocation(shaderProgram, "u_maxVal");
    gl.uniform1f(maxValLocation, settings.maxVal);

    var boundaryConditionLocation = gl.getUniformLocation(shaderProgram, "u_boundaryCondition");
    gl.uniform1i(boundaryConditionLocation, settings.boundaryCondition);
}

function applyColorSettings(gl, shaderProgram, settings) {
    var colorSensitivityLocation = gl.getUniformLocation(shaderProgram, "u_colorSensitivity");
    gl.uniform1f(colorSensitivityLocation, settings.colorSensitivity);

    var colorMixRatioLocation = gl.getUniformLocation(shaderProgram, "u_colorMixRatio");
    gl.uniform1f(colorMixRatioLocation, settings.colorMixRatio);

    var colorPatternLocation = gl.getUniformLocation(shaderProgram, "u_colorPattern");
    gl.uniform1i(colorPatternLocation, settings.colorPattern);

    var maxValLocation = gl.getUniformLocation(shaderProgram, "u_maxVal_color");
    gl.uniform1f(maxValLocation, settings.maxVal);
}

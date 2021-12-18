import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';


const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 400;
const WIDTH = 400;
const HEIGHT = 400;
const OFFSET_LEFT = 0;
const OFFSET_TOP = 0;
const SCALE_t = 0.3;
const SCALE_x = 1;
const SCALE_y = 1;
const OFFSET_t = 0;
const OFFSET_x = 0;
const OFFSET_y = 0;
const FORCE_INTENSITY = 1.0;
const ACTION_INTENSITY = 0.4;
const ACTION_RADIUS = 40;
const COLOR_SENSITIVITY = 100;
const MAX_VAL = 10;
const FPS = 30;


function App() {

  pixels = new Array(WIDTH);
  for (var i = 0; i < WIDTH; i++) {
    pixels[i] = new Array(HEIGHT);
    for (var j = 0; j < HEIGHT; j++) {
      pixels[i][j] = new Array(3);
      pixels[i][j][0] = 0;
      pixels[i][j][1] = 0;
      pixels[i][j][2] = 0;
    }
  }
  
  var settings =  { laplacian: 2.6,
                    cubic: 0.7,
                    identity: 0.2,
                    derivative: 0.1,
                    noise: 0.003};

  var u_tt = createZeroArray(WIDTH, HEIGHT);
  var u_t = createZeroArray(WIDTH, HEIGHT);
  var u = createZeroArray(WIDTH, HEIGHT);
  var t = 0;

  var color_sensitivity = COLOR_SENSITIVITY;
  var fps = FPS;

  var user_input = false;
  var mouse_x = 0;
  var mouse_y = 0;
  var true_x = 0;
  var true_y = 0;
  var update = function() {
    setZero(u_tt, WIDTH, HEIGHT);
    addLaplaceOf(u, u_tt, settings.laplacian, WIDTH, HEIGHT);
    addCubeOf(u, u_tt, -settings.cubic, WIDTH, HEIGHT);
    addMultipleOf(u, u_tt, -settings.identity, WIDTH, HEIGHT);
    addMultipleOf(u_t, u_tt, -settings.derivative, WIDTH, HEIGHT);
    addGaussianForces(u_tt, WIDTH, HEIGHT, settings.noise);

    if (user_input == true) {
      for (var i = 0; i < WIDTH; i++) {
        for (var j = 0; j < HEIGHT; j++) {
          r_squared = pow(true_x - i, 2) + pow(true_y - j,2);
          R_squared = pow(ACTION_RADIUS,2);
          if (r_squared < R_squared) {
            if(user_input_type == 0) {
                u_tt[i][j] = user_action_sign * ACTION_INTENSITY * pow(2, -R_squared / (R_squared - r_squared));
            }
            else {
                u_tt[i][j] = -user_action_sign * ACTION_INTENSITY * pow(2, -R_squared / (R_squared - r_squared));
            }
          }
        }
      }
    }

    addMultipleOfAndCap(u_tt, u_t, MAX_VAL, SCALE_t, WIDTH, HEIGHT);
    addMultipleOfAndCap(u_t, u, MAX_VAL, SCALE_t, WIDTH, HEIGHT);
    t++;
  }       

  var onMouseMove = function(event) {
    var rect = e.target.getBoundingClientRect();
    var true_x = e.clientX - Math.round(rect.left);
    var true_y = e.clientY - Math.round(rect.top);
  }
  var onMouseDown = function(event) {
    var rect = e.target.getBoundingClientRect();
    var true_x = e.clientX - Math.round(rect.left);
    var true_y = e.clientY - Math.round(rect.top);
    user_input = true;
  }

  var onMouseUp = function(event) {
    user_inpute = false;
  }

  var IntervalID = setInterval(update, Math.floor(1000 / fps));

  
  return (
    <div className="App">
      
    </div>
  );
}


function ModifyOnClick(props) {

  const [opacity,setOpacity] = useState(0.5);

  let handleDown = function() {
    setOpacity(1.0);
  }
  let handleUp = function() {
    setOpacity(0.5);
  }

  return(<div onMouseDown = {handleDown} onMouseUp = {handleUp} style = {{opacity: opacity}}>
    {props.children}
  </div>)
}

export default App;





function createZeroArray(width, height) {
  var result = new Array(width);
  for (var i = 0; i < width; i++) {
    result[i] = new Array(height);
    for(var j = 0; j < height; j++) {
      result[i][j] = 0;
    }
  }
}

function setZero(A, width, height) {
  for (var i = 0; i < width; i++) {
    for(var j = 0; j < height; j++) {
      result[i][j] = 0;
    }
  }
}


function addArrays(A, B, C, width, height) {
  for (var i = 0; i < width; i++) {
    for (var j = 0; j < height; j++) {
      C[i][j] = A[i][j] + B[i][j];
    }
  }
}

function scaleArray(A, lambda, width, height) {
  for (var i = 0; i < width; i++) {
    for (var j = 0; j < height; j++) {
      A[i][j] = lambda * A[i][j];
    }
  }
}


function addLaplaceOf(A, B, lambda, width, height) {
  for (var i = 0; i < width; i++) {
    for (var j = 0; j < height; j++) {
      B[i][j] += lambda * ((A[(((i+1) % width) + width) % width][j] 
              - 2 * A[i][j] 
              + A[(((i-1) % width) + width) % width][j]) / SCALE_x 
              +  (A[i][(((j+1) % height) + height) % height] 
              - 2 * A[i][j] 
              + A[i][(((j-1) % height) + height) % height]) / SCALE_y);
    }
  }
}


function addCubeOf(A, B, lambda, width, height) {
  for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
          B[i][j] += lambda * A[i][j] * A[i][j] * A[i][j];
      }
  }
}
function addGaussianForces(A, width, height, lambda) {
  for (var i = 0; i < width; i++) {
    for (var j = 0; j < height; j++) {
      var gaussian_number = 0 //fill this in
      A[i][j] += lambda * gaussian_number;
    }
  }
}

function addMultipleOf(A, B, lambda, width, height) {
  for (var i = 0; i < width; i++) {
    for (var j = 0; j < height; j++) {
      val = B[i][j] + lambda * A[i][j];
      B[i][j] = val; 
    }
  }
} 

function addMultipleOfAndCap(A, B, max_val, lambda, width, height) {
  for (i = 0; i < width; i++) {
    for (j = 0; j < height; j++) {
      val = B[i][j] + lambda * A[i][j];
      if (val > max_val) val = max_val;
      if (val < -max_val) val = -max_val;
      B[i][j] = val;
    }
  }
}


function mapValueToColor(pixels, u, width, height, color_sensitivity) {
  for (i = 0; i < width; i++) {
    for (j = 0; j < height; j++) {
      if (u[i][j] >= 0) {
        pixels[i][j][0] = (int) ((1 - (1 / (1 + color_sensitivity*u[i][j]))) * 255);
        pixels[i][j][1] = (int) ((1 - (1 / (1 + 0.15 * color_sensitivity*u[i][j]))) * 255);
        pixels[i][j][2] = 0;
      }
      else if (u[i][j] < 0){
        pixels[i][j][0] = 0;
        pixels[i][j][1] = (int) ((1 - (1 / (1 - 0.15 * color_sensitivity*u[i][j]))) * 255);
        pixels[i][j][2] = (int) ((1 - (1 / (1 - color_sensitivity*u[i][j]))) * 255);
      }
      else {
        pixels[i][j][0] = 0;
        pixels[i][j][1] = 255;
        pixels[i][j][2] = 0;
      }
    }
  }
}

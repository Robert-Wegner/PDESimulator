# PDESimulator

This is a simulation of the following nonlinear wave equation:
u_tt = Laplace u - u_t - u - u^3 + xi.
Here xi is Gaussian white noise. The PDE is solved via a simple Euler iteration and a discretized Laplacian.
The simulation as well as the graphics are done in shaders using webgl2. On some devices this may crash the browser.
To run it, simply download the files and open index.html in a browser.
Alternatively, here is a link:
https://storage.googleapis.com/sim-pde/index.html

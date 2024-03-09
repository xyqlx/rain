# A simple example of raining effect simulation using WebGL

> Chris, is it raining again there?

https://github.com/xyqlx/rain/assets/40012783/f420a09e-f298-4516-a2aa-5285a6227b76

## How to run

open `index.html` in your browser

## Parameters

| Parameter | Description |
| --- | --- |
| startPosition | the level of water |
| k | the stiffness of the spring |
| density |  the dampening factor |
| spread | how fast the waves spread |
| piova | the amount of raindrops generated per second |
| raindropVelocity | the vertical velocity of rain |
| windVelocity | the horizontal velocity of rain |

## Other features

- The value of the parameter can be initialized by url parameters
- The value of the parameter can also be changed in the input box (can breakthrough the limit of the range)
- Url parameter will be updated when you change the value of the parameter

## Problems

- If you toggle the page to background and then toggle back, the animation may be paused
- I don't know what's the best parameters for the simulation

## Performance issues

~~When the value of `piova` is up to 500, the FPS will drop obviously. Since I'm not familiar with WebGL, maybe there are some ways to improve the performance.~~

I change 'draw gl.TRIANGLE_FAN in a for loop' to 'draw gl.TRIANGLES in a single call', and the performance is improved a lot😙, now it can process more than 10000 piova easily.

## Reference

[d-harel/raindrops](https://github.com/d-harel/raindrops)

[Make a Splash With Dynamic 2D Water Effects](https://gamedevelopment.tutsplus.com/make-a-splash-with-dynamic-2d-water-effects--gamedev-236t)

## Similiar projects or examples

[CSS](https://foolishdeveloper.com/12-css-rain-effect-simple-rain-animation-effect/)

[Realistic raindrop effect](https://github.com/codrops/RainEffect)

[Animated Rainy Window wallpaper](https://github.com/rocksdanister/rain)

[Another realistic effect](https://github.com/jxa/rain)

[Particle rain effect](https://github.com/akella/ParticleRainEffect)

[Procedural rain generation using PixiJS](https://github.com/ZeroDawn0D/pixirain)

[Rainy Mood: Rain Sounds for Sleep & Study](https://www.rainymood.com/)

[Rain.today](https://rain.today/)

[Frequency-Shaped Natural Rain Noise Generator in mynoise](https://mynoise.net/NoiseMachines/rainNoiseGenerator.php)

## TODO

- [ ] Balance the raindrops in different position (make sure the water level is horizontal when k is 0)

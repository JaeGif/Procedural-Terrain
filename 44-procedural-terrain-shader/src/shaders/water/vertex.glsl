

uniform float uTime;
uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesIterations;
uniform float uSmallWavesSpeed;

// Classic Perlin 3D Noise 
// by Stefan Gustavson
//
#include ../includes/cnoise.glsl

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float elevation = 0.0;


    for (float i = 1.0; i <= uSmallWavesIterations; i++) {
        elevation -= abs(cnoise(vec3(modelPosition.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
    }
    modelPosition.y += elevation;

    // the rest
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

}
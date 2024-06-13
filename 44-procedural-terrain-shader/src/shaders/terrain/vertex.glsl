uniform float uPositionFrequency;

#include ../includes/simplexNoise2d.glsl

float getElevation(vec2 position) {
    float elevation = 0.0;
    elevation += simplexNoise2d(position * uPositionFrequency) / 2.0;
    elevation += simplexNoise2d(position * uPositionFrequency * 2.0) / 4.0;
    elevation += simplexNoise2d(position * uPositionFrequency * 4.0) / 8.0; // never reaches 1

    return elevation;
}

void main() {
    // neighbors normals
    float shift = 0.01;     // consider debugging good shift value
    vec3 positionA = position.xyz + vec3(shift, 0.0, 0.0);
    vec3 positionB = position.xyz + vec3(0.0, 0.0, -shift);






    // elevation
    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;

    positionA.y += getElevation(positionA.xz);
    positionB.y += getElevation(positionB.xz);

    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);

    vec3 normal = cross(toA, toB);
    
}
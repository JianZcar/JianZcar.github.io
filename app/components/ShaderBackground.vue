<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let gl = null
let program = null
let animationFrameId = null
let startTime = null
let fontTexture = null

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform sampler2D u_fontTexture;
  uniform float u_charCount;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(123.45, 678.90))) * 12345.67);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv;
    p.x *= aspect;

    vec3 darkBlue = vec3(0.02, 0.04, 0.08);
    vec3 emerald = vec3(0.1, 0.8, 0.4);

    // Subtle background grid
    vec2 gridScale = vec2(40.0 * aspect, 40.0);
    vec2 gridUv = fract(p * gridScale);
    float grid = smoothstep(0.98, 1.0, gridUv.x) + smoothstep(0.98, 1.0, gridUv.y);
    
    // CI/CD Data Stream Logic (Vertical Bitstreams / Downward Flow)
    float streamScale = 50.0;
    vec2 streamUv = p * vec2(streamScale * aspect, streamScale);
    float colId = floor(streamUv.x);
    
    // Randomized column properties
    float colSpeed = 3.0 + hash(vec2(colId, 1.0)) * 8.0; // High speed downward
    float colOffset = hash(vec2(colId, 2.0)) * 100.0;
    
    // Vertical movement (Always downward)
    float moveY = u_time * colSpeed + colOffset;
    float cellRow = floor(streamUv.y + moveY);
    
    // Packet/Burst logic: data appears in vertical chunks
    float packetId = floor((streamUv.y + moveY) / 10.0);
    float isPacket = step(0.75, hash(vec2(colId, packetId)));
    
    // Sample character
    float charId = floor(hash(vec2(colId, cellRow)) * u_charCount);
    vec2 charUv = fract(vec2(streamUv.x, streamUv.y + moveY));
    charUv = charUv * 0.8 + 0.1; // Padding
    
    vec2 fontUv = vec2((charUv.x + charId) / u_charCount, charUv.y);
    float char = texture2D(u_fontTexture, fontUv).r;
    
    // "Bitstream" glow effect
    float bitGlow = char * isPacket;
    
    // Background moving glow (the "grid thing" that adds colors)
    float noise = sin(p.x * 1.5 + u_time * 0.4) * cos(p.y * 1.5 - u_time * 0.2);
    float glow = smoothstep(-0.2, 0.8, noise);
    
    // Final composition
    vec3 color = mix(darkBlue, emerald * 0.12, glow);
    color += grid * emerald * 0.05; // Subtle grid
    color += bitGlow * emerald * 0.08; // Lowered bitstream opacity
    
    // Add occasional "high intensity" packets (white-ish green)
    float intensity = step(0.97, hash(vec2(colId, packetId)));
    color += bitGlow * vec3(0.8, 1.0, 0.9) * intensity * 0.12; // Lowered intensity opacity

    // Soft vignette
    float vignette = 1.0 - length(uv - 0.5) * 1.2;
    color *= clamp(vignette, 0.6, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"\'#&_(),.;:?!"

const createFontTexture = (gl) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const fontSize = 64
  canvas.width = fontSize * chars.length
  canvas.height = fontSize
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `bold ${fontSize}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'white'
  
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], i * fontSize + fontSize / 2, fontSize / 2)
  }
  
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  
  return texture
}

const initGL = () => {
  const canvas = canvasRef.value
  gl = canvas.getContext('webgl')
  if (!gl) return

  fontTexture = createFontTexture(gl)

  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW)

  const positionLocation = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  startTime = performance.now()
  render()
}

const render = () => {
  if (!gl || !program) return

  const time = (performance.now() - startTime) / 1000
  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight

  if (canvasRef.value.width !== width || canvasRef.value.height !== height) {
    canvasRef.value.width = width
    canvasRef.value.height = height
    gl.viewport(0, 0, width, height)
  }

  gl.useProgram(program)

  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time)
  gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height)
  gl.uniform1f(gl.getUniformLocation(program, 'u_charCount'), chars.length)
  
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, fontTexture)
  gl.uniform1i(gl.getUniformLocation(program, 'u_fontTexture'), 0)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
  animationFrameId = requestAnimationFrame(render)
}

onMounted(() => {
  initGL()
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 w-full h-full -z-1 pointer-events-none" />
</template>

<style scoped>
/* High-speed data bitstream */
</style>

'use client'

// credit for base simulation mechanics: https://codepen.io/josev1207/pen/ZEdEmgQ

import {useEffect, useRef} from 'react'
import * as ChriscoursesPerlinNoise from '@chriscourses/perlin-noise'

export default function PerlinNoiseSimulation() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Animation state
    const animationRef = useRef<number>(0)
    const inputValuesRef = useRef<any[][]>([])
    const zBoostValuesRef = useRef<any[][]>([])
    const mousePosRef = useRef({x: -99, y: -99})
    const zOffsetRef = useRef(0)
    const noiseMinRef = useRef(100)
    const noiseMaxRef = useRef(0)
    const currentThresholdRef = useRef(0)
    const colsRef = useRef(0)
    const rowsRef = useRef(0)

    // Editable values
    const thresholdIncrement = 3
    const thickLineThresholdMultiple = 3
    const res = 8
    const baseZOffset = 0.0005
    const lineColor = '#515255'
    const thinLineColor = '#2B2C2D'
    const thickLineWidth = 2
    const thinLineWidth = 1
    const mouseDown = true

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const setupCanvas = () => {
            const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect()
            canvas.width = rect.width * window.devicePixelRatio
            canvas.height = rect.height * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
            canvas.style.width = rect.width + 'px'
            canvas.style.height = rect.height + 'px'
            colsRef.current = Math.floor(canvas.width / res) + 1
            rowsRef.current = Math.floor(canvas.height / res) + 1

            // Initialize zBoostValues
            for (let y = 0; y < rowsRef.current; y++) {
                zBoostValuesRef.current[y] = []
                for (let x = 0; x <= colsRef.current; x++) {
                    zBoostValuesRef.current[y][x] = 0
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            mousePosRef.current = {x: e.offsetX, y: e.offsetY}
        }

        const handleResize = () => {
            setupCanvas()
        }

        const mouseOffset = () => {
            const mousePos = mousePosRef.current
            const x = Math.floor(mousePos.x / res)
            const y = Math.floor(mousePos.y / res)
            if (inputValuesRef.current[y] === undefined || inputValuesRef.current[y][x] === undefined) return

            const incrementValue = 0.0025
            const radius = 5
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    const distanceSquared = i * i + j * j
                    const radiusSquared = radius * radius

                    if (distanceSquared <= radiusSquared && zBoostValuesRef.current[y + i]?.[x + j] !== undefined) {
                        zBoostValuesRef.current[y + i][x + j] += incrementValue * (1 - distanceSquared / radiusSquared)
                    }
                }
            }
        }

        const generateNoise = () => {
            for (let y = 0; y < rowsRef.current; y++) {
                inputValuesRef.current[y] = []
                for (let x = 0; x <= colsRef.current; x++) {
                    inputValuesRef.current[y][x] =
                        ChriscoursesPerlinNoise.noise(
                            x * 0.02,
                            y * 0.02,
                            zOffsetRef.current + zBoostValuesRef.current[y]?.[x]
                        ) * 100
                    if (inputValuesRef.current[y][x] < noiseMinRef.current)
                        noiseMinRef.current = inputValuesRef.current[y][x]
                    if (inputValuesRef.current[y][x] > noiseMaxRef.current)
                        noiseMaxRef.current = inputValuesRef.current[y][x]
                    if (zBoostValuesRef.current[y]?.[x] > 0) {
                        zBoostValuesRef.current[y][x] *= 0.99
                    }
                }
            }
        }

        const line = (from: number[], to: number[]) => {
            ctx.moveTo(from[0], from[1])
            ctx.lineTo(to[0], to[1])
        }

        const linInterpolate = (x0: number, x1: number, y0 = 0, y1 = 1) => {
            if (x0 === x1) {
                return 0
            }
            return y0 + ((y1 - y0) * (currentThresholdRef.current - x0)) / (x1 - x0)
        }

        const binaryToType = (nw: any, ne: any, se: any, sw: any) => {
            let a = [nw, ne, se, sw]
            return a.reduce((res: number, x: number) => (res << 1) | x)
        }

        const placeLines = (gridValue: number, x: number, y: number) => {
            let nw = inputValuesRef.current[y][x]
            let ne = inputValuesRef.current[y][x + 1]
            let se = inputValuesRef.current[y + 1][x + 1]
            let sw = inputValuesRef.current[y + 1][x]
            let a, b, c, d

            switch (gridValue) {
                case 1:
                case 14:
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, c)
                    break
                case 2:
                case 13:
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    line(b, c)
                    break
                case 3:
                case 12:
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, b)
                    break
                case 11:
                case 4:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    line(a, b)
                    break
                case 5:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, a)
                    line(c, b)
                    break
                case 6:
                case 9:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    line(c, a)
                    break
                case 7:
                case 8:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(d, a)
                    break
                case 10:
                    a = [x * res + res * linInterpolate(nw, ne), y * res]
                    b = [x * res + res, y * res + res * linInterpolate(ne, se)]
                    c = [x * res + res * linInterpolate(sw, se), y * res + res]
                    d = [x * res, y * res + res * linInterpolate(nw, sw)]
                    line(a, b)
                    line(c, d)
                    break
                default:
                    break
            }
        }

        const renderAtThreshold = () => {
            ctx.beginPath()
            const isThickLine = currentThresholdRef.current % (thresholdIncrement * thickLineThresholdMultiple) === 0
            ctx.strokeStyle = isThickLine ? lineColor : thinLineColor
            ctx.lineWidth = isThickLine ? thickLineWidth : thinLineWidth

            for (let y = 0; y < inputValuesRef.current.length - 1; y++) {
                for (let x = 0; x < inputValuesRef.current[y].length - 1; x++) {
                    if (
                        inputValuesRef.current[y][x] > currentThresholdRef.current &&
                        inputValuesRef.current[y][x + 1] > currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x + 1] > currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x] > currentThresholdRef.current
                    )
                        continue
                    if (
                        inputValuesRef.current[y][x] < currentThresholdRef.current &&
                        inputValuesRef.current[y][x + 1] < currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x + 1] < currentThresholdRef.current &&
                        inputValuesRef.current[y + 1][x] < currentThresholdRef.current
                    )
                        continue

                    let gridValue = binaryToType(
                        inputValuesRef.current[y][x] > currentThresholdRef.current ? 1 : 0,
                        inputValuesRef.current[y][x + 1] > currentThresholdRef.current ? 1 : 0,
                        inputValuesRef.current[y + 1][x + 1] > currentThresholdRef.current ? 1 : 0,
                        inputValuesRef.current[y + 1][x] > currentThresholdRef.current ? 1 : 0
                    )

                    placeLines(gridValue, x, y)
                }
            }
            ctx.stroke()
        }

        const animate = () => {
            animationRef.current = requestAnimationFrame(() => animate())

            if (mouseDown) {
                mouseOffset()
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            zOffsetRef.current += baseZOffset
            generateNoise()

            const roundedNoiseMin = Math.floor(noiseMinRef.current / thresholdIncrement) * thresholdIncrement
            const roundedNoiseMax = Math.ceil(noiseMaxRef.current / thresholdIncrement) * thresholdIncrement
            for (let threshold = roundedNoiseMin; threshold < roundedNoiseMax; threshold += thresholdIncrement) {
                currentThresholdRef.current = threshold
                renderAtThreshold()
            }
            noiseMinRef.current = 100
            noiseMaxRef.current = 0
        }

        setupCanvas()
        canvas.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('resize', handleResize)
        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
            canvas.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <div className="w-full h-screen relative">
            <div className="absolute top-0 left-0 z-[1000] text-white gap-[12px] flex items-center p-[28px]">
                <img src="/jpglab.png" alt="jpglab" className="w-[48px] h-[48px] object-contain" />
                <div className="text-[48px] font-jersey leading-none mt-[-10px]">jpglab</div>
            </div>

            <div className="absolute top-0 left-0 z-[1000] w-full h-full flex items-center justify-center">
                <a href="https://github.com/jpglab" target="_blank" rel="noopener noreferrer" className='bg-black py-4 px-8 rounded-md border border-gray-700 flex flex-col items-center'>
                    <svg width="98" height="96" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg" className='scale-50'>
                        <g clipPath="url(#clip0_3_12)">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M48.854 0C21.839 0 0 22 0 49.217C0 70.973 13.993 89.389 33.405 95.907C35.832 96.397 36.721 94.848 36.721 93.545C36.721 92.404 36.641 88.493 36.641 84.418C23.051 87.352 20.221 78.551 20.221 78.551C18.037 72.847 14.801 71.381 14.801 71.381C10.353 68.366 15.125 68.366 15.125 68.366C20.059 68.692 22.648 73.418 22.648 73.418C27.015 80.914 34.052 78.796 36.883 77.492C37.287 74.314 38.582 72.114 39.957 70.892C29.118 69.751 17.714 65.514 17.714 46.609C17.714 41.231 19.654 36.831 22.728 33.409C22.243 32.187 20.544 27.134 23.214 20.371C23.214 20.371 27.339 19.067 36.64 25.423C40.6221 24.3457 44.7288 23.7976 48.854 23.793C52.979 23.793 57.184 24.364 61.067 25.423C70.369 19.067 74.494 20.371 74.494 20.371C77.164 27.134 75.464 32.187 74.979 33.409C78.134 36.831 79.994 41.231 79.994 46.609C79.994 65.514 68.59 69.669 57.67 70.892C59.45 72.44 60.986 75.373 60.986 80.018C60.986 86.618 60.906 91.915 60.906 93.544C60.906 94.848 61.796 96.397 64.222 95.908C83.634 89.388 97.627 70.973 97.627 49.217C97.707 22 75.788 0 48.854 0Z"
                                fill="white"
                            />
                        </g>
                        <defs>
                            <clipPath id="clip0_3_12">
                                <rect width="98" height="96" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                    <p className='text-white text-2xl font-jersey'>github</p>
                </a>
            </div>

            <canvas ref={canvasRef} className="w-full h-auto object-contain" />
        </div>
    )
}

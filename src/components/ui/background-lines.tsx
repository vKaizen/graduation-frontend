"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export const BackgroundLines = ({
  className,
  lineColor = "rgba(255, 255, 255, 0.1)",
  lineWidth = 1,
  lineCount = 20,
  animate = true,
}: {
  className?: string
  lineColor?: string
  lineWidth?: number
  lineCount?: number
  animate?: boolean
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          setupCanvas()
        }
      }
    })

    resizeObserver.observe(canvas)

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      ctx.scale(dpr, dpr)

      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      drawLines()
    }

    let animationFrameId: number
    let offset = 0

    function drawLines() {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = lineColor

      // Horizontal lines
      const horizontalSpacing = canvas.height / (lineCount + 1)
      for (let i = 0; i <= lineCount; i++) {
        const y = i * horizontalSpacing + (animate ? offset % horizontalSpacing : 0)

        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Vertical lines
      const verticalSpacing = canvas.width / (lineCount + 1)
      for (let i = 0; i <= lineCount; i++) {
        const x = i * verticalSpacing + (animate ? offset % verticalSpacing : 0)

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      if (animate) {
        offset += 0.2
        animationFrameId = requestAnimationFrame(drawLines)
      }
    }

    setupCanvas()

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrameId)
    }
  }, [lineColor, lineWidth, lineCount, animate])

  return <canvas ref={canvasRef} className={cn("absolute inset-0 w-full h-full -z-10", className)} />
}

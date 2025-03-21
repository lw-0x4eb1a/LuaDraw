import { createSignal, onMount, onCleanup, createEffect, createMemo, Show } from 'solid-js'
import rect from '../assets/pixel_rect.png'

type CanvasProps = {
  type: "cpu" | "gpu",
  width: number,
  height: number,
  imageBytes?: Uint8Array,
  pixelLog?: Map<string, string>,
}

export default function Canvas(props: CanvasProps) {
  const { width, height } = props
  const [coord, setCoord] = createSignal({x: 0, y: 0})
  const [selectedCoord, setSelectedCoord] = createSignal({x: -1, y: -1})
  const hasSelected = ()=> selectedCoord().x !== -1
  let canvas!: HTMLCanvasElement

  createEffect(()=> {
    let imageBytes = props.imageBytes
    if (imageBytes) {
      const ctx = canvas.getContext("2d")!
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
      image.data.set(imageBytes, 0)
      ctx.putImageData(image, 0, 0)
    }
  })

  const getMouseCoord = (e: MouseEvent) => {
    const { clientX, clientY } = e
    const rect = canvas.getBoundingClientRect()
    const xp = Math.max(0, Math.min(.999, (clientX - rect.left) / rect.width))
    const yp = Math.max(0, Math.min(.999, (clientY - rect.top) / rect.height))
    const x = Math.floor(xp * width) + 1
    const y = Math.floor(yp * height) + 1
    return {x, y}
  }

  const onMouseMove = (e: MouseEvent) => {
    setCoord(getMouseCoord(e))
  }
  
  const onClickCanvas = (e: MouseEvent) => {
    let newCoord = getMouseCoord(e)
    setSelectedCoord(coord=> 
       coord.x === newCoord.x && coord.y === newCoord.y ? {x: -1, y: -1} : newCoord
    )
  }

  const dataAtCoord = createMemo(()=> {
    let imageBytes = props.imageBytes
    let currentColour = ""
    let selectedColour = ""
    let currentPixelLog = ""
    let selectedPixelLog = ""
    if (imageBytes) {
      const getColour = (x: number, y: number) => {
        const idx = (y * width + x) * 4
        return imageBytes.slice(idx, idx + 4).join(", ")
      }

      currentColour = getColour(coord().x - 1, coord().y - 1)
      selectedColour = getColour(selectedCoord().x - 1, selectedCoord().y - 1)
    }
    else {
      currentColour = "/"
      selectedColour = "/"
    }

    if (props.pixelLog) {
      const key1 = `${coord().x} ${coord().y}`
      const key2 = `${selectedCoord().x} ${selectedCoord().y}`
      currentPixelLog = props.pixelLog.get(key1) || ""
      selectedPixelLog = props.pixelLog.get(key2) || ""
    }
    return {
      currentColour,
      selectedColour,
      currentPixelLog,
      selectedPixelLog,
    }
  })

  return (
    <div style={{"width": "400px"}}>
      {/* <div class='aspect-w-4 aspect-h-3 w-full'> */}
        <div class='w-[400px] h-[300px] relative' on:mousemove={onMouseMove}>
          <div class='relative w-full h-full border-1 select-none border-slate-400'>
            <canvas ref={canvas} width={width} height={height} 
              class='h-full'
              on:click={onClickCanvas}
            />
            <Show when={hasSelected()}>
              <img class='absolute pointer-events-none'
                src={rect}
                style={{
                  left: `calc(${(selectedCoord().x - 1) / (width) * 100}% + 1px)`,
                  top: `calc(${(selectedCoord().y - 1)/ (height) * 100}% + 1px)`,
                  height: "calc(3%)"
                }}/>
            </Show>
          </div>
            
        </div>    
      {/* </div> */}
      <div class='p-2'>
        <p>模式: <b>{props.type.toUpperCase()}</b></p>
        <p>当前坐标: {coord().x}, {coord().y}</p>
        <p>值: {dataAtCoord().currentColour}
          <span class='inline-block w-4 h-4 ml-2 align-baseline'
            style={{"background-color": `rgba(${dataAtCoord().currentColour})`}}>
          </span>
        </p>
        {
          dataAtCoord().currentPixelLog &&
          <div class='w-full h-[200px] overflow-y-auto p-2 mt-4 border-1 border-slate-400'>
            <pre class="text-wrap break-all">
              {dataAtCoord().currentPixelLog}
            </pre>
          </div>
        }
        <Show when={hasSelected()}>
          <div class="h-px bg-slate-400 w-full my-2">

          </div>
          <p>选择坐标: {selectedCoord().x}, {selectedCoord().y}</p>
          <p>值: {dataAtCoord().selectedColour}
            <span class='inline-block w-4 h-4 ml-2 align-baseline'
              style={{"background-color": `rgba(${dataAtCoord().selectedColour})`}}>
            </span>
          </p>
          {
            dataAtCoord().selectedPixelLog &&
            <div class='w-full h-[200px] overflow-y-auto p-2 mt-4 border-1 border-slate-400'>
              <pre class="text-wrap break-all">
                {dataAtCoord().selectedPixelLog}
              </pre>
            </div>
          }
        </Show>
        
      </div>
    </div>
  )
}
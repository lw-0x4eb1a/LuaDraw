import { createEffect, createSignal, onMount, Show } from 'solid-js'
import './App.css'

import LuaProcess from './luaprocess.ts?worker'
import render_cpu from './lua/render_cpu.lua?raw'
import render_gpu from './lua/render_gpu.lua?raw'
import base from './lua/base.lua?raw'

import { newLuaState } from './luavm.ts'
import Canvas from './components/Canvas.tsx'
import Button from './components/Button.tsx'
import Editor from './components/Editor.tsx'

const defaultScript = {
  cpu: `print("Hello, Lua Draw!")

for y = 1, HEIGHT do
    for x = 1, y do
        set_colour_at_position({255 - x * 4, y * 8, 100}, {x, y})
    end
end`,

  gpu: `local x, y = get_position()
print("This is GPU mode, in pixel: x = "..x..", y = "..y)

if x > y then
    set_colour({255 - x * 4, y * 8, 100})
end`
}

export default function App() {
  const [width, height] = [40, 30]
  const urlParams = new URLSearchParams(window.location.search)
  // extract ?mode=cpu or ?mode=gpu
  const modeParam = urlParams.get("mode")
  const [mode, setMode] = createSignal<"cpu" | "gpu">(modeParam === "gpu" ? "gpu" : "cpu")

  const [refresh, setRefresh] = createSignal([0])

  const [cpu_script, setCpuScript] = createSignal(defaultScript.cpu)
  const [cpu_image, setCpuImage] = createSignal<Uint8Array>()
  const [cpu_log, setCpuLog] = createSignal("")

  const [gpu_script, setGpuScript] = createSignal(defaultScript.gpu)
  const [gpu_image, setGpuImage] = createSignal<Uint8Array>()
  
  const [gpu_log, setGpuLog] = createSignal("")
  const [pixel_log, setPixelLog] = createSignal(new Map<string, string>())

  onMount(()=> {
    if (import.meta.env.PROD)
      window.onbeforeunload = ()=> "Are you sure you want to leave?"
  })

  // cpu_asnyc
  let cpuTimer = -1
  let cpuKillTimer = -1
  let cpuWorker: Worker | null = null
  createEffect(()=> {
    clearTimeout(cpuTimer)
    if (mode() !== "cpu")
      return
    cpuTimer = setTimeout(()=> {
      if (cpuWorker !== null)
        cpuWorker.terminate()
      const worker = new LuaProcess()
      worker.postMessage({mode: "cpu", width, height, script: cpu_script()})
      let now = Date.now()
      worker.onmessage = (e) => {
        let {log, img} = e.data
        setCpuImage(new Uint8Array(img))
        let dt = Date.now() - now
        if (log.length > 0)
          log = log + "\n\n"
        setCpuLog(log + `运行时间: ${dt}ms`)
        clearTimeout(cpuKillTimer)
      }
      cpuWorker = worker
      clearTimeout(cpuKillTimer)
      cpuKillTimer = setInterval(()=> {
        const dt = Date.now() - now
        if (dt > 1000 * 10) {
          worker.terminate()
          setCpuLog("FAILED: Timeout")
          clearInterval(cpuKillTimer)
        }
        else {
          setCpuLog("Drawing, please wait" + ".".repeat(dt / 1000 % 3 + 1))
        }
      }, 100)
    }, refresh()[0])
  })

  // gpu_async
  let gpuTimer = -1
  let gpuKillTimer = -1
  let gpuWorker: Worker | null = null
  createEffect(()=> {
    clearTimeout(gpuTimer)
    if (mode() !== "gpu")
      return
    gpuTimer = setTimeout(()=> {
      if (gpuWorker !== null)
        gpuWorker.terminate()
      const worker = new LuaProcess()
      worker.postMessage({mode: "gpu", width, height, script: gpu_script()})
      let now = Date.now()
      worker.onmessage = (e) => {
        let {log, img, pixel_log} = e.data
        setGpuImage(new Uint8Array(img))
        let dt = Date.now() - now
        if (log.length > 0)
          log = log + "\n\n"
        setGpuLog(log + `运行时间: ${dt}ms`)
        setPixelLog(pixel_log)
        clearTimeout(gpuKillTimer)
      }
      gpuWorker = worker
      clearTimeout(gpuKillTimer)
      gpuKillTimer = setInterval(()=> {
        const dt = Date.now() - now
        if (dt > 1000 * 10) {
          worker.terminate()
          setGpuLog("FAILED: Timeout")
          clearInterval(gpuKillTimer)
        }
        else {
          setGpuLog("Drawing, please wait" + ".".repeat(dt / 1000 % 3 + 1))
        }
      }, 100)
    }, refresh()[0])
  })
  
  // on cpu_script
  let cTimer = -1
  createEffect(() => {
    return
    let delay = refresh()[0]
    clearTimeout(cTimer)
    let script = cpu_script()
    if (mode() !== "cpu")
      return
    cTimer = setTimeout(()=> {
      let now = Date.now()
      const {exec, set_global} = newLuaState()
      set_global("WIDTH", width)
      set_global("HEIGHT", height)
      set_global("cpu_script", script)
      exec(base)
      exec(render_cpu)
      setCpuImage(exec("return get_image_bytes()"))
      let dt = Date.now() - now
      let log = exec("return get_lua_log()")
      if (log.length > 0)
        log = log + "\n\n"
      setCpuLog(log + `运行时间: ${dt}ms`)
    }, delay)
  })

  // on gpu_script
  let gTimer = -1
  createEffect(()=> {
    return 
    let delay = refresh()[0]
    clearTimeout(gTimer)
    let script = gpu_script()
    if (mode() !== "gpu")
      return
    gTimer = setTimeout(()=> {
      let now = Date.now()
      const {exec, set_global} = newLuaState()
      set_global("WIDTH", width)
      set_global("HEIGHT", height)
      set_global("gpu_script", script)
      exec(base)
      exec(render_gpu)      
      setGpuImage(exec("return get_image_bytes()"))
      let dt = Date.now() - now
      let log = exec("return get_lua_log()")
      if (log.length > 0)
        log = log + "\n\n"
      setGpuLog(log + `运行时间: ${dt}ms`)
      let pixel_log = exec("return get_pixel_log()")
      setPixelLog(pixel_log)
    }, delay)
  })

  return (
    <div class='w-screen h-screen min-h-100'>
      <div class='w-full h-full bg-pink-300/0 p-4 flex items-start justify-center'>
        <div class='w-[100px]'>
          <Button title="CPU模式" onClick={()=>setMode("cpu")}/>
          <Button title="GPU模式" onClick={()=>setMode("gpu")}/>
          <div class='h-5'></div>
          <Button title="重新运行" onClick={()=> setRefresh([0])}/>
        </div>
        <div class='flex flex-col h-full ml-4 mr-4 w-[800px]'>
          <Show when={mode() === "cpu"}>
            <Editor type="cpu" value={cpu_script()} 
            onChange={v=> [setCpuScript(v), setRefresh([500])]}/>
          </Show>
          <Show when={mode() === "gpu"}>
            <Editor type="gpu" value={gpu_script()} 
            onChange={v=> [setGpuScript(v), setRefresh([500])]}/>
          </Show>
          <div class='max-h-[calc(30vh)] overflow-y-auto p-2 mt-4 border-1 border-slate-400'>
            <pre class='text-wrap break-all'>
              {mode() == "cpu" ? cpu_log() : gpu_log()}
            </pre>
          </div>
        </div>
        <div class='flex flex-col'>
          <Show when={mode() === "cpu"}>
            <Canvas type="cpu" width={width} height={height} imageBytes={cpu_image()}/>
          </Show>
          <Show when={mode() === "gpu"}>
            <Canvas type="gpu" width={width} height={height} imageBytes={gpu_image()} pixelLog={pixel_log()}/>
          </Show>
        </div>
      </div>

    </div>
  )
}

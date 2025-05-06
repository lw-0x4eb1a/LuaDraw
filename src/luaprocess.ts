import { newLuaState } from "./luavm"
import render_cpu from './lua/render_cpu.lua?raw'
import render_gpu from './lua/render_gpu.lua?raw'
import base from './lua/base.lua?raw'

const { set_global, exec } = newLuaState()

type Message = {
  mode: "cpu" | "gpu",
  width: number,
  height: number,
  script: string
}

// ipc handlers
self.onmessage = (e)=> {
  const { mode, width, height, script } = e.data as Message
  exec(`WIDTH, HEIGHT = ${width}, ${height}`)
  exec(base)

  if (mode === "cpu") {
    set_global("cpu_script", script)
    exec(render_cpu)
  }
  else {
    set_global("gpu_script", script)
    exec(render_gpu)
  }

  const log = exec("return get_lua_log()") as string
  const img = exec("return get_image_bytes()") as Array<number>
  const buffer = new Uint8Array(img).buffer
  const pixel_log = exec("return select(2, pcall(get_pixel_log))") as Map<string, string>
    
  // @ts-ignore
  self.postMessage({ log, img: buffer, pixel_log }, [buffer])
}
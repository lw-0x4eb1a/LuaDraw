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

  interface LuaResult {
  log: string;
  img: number[];
  pixel_log: Record<string, {
    color: [number, number, number];
    operations: string[];
  }>;
}

const result = exec(`return {
  log = get_lua_log(),
  img = get_image_bytes(),
  pixel_log = select(2, pcall(get_pixel_log))
}`) as LuaResult;

const buffer = new Uint8Array(result.img).buffer;
  
  // @ts-ignore
  self.postMessage({ log, img: buffer, pixel_log }, [buffer])

}
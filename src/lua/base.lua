local LuaLog = {}
local LuaImageData = {}

local floor = math.floor
local ceil = math.ceil
local min = math.min
local max = math.max
local unpack = table.unpack
local char = string.char

-- strip float from js
WIDTH = floor(WIDTH)
HEIGHT = floor(HEIGHT)

function format_args(...)
    local n = select("#", ...)
    local s = {}
    for i = 1, n do 
        s[i] = tostring(select(i, ...)) 
    end
    return table.concat(s, "\t")
end

local old_print = print
local print_to_console = false
function print(...)
    if print_to_console then 
        old_print(...) 
    end

    table.insert(LuaLog, format_args(...))
end

function get_lua_log() 
    return table.concat(LuaLog, "\n") 
end

for _ = 1, WIDTH * HEIGHT do 
    table.insert(LuaImageData, {0, 0, 0, 0}) 
end

local function clamp(v) 
    return max(0, min(255, v)) 
end

function set_colour_at_position(colour, position)
    local err_prefix = "ERROR in set_colour_at_position(colour, position): "
    assert(type(colour) == "table", err_prefix .. "colour must be a table")
    assert(type(position) == "table", err_prefix .. "position must be a table")
    local r, g, b, a = unpack(colour)
    assert(type(r) == "number", err_prefix .. "colour[1] must be a number")
    assert(type(g) == "number", err_prefix .. "colour[2] must be a number")
    assert(type(b) == "number", err_prefix .. "colour[3] must be a number")
    assert(type(a or 0) == "number", "colour[4] must be a number")
    local x, y = unpack(position)
    assert(type(x) == "number", err_prefix .. "position[1] must be a number")
    assert(x >= 1 and x <= WIDTH, err_prefix .. "position[1] must be in range 1–" .. floor(WIDTH))
    assert(type(y) == "number", err_prefix .. "position[2] must be a number")
    assert(y >= 1 and y <= HEIGHT, err_prefix .. "position[2] must be in range 1–" .. floor(HEIGHT))
    x, y = floor(x), floor(y)
    local table_index = (y - 1) * WIDTH + x
    local pixel = LuaImageData[table_index]
    pixel[1] = clamp(r)
    pixel[2] = clamp(g)
    pixel[3] = clamp(b)
    pixel[4] = clamp(a or 255)
end

function get_image_bytes()
    local js = require "js"
    local array = js.new(js.global.Array)
    for _, v in ipairs(LuaImageData) do
        array:push(v[1])
        array:push(v[2])
        array:push(v[3])
        array:push(v[4])
    end
    return array
end

function math.pow(a, b)
    return a ^ b
end
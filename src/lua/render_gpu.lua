local set_colour_at_position = set_colour_at_position
local format_args = format_args
local LuaPixelLog = {}
local unpack = table.unpack
local old_print = print

function get_pixel_log()
    local js = require "js"
    local obj = js.new(js.global.Map)
    for k,v in pairs(LuaPixelLog)do
        obj:set(k, table.concat(v, "\n"))
    end
    return obj
end

local function shuffle_array(array)
    for i = #array, 2, -1 do
        local j = math.random(1, i)
        array[i], array[j] = array[j], array[i]
    end
    return array
end

local function list_position()
    local result = {}
    for y = 1, HEIGHT do 
        for x = 1, WIDTH do 
            table.insert(result, {x, y}) 
        end 
    end
    shuffle_array(result)
    return result
end

local env = setmetatable({}, {
    __index = _G,
    __newindex = function(t, k, v)
        error("Attempt to modified global variable: " .. k)
    end
})

local fn, err = load(gpu_script, "main", "t", env)
if type(fn) == "function" then
    for _, pos in ipairs(list_position()) do
        local x, y = unpack(pos)
        _G.get_position = function() 
            return x, y
        end
        _G.set_colour = function(colour)
            local err_prefix = "ERROR in set_colour(colour): "
            assert(type(colour) == "table", err_prefix .. "colour must be a table")
            local r, g, b, a = unpack(colour)
            assert(type(r) == "number", err_prefix .. "colour[1] must be a number")
            assert(type(g) == "number", err_prefix .. "colour[2] must be a number")
            assert(type(b) == "number", err_prefix .. "colour[3] must be a number")
            assert(type(a or 0) == "number", "colour[4] must be a number")
            set_colour_at_position(colour, pos)
        end
        _G.set_colour_at_position = function()
            error("set_colour_at_position() is not allowed in GPU mode")
        end
        -- print in pixel!
        _G.print = function(...)
            local s = format_args(...)
            old_print("("..x..", "..y.."): "..s)
            if LuaPixelLog[x.." "..y] == nil then
                LuaPixelLog[x.." "..y] = {}
            end
            table.insert(LuaPixelLog[x.." "..y], s)
        end

        local success = xpcall(fn, function(err)
            print("ERROR: " .. err .. "\n" .. debug.traceback())
        end)
        if not success then
            old_print("\nError occurred at position ("..x..", "..y.."), abort drawing.")
            break
        end
    end

else
    print("Incorrect syntax: " .. err)
end
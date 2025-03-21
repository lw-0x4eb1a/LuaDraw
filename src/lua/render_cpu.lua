local fn, err = load(cpu_script, "cpu")
if type(fn) == "function" then
    xpcall(fn, function(err)
        print("ERROR: " .. err .. "\n" .. debug.traceback())
    end)
else
    print("Incorrect syntax: " .. err)
end

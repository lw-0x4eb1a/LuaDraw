print("Testing...")
print("Reset print function")

LuaPrint = ""
local function print(...)
  local n = select("#", ...)
  local s = {}
  for i = 1, n do
    s[i] = tostring(select(i, ...))
  end
  LuaPrint = LuaPrint .. table.concat(s, "\t") .. "\n"
end

print(ccc, type(ccc))
print(ddd, type(ddd))
print(eee, type(eee))
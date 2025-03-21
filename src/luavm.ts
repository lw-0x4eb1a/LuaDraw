import {
	lua, 
	lauxlib, 
	lualib, 
	interop,
	luastring_eq,
	luastring_indexOf,
	luastring_of,
	to_jsstring,
	to_luastring,
	to_uristring,
	/* @ts-ignore */
} from 'fengari-web'

const {
	LUA_ERRRUN,
	LUA_ERRSYNTAX,
	LUA_OK,
	LUA_VERSION_MAJOR,
	LUA_VERSION_MINOR,
	lua_Debug,
	lua_getinfo,
	lua_getstack,
	lua_gettop,
	lua_insert,
	lua_pcall,
	lua_pop,
	lua_pushcfunction,
	lua_pushstring,
	lua_pushnil,
	lua_settable,
	lua_remove,
	lua_setglobal,
	lua_getglobal,
	lua_tojsstring
} = lua

const {
	luaL_loadbuffer,
	luaL_newstate,
	luaL_requiref
} = lauxlib

const {
	checkjs,
	luaopen_js,
	push,
	tojs
} = interop

export function newLuaState() {
	const L = luaL_newstate();

	/* open standard libraries */
	lualib.luaL_openlibs(L);
	luaL_requiref(L, to_luastring("js"), luaopen_js, 1);
	lua_pop(L, 1); /* remove lib */

	/* remove io, os, corountine */
	lua_pushnil(L);
	lua_setglobal(L, to_luastring("io"));
	lua_pushnil(L);
	lua_setglobal(L, to_luastring("os"));
	lua_pushnil(L);
	lua_setglobal(L, to_luastring("coroutine"));

	/* Helper function to load a JS string of Lua source */
	function load(source: string | Uint8Array, chunkname?: string) {
		if (typeof source == "string")
			source = to_luastring(source);
		else if (!(source instanceof Uint8Array))
			throw new TypeError("expects an array of bytes or javascript string");

		chunkname = chunkname?to_luastring(chunkname):null;
		let ok = luaL_loadbuffer(L, source, null, chunkname);
		let res;
		if (ok === LUA_ERRSYNTAX) {
			res = new SyntaxError(lua_tojsstring(L, -1));
		} else {
			res = tojs(L, -1);
		}
		lua_pop(L, 1);
		if (ok !== LUA_OK) {
			throw res;
		}
		return res;
	}

	/* Load and execute a Lua script */
	function exec(source: string | Uint8Array, chunkname?: string): any {
		try {
			return load(source, chunkname)();
		}
		catch (e) {
			console.error(e);
		}
	}

	/* Set global vars */
	function set_global(key: string, value: string | number | boolean) {
		push(L, value);
		lua_setglobal(L, to_luastring(key));
	}

	function get_global(key: string) {
		lua_getglobal(L, to_luastring(key));
		return tojs(L, -1);
	}

	return {L, load, exec, set_global, get_global};
}
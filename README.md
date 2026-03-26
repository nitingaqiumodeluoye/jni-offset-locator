# jni-offset-locator

A Codex skill for locating JNI/native method addresses and module offsets in Android reverse engineering.

## Included

- `SKILL.md` - skill instructions
- `scripts/get_jni_offset.js` - ArtMethod-based JNI entry locator
- `scripts/find_register_natives.js` - RegisterNatives hook fallback

## Typical use

### 1. Default target class

```bash
frida -U -f <package> -l scripts/get_jni_offset.js
```

### 2. Override target class

```bash
frida -U -f <package> -e "globalThis.JNI_TARGET_CLASS='com.example.NativeClass'" -l scripts/get_jni_offset.js
```

### 3. Fallback when ArtMethod layout is unstable

```bash
frida -U -f <package> -l scripts/find_register_natives.js
```

## Notes

- `get_jni_offset.js` is faster but may fail on some Android/ROM combinations.
- `find_register_natives.js` is safer across versions and useful for AndJni-style wrappers.

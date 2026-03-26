---
name: jni-offset-locator
description: Use when you need to find the JNI/native function address or module offset for a Java native method in Android reverse engineering. Includes an ArtMethod-based Frida script at scripts/get_jni_offset.js and a safer RegisterNatives fallback at scripts/find_register_natives.js when ART layout access fails.
---

# JNI Offset Locator

Use this skill when the task is to obtain a JNI entry address, module name, or module offset from a Java native method.

## Workflow

1. Try `scripts/get_jni_offset.js` first.
2. Pass the target class with `globalThis.JNI_TARGET_CLASS` when needed.
3. Run it with Frida against the target app.
4. If it fails with ART-layout issues, switch to `scripts/find_register_natives.js`.

## Primary script

`scripts/get_jni_offset.js`

Use this when `ArtMethod` access is stable on the device.

Default target class:

```js
com.fort.andJni.JniLib1758160095
```

Override target class:

```bash
frida -U -f <package> -e "globalThis.JNI_TARGET_CLASS='com.example.NativeClass'" -l scripts/get_jni_offset.js
```

Default usage:

```bash
frida -U -f <package> -l scripts/get_jni_offset.js
```

## Fallback script

`scripts/find_register_natives.js`

Use this when you see errors such as access violation, invalid `ArtMethod`, or Android/ROM mismatch. It hooks `libart.so` `RegisterNatives` and prints JNI registration targets with module offsets.

Example:

```bash
frida -U -f <package> -l scripts/find_register_natives.js
```

## Output format

Return:

- class
- method
- native address
- module name
- module offset
- whether the address is a JNI wrapper entry or only the registration target

## Notes

- `scripts/get_jni_offset.js` is faster but fragile across Android versions.
- For wrappers like `JniLib1758160095.cL(this, context, 25)`, the located address is usually the JNI wrapper entry. The selector value may require extra native analysis to find the final internal branch.
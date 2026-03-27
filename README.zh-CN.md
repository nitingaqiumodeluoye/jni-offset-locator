# jni-offset-locator

[English](./README.md) | [简体中文](./README.zh-CN.md)

一个用于 Android 逆向场景中定位 JNI/native 方法地址与模块偏移的 Codex skill。

## 包含内容

- `SKILL.md` - skill 说明
- `scripts/get_jni_offset.js` - 基于 ArtMethod 的 JNI 入口定位脚本
- `scripts/find_register_natives.js` - 基于 RegisterNatives 的兜底脚本

## 常见用法

### 1. 使用默认目标类

```bash
frida -U -f <package> -l scripts/get_jni_offset.js
```

### 2. 传入自定义目标类

```bash
frida -U -f <package> -e "globalThis.JNI_TARGET_CLASS='com.example.NativeClass'" -l scripts/get_jni_offset.js
```

### 3. ArtMethod 布局不稳定时使用兜底方案

```bash
frida -U -f <package> -l scripts/find_register_natives.js
```

## 说明

- `get_jni_offset.js` 速度更快，但在部分 Android/ROM 组合上可能失效。
- `find_register_natives.js` 跨版本更稳，适合 AndJni 这类包装场景。

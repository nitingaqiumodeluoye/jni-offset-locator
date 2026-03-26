/**
 * Usage:
 *   frida -U -f <package> -l scripts/get_jni_offset.js
 *   frida -U -f <package> -e "globalThis.JNI_TARGET_CLASS='com.fort.andJni.JniLib1758160095'" -l scripts/get_jni_offset.js
 */

var DEFAULT_TARGET_CLASS = 'com.fort.andJni.JniLib1758160095';

function getTargetClass() {
    try {
        if (typeof globalThis !== 'undefined' && globalThis.JNI_TARGET_CLASS) {
            return String(globalThis.JNI_TARGET_CLASS);
        }
    } catch (e) {}
    return DEFAULT_TARGET_CLASS;
}

function findNativeAddress(soName, javaClassName, targetMethodName) {
    var exports = Module.enumerateExportsSync(soName);
    var lowerClassName = javaClassName.replace(/\./g, '_');
    for (var i = 0; i < exports.length; i++) {
        var exp = exports[i];
        if (exp.type === 'function' &&
            exp.name.indexOf(lowerClassName) !== -1 &&
            exp.name.indexOf(targetMethodName) !== -1 &&
            exp.name.indexOf('CheckJNI') === -1) {
            console.log('[+] Found native method: ' + exp.name + ' @ ' + exp.address);
            return ptr(exp.address);
        }
    }
    return null;
}

function entryPointFromJniOffset() {
    var soName = 'libandroid_runtime.so';
    var className = 'android.os.Process';
    var methodName = 'getUidForName';
    var native_addr = findNativeAddress(soName, className, methodName);
    if (native_addr === null) {
        console.log('[-] Native function not found.');
        return -1;
    }

    var clazz = Java.use(className).class;
    var methods = clazz.getDeclaredMethods();
    for (var i = 0; i < methods.length; i++) {
        var fullMethodName = methods[i].toString();
        var flags = methods[i].getModifiers();
        if (flags & 256) {
            if (fullMethodName.indexOf(methodName) !== -1) {
                var art_method = methods[i].getArtMethod();
                for (var j = 0; j < 64; j++) {
                    try {
                        var maybePtr = Memory.readPointer(ptr(art_method).add(j));
                        if (native_addr.equals(maybePtr)) {
                            return j;
                        }
                    } catch (e) {}
                }
            }
        }
    }
    return -1;
}

function getJniMethodAddr(className) {
    Java.perform(function () {
        var obj = Java.use(className);
        var clazz = obj.class;
        var jni_entrypoint_offset = entryPointFromJniOffset();

        console.log('========== [ JNI Method Info Dump ] ==========');
        console.log('[*] Target class: ' + className);
        console.log('[*] entry_point_from_jni_ offset = ' + jni_entrypoint_offset + ' bytes\n');

        if (jni_entrypoint_offset < 0) {
            console.log('[-] Failed to locate entry_point_from_jni_ offset; try scripts/find_register_natives.js');
            return;
        }

        var methods = clazz.getDeclaredMethods();
        var count = 0;
        for (var i = 0; i < methods.length; i++) {
            var m = methods[i];
            var flags = m.getModifiers();
            var methodName = m.toString();
            if ((flags & 256) !== 0) {
                count++;
                try {
                    var art_method = m.getArtMethod();
                    var native_addr = Memory.readPointer(ptr(art_method).add(jni_entrypoint_offset));
                    var module = Process.findModuleByAddress(native_addr);
                    var offset = module ? native_addr.sub(module.base) : ptr(0);
                    console.log('------------ [ #' + count + ' Native Method ] ------------');
                    console.log('Method Name     : ' + methodName);
                    console.log('ArtMethod Ptr   : ' + ptr(art_method));
                    console.log('Native Addr     : ' + native_addr);
                    if (module) {
                        console.log('Module Name     : ' + module.name);
                        console.log('Module Offset   : 0x' + offset.toString(16));
                        console.log('Module Base     : ' + module.base);
                        console.log('Module Size     : ' + module.size + ' bytes');
                        console.log('Module Path     : ' + module.path);
                    } else {
                        console.log('Module Info     : [ Not Found ]');
                    }
                    console.log('------------------------------------------------\n');
                } catch (e) {
                    console.log('[!] Failed reading native entry for ' + methodName + ': ' + e);
                }
            }
        }

        if (count === 0) {
            console.log('[-] No native methods found in class: ' + className);
        } else {
            console.log('[*] Total native methods found: ' + count);
        }
        console.log('===============================================');
    });
}

function main() {
    var targetClass = getTargetClass();
    console.log('[*] JNI_TARGET_CLASS = ' + targetClass);
    getJniMethodAddr(targetClass);
}

setImmediate(main);

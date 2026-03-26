function hookRegisterNatives() {
    var symbols = Module.enumerateSymbolsSync('libart.so');
    var targets = [];
    for (var i = 0; i < symbols.length; i++) {
        var s = symbols[i];
        if (s.name.indexOf('RegisterNatives') !== -1 && s.name.indexOf('CheckJNI') === -1) {
            targets.push(s.address);
            console.log('[+] found RegisterNatives: ' + s.name + ' @ ' + s.address);
        }
    }
    if (targets.length === 0) {
        console.log('[-] RegisterNatives symbol not found');
        return;
    }

    var seen = {};
    targets.forEach(function (addr) {
        var key = addr.toString();
        if (seen[key]) return;
        seen[key] = true;

        Interceptor.attach(addr, {
            onEnter: function (args) {
                var env = null;
                var className = 'unknown';
                try {
                    env = Java.vm.tryGetEnv();
                    if (env) className = env.getClassName(args[1]);
                } catch (e) {}

                var methodCount = args[3].toInt32();
                var methodsPtr = args[2];
                var pSize = Process.pointerSize;
                var itemSize = pSize * 3;

                console.log('\n[***] RegisterNatives for ' + className + ', count=' + methodCount);
                for (var i = 0; i < methodCount; i++) {
                    var item = methodsPtr.add(i * itemSize);
                    var namePtr = item.readPointer();
                    var sigPtr = item.add(pSize).readPointer();
                    var fnPtr = item.add(pSize * 2).readPointer();
                    var name = namePtr.readCString();
                    var sig = sigPtr.readCString();
                    var mod = Process.findModuleByAddress(fnPtr);
                    var msg = '    ' + name + ' ' + sig + ' => ' + fnPtr;
                    if (mod) msg += ' [' + mod.name + ' + ' + ptr(fnPtr).sub(mod.base) + ']';
                    console.log(msg);
                }
            }
        });
    });
}

setImmediate(function () {
    hookRegisterNatives();
    console.log('[+] hook installed');
});

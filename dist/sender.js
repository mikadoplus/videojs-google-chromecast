(function () {
    var e = function (a) {
            return !!document.currentScript && (-1 != document.currentScript.src.indexOf("?" + a) || -1 != document.currentScript.src.indexOf("&" + a));
        },
        f = "/cast_sender.js",
        g = e("loadCastFramework") || e("loadCastApplicationFramework"),
        h = function () {
            return "function" == typeof window.__onGCastApiAvailable ? window.__onGCastApiAvailable : null;
        },
        k = ["pkedcjkdefgpdelpbcmbmeomcjbeemfm", "enhhojjnijigcajfphajepfemndkmdlo"],
        m = function (a) {
            a.length
                ? l(a.shift(), function () {
                    m(a);
                })
                : n();
        },
        p = function (a) {
            return "chrome-extension://" + a + f;
        },
        l = function (a, c, b) {
            var d = document.createElement("script");
            d.onerror = c;
            b && (d.onload = b);
            d.src = a;
            (document.head || document.documentElement).appendChild(d);
        },
        n = function () {
            var a = h();
            a && a(!1, "No cast extension found");
        },
        q = function () {
            if (g) {
                var a = 2,
                    c = h(),
                    b = function () {
                        a--;
                        0 == a && c && c(!0);
                    };
                window.__onGCastApiAvailable = b;
                l("https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js", n, b);
            }
        };
    if (window.navigator.userAgent.indexOf("Android") >= 0){
        (q(), m(k.map(p)));
    }
    if (0 <= window.navigator.userAgent.indexOf("Chrome/") && window.navigator.presentation) {
        q();
        var r = ["Chrome", "81"]; // Force a Chrome version in order to be able to load the chromecasts features
        m(["https://www.gstatic.com/eureka/clank/" + (r ? parseInt(r[1], 10) : 0) + f, "https://www.gstatic.com/eureka/clank" + f]);
    } else {
        if (!window.chrome || !window.navigator.presentation || 0 <= window.navigator.userAgent.indexOf("Edge")) {
            n();
        } else {
            (q(), m(k.map(p)));
        }
    }
})();


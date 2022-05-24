/* Copyright© 2000 - 2022 SuperMap Software Co.Ltd. All rights reserved.
 * This program are made available under the terms of the Apache License, Version 2.0
 * which accompanies this distribution and is available at http://www.apache.org/licenses/LICENSE-2.0.html.*/
(function() {
    var r = new RegExp('(^|(.*?\\/))(include-openlayers.js)(\\?|$)'),
        s = document.getElementsByTagName('script'),
        targetScript;
    for (var i = 0; i < s.length; i++) {
        var src = s[i].getAttribute('src');
        if (src) {
            var m = src.match(r);
            if (m) {
                targetScript = s[i];
                break;
            }
        }
    }

    function inputScript(url) {
        var script = '<script type="text/javascript" src="' + url + '"><' + '/script>';
        document.writeln(script);
    }

    function inputCSS(url) {
        var css = '<link rel="stylesheet" href="' + url + '">';
        document.writeln(css);
    }

    function inArray(arr, item) {
        for (i in arr) {
            if (arr[i] == item) {
                return true;
            }
        }
        return false;
    }

    function supportES6() {
        var code = "'use strict'; class Foo {}; class Bar extends Foo {};";
        try {
            new Function(code)();
        } catch (err) {
            return false;
        }
        if (!Array.from) {
            return false;
        }
        return true;
    }

    //加载类库资源文件
    function load() {
        var includes = (targetScript.getAttribute('include') || '').split(',');
        var excludes = (targetScript.getAttribute('exclude') || '').split(',');
        if (!inArray(includes, 'ol-debug') && !inArray(includes, 'ol@4.6.5') && !inArray(excludes, 'ol')) {
            inputCSS('libs/openlayers/6.9.0/ol.css');
            inputScript('libs/openlayers/6.9.0/ol.js');
        }
        if (inArray(includes, 'ol@4.6.5')) {
            inputCSS('libs/openlayers/4.6.5/ol.css');
            inputScript('libs/openlayers/4.6.5/ol.js');
        }
        if (inArray(includes, 'ol-debug')) {
            inputCSS('libs/openlayers/4.6.5/ol-debug.css');
            inputScript('libs/openlayers/4.6.5/ol-debug.js');
        }
        if (inArray(includes, 'mapv')) {
            inputScript('libs/mapv/2.0.62/mapv.min.js');
        }
        if (inArray(includes, 'turf')) {
            inputScript('libs/turf/5.1.6/turf.min.js');
        }
        if (inArray(includes, 'echarts')) {
            inputScript('libs/echarts/4.9.0/echarts.min.js');
        }
        if (inArray(includes, 'proj4')) {
            inputScript('libs/proj4/2.7.5/proj4.js');
        }
        if (inArray(includes, 'ol3-echarts')) {
            inputScript('libs/openlayers/ol3-echarts/2.0.4/ol3Echarts.min.js');
        }
        if (inArray(includes, 'ol3-echarts@1.3.6')) {
            inputScript('libs/openlayers/ol3-echarts/1.3.6/ol3Echarts.min.js');
        }
        if (inArray(includes, 'ol-mapbox-style')) {
            inputScript('libs/openlayers/plugins/ol-mapbox-style/2.11.2-4/olms.js');
        }
        if (inArray(includes, 'deck')) {
            inputScript('libs/deck.gl/5.1.3/deck.gl.min.js');
        }
        if (inArray(includes, 'osmbuildings')) {
            inputScript('libs/osmbuildings/OSMBuildings-OL3.js');
        }
        if (inArray(includes, 'animatedclusterlayer')) {
            inputScript('libs/openlayers/plugins/animatedclusterlayer/animatedclusterlayer.js');
        }
        if (inArray(includes, 'layerswitcher')) {
            inputCSS('libs/openlayers/plugins/ol-layerswitcher/3.8.3/ol-layerswitcher.css');
            inputScript('libs/openlayers/plugins/ol-layerswitcher/3.8.3/ol-layerswitcher.js');
        }
        if (inArray(includes, 'jsonsql')) {
            inputScript('libs/jsonsql/jsonsql.js');
        }
        if (inArray(includes, 'geostats')) {
            inputScript('libs/geostats/geostats.js');
        }
        if (inArray(includes, 'canvg')) {
            inputScript('libs/canvg/canvg.min.js');
        }
        if (inArray(includes, 'tensorflow')) {
            inputScript('libs/tensorflow/3.9.0/tf.min.js');
        }
        if (!inArray(excludes, 'iclient-openlayers')) {
            if (supportES6()) {
                inputScript('dist/openlayers/iclient-openlayers-es6.min.js');
            } else {
                inputScript('dist/openlayers/iclient-openlayers.min.js');
            }
        }
        if (!inArray(excludes, 'iclient-openlayers-css')) {
            inputCSS('dist/openlayers/iclient-openlayers.min.css');
        }
    }

    load();
    window.isLocal = true;
    window.server = document.location.toString().match(/file:\/\//)
        ? 'http://localhost:8090'
        : document.location.protocol + '//' + document.location.host;
})();

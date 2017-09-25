/**
 * @file csssupports.js
 * @author: caoyu03
 * @path: widget/js/util/csssupports.js
 * @description: css属性支持性测试
 */

var css3Check = (function () {
    var div = document.createElement('div');
    var vendors = 'Moz O ms Webkit'.split(' ');

    return function (prop) {
        // 复位前缀个数
        var len = vendors.length;

        var propArr = prop.split('-');
        var propLen = propArr.length;
        while (propLen > 1) {
            propLen--;
            propArr[propLen] = propArr[propLen].replace(/^[a-z]/, function (val) {
                return val.toUpperCase();
            });
        }
        prop = propArr.join('');

        if (prop in div.style) {
            return prop;
        }

        prop = prop.replace(/^[a-z]/, function (val) {
            return val.toUpperCase();
        });

        while (len > 0) {
            len--;
            if (vendors[len] + prop in div.style) {
                return vendors[len] + prop;
            }
        }
        return false;
    };
})();

export default css3Check;

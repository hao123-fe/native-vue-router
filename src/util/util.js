/**
 * 基本工具方法
 */
export let assign = function (a, b) {
    for (const key in b) {
        a[key] = b[key];
    }
    return a;
}
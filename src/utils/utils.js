export function isEnglish(str) {
    var charCode = str.charCodeAt(0);
    return (charCode >= 97 && charCode <=122) || (charCode >= 65 && charCode <= 90); 
}

export function isHebrew(str) {
    var charCode = str.charCodeAt(0);
    return (charCode >= 1488 && charCode <=1514);
}

export function getDir(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var str = div.textContent;
    var dir;
    for (let i=0,ii=str.length;i<ii;i++) {
        let char = str[i];
        if (isHebrew(char)) dir = "rtl";
        if (isEnglish(char)) dir = "ltr";
        if (dir) break;
    }
    return dir || "ltr";
}
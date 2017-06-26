window.state = "ok";
window.onerror = function(msg, url, line, col, error) {
    var wrap = document.getElementById("errorWrapper")
    if (window.state == "ok") {
        wrap.textContent = "";
        window.state = "unstable";
    }

    wrap.textContent += msg;

    if (line && url) {
        wrap.textContent += "Line " + line + " in file " + url;
    }

    wrap.style.color = "#FF2634";
    wrap.style.fontWeight = "bold";
};

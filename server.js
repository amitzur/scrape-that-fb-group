var port = 9090,
    path = __dirname + "/dist/data/versions/@.json",
    outFile = __dirname + "/dist/data/0.json",
    fs = require("fs"),
    http = require("http"),
    fileIndex = findIndex();
    
function filename(index) {
    return path.replace("@", index);
}

function findIndex() {
    var i = 0, MAX = 1000;
    while(fs.existsSync(filename(i)) && i <= MAX) i++;
    if (i === MAX) i = 0;
    return i;
}

console.log("output file will be " + outFile); 
console.log("first version file will be " + filename(fileIndex)); 
    
http.createServer(function(req, res) {
    console.log("request: "+ req.url);
    
    var body = '';
    req.on("data", function(data) { 
        body += data;
    });
    req.on("end", function() {
        var file = filename(fileIndex);
        console.log("req data: " + body.substr(0,100));
        console.log("writing to file " + file);
        fs.writeFileSync(outFile, body);
        fs.writeFileSync(outFile, file);
        fs.writeFileSync(path.replace("@.json", "fileIndex"), String(fileIndex++));
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end("wrote to file: " + file);
    });
}).listen(port, function() {
    console.log("running on port " + port + "...");
});
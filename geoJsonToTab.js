var fs = require ('fs');
fs.readFile ('kk.json', 'utf8', function(err, data) {
    obj = JSON.parse(data);
//  console.log (obj.features);

    features = obj.features;
    
    features.forEach ( function(x) {
        p = x.properties;
        console.log (p.CODE1+"\t"+p.CODE2+"\t"+p.VILLAGE+"\t"+p.TOWN);
    });
});

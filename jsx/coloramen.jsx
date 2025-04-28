$._coloramen = {};

$._coloramen.pickColor = function(oldColor, path) {
    var externalLibrary = new ExternalObject("lib:" + path);
    var newColor = externalLibrary.colorPicker(oldColor, "Color");
    return (newColor === -1) ? oldColor : newColor;
};

$._coloramen.applyColorama = function(path) {
    try {
        app.beginUndoGroup("Apply Colorama");
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            throw "Please select a composition";
        }
        var selectedLayers = comp.selectedLayers;
        var numSelectedLayers = selectedLayers.length;
        if (numSelectedLayers !== 1) {
            throw "Please select a single layer";
        }
        var layer = selectedLayers[0];
        var preset = new File(path);
        layer.applyPreset(preset);
        app.endUndoGroup();
    } catch (err) {
        alert("Coloramen\n" + err);
    }
};

$._coloramen.showAbout = function() {
    var message = [
        "Coloramen 2.0.0",
        "Colorama helper panel\n",
        "lachrymal.net 2021",
        "Kyle Martinez 2025"
    ].join("\n");
    alert(message);
};

$._coloramen.getPropMap = function(inputString, compName, gradientIndex) {
    var compNameIndex = inputString.indexOf(compName);

    var compSubstring = inputString.slice(compNameIndex);
    var layerRegex = new RegExp("Pulling gradient\\.[\\s\\S]*?LIST", "ig");
    var layerMatch = layerRegex.exec(compSubstring);

    var layerSubstring = compSubstring.slice(layerMatch.index + layerMatch[0].length);

    var propMapRegex = new RegExp("<prop\\.map version='4'>([\\s\\S]*?)<\\/prop\\.map>", "ig");

    var propMapMatches = [];
    var match;
    while ((match = propMapRegex.exec(layerSubstring)) !== null) {
        propMapMatches.push(match[0]);
    }

    return propMapMatches[gradientIndex - 1];
};

$._coloramen.toHex = function(value) {
    var hex = value.toString(16).toUpperCase();
    return (hex.length === 1) ? "0" + hex : hex;
};

$._coloramen.getGradientStops = function(xmlString) {
    var stopRegex = new RegExp("<key>Stop-\\d+<\\/key>[\\s\\S]*?<\\/prop\\.list>", "g");

    var stopBlocks = xmlString.match(stopRegex) || [];
    var result = [];

    var stopKeyRegex = new RegExp("<key>(Stop-\\d+)<\\/key>");
    var floatRegex = new RegExp("<float>(.*?)<\\/float>", "g");
    var floatTagRegex = new RegExp("<\\/?float>", "g");

    for (var i = 0; i < stopBlocks.length; i++) {
        var block = stopBlocks[i];

        var nameMatch = block.match(stopKeyRegex);
        var name = nameMatch ? nameMatch[1] : null;

        var floatMatches = block.match(floatRegex) || [];
        var floatValues = [];
        for (var j = 0; j < floatMatches.length; j++) {
            floatValues.push(parseFloat(floatMatches[j].replace(floatTagRegex, "")));
        }

        if (name && floatValues.length > 0) {
            var existingStop = null;
            for (var k = 0; k < result.length; k++) {
                if (result[k].name === name) {
                    existingStop = result[k];
                    break;
                }
            }

            if (!existingStop) {
                existingStop = {
                    "name": name
                };
                result.push(existingStop);
            }

            if (floatValues.length === 3) {
                existingStop.opacity = parseFloat((floatValues[2] * 100).toFixed(2));
            } else if (floatValues.length === 6) {
                existingStop.location = parseFloat((floatValues[0] * 100).toFixed(2));
                var r = Math.round(floatValues[2] * 255);
                var g = Math.round(floatValues[3] * 255);
                var b = Math.round(floatValues[4] * 255);
                existingStop.color = {
                    "ae": [floatValues[2], floatValues[3], floatValues[4]],
                    "rgb": [r, g, b],
                    "hex": this.toHex(r) + this.toHex(g) + this.toHex(b)
                };
            }
        }
    }

    return result;
};

$._coloramen.getSelectedGradientIndex = function(comp, index) {

    function iterateThroughProperties(propertyGroup) {
        var numProperties = propertyGroup.numProperties;
        for (var p = 1; p <= numProperties; p++) {
            var property = propertyGroup.property(p);
            if (property.propertyType === PropertyType.PROPERTY) {
                if (property.matchName === "ADBE Vector Grad Colors") {
                    index = index + 1;
                    if (property.selected === true) {
                        return index;
                    }
                }
            }
            if (property.propertyType === PropertyType.INDEXED_GROUP ||
                property.propertyType === PropertyType.NAMED_GROUP) {
                var result = iterateThroughProperties(property);
                if (result !== null) {
                    return result;
                }
            }
        }
        return null;
    }

    return iterateThroughProperties(comp.selectedLayers[0]);
};

$._coloramen.getProjectFileString = function() {
    var layer = app.project.activeItem.selectedLayers[0];
    var originalName = layer.name;
    layer.name = "Pulling gradient...";
    app.project.save();

    var file = new File(app.project.file.absoluteURI);
    file.open("r");
    var fileString = file.read(file.length).toString();
    file.close();

    layer.name = originalName;
    app.project.save();
    return fileString;
};

$._coloramen.getSelectedGradientProperty = function(comp) {
    var properties = [];
    var selectedProperties = comp.selectedProperties;
    var numProperties = selectedProperties.length;
    for (var p = 0; p < numProperties; p++) {
        var property = selectedProperties[p];
        if (property.matchName === "ADBE Vector Grad Colors") {
            properties.push(property);
        }
    }
    return (properties.length === 1) ? properties[0] : false;
};

$._coloramen.getGradientFromAE = function() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            throw "Please select a composition";
        }
        var property = this.getSelectedGradientProperty(comp);
        if (!property) {
            throw "Please select a single gradient color property";
        }
        var fileString = this.getProjectFileString();
        var gradientIndex = this.getSelectedGradientIndex(comp, 0);
        var propMap = this.getPropMap(fileString, comp.name, gradientIndex);
        var gradientStops = this.getGradientStops(propMap);
        return JSON.stringify(gradientStops);
    } catch (err) {
        alert("Coloramen\n" + err);
    }
};

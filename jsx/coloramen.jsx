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

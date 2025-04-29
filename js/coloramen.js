/**************************************************************************************************
 * Global *****************************************************************************************
 **************************************************************************************************/

const fs = require("fs");
const path = require("path");
const csi = new CSInterface();

const userDataPath = csi.getSystemPath(SystemPath.USER_DATA);
const extensionPath = csi.getSystemPath(SystemPath.EXTENSION);

let pluginPath = path.resolve(extensionPath, "plugin", "AEColorPicker.aex");
if (csi.getOSInformation().indexOf("Windows") !== 0) {
    pluginPath = path.resolve(extensionPath, "plugin", "AEColorPicker.plugin");
}

const templateInPath = path.resolve(extensionPath, "ffx", "template.ffx");
const templateOutPath = path.resolve(userDataPath, "colorama.ffx");

const MIN_STOPS = 1;
const MAX_STOPS = 64;

/**************************************************************************************************
 * Selections *************************************************************************************
 **************************************************************************************************/

const gradientStops = document.querySelector(".gradient-stops");
const gradientPreview = document.querySelector(".gradient-preview-fg");

const opacityContainer = document.querySelector(".opacity-input");
const opacityPreview = opacityContainer.querySelector(".opacity-preview");
const opacityText = opacityPreview.querySelector("span");
const opacityEdit = opacityContainer.querySelector("input");

const locationContainer = document.querySelector(".location-input");
const locationPreview = locationContainer.querySelector(".location-preview");
const locationText = locationPreview.querySelector("span");
const locationEdit = locationContainer.querySelector("input");

const applyButton = document.querySelector(".apply-button");
const pullButton = document.querySelector(".pull-button");
const mirrorButton = document.querySelector(".mirror-button");
const deleteButton = document.querySelector(".delete-button");
const aboutButton = document.querySelector(".about-button");

/**************************************************************************************************
 * Utilities **************************************************************************************
 **************************************************************************************************/

function calculateAngle(x, y) {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return (angle < 0) ? angle + 360 : angle;
}

function getBoundedColor(boundingStops, weight) {
    const priorColor = getColorAsRGB(boundingStops.priorStop.dataset.color);
    const afterColor = getColorAsRGB(boundingStops.afterStop.dataset.color);
    const rgb = [
        interpolateWeight(priorColor.r, afterColor.r, weight),
        interpolateWeight(priorColor.g, afterColor.g, weight),
        interpolateWeight(priorColor.b, afterColor.b, weight)
    ];
    const hex = rgb.map(color => {
        return Math.round(color).toString(16).padStart(2, "0").toUpperCase();
    }).join("");
    return hex;
}

function getBoundedOpacity(boundingStops, weight) {
    const priorOpacity = parseFloat(boundingStops.priorStop.dataset.opacity);
    const afterOpacity = parseFloat(boundingStops.afterStop.dataset.opacity);
    const opacity = interpolateWeight(priorOpacity, afterOpacity, weight);
    return opacity;
}

function getBoundingStops(location) {
    const stops = Array.from(document.querySelectorAll(".gradient-stop"));
    const sorted = stops.sort((a, b) => {
        return parseFloat(a.dataset.location) - parseFloat(b.dataset.location);
    });

    const locationFloat = parseFloat(location);
    const numStops = sorted.length;

    let priorStop = null;
    let afterStop = null;

    for (let i = 0; i < numStops; i++) {
        const currentStop = sorted[i];
        const nextStop = sorted[(i + 1) % numStops];

        const currentLocation = parseFloat(currentStop.dataset.location);
        const nextLocation = parseFloat(nextStop.dataset.location);

        if (currentLocation <= locationFloat && locationFloat < nextLocation) {
            priorStop = currentStop;
            afterStop = nextStop;
            break;
        }
    }

    if (!priorStop || !afterStop) {
        priorStop = sorted[numStops - 1];
        afterStop = sorted[0];
    }

    return {
        priorStop,
        afterStop,
    };
}

function getColorAsCSS(color, opacity) {
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const a = parseFloat(opacity) / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getColorAsHex(color) {
    return parseInt(color, 10).toString(16).toUpperCase();
}

function getColorAsNum(color) {
    return parseInt(color, 16);
}

function getColorAsRGB(color) {
    return {
        "r": parseInt(color.substring(0, 2), 16),
        "g": parseInt(color.substring(2, 4), 16),
        "b": parseInt(color.substring(4, 6), 16)
    };
}

function getLocationAsHex(location) {
    return (location * 0xFFFF).toString(16).split(".")[0].padStart(8, "0");
}

function getLocationAsNum(location) {
    var l = Math.min(Math.max(location, 0), 100);
    return (Number.isInteger(l)) ? l : l.toFixed(2);
}

function getOpacityAsHex(opacity) {
    return Math.round(opacity * 255).toString(16).toUpperCase();
}

function getOpacityAsNum(opacity) {
    return Math.round(Math.min(Math.max(opacity, 0), 100));
}

function getRotationAsCSS(rotation) {
    return `${rotation}deg`;
}

function getRotationAsNum(location) {
    const l = Math.min(Math.max(location, 0), 100);
    return ((360 * (l / 100)) % 360).toFixed(2);
}

function getWeight(boundingStops, location) {
    const locationFloat = parseFloat(location);
    const priorStopLocation = parseFloat(boundingStops.priorStop.dataset.location);
    const afterStopLocation = parseFloat(boundingStops.afterStop.dataset.location);
    return (locationFloat - priorStopLocation) / (afterStopLocation - priorStopLocation);
}

function interpolateWeight(start, end, value) {
    return start + (end - start) * value;
}

/**************************************************************************************************
 * Update Gradient ********************************************************************************
 **************************************************************************************************/

function updateGradientInformation(stop) {
    if (stop) {
        opacityContainer.classList.remove("disabled");
        opacityContainer.classList.add("enabled");
        locationContainer.classList.remove("disabled");
        locationContainer.classList.add("enabled");
        opacityText.innerText = getOpacityAsNum(stop.dataset.opacity);
        opacityEdit.value = getOpacityAsNum(stop.dataset.opacity);
        locationText.innerText = getLocationAsNum(stop.dataset.location);
        locationEdit.value = getLocationAsNum(stop.dataset.location);
    } else {
        opacityContainer.classList.remove("enabled");
        opacityContainer.classList.add("disabled");
        locationContainer.classList.remove("enabled");
        locationContainer.classList.add("disabled");
        opacityText.innerText = "-";
        opacityEdit.value = 0;
        locationText.innerText = "-";
        locationEdit.value = 0;
    }
}

function updateGradientPreview() {
    const stops = Array.from(document.querySelectorAll(".gradient-stop"));
    const sorted = stops.sort((a, b) => a.dataset.location - b.dataset.location);

    const firstStop = sorted[0];
    const firstLocation = parseFloat(firstStop.dataset.location);
    const firstColor = getColorAsCSS(firstStop.dataset.color, firstStop.dataset.opacity);

    const colors = sorted.map(stop => {
        const color = getColorAsCSS(stop.dataset.color, stop.dataset.opacity);
        const location = (parseFloat(stop.dataset.location) - firstLocation + 100) % 100;
        return `${color} ${location}%`;
    });

    colors.push(`${firstColor} 100%`);
    const colorString = colors.join(", ");
    const fromString = `${firstLocation * 3.6}deg`;

    const gradientString = `conic-gradient(from ${fromString} at 50% 50%, ${colorString})`;
    gradientPreview.style.setProperty("background-image", gradientString);
}

/**************************************************************************************************
 * Add Gradient Stop ******************************************************************************
 **************************************************************************************************/

function addGradientStop(opacity, color, location) {
    const stop = document.createElement("span");
    stop.classList.add("gradient-stop");

    stop.dataset.opacity = getOpacityAsNum(opacity);
    stop.dataset.color = color.toString();
    stop.dataset.location = getLocationAsNum(location);
    stop.dataset.rotation = getRotationAsNum(location);

    stop.style.setProperty("--color", getColorAsCSS(stop.dataset.color, 100));

    const degrees = getRotationAsCSS(stop.dataset.rotation);
    stop.style.setProperty("transform", `rotateZ(${degrees}) translateY(-11.5em)`);

    stop.addEventListener("mousedown", () => {
        document.querySelector(".selected")?.classList.remove("selected");
        stop.classList.add("selected");
        updateGradientInformation(stop);
    });

    stop.addEventListener("dblclick", () => {
        const oldColor = getColorAsNum(stop.dataset.color);
        csi.evalScript(`$._coloramen.pickColor(${oldColor}, "${pluginPath}");`, newColor => {
            stop.dataset.color = getColorAsHex(newColor);
            stop.style.setProperty("--color", getColorAsCSS(stop.dataset.color, 100));
            updateGradientPreview();
        });
    });

    gradientStops.appendChild(stop);
    updateGradientInformation();
    updateGradientPreview();
}

/**************************************************************************************************
 * Gradient Stops *********************************************************************************
 **************************************************************************************************/

gradientStops.addEventListener("mousedown", (event) => {
    if (event.target === event.currentTarget) {
        return;
    }

    event.stopPropagation();

    const rect = gradientStops.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const initialMouseX = event.clientX - centerX;
    const initialMouseY = event.clientY - centerY;
    const initialMouseAngle = calculateAngle(initialMouseX, initialMouseY);

    const stop = event.target;
    const currentRotation = parseFloat(stop.dataset.location) || 0;
    const initialOffset = initialMouseAngle - (currentRotation * 360) / 100;

    function onMouseMove(moveEvent) {
        const dx = moveEvent.clientX - centerX;
        const dy = moveEvent.clientY - centerY;

        const angle = calculateAngle(dx, dy);
        const rotation = (angle - initialOffset + 360) % 360;
        const location = (rotation / 360) * 100;

        stop.dataset.location = getLocationAsNum(location);
        stop.dataset.rotation = getRotationAsNum(location);

        const degrees = getRotationAsCSS(stop.dataset.rotation);
        stop.style.setProperty("transform", `rotateZ(${degrees}) translateY(-11.5em)`);

        updateGradientInformation(stop);
        updateGradientPreview();
    }

    function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
});

gradientStops.addEventListener("click", (event) => {
    if (event.target !== event.currentTarget) {
        return;
    }

    const rect = gradientStops.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    const angle = calculateAngle(dx, dy);
    const rotation = (angle + 90) % 360;
    const location = (rotation / 360) * 100;

    const boundingStops = getBoundingStops(location);
    const weight = getWeight(boundingStops, location);
    const opacity = getBoundedOpacity(boundingStops, weight);
    const color = getBoundedColor(boundingStops, weight);

    addGradientStop(opacity, color, location);
});

/**************************************************************************************************
 * Gradient Information > Opacity *****************************************************************
 **************************************************************************************************/

function blurOpacityEdit() {
    opacityEdit.classList.add("hidden");
    opacityPreview.classList.remove("hidden");
    const stop = document.querySelector(".selected");
    stop.dataset.opacity = getOpacityAsNum(opacityEdit.value);
    updateGradientInformation(stop);
    updateGradientPreview();
}

opacityEdit.addEventListener("blur", () => {
    blurOpacityEdit();
});

opacityEdit.addEventListener("keyup", event => {
    if (event.key === "Enter") {
        blurOpacityEdit();
    }
});

opacityContainer.addEventListener("click", () => {
    if (opacityContainer.classList.contains("enabled")) {
        opacityPreview.classList.add("hidden");
        opacityEdit.classList.remove("hidden");
        opacityEdit.focus();
        opacityEdit.select();
    }
});

/**************************************************************************************************
 * Gradient Information > Location ****************************************************************
 **************************************************************************************************/

function blurLocationEdit() {
    locationEdit.classList.add("hidden");
    locationPreview.classList.remove("hidden");
    const stop = document.querySelector(".selected");
    stop.dataset.location = getLocationAsNum(locationEdit.value);
    stop.dataset.rotation = getRotationAsNum(locationEdit.value);
    const degrees = getRotationAsCSS(stop.dataset.rotation);
    stop.style.setProperty("transform", `rotateZ(${degrees}) translateY(-11.5em)`);
    updateGradientInformation(stop);
    updateGradientPreview();
}

locationEdit.addEventListener("blur", () => {
    blurLocationEdit();
});

locationEdit.addEventListener("keyup", event => {
    if (event.key === "Enter") {
        blurLocationEdit();
    }
});

locationContainer.addEventListener("click", () => {
    if (locationContainer.classList.contains("enabled")) {
        locationPreview.classList.add("hidden");
        locationEdit.classList.remove("hidden");
        locationEdit.focus();
        locationEdit.select();
    }
});

/**************************************************************************************************
 * Apply Button ***********************************************************************************
 **************************************************************************************************/

applyButton.addEventListener("click", () => {
    const stops = Array.from(document.querySelectorAll(".gradient-stop"));
    const sorted = stops.sort((a, b) => a.dataset.location - b.dataset.location);

    const colors = sorted.map(stop => stop.dataset.color);
    const locations = sorted.map(stop => parseFloat(stop.dataset.location) / 100);
    const opacities = sorted.map(stop => parseFloat(stop.dataset.opacity) / 100);

    if (fs.existsSync(templateOutPath) === true) {
        fs.unlinkSync(templateOutPath);
    }

    const template = fs.readFileSync(templateInPath).toString("hex");

    const colorOffsets = [0x0CD0, 0x2D1C];
    const countOffsets = [0x0ED3, 0x2F1F];
    const keyEntryWidth = 16;

    const outputArray = Array.from(template);

    colors.forEach((colorHex, colorIndex) => {
        const opacityHex = getOpacityAsHex(opacities[colorIndex]);
        const locationHex = getLocationAsHex(locations[colorIndex]);
        const hexSegment = locationHex + opacityHex + colorHex;

        colorOffsets.forEach((offset) => {
            Array.from(hexSegment).forEach((hexChar, charIndex) => {
                outputArray[offset * 2 + charIndex + colorIndex * keyEntryWidth] = hexChar;
            });
        });
    });

    const countHex = colors.length.toString(16).padStart(2, "0");

    Array.from(countHex).forEach((countChar, charPosition) => {
        countOffsets.forEach((offset) => {
            outputArray[offset * 2 + charPosition] = countChar;
        });
    });

    const outputBuffer = Buffer.from(outputArray.join(""), "hex");
    fs.appendFileSync(templateOutPath, outputBuffer);

    csi.evalScript(`$._coloramen.applyColorama(\"${templateOutPath}\");`);
});

/**************************************************************************************************
 * Pull Button ************************************************************************************
 **************************************************************************************************/

pullButton.addEventListener("click", () => {
    csi.evalScript("$._coloramen.getGradientFromAE();", result => {
        const gradientStops = JSON.parse(result);
        if (gradientStops !== null) {
            Array.from(document.querySelectorAll(".gradient-stop")).forEach(stop => {
                stop.remove();
            });
            gradientStops.forEach(stop => {
                const opacity = parseFloat(stop.opacity) || 100;
                const color = stop.color.hex;
                const location = 50 * (parseFloat(stop.location) / 100);
                addGradientStop(opacity, color, location);
            });
            updateGradientPreview();
        }
    });
});

/**************************************************************************************************
 * Mirror Button **********************************************************************************
 **************************************************************************************************/

mirrorButton.addEventListener("click", () => {
    Array.from(document.querySelectorAll(".gradient-stop")).forEach(stop => {
        if (stop.dataset.location > 0 && stop.dataset.location < 50) {
            const location = 100 - stop.dataset.location;
            addGradientStop(stop.dataset.opacity, stop.dataset.color, location);
        }
    });
});

/**************************************************************************************************
 * Delete Button **********************************************************************************
 **************************************************************************************************/

deleteButton.addEventListener("click", () => {
    const oldNum = Array.from(document.querySelectorAll(".gradient-stop")).length;
    const newNum = oldNum - 1;
    if (MIN_STOPS < newNum && newNum <= MAX_STOPS) {
        document.querySelector(".selected").remove();
        updateGradientInformation();
        updateGradientPreview();
    }
});

/**************************************************************************************************
 * About Button ***********************************************************************************
 **************************************************************************************************/

aboutButton.addEventListener("click", () => {
    csi.evalScript("$._coloramen.showAbout();");
});

/**************************************************************************************************
 * Initialize *************************************************************************************
 **************************************************************************************************/

addGradientStop(100, "FF0000", 0);
addGradientStop(100, "FFFF00", 16.66);
addGradientStop(100, "00FF00", 33.33);
addGradientStop(100, "00FFFF", 50);
addGradientStop(100, "0000FF", 66.66);
addGradientStop(100, "FF00FF", 83.33);

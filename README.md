# Coloramen 2

Coloramen 2 is a CEP helper panel for the Colorama effect in Adobe After Effects used to easily set colors, positions, and opacity values for each gradient stop in a Colorama gradient.

## About

Coloramen 2 is a CEP helper panel for the Colorama effect in Adobe After Effects used to easily set colors, positions, and opacity values for each gradient stop in a Colorama gradient.

The native Colorama user interface is quite advanced but there are 2 glaring issues:

* **Issue #1:** Output Cycle color stops cannot be placed accurately via percentage values.
* **Issue #2:** Output Cycle color stops provide even less accurate placement for opacity values.

### Built Upon

Shout out to this [original Adobe Community post](https://community.adobe.com/t5/after-effects-discussions/change-colorama-colors-via-scripting/m-p/10392133) which inspired the wildly brilliant solution of direct manipulation of an Adobe After Effects animation preset binary.

* Original Coloramen at [lachrymalLF/Coloramen](https://github.com/lachrymaLF/Coloramen)
* AE Color Picker at [Belonit/AEColorPicker](https://github.com/Belonit/AEColorPicker)

### Features

* **Apply Colorama:** Apply the gradient built in Coloraman 2 as a Colorama effect on the currently selected After Effects layer
* **Pull Gradient:** Pull an existing gradient from a selected Gradient Colors property on a After Effects Shape Layer
* **Mirror Gradient:** Mirror all gradient stops from the right side of the gradient to the left side
* **Delete Stop:** Remove the currently selected gradient stop

With a gradient stop selected:
* **Opacity:** Set the opacity value (`0%` to `100%`) for the current stop
* **Location:** Set the location value (`0%` to `100%`) for the current stop

## Usage

1. Download the latest version of Coloramen 2 from the `Releases` section along the right side of this repository.
2. Unzip and install Coloramen 2 using the ZXP/UXP Installer from [aescripts+aeplugins](https://aescripts.com/learn/zxp-installer/).
3. Open Coloraman 2 from the `Window > Extensions > Coloraman 2` menu.
4. Set your gradient manually, via the `Pull Gradient` button, via the `Mirror Gradient` button and more.
5. Select a layer in After Effects and click the `Appy Colorama` button.

## License

Distributed under the MIT License. See [LICENSE](/LICENSE) for more information.

## Contact
Kyle Martinez
[Website](https://www.kyle-martinez.com/) | [Instagram](https://www.instagram.com/kyletmartinez/)

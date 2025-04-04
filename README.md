# ComfyUI Mini

A mobile-friendly WebUI to run ComfyUI workflows.

![App Preview](https://github.com/user-attachments/assets/78a52443-ac9c-498c-8df3-129acd94a48c)

## Features

-   ⚡ Lightweight UI built for mobile devices
-   💾 Workflows saved to device or PC
-   ⏳ Progress info when generating images
-   🤖 Automatic workflow importing
-   🖼️ Gallery of all generated images

## Requirements

### For PC (Hosting WebUI):

-   **ComfyUI**: Ensure ComfyUI is installed and functional (minimum v0.2.2-50-7183fd1 / Sep. 18th release).
-   **NodeJS**: Version _20.0.0_ or higher.
-   **Package manager**: Perferrably NPM as Yarn has not been explicitly tested but should work nonetheless.

### Mobile (Accessing WebUI):

-   **Browser**: Any modern browser with support for WebSocket.
-   **Network**: Connection to the same network as the hosting PC.

## Installation

You can find a guide to installing and running the app on the **[getting started](https://github.com/ImDarkTom/ComfyUIMini/wiki/Getting-Started)** page.

## FAQ

### **Q**: I can't import my workflow.

-   **A**: You need to save your workflow in API Format to be able to import it as regular saving doesnt provide enough information to list all available inputs. For a guide on how to enable this option see video [here](https://imgur.com/a/YsZQu83).

### **Q**: Can you access the WebUI outside of the local network?

-   **A**: Yes you can through the use of port forwarding, however this carries security risks as it will allow anyone to potentially connect to your WebUI. As the process of setting up port forwarding varies greatly depending on your internet service provider I am unable to give specific instructions, however you may be able to find help by seaching '_[your ISP] enable port forwarding_'.

## Donating

This is a fork from the original author. If you find this WebUI to be useful and want to support him, you can donate using the button below:

<a href="https://www.buymeacoffee.com/ImDarkTom" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>

While this fork is mainly for myself, I appreciate any donations if you find this fork useful:

<a href="https://www.buymeacoffee.com/bjew" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" alt="Buy Me A Coffee" height="41" width="174"></a>
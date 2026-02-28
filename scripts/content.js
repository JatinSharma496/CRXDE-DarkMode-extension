console.log("CRXDE Lite Dark Mode Extension Loaded");



// Inject CodeMirror CSS
function injectCSS(file_path, node) {
    var th = document.getElementsByTagName(node)[0];
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('type', 'text/css');
    link.setAttribute('href', chrome.runtime.getURL(file_path));
    th.appendChild(link);
}

// Run only after the DOM (including body and head) is fully initialized
document.addEventListener("DOMContentLoaded", () => {
    try {
        // No addons
    } catch (e) {
        console.error("CRXDE Dark Mode: Error injecting CodeMirror scripts", e);
    }

    // Set the logo URL as a CSS variable since content scripts can't easily resolve extension paths in CSS
    document.documentElement.style.setProperty('--anti-logo-url', `url(${chrome.runtime.getURL('assets/CRXDE_Header.png')})`);

    const ICONS = {
        'apps': 'assets/icons/apps.png',
        'libs': 'assets/icons/libs.png',
        'content': 'assets/icons/content.png',
        'conf': 'assets/icons/conf.png',
        'config': 'assets/icons/conf.png',
        'etc': 'assets/icons/etc.png',
        'home': 'assets/icons/home.png',
        'var': 'assets/icons/var.png',
        'tmp': 'assets/icons/temp.png',
        'oak:index': 'assets/icons/oak_index.png',
        'jcr:system': 'assets/icons/jcr_system.png',
        'ui.apps': 'assets/icons/apps.png',
        'ui.content': 'assets/icons/content.png',
        'ui.config': 'assets/icons/conf.png',
        'ui.frontend': 'assets/icons/apps.png',
        'core': 'assets/icons/apps.png' // falling back to apps.png since there's no core.png
    };

    function applyIcons() {
        // The nodes are actually div elements with class "x-tree-node-el"
        document.querySelectorAll("div.x-tree-node-el").forEach((div) => {
            // The anchor containing the text is inside this div, inside a span
            const textSpan = div.querySelector('a.x-tree-node-anchor span');
            // The image icon is also a direct child of this div
            const iconImg = div.querySelector('img.x-tree-node-icon');

            if (!textSpan || !iconImg) return;

            const name = textSpan.textContent.trim().toLowerCase();
            let iconPath = ICONS[name];

            // If this node doesn't match a top-level name, but it's a folder, inherit icon from parent
            if (!iconPath && iconImg.classList.contains('folder')) {
                let currentNode = div;
                while (true) {
                    const parentUl = currentNode.closest('ul.x-tree-node-ct');
                    if (!parentUl) break; // Reached root

                    const parentLi = parentUl.closest('li.x-tree-node');
                    if (!parentLi) break;

                    const parentDiv = parentLi.querySelector(':scope > div.x-tree-node-el');
                    if (!parentDiv) break;

                    const parentSpan = parentDiv.querySelector('a.x-tree-node-anchor span');
                    if (parentSpan) {
                        const parentName = parentSpan.textContent.trim().toLowerCase();
                        if (ICONS[parentName]) {
                            iconPath = ICONS[parentName];
                            break;
                        }
                    }
                    currentNode = parentDiv;
                }
            }

            if (!iconPath) return;

            const newUrl = chrome.runtime.getURL(iconPath);

            // avoid re-setting repeatedly
            if (iconImg.dataset.customIcon === newUrl) return;

            iconImg.src = newUrl;
            iconImg.dataset.customIcon = newUrl;

            // Force constraints so it fits perfectly in the tree
            iconImg.style.width = "16px";
            iconImg.style.height = "16px";
            iconImg.style.objectFit = "contain";

            // Remove the background-image styles ExtJS might try to put on the img
            iconImg.style.backgroundImage = "none";
        });
    }

    // Run once + whenever CRXDE updates the tree
    applyIcons();

    const observer = new MutationObserver(() => applyIcons());
    observer.observe(document.body, { childList: true, subtree: true });
});

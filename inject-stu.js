// Add iframe observer function
function handleIframes() {
    // Function to modify iframe
    function updateIframeAllow(iframe) {
        if (iframe) {
            const currentAllow = iframe.getAttribute('allow') || '';
            if (!currentAllow.includes('clipboard-read')) {
                const newAllow = currentAllow ? `${currentAllow};clipboard-read` : 'clipboard-read';
                iframe.setAttribute('allow', newAllow.trim());
            }
        }
    }

    // Create a mutation observer to watch for iframe changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check for added nodes
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'IFRAME') {
                    updateIframeAllow(node);
                }
            });
        });
    });

    // Start observing body for iframe changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Handle any existing iframes
    document.querySelectorAll('iframe').forEach(updateIframeAllow);
}

handleIframes();
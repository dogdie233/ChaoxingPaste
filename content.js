// Main content script for handling paste events

console.log('ChaoxingPaste extension loaded');

// Global variable to store the question ID
let questionId = null;

// Function to initialize the extension
function initExtension() {
  // Use direct event capture to ensure our handler runs first
  document.documentElement.addEventListener('keydown', handleKeyDown, true);
}

// Handle keydown events
function handleKeyDown(event) {
  // Early return if not Ctrl+V
  if (!(event.key === 'v' && event.ctrlKey)) {
    return;
  }

  // Early return if not focused on the correct textarea
  const activeElement = document.activeElement;
  if (!activeElement || activeElement.tagName !== 'TEXTAREA' || !activeElement.classList.contains('big-ipt')) {
    return;
  }

  // Find the parent textarea-box
  const textareaBox = findAncestorWithClass(activeElement, 'textarea-box');
  if (!textareaBox) {
    return;
  }

  // Find the icon-camera div inside the textarea-box
  const iconCamera = textareaBox.querySelector('.icon-camera');
  if (!iconCamera) {
    return;
  }

  // Get the input element inside the icon-camera div
  const cameraInput = iconCamera.querySelector('input');
  if (!cameraInput) {
    return;
  }

  // Extract question ID from attributes or context
  if (cameraInput.hasAttribute('qid')) {
    questionId = cameraInput.getAttribute('qid');
    handlePaste();
    return;
  }
  
  questionId = cameraInput.getAttribute('qid');
  if (!questionId) {
    return;
  }
  handlePaste();
}

// Helper function to find ancestor with specific class
function findAncestorWithClass(element, className) {
  while (element && !element.classList.contains(className)) {
    element = element.parentElement;
  }
  return element;
}

// Helper function to check if image type is one of the required formats
function isImageFormat(mimeType, extension) {
  const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/bmp', 'image/gif'];
  const validExtensions = ['png', 'jpg', 'jpeg', 'bmp', 'gif'];
  
  return validMimeTypes.includes(mimeType) || validExtensions.includes(extension);
}

function handlePaste() {
  // Set the global queid variable in the page context
  queid = questionId;
  
  // Detect which approach to use based on browser support
  if (navigator.clipboard && navigator.clipboard.read) {
    // Modern approach
    navigator.clipboard.read()
      .then(clipboardItems => {
        processClipboardItems(clipboardItems);
      })
      .catch(() => {
        useFallbackPasteMethod();
      });
  } else {
    // Fallback for browsers without clipboard API support
    useFallbackPasteMethod();
  }
}

function processClipboardItems(clipboardItems) {
  for (const clipboardItem of clipboardItems) {
    // Check if there are image types in the clipboard
    if (clipboardItem.types.some(type => type.startsWith('image/'))) {
      // Get the first image type
      const imageType = clipboardItem.types.find(type => type.startsWith('image/'));
      
      // Get the blob data for this image type
      clipboardItem.getType(imageType)
        .then(blob => {
          processImageBlob(blob, imageType);
        });
      return;  // Found an image, no need to continue processing
    }
  }
}

function processImageBlob(blob, imageType) {
  // Create a file from the blob
  const extension = imageType.split('/')[1] || 'png';
  const fileName = `pasted_image_${new Date().getTime()}.${extension}`;
  const file = new File([blob], fileName, { type: imageType });
  
  // Find the file input element
  const fileInput = document.getElementById('fileBoxBtn');
  if (fileInput) {
    // Create a DataTransfer object to set files
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Set the files property of the file input
    fileInput.files = dataTransfer.files;
    
    // Set the global queid variable in the page context
    queid = questionId;
    upfiletype = isImageFormat(imageType, extension) ? 1 : 0;
    
    // Dispatch change event to trigger the file upload
    const changeEvent = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(changeEvent);
    
    console.log('Image pasted successfully');
  }
}

function useFallbackPasteMethod() {
  // Create a hidden textarea to receive the paste
  const pasteTarget = document.createElement('textarea');
  pasteTarget.style.position = 'absolute';
  pasteTarget.style.left = '-999999px';
  document.body.appendChild(pasteTarget);
  pasteTarget.focus();
  
  // Add a one-time paste event listener
  pasteTarget.addEventListener('paste', function(e) {
    const clipboardData = e.clipboardData;
    if (clipboardData && clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        if (clipboardData.items[i].type.indexOf('image') !== -1) {
          const blob = clipboardData.items[i].getAsFile();
          const mimeType = clipboardData.items[i].type;
          const extension = mimeType.split('/')[1] || 'png';
          
          // Set upfiletype to 1 for image formats, 0 for others
          upfiletype = isImageFormat(mimeType, extension) ? 1 : 0;
          
          processImageBlob(blob, mimeType);
          e.preventDefault();
          break;
        }
      }
    }
    // Clean up
    document.body.removeChild(pasteTarget);
  });
  
  // Trigger paste
  document.execCommand('paste');
}

// Initialize the extension when the document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}

// Set up a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver(() => {
  initExtension();
});

observer.observe(document.body, { childList: true, subtree: true });
chrome.runtime.onInstalled.addListener(function() {
  // When the app gets installed, set up the context menus
  chrome.contextMenus.create({
    id: 'id',
    title: 'Add video text to clipboard',
    contexts: ['video']
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  const code = `(function() {

const originalVideo = document.querySelector('video[src="${info.srcUrl}"]');    
if (originalVideo) {
  const video = document.createElement('video');
  video.crossOrigin = true;
  video.src = originalVideo.src;
  video.currentTime = originalVideo.currentTime;
  video.muted = true;
  video.play()
  .then(function() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    analyseImage(canvas.toDataURL());
    video.src = '';
  });
}

async function analyseImage(url) {
  const apiUrl = 'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyDzxY4p7fGSug5MkkXhkQRbKwfd9jmBzm0';
  const body = JSON.stringify({
    "requests": [
      {
        "image": {
          "content": url.substring('data:image/png;base64,'.length)
        },
        "features": [
          {
            "type": "TEXT_DETECTION",
            "maxResults": 1
          }
        ]
      }
    ]
  });
  const response = await fetch(apiUrl, {method: 'POST', body});
  const json = await response.json();
  const text = json.responses.map(response => { return response.fullTextAnnotation.text; }).join(' ');
  copyToClipboard(text);
}
  
function copyToClipboard(text) {
  const buffer = document.createElement('textarea');
  document.body.appendChild(buffer);
  buffer.style.position = 'absolute'; // Hack: http://crbug.com/334062
  buffer.value = text;
  buffer.select();
  document.execCommand('copy');
  buffer.remove();
}

})();`;

  chrome.tabs.executeScript(tab.id, {code, allFrames: true});
});
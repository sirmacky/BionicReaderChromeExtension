String.prototype.insert = function(index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);

  return string + this;
};

Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}

function PushStyle() {
  const linkElement = document.createElement('link');
  linkElement.href = chrome.runtime.getURL('bionicstyles.css');
  linkElement.id   = 'link-bionicstyles';
  linkElement.rel  = 'stylesheet';
  linkElement.type = `text/css`;
  document.head.appendChild(linkElement);
}

function PopStyle() {
  document.getElementById("link-bionicstyles").remove();
}

let isEnabled = null;
let focusLength = 0.33;

chrome.storage.sync.get(["isEnabled", "focusLength"], ({ isEnabled: savedIsEnabled, focusLength: savedFocusLength }) => {
  focusLength = (savedFocusLength || 33) / 100.0
  if (savedIsEnabled) {
    activateBionicReading();
  } else {
    isEnabled = false;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "activateBionicReading") {
    activateBionicReading();
  } else if (request.action === "deactivateBionicReading") {
    deactivateBionicReading();
  } else if (request.action === "updateFocusLength") {
      focusLength = parseFloat(request.focusLength, focusLength) / 100;
    if (isEnabled) {
      updateBionicReading();
    }
  }
});

function activateBionicReading() {
  if (isEnabled === true)
    return;
  isEnabled = true;
  PushStyle();
  updateBionicReading();
}

function deactivateBionicReading() {
  if (isEnabled === false)
    return;
  isEnabled = false;
  PopStyle();
  updateBionicReading();
}


function updateBionicReading() {

  let bionicSpans = document.querySelectorAll(".bionic-primary, .bionic-secondary");
  bionicSpans.forEach((span) => {
    span.outerHTML = span.textContent;
  });

  if (isEnabled){
    let textNodes = getTextNodes(document.body);
    textNodes.forEach((node) => {
      let bionicText = applyBionicReading(node);
      let newNode = document.createElement("span");
      newNode.innerHTML = bionicText;
      node.parentNode.replaceChild(newNode, node);
    });
  }
}

function getTextNodes(element) {
  let textNodes = [];
  let walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (
        !/^(script|style|code|noscript)$/i.test(node.parentNode.nodeName) &&
        node.textContent.trim().length > 0
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }
    },
  }, false);

  while (node = walk.nextNode()) {
    textNodes.push(node);
  }

  return textNodes;
}

// TODO: We may want to get a bit fancier for longer / shorter words to maintain consistency
function calcualteBionicLength(word) { 
  let bionicLength = Math.ceil(word.length * focusLength);
  return bionicLength;
}

function convertToBionic(word) {
  const bionicLength = calcualteBionicLength(word);
  if (length == 0)
    return word;
  let bionicWord = '';

  if (word.length > bionicLength){
    // add a secondary?
  }

  bionicWord = word.insert(bionicLength, `</span>`);
  bionicWord = `<span class="bionic-primary">` + bionicWord;

  return bionicWord;
}

function applyBionicReading(textNode) {
  const text = textNode.nodeValue;
  const words = text.split(/(\s+)/);
  const bionicWords = words.map((word) => {
    if (/^\s+$/.test(word))
      return word;

    return convertToBionic(word);
  });

  return bionicWords.join('');
}
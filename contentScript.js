String.prototype.insert = function(index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);

  return string + this;
};

function injectCSS() {

  const styles = `
    .bionic-primary {
      font-weight: 800;
    }

    .bionic-secondary {
      font-weight: 700;
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}


let isEnabled = false;
let focusLength = 0.33;

chrome.storage.sync.get(["isEnabled", "focusLength"], ({ isEnabled: savedIsEnabled, focusLength: savedFocusLength }) => {
  isEnabled = savedIsEnabled;
  focusLength = (savedFocusLength || 33) / 100.0
  if (isEnabled) {
    activateBionicReading();
  }
  
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "activateBionicReading") {
    isEnabled = true;
    activateBionicReading();
  } else if (request.action === "deactivateBionicReading") {
    isEnabled = false;
    deactivateBionicReading();
  } else if (request.action === "updateFocusLength") {
      focusLength = parseFloat(request.focusLength, focusLength) / 100;
    if (isEnabled) {
      updateBionicReading();
    }
  }
});

function activateBionicReading() {
  console.log("Applying bionic reading");
  injectCSS();
  let textNodes = getTextNodes(document.body);
  textNodes.forEach((node) => {
    let bionicText = applyBionicReading(node);
    let newNode = document.createElement("span");
    newNode.innerHTML = bionicText;
    node.parentNode.replaceChild(newNode, node);
  });
}

function deactivateBionicReading() {
  let bionicSpans = document.querySelectorAll(".bionic-primary, .bionic-secondary");
  bionicSpans.forEach((span) => {
    span.outerHTML = span.textContent;
  });
}

function updateBionicReading() {
  deactivateBionicReading();
  activateBionicReading();
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
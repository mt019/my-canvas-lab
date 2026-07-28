// ==UserScript==
// @name         法規條文項次顯示器
// @namespace    https://github.com/mt019/law-item-labeler
// @version      1.10.0
// @description  僅插入「第 X 項」文字於原位置，完全不影響正文對齊，取代原本 ::before 數字顯示方式
// @author       mt019
// @homepageURL  https://phenomcanvas.com/userscripts/law-item-labeler
// @supportURL   https://github.com/mt019/law-item-labeler/issues
// @updateURL    https://phenomcanvas.com/scripts/law-item-labeler.user.js
// @downloadURL  https://phenomcanvas.com/scripts/law-item-labeler.user.js
// @match        https://law.moj.gov.tw/LawClass/LawAll.aspx*
// @match        https://law.moj.gov.tw/LawClass/LawSingle.aspx*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {

// == injectLabel.js ==

let styleNode = null;

function insertItemLabels() {
  document.querySelectorAll('.law-article').forEach(container => {
    let counter = 1;
    container.querySelectorAll('.show-number').forEach(div => {
      if (!div.classList.contains('number-inserted')) {
        div.style.position = 'relative';

        const label = document.createElement('span');
        label.textContent = `第${counter}項：`;
        label.className = 'inserted-label';
        label.style.position = 'absolute';
        label.style.left = '-3.5em';
        label.style.top = '0';
        label.style.color = '#666';
        label.style.fontFamily = 'Consolas, monospace';
        label.style.fontSize = '0.85em';
        label.style.whiteSpace = 'nowrap';
        label.style.lineHeight = '1.6';

        div.prepend(label);
        div.classList.add('number-inserted');
      }
      counter++;
    });
  });

  if (!styleNode) {
    styleNode = document.createElement('style');
    styleNode.textContent = `.show-number::before { content: none !important; }`;
    document.head.appendChild(styleNode);
  }
}

function removeItemLabels() {
  document.querySelectorAll('.law-article .show-number').forEach(div => {
    if (div.classList.contains('number-inserted')) {
      const label = div.querySelector('.inserted-label');
      if (label) label.remove();
      div.classList.remove('number-inserted');
      div.style.position = '';
    }
  });

  if (styleNode) {
    styleNode.remove();
    styleNode = null;
  }
}


// == uiButton.js ==

function createToggleButton(removeFn, insertFn) {
  const btn = document.createElement('button');
  btn.textContent = '隱藏項次';
  btn.style.position = 'fixed';
  btn.style.top = '12px';
  btn.style.right = '12px';
  btn.style.zIndex = '9999';
  btn.style.padding = '6px 12px';
  btn.style.fontSize = '14px';
  btn.style.background = '#006699';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '4px';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  btn.setAttribute('data-state', 'shown');

  btn.addEventListener('click', () => {
    if (btn.getAttribute('data-state') === 'shown') {
      removeFn();
      btn.textContent = '顯示項次';
      btn.setAttribute('data-state', 'hidden');
    } else {
      insertFn();
      btn.textContent = '隱藏項次';
      btn.setAttribute('data-state', 'shown');
    }
  });

  document.body.appendChild(btn);
}


// == main.js ==

function init() {
  insertItemLabels();
  createToggleButton(removeItemLabels, insertItemLabels);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();

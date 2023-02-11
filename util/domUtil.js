'use strict';

// this way does NOT support document.execute(), which is the way to run XPath query.
// refer: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
const htmlStrToElements = (str) => {
  const template = document.createElement('template');
  str = str.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = str;
  // return = template.content;
  return template.content.childNodes;
};

const htmlStrToElement = (str) => {
  return htmlStrToElements(str)[0];
};

const domParser = new DOMParser();
const htmlStrToDocument = (str) => {
  const doc = domParser.parseFromString(str, 'text/html');
  const thisDocument = doc;
  return thisDocument;
};

const stringToMB = (str) => {
  if(str === '0' || str === '0.0') {
    return 0;
  }
  const num = Number.parseFloat(`${str.match(/^\d+\.?\d*/g)}`, 10);
  const unit = (`${str.match(/[a-z]+$/gi)}`).toUpperCase().trim();
  let retVal = 0;

  switch (unit) {
    case 'TB':
      retVal = num * 1024 * 1024;
      break;
    case 'GB':
      retVal = num * 1024;
      break;
    case 'MB':
      retVal = num;
      break;
    case 'KB':
      retVal = num / 1024;
      break;
    case 'NULL': // unit is omitted when it's byte
    case 'B':
      retVal = num / (1024 * 1024);
      break;
    default:
      console.warn(`no unit matched - str: ${str}`);
      break;
  }
  return retVal;
};

const xPathSelector = (ele, queryArg, contextNode = document) => {
  const xPathResult = ele.evaluate(queryArg, contextNode, null, XPathResult.ANY_TYPE , null);
  const nodes = [];
  let node = xPathResult.iterateNext();
  return node;
};

const xPathSelectorAll = (ele, queryArg, contextNode = document) => {
  const xPathResult = ele.evaluate(queryArg, contextNode, null, XPathResult.ANY_TYPE , null);
  const nodes = [];
  let node = xPathResult.iterateNext();
  while (node) {
      nodes.push(node);
      node = xPathResult.iterateNext();
  }
  return nodes;
};

window_.xPathSelector = xPathSelector;
window_.xPathSelectorAll = xPathSelectorAll;
const innerText = (ele) => {
  if(!ele) {
    console.error(`ele is null!!!`);
    throw new Error(`ele is null!!!`);
  }
  return (ele.innerText || ele.textContent).trim();
};

const extractFileInfo = (liDom) => {
  let fileName = '';
  const childNodes = liDom.childNodes;
  let i = 0;
  let nextNode = childNodes[i++];
  do {
    fileName = fileName + nextNode.textContent.replaceAll('\n', '').trim();
    nextNode = childNodes[i++];
  } while (nextNode.nodeType === 3)

  // const fileName = liDom.childNodes[0].textContent.replaceAll('\n', '').trim();
  const matchResult = fileName.match(/\.[^.]+$/);
  let extension = matchResult ? matchResult[0] : '';
  // incase some file extension is crazy
  if(extension.length > 31) {
    extension = extension.substr(0, 4);
  }
  const fileSize = innerText(liDom.querySelector(':scope > span')).trim();
  const fileSizeInMB = stringToMB(fileSize);
  return {
    fileName,
    extension,
    fileSize,
    fileSizeInMB,
  };
};

const MAGNET_PREFIX = 'magnet:?xt=urn:btih:'; // eslint-disable-line no-unused-vars
// Common variable end

const extractTorrentInfo = (ele) => {
  // const torrentName = innerText(ele.querySelector('h5:nth-child(1)'));
  const torrentName = ele.querySelector('h5:nth-child(1)').title || innerText(ele.querySelector('h5:nth-child(1)'));
  const torrentHref = ele.querySelector('h5:nth-child(1) > a').href.match(/(?<=\/magnet\/)[^/]+$/g)[0];
  const torrentHrefFull = torrentHref;
  const torrentDetailLink = `https://bt4g.org/magnet/${torrentHref}`;
  const torrentType = innerText(ele.querySelector(':scope > span:nth-of-type(1)'));

  const torrentCreateTime = innerText(ele.querySelector(':scope > span:nth-of-type(2) > b'));
  const torrentFileCnt = innerText(ele.querySelector(':scope > span:nth-of-type(3) > b'));
  const needToFetchFileList = torrentFileCnt > 3;
  const torrentSize = innerText(ele.querySelector(':scope > span:nth-of-type(4) > b'));
  const torrentSeeders = innerText(ele.querySelector(':scope > span:nth-of-type(5) > b'));
  const torrentLeechers = innerText(ele.querySelector(':scope > span:nth-of-type(6) > b'));

  const fileLIs = Array.from(ele.querySelectorAll(':scope > ul > li'));

  const filesPartial = fileLIs.map((fileItem) => extractFileInfo(fileItem));

  let torrentTypeInt = 0;

  switch (torrentType.toUpperCase()) {
    case 'VIDEO':
      torrentTypeInt = 0;
      break;
    case 'AUDIO':
      torrentTypeInt = 1;
      break;
    case 'ARCHIVE FILE':
      torrentTypeInt = 2;
      break;
    case 'APPLICATION':
      torrentTypeInt = 3;
      break;
    case 'OTHER':
      torrentTypeInt = 5;
      break;
    case 'DOC':
      torrentTypeInt = 6;
      break;
    default:
      torrentTypeInt = 5;
      console.warn(`no torrentType matched - torrentType: ${torrentType}`);
      break;
  }
  const torrentSizeInMB = stringToMB(torrentSize);

  return {
    torrentName,
    torrentHref,
    torrentHrefFull,
    torrentDetailLink,
    torrentType,
    torrentTypeInt,
    torrentCreateTime,
    torrentFileCnt,
    torrentSize,
    torrentSizeInMB,
    torrentSeeders,
    torrentLeechers,
    needToFetchFileList,
    filesPartial,
  };
};

const extractTorrentList = (htmlStr) => {
  const document_ = htmlStrToDocument(htmlStr);

  const allItems = Array.from(document_.querySelectorAll('main > .container > .row:nth-of-type(3) > .col.s12 > div:nth-of-type(n+2)'));

  const resultTorrents = allItems.map(extractTorrentInfo);
  // console.info(JSON.stringify(resultTorrents, null, 2));
  // console.info(resultTorrents.join('\n'));
  return resultTorrents;
};

const extractExtraTorrentInfo = (htmlStr) => {
  const document_ = htmlStrToDocument(htmlStr);

  const fileLIs = Array.from(document_.querySelectorAll('main > .container > .row:nth-of-type(2) > .col.s12 > table:nth-of-type(5) li'));
  const files = fileLIs.map((fileItem) => extractFileInfo(fileItem));
  // console.info(JSON.stringify(files, null, 2));
  return {
    files,
  };
};

const mergeFileList = (ele, files) => {
  const currentFileLis = Array.from(ele.querySelectorAll(':scope > ul > li'));
  let listToAdd = files.concat();

  // first, remove duplicate files
  currentFileLis.forEach((item) => {
    const fileObj = extractFileInfo(item);
    listToAdd = listToAdd.filter(itemToAdd => {
      if(
        itemToAdd.fileName === fileObj.fileName
        && itemToAdd.extension === fileObj.extension
        && itemToAdd.fileSize === fileObj.fileSize
      )  {
        return false;
      }
      return true;
    });

  });

  // then add non-dup files into current fileList
  const containerEle = currentFileLis[0].parentElement;
  listToAdd.forEach((itemToAdd) => {
    const { fileName, extension, fileSize } = itemToAdd;
      
    const newItem = `
    <li>${fileName}${extension}&nbsp; <span class="lightColor">${fileSize}</span> </li>
    `;
    containerEle.insertAdjacentHTML('beforeend', newItem);
  });

  return true;
};

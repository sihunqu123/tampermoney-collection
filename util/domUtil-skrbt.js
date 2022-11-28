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
    case 'BYTE':
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

xPathSelectorAll(document, "//div[./*[@aria-label='Page navigation']]");


const innerText = (ele) => {
  if(!ele) {
    console.error(`ele is null!!!`);
    throw new Error(`ele is null!!!`);
  }
  return (ele.innerText || ele.textContent).trim();
};

const extractFileInfo = (liDom) => {
  const fileName = innerText(liDom.firstElementChild).replaceAll('\n', '').trim();
  const matchResult = fileName.match(/\.[^.]+$/);
  const extension = matchResult ? matchResult[0] : '';
  const fileSize = innerText(liDom.lastElementChild);
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

const extractCreateTime = (str) => {
  // ['4', 'hours', 'ago']
  const arr = str.split(/\s+/);
  const number = Number.parseInt(arr[1], 10);
  const unit = arr[2].toLowerCase();
  const now = new Date();
  switch (unit) {
    case 'hour':
    case 'hours':
      now.setHours(now.getHours() - number);
      break;
    case 'day':
    case 'days':
      now.setDate(now.getDate() - number);
      break;
    case 'week':
    case 'weeks':
      now.setDate(now.getDate() - (number * 7));
      break;
    case 'month':
    case 'months':
      now.setMonth(now.getMonth() - number);
      break;
    case 'year':
    case 'years':
      now.setFullYear(now.getFullYear() - number);
      break;
    default:
      console.error(`no unit matched - unit: ${unit}`);
      break;
  }
  try {
    const retVal =  now.toISOString().replace('T', ' ').replace('Z', '').replace(/\..+/, '');
    return retVal;
  } catch(e) {
    console.error(e);
    throw e;
  }
};

const extractTorrentInfo = (ele) => {
  const torrentName = innerText(ele.querySelector('.result-resource-title'));
//const torrentHrefFull = ele.querySelector('.torrent_magnet a').href.trim().substr(MAGNET_PREFIX.length);
//const torrentHref = torrentHrefFull.match('^[^&]+')[0];
  const torrentHrefFull = ''; // not exist on current dom, need to fetch from torrentDetailLink 
  const torrentHref = ''; // not exist on current dom, need to fetch from torrentDetailLink

  const torrentDetailLink = ele.querySelector('.result-resource-title').href;
  // hardcoding since there is no such info for this site
  const torrentType = 'VIDEO';

  const torrentCreateTime = innerText(ele.querySelector('.result-resource-meta-info > span:nth-of-type(3)'));

  const torrentFileCnt = innerText(ele.querySelector('.result-resource-meta-info > span:nth-of-type(2)'));
  
  const torrentSize = innerText(ele.querySelector('.result-resource-meta-info > span:nth-of-type(1)'));
  // hardcoding since there is no such info for this site
  const torrentSeeders = 0;
  const torrentLeechers = 0;

  const needToFetchFileList = true; // always, since we need to fetch the torrentHref

  const fileLIs = Array.from(ele.querySelectorAll('.result-resource-file'));

  const filesPartial = fileLIs.map((fileItem) => extractFileInfo(fileItem));

  const fileCountEle = ele.querySelector('.torrent_files');

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

  // JSDom does not support evaluate method which execute the XPath query
  // const fileLIs = xPathSelectorAll_Doc(document_, document_, "div[@class='panel-heading'][contains(., '文件列表')]/following-sibling::div/ul/li");
  const fileLIs = Array.from(document_.querySelectorAll(".col-md-6 > div:nth-of-type(5) ul.list-unstyled > li"));
  const files = fileLIs.map((fileItem) => extractFileInfo(fileItem));
  // console.info(JSON.stringify(files, null, 2));

  const hrefA = document_.querySelector("#detail-magnet-panel > a");
  if(!hrefA) {
    console.error('No hrefA found! htmlStr is below:');
    console.error(htmlStr);
    throw new Error('No hrefA found! htmlStr is below:');
  }
  const torrentHref = hrefA.href;
  const torrentHrefFull = torrentHref;
  return {
    files,
    torrentHref,
    torrentHrefFull,
  };
};

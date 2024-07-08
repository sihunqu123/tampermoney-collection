
const MAGNET_LINK = 'magnetLink';

(function() {
  'use strict';
  console.info(`=================deoVR hacked`);
  const serverHOST = '192.168.10.2'; // the host of the backend server, NOT the mysql ip
  const serverPORT = 8180;
  const website = 'deoVR';
  const requestIntervalLow = 1;
  const requestIntervalHigh = 5;

  if(inIframe()) return;

  const torrents = {

  };

  const torrent6 = {

  };


  const postToDB = async (url, data) => {

    /*
    const formData = new FormData();

    const keys = Object.keys(data);
    keys.forEach(key => {
        formData.append(key, data[key]);
    });
    */
    var formData = new FormData();
    formData.append('website', website);
    formData.append('torrents', torrents);

    /***/
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });

    return response;

    /*
      GM_xmlhttpRequest ({
          method: "POST",
          url,
          onload: function (response) {
              console.info(`xml get down`);
              console.log (response.responseText);
          }
      });


      console.info(`before xml get down`);
      GM_xmlhttpRequest ({
          method:     "POST",
          url,
          data:       formData,
          binary: 		true,
          onload:     function (response) {
              console.info(`xml get down`);
              console.log (response.responseText);
          },
      });
    */
  };


  const testaaa = async() => {
    const postRes = await postToDB(`http://${serverHOST}:${serverPORT}/add-deoVR`, {
      postData: {
        "a": 123,
        "b": 1243,
      },
    });
    const body = await postRes.text();
    console.info(`=========status: ${postRes.status}, body: ${body}`);
  };

  const getPageIndexHeader = (pageIndex) => {
    return htmlStrToElement(`<div class="pageListheader">Page ${pageIndex} is shown below:</div>`);
  };

  const getAllIteams = (doc) => {
    const allItems = Array.from(document.querySelectorAll(".c-grid-item"));
    return allItems;
  };

  const getAllIteamsEnabled = (doc) => {
    const allItems = Array.from(document.querySelectorAll(".itemBody"));
    return allItems;
  };

  const getCheckbox = (itemContainer) => {
    // return itemContainer.querySelectorAll('.c-grid-item-footer .u-width--full > todo');
    return itemContainer.children[0];
  };

  const revertCheckbox = (itemContainer) => {
    const checkboxEle = getCheckbox(itemContainer);
    checkboxEle.checked = !checkboxEle.checked;
  };

  const getMagnet = async (itemContainer) => {
    let magnetLink = itemContainer.getAttribute(MAGNET_LINK);
    if(magnetLink) { // if it's already fetched, just return the fetched value
      return magnetLink;
    }

    // fetch the magnetLink
    const href = itemContainer.querySelector('a').href;

    // window.location.host
    // 'bt4gprx.com'
    const { body: htmlStr, statusCode } = await fetchBT4GRetry(href);
    if(statusCode === 200) { // some fileDetails might have been removed.
      const document_ = htmlStrToDocument(htmlStr);
      // xPathSelector(document, "//a/img[@src='/static/img/magnet.png']/parent::*").href.match(/(?<=\/hash\/).*/)[0]
      const linkA = xPathSelector(document_, "//a/img[@src='/static/img/magnet.png']/parent::*", document_);
      if(linkA && linkA.href) {
        const magnetContent = linkA.href.match(/(?<=\/hash\/)[^?]+/)[0];
        magnetLink = 'magnet:?xt=urn:btih:' + magnetContent;
        itemContainer.setAttribute(MAGNET_LINK, magnetLink);
      } else {
        console.error(`failed to fetch magnetLink for torrent: ${magnetLink}`);
      }
    } else {
      // throw new Error(`failed to fetch magnetLink for torrent: ${magnetLink}`);
        console.error(`failed to fetch magnetLink for torrent: ${magnetLink}`);
    }
    return magnetLink;
  };
  window_.getMagnet = getMagnet;

  const extractParamPath = (path) => {
    const arr = path.split('/');
    if(arr.length === 4) { // order by time, which is the default one. e.g. '/search/uncen/1'
      const searchTxt = arr[2];
      const orderBy = '';
      const pageIndex = parseInt(arr[3], 10);
      return {
        searchTxt,
        orderBy,
        pageIndex,
      };
    } else if(arr.length === 3) {
      const searchTxt = arr[2];
      const orderBy = '';
      const pageIndex = 1;
      return {
        searchTxt,
        orderBy,
        pageIndex,
      };
    } else { // not order by time. e.g. '/search/uncen/bysize/1'
      const searchTxt = arr[2];
      const orderBy = arr[3];
      const pageIndex = parseInt(arr[4], 10);
      return {
        searchTxt,
        orderBy,
        pageIndex,
      };
    }
  };

  const extractParamSearch = (path) => {
    const matchedStr = path.match(/\?.*/)[0];
    const queryArr = matchedStr.substr(1).split('&');

    const querys = {};

    queryArr.forEach(str => {
      const arr = str.split('=');
      const key = arr[0];
      const value = arr[1];
      querys[key] = value;
    });
    const { q, p, orderby } = querys;
    const searchTxt = q;
    const orderBy = orderby;
    const pageIndex = p ? parseInt(p) : 1; // start with 1
    return {
      searchTxt,
      orderBy,
      pageIndex,
    };
  };

  let searchTxt = null;
  let orderBy = null;
  let pageIndex = null;

  if(window_.location.search.indexOf('q=') > -1) { // query is inside location.search
    ({ searchTxt, orderBy, pageIndex } = extractParamSearch(window_.location.search + ''));
  } else { // query is inside path
    ({ searchTxt, orderBy, pageIndex } = extractParamPath(window_.location.pathname + ''));
  }
  let currentPageIndex = pageIndex;
  let currentPageIndexLeft = currentPageIndex;
  let currentPageIndexRight = currentPageIndex;



  const loadCustomStyle = () => {
    var style = document.createElement('style');
    style.type='text/css';

    const customCSS = `
      .hiddenEle {
        display: none !important;
      }
      .itemCheck {
        width: 30px;
        height: 30px;
        color: red;
        left: 30px;
        margin-top: 3px;
        border-color: green;
        opacity: 1 !important;
        pointer-events: unset !important;
        /* border-width: 10px; */
        /* border-style: solid; */
        /* line-height: 20; */
        /* padding: 3px; */
        /* z-index: 999; */
      }
      .itemCheck:hover {
        cursor: pointer;
      }
      .itemBody {
        background: white;
      /*        cursor: pointer; */
      }
      .itemBody:hover {
        background: #d2cce6;
        cursor: pointer;
      }
      .itemBodyDisabled {
        background: grey;
      }
      .itemBodyDisabled:hover {
        background: grey;
      }
      .action-divider {
        display: inline;
      }
      .fetch6FilesList {
        display: inline;
      }
      .keyword4Junk {
        width: 100px !important;
      }
      .removeKeyWordItems {
        display: inline;
      }
      .checkActionItem {
        display: inline;
        width: 100px !important;
      }
      .CountToLoad {
        width: 50px !important;
      }
      .refreshDiv {
        display: flex;
        flex-direction: column;
        position: fixed;
        z-index: 9999;
        width: 90vw;
        height: 90vh;
        background-color: #547f52;    
        opacity: 0.9;
        margin: 5vh 5vw;
        left: 0px;
        top: 10px;
      }
      .refreshDiv  .refreshIframe {
        width: 90vw;
        height: calc(90vw - 100px);
      }
      .refreshDiv .refreshHeader {
        width: 100%;
        height: 100px;
        line-height: 100px;
        font-size: 85px;
        text-align: center;
        color: coral;
        position: relative;
      }
      .refreshDiv .refreshHeader .refreshMsg{
        color: red;
      }
      .IFixedIt {
        height: 100%;
        font-size: 30px;
        display: flex;
        position: absolute;
        right: 0;
        top: 0;
      }
      .pageListheader {
        width: calc(100vw - 150px);
        border-top-style: ridge;
      }
      .pageAnchor {
        width: 80vw;
      }
    `;

    if(style.styleSheet){
        style.styleSheet.cssText=customCSS;
    }else{
        style.appendChild(document.createTextNode(customCSS));
    }
    document.getElementsByTagName('head')[0].appendChild(style);
  };
  loadCustomStyle();


  window_.allCheck = () => {
    console.info(`in allCheck`);
    getAllIteamsEnabled(document).forEach(ele => {
      getCheckbox(ele).checked = true;
    });
  };

  window_.invertCheck = () => {
    console.info(`in invertCheck`);
    getAllIteamsEnabled(document).forEach(ele => {
      const checkboxEle = getCheckbox(ele);
      checkboxEle.checked = !checkboxEle.checked;
    });
  };

  window_.onItemClick = function(event) {
    console.info(`in onItemClick`);
    // this.checked = !this.checked;
    if(event) {
      // event.preventDefault();
    }
    return true;
  };

  window_.CopyCheckedLink = async function() {
    console.info(`in CopyCheckedLink`);

    console.info(JSON.stringify(torrents));
    // console.info(resultTorrent.join('\n'));
    // window_.prompt('The selected links are show below:', resultTorrent.join('\n'));
    // window_.navigator.clipboard.writeText(resultTorrent.join('\n'));
    const logToShow = Object.values(torrents).map(item => {
      return item.title + ' | ' + item.link;
    });
    copyToClipboard(logToShow.join('\n'));
    showMsg(`Copied ${Object.keys(torrents).length} items to Clipboard! ^_^`);
  };

  const getElementIndexAmondSiblings = (ele) => {
    var parent = ele.parentNode;
    const retVal = Array.prototype.indexOf.call(parent.children, ele);
    return retVal;
  }

  const itemOnclickHandler = (event, ele) => {
    const lastClickedItems = Array.from(document.querySelectorAll(".itemBody[isLastClickedItem='true']"));
    // console.info(event.shiftKey);
    // debugger;
    if(event.shiftKey && lastClickedItems.length > 0) { // shift mode for multi-selection
      const lastClickedItem = lastClickedItems[0];
      // find the items between lastClickedItem and current element
      // we add 1 since the index of :nth-child() selector in css seletor starts from 1, instead of 0
      const lastClickedItemIndex = getElementIndexAmondSiblings(lastClickedItem) + 1;
      const currentClickedItemIndex = getElementIndexAmondSiblings(ele) + 1;
      // const siblings = Array.from(ele.parentNode.children);
      let cssSelector = '';
      if(lastClickedItemIndex < currentClickedItemIndex) {
        cssSelector = `:scope > .itemBody:nth-child(n+${lastClickedItemIndex + 1}):nth-child(-n+${currentClickedItemIndex})`;
      } else {
        cssSelector = `:scope > .itemBody:nth-child(n+${currentClickedItemIndex}):nth-child(-n+${lastClickedItemIndex - 1})`;
      }
      const itemsToHandle = Array.from(ele.parentElement.querySelectorAll(cssSelector));
      itemsToHandle.forEach(item => {
        revertCheckbox(item);
      });
    } else { // single click mode

      // clear the last clicked item mark
      lastClickedItems.forEach(item => {
        item.setAttribute('isLastClickedItem', 'false');
      });
      revertCheckbox(ele);
      // event.preventDefault();
      // console.info(`ischecked? : ${checkboxEle.checked}`);
      // set the last clicked item mark
      ele.setAttribute('isLastClickedItem', 'true');
    }
    event.preventDefault();


  };

  const patchA = () => {
    // find all a
    // const allItems = Array.from(document.querySelectorAll("a[href^='/magnet/']:not([isPatched='true'])"));
    const allItems = getAllIteams(document);
    allItems.forEach(ele => {
      // add a checkbox for each a
      ele.insertAdjacentHTML('afterBegin', '<input type="checkbox" name="itemCheck" value="yes" class="itemCheck" onclick="onItemClick(event); return true;" />');
      // add class for the checkbox to apply css
      ele.classList.add("itemBody");
      /* */
      // add click on div to check/uncheck
      ele.addEventListener('click', function(event) {
        // event.preventDefault();
        // ele.previousElementSibling.click();
        if(event.target.name !== 'itemCheck') {
          itemOnclickHandler(event, ele);
        }
      }, false);

      // add mark to tell this a has been patched
      ele.setAttribute('isPatched', 'true');
    });
  };


  const extractDownloadInfo = async(ele) => {
    const aItem = ele.querySelector(".c-grid-item-in > .c-grid-ratio > a");
    const titleTxt = ele.querySelector(".c-grid-item-footer-title").text;
    const pageToLoad = aItem.href;

    const { body: htmlStr, statusCode } = await fetchBT4GRetry(pageToLoad);
    if(statusCode != 200){
      throw new Error(`failed to fetch html for torrent: ${pageToLoad} - ${titleTxt}`);
    }

    const downloadInfoArr = htmlStr.match(/(?<=videoData: *){[^\n]*(?=, *\n)/);
    
    if(!downloadInfoArr) {
      throw new Error(`failed to fetch videoDownloadJSON for torrent: ${pageToLoad} - ${titleTxt}`);
    }
    const downloadInfoJson = JSON.parse(downloadInfoArr[0]);
    const linkArr = downloadInfoJson.src;
    const bestLink = linkArr[linkArr.length - 1].url;
    const linkTitle = downloadInfoJson.title;

    return {
      title: linkTitle,
      link: bestLink,
    };
  };

  const fetchSelectFileList = async() => {

    const allItems = Array.from(document.querySelectorAll(".itemBody:not([isFetched='true'])"));
    const selectedItem = allItems.filter(ele => {
      if(getCheckbox(ele).checked) {
         return true;
      }
      return false;
    });
    const length = selectedItem.length;
    for(let i = 0; i < length; i++) {
      if(i % 10 === 0) {
        const progress = ((i / length) * 100).toFixed(2);
        showMsg(`fetch filelist inprogress... ${progress}%`);
      }
      const ele = selectedItem[i];

      const downloadInfo = await extractDownloadInfo(ele);

      torrents[downloadInfo.title] = downloadInfo;
      await sleepMS(randomIntFromInterval(requestIntervalLow, requestIntervalHigh));
      ele.setAttribute('isFetched', 'true');
    }
    return length;
  };

  window_.fetchFileList = async function(_this) {
      console.info(`in fetchFileList();`);
      const length = await fetchSelectFileList();
      showMsg(`Fetched the fileList for ${length} torrent. ^_^`);
      return true;
  };

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
}


  const checkActionBtns = `
    <input type="button" name="allCheck" value="Check All" class="allCheck checkActionItem" onClick="allCheck()" />
<input type="button" name="invertCheck" value="Invert Check" class="invertCheck checkActionItem" onClick="invertCheck()" />
<input type="button" name="CopyCheckedLink" value="CopyCheckedLink" class="CopyCheckedLink checkActionItem" onClick="CopyCheckedLink()" />
<input type="button" name="fetchFileList" value="fetchFileList" class="fetchFileList checkActionItem" onClick="fetchFileList()" />
    `;

  document.querySelector('.c-page').insertAdjacentHTML('beforebegin', checkActionBtns);

  patchA();
})();

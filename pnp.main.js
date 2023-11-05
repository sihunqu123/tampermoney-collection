
const MAGNET_LINK = 'magnetLink';

(function() {
  'use strict';
  console.info(`=================pnp hacked`);
  const serverHOST = '192.168.10.2';
  const serverPORT = 8180;
  const website = 'bt4g';
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
    const postRes = await postToDB(`http://${serverHOST}:${serverPORT}/add-bt4g`, {
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

  // testaaa();

  const getItemParent = () => {
    // const targetUl = xPathSelector(document, "");
    const targetUl = document.querySelector('#org-repositories > div > div > div.Box > ul');
    return targetUl;
  };

  const itemParent = getItemParent();

  // TODO: fix the selector the find the anchor_top
  const insertPageListHeaderAnchor_top = itemParent.firstElementChild;
  if(!insertPageListHeaderAnchor_top) { // do nothing when there is no result
    return;
  }
  // TODO: fix the selector the find the anchor_bottom
  itemParent.insertAdjacentHTML('beforeend', "<div class='pageAnchor'>List End</div>");
  const insertPageListHeaderAnchor_bottom = itemParent.lastElementChild;

  const getAllIteams = (doc) => {
    const allItems = Array.from(doc.querySelectorAll('#org-repositories > div > div > div.Box > ul > li'));
    return allItems;
  };

  const getAllIteamsEnabled = (doc) => {
    const allItems = Array.from(doc.querySelectorAll(".itemBody"));
    return allItems;
  };

  const getCheckbox = (itemContainer) => {
    return itemContainer.querySelector('.wb-break-all > input');
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

  const loadMore = async(searchTxt, orderBy, isForward, currentPageIndex, jumpSize) => {
    const beginIndex = 0; // skip page one since it's already on first page
    const endIndex = 70; // this site won't load page after this number
    // const orgName = 'phoenix-core';

    // '/search/uncen/bysize/1'


    const targetUl = getItemParent();

    const countBefore = getAllIteams(document).length;
    console.info(`beofre change we have: ${countBefore} items`);

    let i = isForward ? (currentPageIndex + 1) : (currentPageIndex - 1);
    let document_ = null;
    let pagesToLoad = jumpSize;
    let baseUrl = `https://github01.hclpnp.com/orgs/${orgName}/repositories?type=all&page=`;
    let url = '';
    let newCurrentPage = currentPageIndex;

    do {
      const pageNum = i;
      if(i < beginIndex || --pagesToLoad < 0 || i > endIndex) {
        console.info(`reached the last page: ${pageNum}`);
        break;
      }
      await sleepMS(randomIntFromInterval(requestIntervalLow, requestIntervalHigh));
      url = baseUrl + pageNum;
      const { statusCode, body } = await fetchBT4GRetry(url);
      if(statusCode === 404) { // edge page
        break;
      }
      if(statusCode != 200) {
        console.error(`non-200/404 result: ${body}`);
        showMsg(`run into error. Please check the console for details!`);
        await sleepMS(4000);
        break;
      }
      const currentHTML = body;
      const document_ = htmlStrToDocument(currentHTML);
      const listItems = getAllIteams(document_);
      if(listItems.length === 0 ) { // already reach to the end
        const edgeMsg = `reached the edge page: ${pageNum}`;
        console.error(edgeMsg);
        showMsg(edgeMsg);
        break;
      }
      // added into the `page 1`(which is the first page) page.
      // targetUl.appendChild(...LIs);
      if(isForward) {
        insertPageListHeaderAnchor_bottom.insertAdjacentElement('beforebegin', getPageIndexHeader(i));
        listItems.forEach(item => {
          // targetUl.appendChild(item);
          insertPageListHeaderAnchor_bottom.insertAdjacentElement('beforebegin', item);
        });
      } else {
        // const anchorEle = targetUl.querySelector(":scope > div:nth-child(0)");
        //            listItems.forEach(item => {
        //              anchorEle.insertAdjacentElement('beforebegin', item);
        //            });
        // backward
        listItems.reverse();
        listItems.forEach(item => {
          insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', item);
        });
        insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', getPageIndexHeader(i));
      }
      newCurrentPage = i; // update the newCurrentPage when request done
      isForward ? i++ : i--;
    } while(true);

    const countAfter = getAllIteams(document).length;
    const msg = `Loaded another ${countAfter - countBefore} items from page ${currentPageIndex} to ${newCurrentPage}`;
    console.info(`after change we have: ${countAfter} items`);
    showMsg(msg);
    return newCurrentPage;
  };


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
    const { page } = querys;
    const pageIndex = page ? parseInt(page) : 1; // start with 1
    return {
      pageIndex,
    };
  };

  let searchTxt = '';
  let orderBy = null;
  let pageIndex = 1;
  const orgName = (window_.location.pathname + '').match(/(?<=\/orgs\/)[^/]+(?=\/repositories)/)[0];
  if(window_.location.search.indexOf('page=') > -1) { // query is inside location.search
    ({ pageIndex } = extractParamSearch(window_.location.search + ''));
  } else { // query is inside path
    pageIndex = 1;
    // ({ searchTxt, orderBy, pageIndex } = extractParamPath(window_.location.pathname + ''));
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
    const resultTorrent = [];
    const allItems = getAllIteams(document);
    for(let i = 0; i < allItems.length; i++) {
      const ele = allItems[i];
      const checkboxEle = getCheckbox(ele);
      if(checkboxEle.checked) {
        const a = ele.querySelector("a[itemprop='name codeRepository']");
        const tmp = a.href.replaceAll('https://', 'git@').replace('/', ':');
        const tmpArr = tmp.split('/');
        const projectName = tmpArr[tmpArr.length - 1];
        const retVal = `${orgName} | ${tmp}` + ".git";
        resultTorrent.push(retVal);
        //            ele.href = newUrl;
      }

    }
    // console.info(JSON.stringify(resultTorrent));
    console.info(resultTorrent.join('\n'));
    // window_.prompt('The selected links are show below:', resultTorrent.join('\n'));
    // window_.navigator.clipboard.writeText(resultTorrent.join('\n'));
    copyToClipboard(resultTorrent.join('\n'));
    showMsg(`Copied ${resultTorrent.length} items to Clipboard! ^_^`);
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
    // const allItems = xPathSelectorAll(document, "//span[contains(concat(' ',normalize-space(@class),' '),' cpill ')]/parent::div[not(@isPatched='true')]");
    const allItems = Array.from(document.querySelectorAll("#org-repositories > div > div > div.Box > ul > li:not(.itemBody)"));
    allItems.forEach(ele => {
      const aItem = ele.querySelector('a');
      // add a checkbox for each a
      aItem.insertAdjacentHTML('beforebegin', '<input type="checkbox" name="itemCheck" value="yes" class="itemCheck" onclick="onItemClick(event); return true;" />');
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

  window_.loadToPage1 = async function(event) {
    console.info(`in loadToPage1();`);
    const isForward = false;
    const jumpSize = 999;
    const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexLeft, jumpSize);
    currentPageIndexLeft = newIndex;
    patchA();
    return true;
  };


  window_.loadPrevPages = async function(_this) {
    console.info(`in loadPrevPages();`);
    const isForward = false;
    const count = _this.nextElementSibling.value;
    const jumpSize = Number.parseInt(count, 10);
    const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexLeft, jumpSize);
    currentPageIndexLeft = newIndex;
    patchA();
    return true;
  };

  window_.loadNextPages = async function(_this) {
    console.info(`in loadNextPages();`);
    const isForward = true;
    // read the CountToLoad from the previous input
    const count = _this.previousElementSibling.value;
    const jumpSize = Number.parseInt(count, 10);
    const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexRight, jumpSize);
    currentPageIndexRight = newIndex;
    patchA();
    return true;
  };

  window_.loadToLastPage = async function(_this) {
    console.info(`in loadToLastPage();`);
    const isForward = true;
    const jumpSize = 999;
    const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexRight, jumpSize);
    currentPageIndexRight = newIndex;
    patchA();
    return true;
  };

  const checkActionBtns = `
    <input type="button" name="allCheck" value="Check All" class="allCheck checkActionItem" />
<input type="button" name="invertCheck" value="Invert Check" class="invertCheck checkActionItem" />
<input type="button" name="CopyCheckedLink" value="CopyCheckedLink" class="CopyCheckedLink checkActionItem" />
<div class="action-divider">|</div>
    `;

  const loadBtns = `
<br />
<input type="button" name="loadToPage1" value="loadToFirstPage" class="loadPages" />
<input type="button" name="loadPrevPages" value="loadPrevPages" class="loadPages" />
<input type="text" id="CountToLoad" value="5" class="CountToLoad" />
<input type="button" name="loadNextPages" value="loadNextPages" class="loadPages" />
<input type="button" name="loadToLastPage" value="loadToLastPage" class="loadPages" />
    `;


  //  [
  //    'allCheck', 'invertCheck', 'CopyCheckedLink',
  //    'loadToPage1', 'loadPrevPages', 'loadNextPages', 'loadToLastPage',
  //  ].forEach(eventName

  //  );

  insertPageListHeaderAnchor_top.insertAdjacentElement('beforebegin', getPageIndexHeader(currentPageIndex));

  document.querySelector("form[data-autosearch-results-container='org-repositories']").insertAdjacentHTML('beforebegin', checkActionBtns);

  const paginationEle = document.querySelector('.pagination');
  if(paginationEle) {
    document.querySelector("form[data-autosearch-results-container='org-repositories']").insertAdjacentHTML('beforeend', loadBtns);
    paginationEle.insertAdjacentHTML('beforebegin', checkActionBtns);
    paginationEle.insertAdjacentHTML('beforeend', loadBtns);
  }

  patchA();

  Array.from(document.querySelectorAll("input[name='allCheck']")).forEach(ele => ele.onclick = allCheck);
  Array.from(document.querySelectorAll("input[name='invertCheck']")).forEach(ele => ele.onclick = invertCheck);
  Array.from(document.querySelectorAll("input[name='CopyCheckedLink']")).forEach(ele => ele.onclick = CopyCheckedLink);
  Array.from(document.querySelectorAll("input[name='loadToPage1']")).forEach(ele => ele.onclick = loadToPage1.bind(null, ele));
  Array.from(document.querySelectorAll("input[name='loadPrevPages']")).forEach(ele => ele.onclick = loadPrevPages.bind(null, ele));
  Array.from(document.querySelectorAll("input[name='loadNextPages']")).forEach(ele => ele.onclick = loadNextPages.bind(null, ele));
  Array.from(document.querySelectorAll("input[name='loadToLastPage']")).forEach(ele => ele.onclick = loadToLastPage.bind(null, ele));

})();

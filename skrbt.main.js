

(function() {
    'use strict';
    console.info(`=================skrbt hacked`);
    const serverHOST = '192.168.10.16';
    const serverPORT = 8180;
    const website = 'skrbt';
    const requestIntervalLow = 5000;
    const requestIntervalHigh = 15000;

    // if(inIframe()) return;

    const torrents = {

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

    const insertPageListHeaderAnchor_top = xPathSelector(document, "//p/*[@class='result-stats']/..");
    if(!insertPageListHeaderAnchor_top) { // do nothing when there is no result
      return;
    }
    const insertPageListHeaderAnchor_bottom = xPathSelector(document, "//div/nav[@aria-label='Page navigation']");

    const loadMore = async(searchTxt, orderBy, isForward, currentPageIndex, jumpSize, otherArgs) => {
        const beginIndex = 1; // skip page one since it's already on first page
        const endIndex = 100; // this site won't load page after this number
        // const orgName = 'phoenix-core';

        // '/search/uncen/bysize/1'


        // https://skrbtdi.top/search?keyword=Uncensored-Leaked&sos=relevance&sofs=all&sot=all&soft=all&som=exact&p=10
        // TODO: get the list item parent
        const targetUl = xPathSelector(document, "//div[./*[@aria-label='Page navigation']]");
        // const targetUl = document.querySelector("form[action='/search'] + div > div:nth-child(4)");

        const countBefore = targetUl.querySelectorAll(".itemBody").length;
        console.info(`beofre change we have: ${countBefore} items`);

        let i = isForward ? (currentPageIndex + 1) : (currentPageIndex - 1);
        let document_ = null;
        let pagesToLoad = jumpSize;
        let baseUrl = `https://skrbtdi.top/search?keyword=${searchTxt}&sos=${orderBy}`;
        Object.keys(otherArgs).forEach(key => {
          const val = otherArgs[key];
          baseUrl += `&${key}=${val}`;
        });
        baseUrl += '&p=';

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
            const {
              listItems,
              torrents: newTorrents,
            } = await fetchIframeRetry({
              url,
              searchTxt,
              pageIndex: pageNum,
            });
//          if(statusCode === 404 || statusCode === 302) { // edge page
//            break;
//          }
//          if(statusCode != 200) {
//            console.error(`non-200/404 result: ${body}`);
//            showMsg(`run into error. Please check the console for details!`);
//            await sleepMS(4000);
//            break;
//          }
//          const currentHTML = body;
//          const document_ = htmlStrToDocument(currentHTML);
//          const listItems = xPathSelectorAll(document_, "//div[./*[@aria-label='Page navigation']]/ul", document_);
            // const listItems = Array.from(document_.querySelectorAll("form[action='/search'] + div > div:nth-child(4) > *"));
            // added into the `page 1`(which is the first page) page.
            // targetUl.appendChild(...LIs);
            if(isForward) {
              insertPageListHeaderAnchor_bottom.insertAdjacentElement('beforebegin', getPageIndexHeader(i));
              listItems.forEach(item => {
                insertPageListHeaderAnchor_bottom.insertAdjacentElement('beforebegin', item);
              });
            } else {
//            const anchorEle = targetUl.querySelector(":scope > ul:nth-of-type(1)");
//            listItems.forEach(item => {
//                anchorEle.insertAdjacentElement('beforebegin', item);
//            });
              // backward
              listItems.reverse();
              listItems.forEach(item => {
                insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', item);
              });
              insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', getPageIndexHeader(i));
            }
            Object.assign(torrents, newTorrents);

//          await patchA();
            newCurrentPage = i; // update the newCurrentPage when request done
            isForward ? i++ : i--;
        } while(true);

        const countAfter = targetUl.querySelectorAll(".itemBody").length;
        const msg = `Loaded another ${countAfter - countBefore} items from page ${currentPageIndex} to ${newCurrentPage}`;
        console.info(`after change we have: ${countAfter} items`);
        showMsg(msg);
        return newCurrentPage;
    };

    /*
     * Relevance: 0
     * Age: 2
     * Size: 3
     * Files: 4
     * https://skrbtdi.top/search?keyword=Uncensored-Leaked&sos=relevance&sofs=all&sot=all&soft=all&som=exact&p=10
     *
     */
    const extractParam = (href) => {
      const matchedStr = href.match(/\?.*/)[0];
      const queryArr = matchedStr.substr(1).split('&');

      const querys = {};

      queryArr.forEach(str => {
        const arr = str.split('=');
        const key = arr[0];
        const value = arr[1];
        querys[key] = value;
      });
      const { keyword, sos, sofs, sot, soft, som, p } = querys;
      const searchTxt = keyword;
      const orderBy = sos || 'relevance';
      const pageIndex = p ? parseInt(p) : 1; // start with 1

      const otherArgs = {
        sofs: sofs || 'all',
        sot: sot || 'all',
        soft: soft || 'all',
        som: som || 'exact',
      };

      return {
        searchTxt,
        orderBy,
        pageIndex,
        otherArgs,
      };
    };

    let searchTxt = '';
    let orderBy = '';
    let pageIndex = 1;
    let otherArgs = {};
    if(!inIframe()) ({ searchTxt, orderBy, pageIndex, otherArgs } = extractParam(window_.location.href + ''));

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
		border-color: green;
        opacity: 1 !important;
        pointer-events: unset !important;
      margin-top: 30px !important;
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
        background: #d2cce6 !important;
        cursor: pointer;
      }
      .CountToLoad {
        width: 50px !important;
      }
      .itemCheckDiv {
        display: flex;
        position: absolute;
        left: -30px;
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
      .col-md-6 > p {
        min-width: 600px;
      }
      .col-md-6 > nav {
        min-width: 600px;
      }
      .pageListheader {
        width: calc(100vw - 150px);
        border-top-style: ridge;
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

    const getAllIteams = () => {
        return Array.from(document.querySelectorAll(".itemBody"));
    };

    const getCheckbox = (itemContainer) => {
      return itemContainer.children[0].children[0];
    };

    const revertCheckbox = (itemContainer) => {
      const checkboxEle = getCheckbox(itemContainer);
      checkboxEle.checked = !checkboxEle.checked;
    };

    const getMagnet = (itemContainer) => {
      return itemContainer.getAttribute('torrentHref');
    };

    window_.allCheck = () => {
        console.info(`in allCheck`);
        getAllIteams().forEach(ele => {
            getCheckbox(ele).checked = true;
        });
    };

    window_.invertCheck = () => {
        console.info(`in invertCheck`);
        getAllIteams().forEach(ele => {
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

    window_.CopyCheckedLink = function() {
        console.info(`in CopyCheckedLink`);
        const resultTorrent = [];
        const allItems = getAllIteams();
        allItems.forEach(ele => {
            const checkboxEle = getCheckbox(ele);
            if(checkboxEle.checked) {
                const newUrl = getMagnet(ele);
                resultTorrent.push(newUrl);
                //            ele.href = newUrl;
            }
        });
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


    const patchA = async () => {
      // item container
      // xPathSelector(document, "//div[./*[@aria-label='Page navigation']]")
      //
      // find all a
      // 
      const allItems = xPathSelectorAll(document, "//div[./*[@aria-label='Page navigation']]/ul[not(@isPatched='true')]");
      const length = allItems.length;
      for(let i = 0; i < length; i++) {
        const ele = allItems[i];
        // add a checkbox for each a
        ele.insertAdjacentHTML('afterbegin', '<div class="itemCheckDiv"><input type="checkbox" name="itemCheck" value="yes" class="itemCheck" onclick="onItemClick(event); return true;" /></div>');
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
        await fetchTorrentFileList(ele);
      };
    };

    const fetchTorrentFileList = async (ele) => {
        const torrentInfo = extractTorrentInfo(ele);
        await fetchTorrentDetails(torrentInfo);
        await sleepMS(randomIntFromInterval(requestIntervalLow, requestIntervalHigh));
        torrents[torrentInfo.torrentHref] = torrentInfo;
        ele.setAttribute('torrentHref', torrentInfo.torrentHref); // set torrentHref, since it's missing in the main dom
        ele.setAttribute('isFetched', 'true');
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
        await fetchTorrentFileList(ele);
      }
      return length;
    };


    window_.loadToPage1 = async function(event) {
        console.info(`in loadToPage1();`);
        const isForward = false;
        const jumpSize = 999;
        const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexLeft, jumpSize, otherArgs);
        currentPageIndexLeft = newIndex;
        // patchA();
        return true;
    };


    window_.loadPrevPages = async function(_this) {
        console.info(`in loadPrevPages();`);
        const isForward = false;
        const count = _this.nextElementSibling.value;
        const jumpSize = Number.parseInt(count, 10);
        const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexLeft, jumpSize, otherArgs);
        currentPageIndexLeft = newIndex;
        // patchA();
        return true;
    };

    window_.loadNextPages = async function(_this) {
        console.info(`in loadNextPages();`);
        const isForward = true;
        // read the CountToLoad from the previous input
        const count = _this.previousElementSibling.value;
        const jumpSize = Number.parseInt(count, 10);
        const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexRight, jumpSize, otherArgs);
        currentPageIndexRight = newIndex;
        // patchA();
        return true;
    };

    window_.loadToLastPage = async function(_this) {
        console.info(`in loadToLastPage();`);
        const isForward = true;
        const jumpSize = 999;
        const newIndex = await loadMore(searchTxt, orderBy, isForward, currentPageIndexRight, jumpSize, otherArgs);
        currentPageIndexRight = newIndex;
        // patchA();
        return true;
    };
    window_.fetchFileList = async function(_this) {
        console.info(`in fetchFileList();`);
        const length = await fetchSelectFileList();
        showMsg(`Fetched the fileList for ${length} torrent. ^_^`);
        return true;
    };
    window_.postToBackend = async function(_this) {
      console.info(`in postToBackend();`);
      // console.info(JSON.stringify(torrents));
      const url = `http://${serverHOST}:${serverPORT}/add-bt4g`;
      const postData = {
        website,
        torrents,
      };

//    debugger;
      showMsg(`postToBackend start... ^_^`);
      const { statusCode, body } = await postRetry(url, postData);
      console.info(`postResponse: statusCode: ${statusCode}, body: ${body}`);
      if(statusCode === 200) {
        copyToClipboard(body);
        const insertedItems_thisTime = body.split('\n');
        showMsg(`${insertedItems_thisTime.length} new items added, and they has been copied to Clipboard! ^_^`);
        return true;
      }
      showMsg(`postToBackend failed - statusCode: ${statusCode}, body: ${body}`);
      return false;
    };



    const checkActionBtns = `
    <input type="button" name="allCheck" value="Check All" class="allCheck" onClick="allCheck()" />
<input type="button" name="invertCheck" value="Invert Check" class="invertCheck" onClick="invertCheck()" />
<input type="button" name="CopyCheckedLink" value="CopyCheckedLink" class="CopyCheckedLink" onClick="CopyCheckedLink()" />
<input type="button" name="fetchFileList" value="fetchFileList" class="fetchFileList" onClick="fetchFileList()" disabled />
<input type="button" name="postToBackend" value="postToBackend" class="postToBackend" onClick="postToBackend()" />
<br />
    `;

    const loadBtns = `
<br />
<input type="button" name="loadToPage1" value="loadToFirstPage" class="loadPages" onClick="loadToPage1()" />
<input type="button" name="loadPrevPages" value="loadPrevPages" class="loadPages" onClick="loadPrevPages(this)" />
<input type="text" id="CountToLoad" value="1" class="CountToLoad" />
<input type="button" name="loadNextPages" value="loadNextPages" class="loadPages" onClick="loadNextPages(this)" />
<input type="button" name="loadToLastPage" value="loadToLastPage" class="loadPages" onClick="loadToLastPage()" />
    `;

//  const getAnchorElement = () => {
//    const checkActionBtnPostion_top = document.querySelector("form[action='/search'] + div > div:nth-child(1)");
//    const loadBtnPostion_top = document.querySelector("form[action='/search'] + div > div:nth-child(3)");
//    document.querySelectorAll("form[action='/search'] + div > div:last-child");
//
//  };

  // TODO
  insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', getPageIndexHeader(currentPageIndex));
  document.querySelector(".result-stats").insertAdjacentHTML('beforebegin', checkActionBtns);
  document.querySelector(".result-stats").insertAdjacentHTML('afterend', loadBtns);
  
  document.querySelector(".pagination").insertAdjacentHTML('beforebegin', checkActionBtns);
  document.querySelector(".pagination").insertAdjacentHTML('afterend', loadBtns);

  if(inIframe()) {
    // don't invoke patchA in iframe, but only align the patchA to window, so that it could be calld by main frame
    window_.patchA = patchA;
    window.patchA = patchA;
    window_.torrents = torrents;
    window.torrents = torrents;
  } else {
    // run patchA directly in the main frame
    // TODO: uncomment this
    // patchA(); // we disable it temporally for loadMore testcase
  }
})();

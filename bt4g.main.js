

(function() {
    'use strict';
    console.info(`=================bt4g hacked`);
    const serverHOST = '192.168.10.16';
    const serverPORT = 8180;
    const website = 'bt4g';
    const requestIntervalLow = 1;
    const requestIntervalHigh = 5;

    if(inIframe()) return;

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

    const getItemParent = () => {
      const targetUl = xPathSelector(document, "//span[contains(concat(' ',normalize-space(@class),' '),' cpill ')]/parent::div/parent::div");
      return  targetUl;
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
      const allItems = xPathSelectorAll(doc, "//span[contains(concat(' ',normalize-space(@class),' '),' cpill ')]/parent::div", doc);
      return allItems;
    };

    const getCheckbox = (itemContainer) => {
      return itemContainer.children[0].children[0];
    };

    const revertCheckbox = (itemContainer) => {
      const checkboxEle = getCheckbox(itemContainer);
      checkboxEle.checked = !checkboxEle.checked;
    };

    const getMagnet = (itemContainer) => {
      const href = itemContainer.querySelector('a').href;
      const magnet = 'magnet:?xt=urn:btih:' + href.match(/(?<=\/magnet\/)[^\/]+$/g)[0];
      return magnet;
    };

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
        let baseUrl = `https://bt4g.org/search/${searchTxt}/`;
        if(orderBy) {
            baseUrl += `${orderBy}/`;
        }
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


    const extractParam = (path) => {
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

    const { searchTxt, orderBy, pageIndex } = extractParam(window_.location.pathname + '');
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
        getAllIteams(document).forEach(ele => {
            getCheckbox(ele).checked = true;
        });
    };

    window_.invertCheck = () => {
        console.info(`in invertCheck`);
        getAllIteams(document).forEach(ele => {
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
        const allItems = getAllIteams(document);
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

    const patchA = () => {
      // find all a
      // const allItems = Array.from(document.querySelectorAll("a[href^='/magnet/']:not([isPatched='true'])"));
      const allItems = xPathSelectorAll(document, "//span[contains(concat(' ',normalize-space(@class),' '),' cpill ')]/parent::div[not([@isPatched='true'])]");
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
        const torrentInfo = extractTorrentInfo(ele);
        await fetchTorrentDetails(torrentInfo);
        torrents[torrentInfo.torrentHref] = torrentInfo;
        await sleepMS(randomIntFromInterval(requestIntervalLow, requestIntervalHigh));
        ele.setAttribute('isFetched', 'true');
      }
      return length;
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
<input type="button" name="fetchFileList" value="fetchFileList" class="fetchFileList" onClick="fetchFileList()" />
<input type="button" name="postToBackend" value="postToBackend" class="postToBackend" onClick="postToBackend()" />
    `;

    const loadBtns = `
<br />
<input type="button" name="loadToPage1" value="loadToFirstPage" class="loadPages" onClick="loadToPage1()" />
<input type="button" name="loadPrevPages" value="loadPrevPages" class="loadPages" onClick="loadPrevPages(this)" />
<input type="text" id="CountToLoad" value="5" class="CountToLoad" />
<input type="button" name="loadNextPages" value="loadNextPages" class="loadPages" onClick="loadNextPages(this)" />
<input type="button" name="loadToLastPage" value="loadToLastPage" class="loadPages" onClick="loadToLastPage()" />
    `;

    insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', getPageIndexHeader(currentPageIndex));

    document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforebegin', checkActionBtns);

    document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforeend', loadBtns);

    document.querySelector('.pagination').insertAdjacentHTML('beforebegin', checkActionBtns);
    document.querySelector('.pagination').insertAdjacentHTML('beforeend', loadBtns);

    patchA();
})();



(function() {
    'use strict';
    console.info(`=================btdig hacked`);
    const serverHOST = '192.168.10.2';
    const serverPORT = 8180;
    const website = 'btdig';
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
      return htmlStrToElement(`<div class="pageListheader listItem-common"><div class="headerTxt">Page ${pageIndex} is shown below:</div></div>`);
    };

    // testaaa();

    const getItemParent = () => {
      const targetUl = document.querySelector("form[action='/search'] + div > div:nth-child(4)");
      return  targetUl;
    };

    const itemParent = getItemParent();

    // TODO: fix the selector the find the anchor_top
    itemParent.insertAdjacentHTML('afterbegin', "<div class='pageAnchor listItem-common'></div>");
    const insertPageListHeaderAnchor_top = itemParent.firstElementChild;
    if(!insertPageListHeaderAnchor_top) { // do nothing when there is no result
      return;
    }
    // TODO: fix the selector the find the anchor_bottom
    itemParent.insertAdjacentHTML('beforeend', "<div class='pageAnchor listItem-common'></div>");
    const insertPageListHeaderAnchor_bottom = itemParent.lastElementChild;

    const getAllIteams = (doc) => {
      const allItems = Array.from(doc.querySelectorAll("form[action='/search'] + div > div:nth-child(4) > .one_result"));
      return allItems;
    };

    const getAllIteamsEnabled = (doc) => {
      const allItems = Array.from(document.querySelectorAll(".itemBody"));
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
      return itemContainer.querySelector('.torrent_magnet a').href;
    };

    const loadMore = async(searchTxt, orderBy, isForward, currentPageIndex, jumpSize) => {
        const beginIndex = 0; // skip page one since it's already on first page
        const endIndex = 100; // this site won't load page after this number
        // const orgName = 'phoenix-core';

        // '/search/uncen/bysize/1'


        const targetUl = getItemParent();

        const countBefore = getAllIteams(document).length;
        console.info(`beofre change we have: ${countBefore} items`);

        let i = isForward ? (currentPageIndex + 1) : (currentPageIndex - 1);
        let document_ = null;
        let pagesToLoad = jumpSize;
        let baseUrl = `https://www.btdig.com/search?q=${searchTxt}&order=${orderBy}&p=`;

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
            if(statusCode === 404 || statusCode === 302) { // edge page
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
              // const anchorEle = targetUl.querySelector(":scope > div:nth-child(1)");
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

    /*
     * Relevance: 0
     * Age: 2
     * Size: 3
     * Files: 4
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
      const { q, p, order} = querys;
      const searchTxt = q;
      const orderBy = order;
      const pageIndex = p ? parseInt(p) : 0; // start with 0

      return {
        searchTxt,
        orderBy,
        pageIndex,
      };
    };

    const { searchTxt, orderBy, pageIndex } = extractParam(window_.location.href + '');
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
        background: #d2cce6 !important;
        cursor: pointer;
      }
      .itemBodyDisabled {
        background: grey !important;
      }
      .itemBodyDisabled:hover {
        background: grey;
      }
      .CountToLoad {
        width: 50px !important;
      }
      .itemCheckDiv {
        display: table-cell;
        vertical-align: middle !important;
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
      .IFixedIt {
        height: 100%;
        font-size: 30px;
        display: flex;
        position: absolute;
        right: 0;
        top: 0;
      }
      .pageListheader {
      }
      .pageListheader .headerTxt {

        display: flex;
        position: absolute;
        border-top-style: ridge;
        width: 80vw;

      }
      .pageAnchor {
        display: table-row;
      }
      .listItem-common {
        height: 20px;

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


    const patchA = async () => {
      // find all a
      const allItems = Array.from(document.querySelectorAll(".one_result:not([isPatched='true'])"));
      allItems.forEach(ele => {
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
      const url = `http://${serverHOST}:${serverPORT}/add-torrent`;
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
      const endMsg = `postToBackend failed - statusCode: ${statusCode}, body: ${body}`;
      console.info(endMsg);
      showMsg(`${endMsg}`);
      return false;
    };

  /**
   * remove items that contains given keyword(in the input keyword4Junk) in title
   */
    window_.removeKeyWordItemsImt = async function(criteria, isReg) {
      // get all items
      const allItems = Array.from(document.querySelectorAll(".itemBody"));
      // filter itmes that contains given text
      const itemsToHandle = allItems.filter(ele => {
        const itemText = ('' + ele.textContent).trim().toLowerCase();
        if(isReg) {
          
          if(new RegExp(criteria).test(itemText)) {
             return true;
          }
        } else {
          if(itemText.indexOf(('' + criteria).toLowerCase()) > -1) {
             return true;
          }
        }
        return false;
      });
      // disable those junk items
      const length = itemsToHandle.length;
      for(let i = 0; i < length; i++) {
        const ele = itemsToHandle[i];
        ele.classList.remove("itemBody");
        ele.classList.add("itemBodyDisabled");
      }
      return length;
    };

  /**
   * remove items that contains given keyword(in the input keyword4Junk) in title
   */
    window_.removeKeyWordItems = async function(_this) {
      showMsg(`removeKeyWordItems start... ^_^`);
      const criteria = _this.previousElementSibling.value;
      const retVal = removeKeyWordItemsImt(criteria, false);
      showMsg(`removeKeyWordItems done... ^_^`);
      return retVal;
    };
  /**
   * remove items that contains given reg(in the input keyword4Junk) in title
   */
    window_.removeRegItems = async function(_this) {
      showMsg(`removeRegItems start... ^_^`);
      const criteria = _this.previousElementSibling.previousElementSibling.value;
      const retVal = removeKeyWordItemsImt(criteria, true);
      showMsg(`removeRegItems done... ^_^`);
      return length;
    };
  /**
   * remove items that less than given size(in the input sizeThrottle)
   */
    window_.removeSmallItems = async function(_this) {
      showMsg(`removeSmallItems start... ^_^`);
      const criteria = Number.parseInt(_this.previousElementSibling.value, 10);
      const allItems = Array.from(document.querySelectorAll(".itemBody"));
      const itemsToHandle = allItems.filter(ele => {
        const torrentInfo = extractTorrentInfo(ele);
        if(torrentInfo.torrentSizeInMB < criteria) {
           return true;
        }
        return false;
      });
      const length = itemsToHandle.length;
      for(let i = 0; i < length; i++) {
        const ele = itemsToHandle[i];
        ele.classList.remove("itemBody");
        ele.classList.add("itemBodyDisabled");
      }
      showMsg(`removeSmallItems done... ^_^`);
      return length;
    };

  const getSuffix = (i) => {
    const retVal = [];
    if (i < 10) {
      retVal.push(`0000${i}`, `000${i}`, `0${i}`, `00${i}`, i);
    } else if (i < 100) {
      retVal.push(`000${i}`, `00${i}`, `0${i}`, i);
    } else if (i < 1000) {
      retVal.push(`00${i}`, `0${i}`, i);
    } else if (i < 10000) {
      retVal.push(`0${i}`, i);
    } else {
      retVal.push(i);
    }
    return retVal;
  };
  //
  // gunm00046

  const do1Index = async (i) => {
    const isForward = true;
    const jumpSize = 1;
    const suffixes = getSuffix(i);
    for (let j = 0; j < suffixes.length; j++) {
      const suffix = suffixes[j];
      const querytxt = `${searchTxt}${suffix}`;
      try {
        const newIndex = await loadMore(querytxt, orderBy, isForward, 0, jumpSize);
      } catch (e) {
        // console.debug(`${url} not passed`);
      }
      await sleepMS(randomIntFromInterval(requestIntervalLow, requestIntervalHigh));
    }
    return true;
  };

    window_.qryWithPrefix0 = async function(_this) {
      showMsg(`qryWithPrefix0 start... ^_^`);
      const start = 1;
      // const end = 6;
      const end = Number.parseInt(_this.previousElementSibling.value, 10);

      for (let i = start; i < end; i++) {
        showMsg(`qryWithPrefix0 inprogress... ${i}~${end}`);
        await do1Index(i);
        await sleepMS(1000);
      }
      
      // console.info(`result: ${JSON.stringify(result)}`);
      console.info('done');

      showMsg(`qryWithPrefix0 done... ^_^`);
      return true;
    };


    const checkActionBtns = `
    <input type="button" name="allCheck" value="Check All" class="allCheck" onClick="allCheck()" />
<input type="button" name="invertCheck" value="Invert Check" class="invertCheck" onClick="invertCheck()" />
<input type="button" name="CopyCheckedLink" value="CopyCheckedLink" class="CopyCheckedLink" onClick="CopyCheckedLink()" />
<input type="button" name="fetchFileList" value="fetchFileList" class="fetchFileList" onClick="fetchFileList()" />
<input type="button" name="postToBackend" value="postToBackend" class="postToBackend" onClick="postToBackend()" />
<div class="action-divider">|</div>
<input type="text" id="keyword4Junk" value="keyword4Junk" class="keyword4Junk checkActionItem" />
<input type="button" name="removeKeyWordItems" value="removeKeyWordItems" class="removeKeyWordItems checkActionItem" onClick="removeKeyWordItems(this)" />
<input type="button" name="removeRegItems" value="removeRegItems" class="removeRegItems checkActionItem" onClick="removeRegItems(this)" />
<input type="text" id="sizeThrottle" value="sizeThrottleInMB" class="sizeThrottle checkActionItem" />
<input type="button" name="removeSmallItems" value="removeSmallItems" class="removeSmallItems checkActionItem" onClick="removeSmallItems(this)" />
<input type="text" id="qryWithPrefix0End" value="qryWithPrefix0End" class="qryWithPrefix0End checkActionItem" />
<input type="button" name="qryWithPrefix0" value="qryWithPrefix0" class="qryWithPrefix0 checkActionItem" onClick="qryWithPrefix0(this)" />
    `;

    const loadBtns = `
<br />
<input type="button" name="loadToPage1" value="loadToFirstPage" class="loadPages" onClick="loadToPage1()" />
<input type="button" name="loadPrevPages" value="loadPrevPages" class="loadPages" onClick="loadPrevPages(this)" />
<input type="text" id="CountToLoad" value="5" class="CountToLoad" />
<input type="button" name="loadNextPages" value="loadNextPages" class="loadPages" onClick="loadNextPages(this)" />
<input type="button" name="loadToLastPage" value="loadToLastPage" class="loadPages" onClick="loadToLastPage()" />
    `;


  // TODO
    insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', getPageIndexHeader(currentPageIndex));

    document.querySelector("form[action='/search'] + div > div:nth-child(1)").insertAdjacentHTML('afterbegin', checkActionBtns);
    document.querySelector("form[action='/search'] + div > div:nth-child(3)").insertAdjacentHTML('afterbegin', loadBtns);

    document.querySelector("form[action='/search'] + div > div:last-child").insertAdjacentHTML('afterbegin', checkActionBtns);
    document.querySelector("form[action='/search'] + div > div:last-child").insertAdjacentHTML('beforeend', loadBtns);

    patchA();
})();

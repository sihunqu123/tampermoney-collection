
///@require https://github.com/mitchellmebane/GM_fetch/blob/master/GM_fetch.min.js

// console.info(`=====path: ${JSON.stringify(unsafeWindow.location)}`);

(function() {
    'use strict';
    console.info(`=================bt4g hacked`);
    const serverHOST = '192.168.10.16';
    const serverPORT = 8180;
    const website = 'bt4g';

    window_ = unsafeWindow;

    function inIframe () {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    }

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


    // testaaa();

    const loadMore = async(searchTxt, orderBy, isForward, currentPageIndex, jumpSize) => {
        const beginIndex = 0; // skip page one since it's already on first page
        const endIndex = 70; // this site won't load page after this number
        // const orgName = 'phoenix-core';

        // '/search/uncen/bysize/1'


        const targetUl = document.querySelector("a[href^='/magnet/']").parentElement.parentElement.parentElement;
        const countBefore = targetUl.childElementCount;
        console.info(`beofre targetUl.childElementCount: ${countBefore}`);

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
            const aItems = Array.from(document_.querySelectorAll("a[href^='/magnet/']"));
            // added into the `page 1`(which is the first page) page.
            // targetUl.appendChild(...LIs);
            if(isForward) {
                aItems.forEach(item => {
                    const itemContainer = item.parentElement.parentElement;
                    targetUl.appendChild(itemContainer);
                });
            } else {
                const anchorEle = document.querySelector("a[href^='/magnet/']").parentElement.parentElement
                aItems.forEach(item => {
                    const itemContainer = item.parentElement.parentElement;
                    anchorEle.insertAdjacentElement('beforebegin', itemContainer);
                });
            }
            newCurrentPage = i; // update the newCurrentPage when request done
            isForward ? i++ : i--;
        } while(true);

        const countAfter = targetUl.childElementCount;
        const msg = `Loaded another ${countAfter - countBefore} items from page ${currentPageIndex} to ${newCurrentPage}`;
        console.info(`after targetUl.childElementCount: ${targetUl.childElementCount}`);
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
      .refreshDiv  iframe {
        width: 90vw;
        height: calc(90vw - 100px);
      }
      .refreshDiv .refreshMsg {
        width: 100%;
        height: 100px;
        line-height: 100px;
        font-size: 85px;
        text-align: center;
        color: coral;
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

    const getAllAIteams = () => {
        return Array.from(document.querySelectorAll("a[href^='/magnet/']"));
    };

    window_.allCheck = () => {
        console.info(`in allCheck`);
        getAllAIteams().forEach(ele => {
            ele.previousElementSibling.checked = true;
        });
    };

    window_.invertCheck = () => {
        console.info(`in invertCheck`);
        getAllAIteams().forEach(ele => {
            ele.previousElementSibling.checked = !ele.previousElementSibling.checked;
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
        const allA = getAllAIteams();
        allA.forEach(ele => {
            if(ele.previousElementSibling.checked) {
                const newUrl = 'magnet:?xt=urn:btih:' + ele.href.match(/(?<=\/magnet\/)[^\/]+$/g)[0];
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


    const patchA = () => {
      // find all a
      const allA = Array.from(document.querySelectorAll("a[href^='/magnet/']:not([isPatched='true'])"));
      allA.forEach(ele => {
          // add a checkbox for each a
          ele.insertAdjacentHTML('beforebegin', '<input type="checkbox" name="itemCheck" value="yes" class="itemCheck" onclick="onItemClick(event); return true;" />');
          // add class for the checkbox to apply css
          ele.parentElement.parentElement.classList.add("itemBody");
          /* */
          // add click on div to check/uncheck
          ele.parentElement.parentElement.addEventListener('click', function(event) {
              // event.preventDefault();
              // ele.previousElementSibling.click();
              if(event.target.name !== 'itemCheck') {
                  ele.previousElementSibling.checked = !ele.previousElementSibling.checked;
                  event.preventDefault();
                  console.info(`ischecked? : ${ele.previousElementSibling.checked}`);
              }
          }, false);
          // add mark to tell this a has been patched
          ele.setAttribute('isPatched', 'true');
      });
    };

    const fetchSelectFileList = async() => {

      const allA = Array.from(document.querySelectorAll("a[href^='/magnet/']:not([isFetched='true'])"));
      const selectedA = allA.filter(ele => {
        if(ele.previousElementSibling.checked) {
           return true;
        }
        return false;
      });
      const length = selectedA.length;
      for(let i = 0; i < length; i++) {
        if(i % 10 === 0) {
          const progress = (i / length).toFixed(2);
          showMsg(`fetch filelist inprogress... ${progress}%`);
        }
        const ele = selectedA[i];
        const torrentInfo = extractTorrentInfo(ele.parentElement.parentElement);
        await fetchTorrentDetails(torrentInfo);
        torrents[torrentInfo.torrentHref] = torrentInfo;
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

    document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforebegin', checkActionBtns);

    document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforeend', loadBtns);

    document.querySelector('.pagination').insertAdjacentHTML('beforebegin', checkActionBtns);
    document.querySelector('.pagination').insertAdjacentHTML('beforeend', loadBtns);

    patchA();
})();



(function() {
    'use strict';
    console.info(`=================btdig hacked`);
    const serverHOST = '192.168.10.16';
    const serverPORT = 8180;
    const website = 'btdig';

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
        // const beginIndex = 2; // skip page one since it's already on page
        //	const endIndex = 6;
        // const orgName = 'phoenix-core';

        // '/search/uncen/bysize/1'


        const targetUl = document.querySelector("form[action='/search'] + div > div:nth-child(4)");

        const countBefore = targetUl.querySelectorAll(".one_result").length;
        console.info(`beofre change we have: ${countBefore} items`);

        let i = isForward ? (currentPageIndex + 1) : (currentPageIndex - 1);
        let document_ = null;
        let pagesToLoad = jumpSize;
        let baseUrl = `https://www.btdig.com/search?q=${searchTxt}&order=${orderBy}&p=`;
      

        let url = '';
        do {
            const pageNum = i;
            url = baseUrl + pageNum;
            const { statusCode, body } = await fetchBT4GRetry(url);
            if(statusCode === 404) { // edge page
              break;
            }
            if(statusCode != 200) {
              console.error(`non-200/404 result: ${body}`);
              showMsg(`run into error. Please check the console for details!`);
              return;
            }
            const currentHTML = body;
            const document_ = htmlStrToDocument(currentHTML);
            const listItems = Array.from(document_.querySelectorAll("form[action='/search'] + div > div:nth-child(4) > *"));
            // added into the `page 1`(which is the first page) page.
            // targetUl.appendChild(...LIs);
            if(isForward) {
              listItems.forEach(item => {
                  targetUl.appendChild(item);
              });
            } else {
              const anchorEle = document.querySelector("form[action='/search'] + div > div:nth-child(4) > div:first-child");
              listItems.forEach(item => {
                  anchorEle.insertAdjacentElement('beforebegin', item);
              });
            }

            if(i <= 0 || --pagesToLoad < 1) {
                console.info(`reached the last page: ${pageNum}`);
                break;
            }
            isForward ? i++ : i--;
        } while(true);

        const countAfter = targetUl.querySelectorAll(".one_result").length;
        const msg = `Loaded another ${countAfter - countBefore} items from page ${currentPageIndex} to ${i}`;
        console.info(`after change we have: ${countAfter} items`);
        showMsg(msg);
        return i;
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
        const pageIndex = p || 0; // start with 0

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
        background: white !important;
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
        display: table-cell;
        vertical-align: middle !important;
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
        return Array.from(document.querySelectorAll(".one_result"));
    };

    const getCheckbox = (itemContainer) => {
      return itemContainer.children[0].children[0];
    };

    const getMagnet = (itemContainer) => {
      return itemContainer.querySelector('.torrent_magnet a').href;
    };
    

    window_.allCheck = () => {
        console.info(`in allCheck`);
        getAllAIteams().forEach(ele => {
            getCheckbox(ele).checked = true;
        });
    };

    window_.invertCheck = () => {
        console.info(`in invertCheck`);
        getAllAIteams().forEach(ele => {
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
        const allItems = getAllAIteams();
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


    const patchA = () => {
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
            const checkboxEle = getCheckbox(ele);
            checkboxEle.checked = !getCheckbox(ele).checked;
            event.preventDefault();
            console.info(`ischecked? : ${checkboxEle.checked}`);
          }
        }, false);
        // add mark to tell this a has been patched
        ele.setAttribute('isPatched', 'true');
      });
    };

    const sleepInMS = async(numInMs) => {
        return new Promise(resove => {
            setTimeout(() => {
                resolve();
            }, numInMs);
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
<input type="button" name="loadToPage1" value="loadToPage1" class="loadPages" onClick="loadToPage1()" />
<input type="button" name="loadPrevPages" value="loadPrevPages" class="loadPages" onClick="loadPrevPages(this)" />
<input type="text" id="CountToLoad" value="5" class="CountToLoad" />
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
    document.querySelector("form[action='/search'] + div > div:nth-child(1)").insertAdjacentHTML('afterbegin', checkActionBtns);
    document.querySelector("form[action='/search'] + div > div:nth-child(3)").insertAdjacentHTML('afterbegin', loadBtns);

    document.querySelector("form[action='/search'] + div > div:last-child").insertAdjacentHTML('afterbegin', checkActionBtns);
    document.querySelector("form[action='/search'] + div > div:last-child").insertAdjacentHTML('beforeend', loadBtns);

    patchA();
})();

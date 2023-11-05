

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
          #J_isku div:nth-child(1) > dl:nth-child(1) > dt {
            display: none !important;
          }
          .itemContainer {
            max-height: 900px;
            width: 470px;
            overflow-y: auto;
          }
          .itemBody {
            display: flex !important;
            width: 410px;
          }
          .itemBody > a {
            overflow: hidden;
            max-width: 45px;
          }
          .itemBody > span {
            margin-left: 10px;
            display: inline !important;
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

    /**
     * patch the buy option list
     */
    const patchA = () => {
      // find all li
      const allItems = Array.from(document.querySelectorAll("#J_isku div:nth-child(1) > dl:nth-child(1) > dd:nth-child(2) > ul > li"));
      if(allItems.length > 0) {
        allItems[0].parentElement.classList.add("itemContainer");
      }
      // const allItems = xPathSelectorAll(document, "//span[contains(concat(' ',normalize-space(@class),' '),' cpill ')]/parent::div[not(@isPatched='true')]");
      allItems.forEach(ele => {
        const aItem = ele.querySelector(' a ');
        // add a checkbox for each a
        aItem.insertAdjacentHTML('afterend', `<span class='item-des'>${aItem.textContent}</span>`);
        // add class for the checkbox to apply css
        ele.classList.add("itemBody");
        /* */
        // add click on div to check/uncheck
//      ele.addEventListener('click', function(event) {
//        // event.preventDefault();
//        // ele.previousElementSibling.click();
//        if(event.target.name !== 'itemCheck') {
//          itemOnclickHandler(event, ele);
//        }
//      }, false);

        // add mark to tell this a has been patched
        ele.setAttribute('isPatched', 'true');
      });
    };





    const checkActionBtns = `
    <input type="button" name="allCheck" value="Check All" class="allCheck checkActionItem" onClick="allCheck()" />
<input type="button" name="invertCheck" value="Invert Check" class="invertCheck checkActionItem" onClick="invertCheck()" />
<input type="button" name="CopyCheckedLink" value="CopyCheckedLink" class="CopyCheckedLink checkActionItem" onClick="CopyCheckedLink()" />
<input type="button" name="fetchFileList" value="fetchFileList" class="fetchFileList checkActionItem" onClick="fetchFileList()" />
<input type="button" name="postToBackend" value="postToBackend" class="postToBackend checkActionItem" onClick="postToBackend()" />
<div class="action-divider">|</div>
<input type="button" name="fetch6FilesList" value="fetch6FilesList" class="fetch6FilesList checkActionItem" onClick="fetch6FilesList()" />
<input type="text" id="keyword4Junk" value="keyword4Junk" class="keyword4Junk checkActionItem" />
<input type="button" name="removeKeyWordItems" value="removeKeyWordItems" class="removeKeyWordItems checkActionItem" onClick="removeKeyWordItems(this)" />
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

    // insertPageListHeaderAnchor_top.insertAdjacentElement('afterend', getPageIndexHeader(currentPageIndex));

//  document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforebegin', checkActionBtns);
//
//  document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforeend', loadBtns);
//
//  document.querySelector('.pagination').insertAdjacentHTML('beforebegin', checkActionBtns);
//  document.querySelector('.pagination').insertAdjacentHTML('beforeend', loadBtns);

    patchA();
})();

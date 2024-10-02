
const MAGNET_LINK = 'magnetLink';
const enableImgDownload = true;

(function() {
  'use strict';
  console.info(`=================PaXiShi hacked`);
  const serverHOST = '192.168.10.2';
  const serverPORT = 8180;
  const website = 'bt4g';
  const requestIntervalLow = 1;
  const requestIntervalHigh = 5;
  const downloadHost = window_.location.hostname;

  if(inIframe()) return;

  const downloadedLinks = [];

  const torrents = {

  };

  const torrent6 = {

  };

  const getAllIteams = (doc) => {
    const allItems = Array.from(doc.querySelectorAll("#waterfall > li"));
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

  const failedList = [];

  const extractTorrentZipInfo = async (ele, pageIndex) => {
    const itemURL = ele.querySelector(":scope > div > a").href;
    const imageEle4Item = ele.querySelector(":scope > div > a > img");
    if(!imageEle4Item) {
      console.info(`ignore element: ${ele.outerHTML}`);
      return null;
    }
    const itemTitle = imageEle4Item.getAttribute("alt");
    let imageURL = ele.querySelector(":scope > div > a > img").getAttribute("src");
    console.info(`itemTitle: ${itemTitle}, imageURL: ${imageURL}, itemURL: ${itemURL}`);
    const { statusCode, body } = await fetchBT4GRetry(itemURL);

    if(statusCode === 404) { // edge page
      console.error(`non-200/404 result: ${body}`);
      const msg = `run into error. Please check the console for details! The taregt page does NOT exist!`;
      showMsg(msg);
      await sleepMS(4000);
      throw new Error();
    }
    if(statusCode != 200) {
      console.error(`non-200/404 result: ${body}`);
      const msg = `run into error. Please check the console for details!`;
      showMsg(msg);
      await sleepMS(4000);
      throw new Error();
    }


    const currentHTML = body;
    const document_ = htmlStrToDocument(currentHTML);
    // handle image src
    imageURL = document_.querySelectorAll('#postlist img[src*=hxmmdd]')[0].src;
    // handle download src
    let zipDownloadURL = document_.querySelectorAll('#postlist .attnm > a')[0].href;

    const retVal = {
      imageURL,
      itemTitle,
      itemURL,
      zipDownloadURL,
      pageIndex,
    };

    if(zipDownloadURL) {
      const successMsg = `extracted ${itemTitle}:\n ${JSON.stringify(retVal, null, 2)}, pageIndex: ${pageIndex}`;
      showMsg(successMsg);
      console.info(successMsg);
      // refer: https://github.com/Tampermonkey/tampermonkey/issues/1113

      const downloadHeaders = {
        'sec-ch-ua-mobile': '?0',
        'Referer': `https://${downloadHost}/` ,
        'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      };

      try {

        const downloadRarSuccess = await downloadViaBrowserNative(zipDownloadURL, itemTitle + '.rar', itemURL);
        if(downloadRarSuccess) {
          // we need to save the itemURL instead, since the zipDownloadURL is always on change
          const urlQuery = getQueryFrmURL(itemURL);
          // add to the array when downloaded
          downloadedLinks.push(urlQuery);
          showMsg(`Downloaded zip for: ${itemTitle}, pageIndex: ${pageIndex}`);

          if(enableImgDownload) {
            await downloadViaBrowser(imageURL, itemTitle + '.jpg', downloadHeaders);
            showMsg(`Downloaded image for: ${itemTitle}, pageIndex: ${pageIndex}`);
          }
        } else {
          showMsg(`Skip zip for: ${itemTitle}, since alrady downloaded in prev time, pageIndex: ${pageIndex}`);
        }

      } catch(e) {
        const errMsg = `Failed to download for: ${itemTitle}, pageIndex: ${pageIndex}`;
        showMsg(errMsg);
        console.error(errMsg);
        failedList.push(retVal);
        throw e; // no need to continue download if one item failed
      }
    } else {
      const msg = `Failed to extra the zipDownloadInfo for ${itemTitle}, pageIndex: ${pageIndex}`;
      console.error(msg);
      failedList.push(retVal);
      // throw new Error(msg);
    }

    return retVal;
  };

  /**
   * @searchTxt ignored
   * @orderBy ignored
   * @orderBy ignored
   * @isForward ignored
   * @currentPageIndex
   * @jumpSize
   */
  const loadMore = async(searchTxt, orderBy, isForward, currentPageIndex, jumpSize) => {
    const beginIndex = 0; // skip page one since it's already on first page
    const endIndex = 9999 // this site won't load page after this number

    // '/search/uncen/bysize/1'
    //

    // https://mail.bilibb.shop/forum-127-1.html
    // https://mail.bilibb.shop/forum-127-12.html

    // https://m.x11x.lol/forum.php?mod=forumdisplay&fid=163&page=2


    let i = currentPageIndex;
    let document_ = null;
    let pagesToLoad = jumpSize;
    // let baseUrl = `https://m.x11x.lol/forum.php?mod=forumdisplay&fid=163&page=`;
    let baseUrl = `https://${downloadHost}/forum.php?mod=forumdisplay&fid=163&page=`;
    // let baseUrl = `https://mail.bilibb.shop/forum-127-`;
    let url = '';
    let newCurrentPage = currentPageIndex;
    const allZipList = [];

    const fetchItems = [];

    do {
      const pageNum = i;
      showMsg(`handling page: ${i}`);
      console.info(`handling page: ${i}`);
      if(i < beginIndex || --pagesToLoad < 0 || i > endIndex) {
        console.info(`reached the last page: ${pageNum}`);
        break;
      }
      await sleepMS(randomIntFromInterval(requestIntervalLow, requestIntervalHigh));
      url = baseUrl + pageNum;
      // url = baseUrl + pageNum + '.html';
      const { statusCode, body } = await fetchBT4GRetry(url);
      if(statusCode === 404) { // edge page
        break;
      }
      if(statusCode != 200) {
        console.error(`non-200/404 result: ${body}`);
        showMsg(`run into error. Please check the console for details! Failed to fetch list`);
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

      for(let j = 0; j < listItems.length; j++) {
        const listItem = listItems[j];
        const torrentZipInfo = await extractTorrentZipInfo(listItem, pageNum);
        if(torrentZipInfo) {
          allZipList.push(torrentZipInfo);
          // TODO: remove this break when all test work done
          // break;
        }
      }



      newCurrentPage = i; // update the newCurrentPage when request done
      isForward ? i++ : i--;
    } while(true);

    console.info(`allZipList: \n` + JSON.stringify(allZipList));
    console.info(`allImgLink: \n` + allZipList.map(item => item.imageURL).join('\n'));
    console.info(`allzipink: \n` + allZipList.map(item => item.zipDownloadURL).join('\n'));
    console.info(`failedList: \n` + JSON.stringify(failedList));
    console.info(`failedImgLink: \n` + failedList.map(item => item.imageURL).join('\n'));
    console.info(`failedZipink: \n` + failedList.map(item => item.zipDownloadURL).join('\n'));
    showMsg('done');
    return newCurrentPage;
  };

  let searchTxt = '';
  let orderBy = null;
  let pageIndex = 1;
  let currentPageIndex = pageIndex;



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
  loadCustomStyle();


  window_.allCheck = () => {
    console.info(`in allCheck`);
    getAllIteamsEnabled(document).forEach(ele => {
      getCheckbox(ele).checked = true;
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
        const retVal = `${tmp}` + ".git";
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

  //  const handleOnePage = async function() {
  //
  //  };
  //
  window_.loadNextPages = async function(_this) {
    console.info(`in loadNextPages();`);
    const isForward = true;
    // read the CountToLoad from the previous input
    const toStr = _this.previousElementSibling.value;
    const fromStr = _this.previousElementSibling.previousElementSibling.value;
    const fromIndex = Number.parseInt(fromStr, 10);
    const toIndex = Number.parseInt(toStr, 10);
    const jumpSize = toIndex - fromIndex + 1;
    // alert(`fromIndex: ${fromIndex}, toIndex: ${toIndex}`);
    try {
      const newIndex = await loadMore(searchTxt, orderBy, isForward, fromIndex, jumpSize);
    } catch(e) {
      console.error(e);
    } finally {
      console.info(`downloadedLinks this time: \n` + downloadedLinks.join('\n'));
    }
    return true;
  };

  const checkActionBtns = `
fromPage: <input type="text" name="CountToLoad" value="1" class="CountToLoad" />
toPage: <input type="text" name="CountToLoad" value="2" class="CountToLoad" />
<input type="button" name="loadNextPages" value="fetchDownloadInfos" class="loadPages" />
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


  // document.querySelector("span#visitedforums").insertAdjacentHTML('beforebegin', checkActionBtns);
  document.querySelector("#pgt").insertAdjacentHTML('beforebegin', checkActionBtns);

  //  const paginationEle = document.querySelector('.pagination');
  //  if(paginationEle) {
  //    document.querySelector("form[data-autosearch-results-container='org-repositories']").insertAdjacentHTML('beforeend', loadBtns);
  //    paginationEle.insertAdjacentHTML('beforebegin', checkActionBtns);
  //    paginationEle.insertAdjacentHTML('beforeend', loadBtns);
  //  }

  // patchA();

  //  Array.from(document.querySelectorAll("input[name='allCheck']")).forEach(ele => ele.onclick = allCheck);
  //  Array.from(document.querySelectorAll("input[name='invertCheck']")).forEach(ele => ele.onclick = invertCheck);
  //  Array.from(document.querySelectorAll("input[name='CopyCheckedLink']")).forEach(ele => ele.onclick = CopyCheckedLink);
  //  Array.from(document.querySelectorAll("input[name='loadToPage1']")).forEach(ele => ele.onclick = loadToPage1.bind(null, ele));
  //  Array.from(document.querySelectorAll("input[name='loadPrevPages']")).forEach(ele => ele.onclick = loadPrevPages.bind(null, ele));
  Array.from(document.querySelectorAll("input[name='loadNextPages']")).forEach(ele => ele.onclick = loadNextPages.bind(null, ele));
  //  Array.from(document.querySelectorAll("input[name='loadToLastPage']")).forEach(ele => ele.onclick = loadToLastPage.bind(null, ele));

})();

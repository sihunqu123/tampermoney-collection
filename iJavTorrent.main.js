
const MAGNET_LINK = 'magnetLink';

(function() {
  'use strict';
  console.info(`=================iJavTorrent hacked`);
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

  const baseURL = window_.location.href.match(/^.*page=/)[0];

  const getAllIteams = (doc) => {
    const allItems = Array.from(document.querySelectorAll("a[href^='magnet']"));
// console.info(Array.from(document.querySelectorAll("a[href^='magnet']")).join('\n'));
    return allItems;
  };

  const getAllIteamsEnabled = (doc) => {
    const allItems = Array.from(doc.querySelectorAll(".itemBody"));
    return allItems;
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
    const endIndex = 70; // this site won't load page after this number

    // '/search/uncen/bysize/1'

    // https://m.x11x.lol/forum.php?mod=forumdisplay&fid=127&page=2
    let i = currentPageIndex;
    let document_ = null;
    let pagesToLoad = jumpSize;
    // let baseUrl = `https://ijavtorrent.com/tag/8kvr-2407?page=`;
    let baseUrl = baseURL;
    let url = '';
    let newCurrentPage = currentPageIndex;
    let allZipList = [];

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

      allZipList = allZipList.concat(listItems);
//    for(let j = 0; j < listItems.length; j++) {
//      const listItem = listItems[j];
//      const torrentZipInfo = await extractTorrentZipInfo(listItem, pageNum);
//      allZipList.push(torrentZipInfo);
//      // TODO: remove this break when all test work done
//      // break;
//    }



      newCurrentPage = i; // update the newCurrentPage when request done
      isForward ? i++ : i--;
    } while(true);

    console.info('all items: ');
    console.info(allZipList.join('\n'));
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
    const newIndex = await loadMore(searchTxt, orderBy, isForward, fromIndex, jumpSize);
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


  document.querySelector("main>.container-fluid .second-main h1").insertAdjacentHTML('beforeend', checkActionBtns);

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

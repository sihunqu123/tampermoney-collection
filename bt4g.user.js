// ==UserScript==
// @name         bt4g
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://bt4g.org/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at      document-end
// @grant       GM_cookie
// @grant       GM.cookie
// ==/UserScript==


(function() {
    'use strict';
    console.info(`=================bt4g hacked`);


    const window_ = unsafeWindow;

    const showMsg = (str) => {
        // default css:
        const css = 'cursor:default;z-index:2147483646;display:block;overflow:hidden;whitespace:normal;vertical-align:middle;font-weight:normal;font-size:14px;line-height:20px;font-family:sans-serif;max-width:none;max-height:none;min-width:10px;height:auto;min-height:10px;padding:0;margin:0;background:#f1f1f1;border:1px solid #333;border-color:#fff #333 #333 #fff;border-radius:1px;box-shadow:none;vertical-align:top;';
        const wrapper = document.createElement('div');
        let textLength=0;
        str.split('\n').forEach(function(line){
            if (textLength<line.length) {
                textLength=line.length;
            }
        });
        const width = Math.floor(Math.min(innerWidth - 30, textLength*16, Math.max(innerWidth / 2, 200)));
        const left = innerWidth / 2 - width / 2;
        wrapper.style.cssText = css + 'position:fixed;box-shadow:0 0 3px #000;padding:10px;top:50px;left:' + left + 'px;width:' + width + 'px;';
        const x = '<div style="' + css + 'position:static;width:auto;float:right;clear:both;border:none;margin-top:-10px;margin-right:-5px;font-size:18px;">&times;</div>';
        const hr = '<div style="' + css + 'width:100%;height:1px;border-top:#777;border-radius:0;margin:15px 0 5px;"></div>';
        const ok = '<div style="' + css + 'position:static;float:right;clear:both;margin:5px;padding:4px 10px;">OK</div>';
        wrapper.innerHTML = x + ('' + str).replace(/</g, '&lt;').replace(/\n/g, '<br>') + ok;
        setTimeout(() => {
            document.body.removeChild(wrapper);
        }, 8000);
        wrapper.addEventListener("click", function () {
            document.body.removeChild(wrapper);
        }, false);
        document.body.appendChild(wrapper);
    }

    // Copies a string to the clipboard. Must be called from within an
    // event handler such as click. May return false if it failed, but
    // this is not always possible. Browser support for Chrome 43+,
    // Firefox 42+, Safari 10+, Edge and Internet Explorer 10+.
    // Internet Explorer: The clipboard feature may be disabled by
    // an administrator. By default a prompt is shown the first
    // time the clipboard is used (per session).
    function copyToClipboard(text) {
        if (window_.clipboardData && window_.clipboardData.setData) {
            // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
            return window_.clipboardData.setData("Text", text);

        }
        else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            const textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
            document.body.appendChild(textarea);
            textarea.select();
            try {
                return document.execCommand("copy");  // Security exception may be thrown by some browsers.
            }
            catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return prompt("Copy to clipboard: Ctrl+C, Enter", text);
            }
            finally {
                document.body.removeChild(textarea);
            }
        }
    }



    const loadMore = async(searchTxt, orderBy, isForward, currentPageIndex, jumpSize) => {
        // const beginIndex = 2; // skip page one since it's already on page
        //	const endIndex = 6;
        // const orgName = 'phoenix-core';

        // '/search/uncen/bysize/1'

        const fetch1Page = async (pageNum) => {
            let url = `https://bt4g.org/search/${searchTxt}/`;
            if(orderBy) {
                url += `${orderBy}/`;
            }
            url += pageNum;
            let res = null;
            let body = null;
            try {
                res = await fetch(url);
                if(res.status === 404) {
                    console.warn(`run into 404 with page ${pageNum}, which seems to be an edge page index`);
                } else {
                    body = await res.text();
                }
            } catch(e) {
                console.info(e);
                console.info(res.status);
                throw e;
            } finally {
                console.info('in finally');
            }

            return {
                statusCode: res.status,
                body,
            };
        };

        const htmlStrToDocument = (str) => {
            const template = document.createElement('template');
            str = str.trim(); // Never return a text node of whitespace as the result
            template.innerHTML = str;
            const thisDocument = template.content;
            // thisDocument.querySelectorAll('li');
            return thisDocument;
        };

        const targetUl = document.querySelector("a[href^='/magnet/']").parentElement.parentElement.parentElement;
        const countBefore = targetUl.childElementCount;
        console.info(`beofre targetUl.childElementCount: ${countBefore}`);

        let i = isForward ? (currentPageIndex + 1) : (currentPageIndex - 1);
        let document_ = null;
        let pagesToLoad = jumpSize;
        do {
            const pageNum = i;
            const { statusCode, body } = await fetch1Page(pageNum);
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

            if(i <= 1 || --pagesToLoad < 1) {
                console.info(`reached the last page: ${pageNum}`);
                break;
            }
            isForward ? i++ : i--;
        } while(true);

        const countAfter = targetUl.childElementCount;
        const msg = `Loaded another ${countAfter - countBefore} items from page ${currentPageIndex} to ${i}`;
        console.info(`after targetUl.childElementCount: ${targetUl.childElementCount}`);
        showMsg(msg);
        return i;
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
        const allA = Array.from(document.querySelectorAll("a[href^='/magnet/']:not([isPatched='true'])"));
        allA.forEach(ele => {
            ele.insertAdjacentHTML('beforebegin', '<input type="checkbox" name="itemCheck" value="yes" class="itemCheck" onclick="onItemClick(event); return true;" />');
            ele.parentElement.parentElement.classList.add("itemBody");
            /* */
            ele.parentElement.parentElement.addEventListener('click', function(event) {
                // event.preventDefault();
                // ele.previousElementSibling.click();
                if(event.target.name !== 'itemCheck') {
                    ele.previousElementSibling.checked = !ele.previousElementSibling.checked;
                    event.preventDefault();
                    console.info(`ischecked? : ${ele.previousElementSibling.checked}`);
                }
            }, false);
            ele.setAttribute('isPatched', 'true');
        });
    }


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

    const checkActionBtns = `
    <input type="button" name="allCheck" value="Check All" class="allCheck" onClick="allCheck()" />
<input type="button" name="invertCheck" value="Invert Check" class="invertCheck" onClick="invertCheck()" />
<input type="button" name="CopyCheckedLink" value="CopyCheckedLink" class="CopyCheckedLink" onClick="CopyCheckedLink()" />
    `;

    const loadBtns = `
<br />
<input type="button" name="loadToPage1" value="loadToPage1" class="loadPages" onClick="loadToPage1()" />
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
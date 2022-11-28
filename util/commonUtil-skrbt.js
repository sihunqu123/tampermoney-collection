'use strict';


// ================TamperMonkey only begin================
let window_ = null;
window_ = unsafeWindow;

function inIframe () {
  try {
    return window_.self !== window_.top;
  } catch (e) {
    return true;
  }
}

let refreshResolver = null;

let captchaPromise = null;
let captchaResolver = null;

const refershToken = async(url) => {
  let refreshDiv = document.querySelector('.refreshDiv');
  if(refreshDiv) {
    refreshDiv.classList.remove('hiddenEle'); // show the refreshDiv
  } else {
    document.querySelector('body').insertAdjacentHTML('beforeend', `
      <div class="refreshDiv">
        <div class="refreshHeader">
          <span class="refreshMsg">Please fix below Captcha!!!!!!!</span>
          <input type="button" name="IFixedIt" value="IFixedIt" class="IFixedIt" onClick="IFixedIt()" />
        </div>
        <iframe class="refreshIframe"></iframe>
      </div>
    `);
    refreshDiv = document.querySelector('.refreshDiv');
  }
  const refreshIframe = refreshDiv.querySelector('.refreshIframe');
  const refreshPromise = new Promise(resolve => {
    refreshResolver = resolve;
  });
  refreshIframe.setAttribute('src', url);
  return refreshPromise;
};

const loadViaIframe = async(url) => {
  let refreshDiv = document.querySelector('.refreshDiv');
  if(refreshDiv) {
    refreshDiv.classList.remove('hiddenEle'); // show the refreshDiv
  } else {
    document.querySelector('body').insertAdjacentHTML('beforeend', `
      <div class="refreshDiv">
        <div class="refreshHeader">
          <span class="refreshMsg">Please fix below Captcha!!!!!!!</span>
          <input type="button" name="IFixedIt" value="IFixedIt" class="IFixedIt" onClick="IFixedIt()" />
        </div>
        <iframe id="refreshIframe" name="refreshIframe" class="refreshIframe"></iframe>
      </div>
    `);
    refreshDiv = document.querySelector('.refreshDiv');
  }
  const refreshIframe = refreshDiv.querySelector('.refreshIframe');
  const refreshPromise = new Promise(resolve => {
    refreshResolver = resolve;
  });
  refreshIframe.setAttribute('src', url);
  // window.frames["refreshIframe"].document.querySelectorAll(".itemBody:not([isFetched='true'])").length = 0;

  await sleepMS(100);
  document.querySelector("input[name='keyword']").value = searchTxt;
  await sleepMS(200);
  document.querySelector("button.search-btn").click();
  await sleepMS(200);
  searchWithPath(pageIndex);

  return refreshPromise;
};

window_.IFixedIt = async function(_this) {
  console.info(`in IFixedIt();`);
  const refreshDiv = document.querySelector('.refreshDiv');
  refreshDiv.classList.add("hiddenEle"); // hide the refreshDiv
  refreshResolver();
  return true;
};
   
window_.CaptchaFixed = async function(_this) {
  console.info(`in CaptchaFixed();`);
  timeoutAll = true;
  await sleepMS(1200);
  captchaResolver();
  return true;
};

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
  const timeoutId = setTimeout(() => {
      document.body.removeChild(wrapper);
  }, 8000);
  wrapper.addEventListener("click", function () {
      document.body.removeChild(wrapper);
      clearTimeout(timeoutId);
  }, false);
  document.body.appendChild(wrapper);
};



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

  } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
    const textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
        return document.execCommand("copy"); // Security exception may be thrown by some browsers.
    } catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return prompt("Copy to clipboard: Ctrl+C, Enter", text);
    } finally {
        document.body.removeChild(textarea);
    }
  }
}

const postRetry = async (url, postJSON, timesToRetry = 0) => {
  let res = null;
  let body = null;

//const formData = new FormData();
//const keys = Object.keys(postJSON);
//keys.forEach(key => {
//    formData.append(key, postJSON[key]);
//});
  try {
    console.info(`fetch url: ${url}`);
    // will NOT use fetch since it doesn't work for CROS, and HTTPS -> HTTP downgrad case
//  res = await fetch(url, {
//      method: 'POST',
//      body: formData,
//  });

    // https://wiki.greasespot.net/GM.xmlHttpRequest
    const res = await new Promise(resolve => {
      return GM_xmlhttpRequest({
        method:     "POST",
        url:        url,
        data:       JSON.stringify(postJSON),
//      dataType: 'json',
//      contentType: 'application/json',
        headers:    {
          'Content-Type': 'application/json',
        },
        onload:     (response) => {
          const { responseText, status } = response;
          resolve({
            status,
            body: responseText || '', // the emtpy string returned by backed will result to undefine for responseText
          });
        },
        onerror:    (response) => {
          // console.error(`GM_xmlhttpRequest failed: ${response}`);
          // response.status + response.statusText

          const { responseText, status } = response;
          resolve({
            status,
            body: responseText || '',
          });
        }
      });
    });


    const statusCode = res.status;
    let body = res.body;
    if(statusCode === 200) {
      // body = res.body;
    } else {
      --timesToRetry;
      if(timesToRetry >= 0) {
        if(statusCode === 401 || statusCode === 403) { // refresh page
          console.warn(`session expired, try to refresh token with iframe`);
          await sleepMS(randomIntFromInterval(1000, 5000));
          // TODO: how to refresh in nodejs?
          // await refershToken(url);
          return postRetry(url, postJSON, timesToRetry);
        }
        console.warn(`unexpected statusCode: ${statusCode} when accessing: ${url}`);
        await sleepMS(randomIntFromInterval(1000, 5000));
        return postRetry(url, timesToRetry);
      }

      body = `Retry exceed for url: ${url} with statusCode: ${statusCode}`; 
      console.error(body);
    }

    return {
      statusCode,
      body,
    };
  } catch(e) {
    console.info(e);
    throw e;
  }
};


// ================TamperMonkey only end================


const sleepMS = (timeInMS) => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, timeInMS);
});


function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// randomIntFromInterval(1, 6)

let timeoutAll = false;

const waitUntilQuery = async (query, timeoutInMS, win) => {
  let timeoutId = null;
  let intervalId = null;

  return new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      reject(new Error(`failed to find ${query}, after ${timeoutInMS}ms!!`));
    }, timeoutInMS);

    intervalId = setInterval(() => {
      let result = null;
      if(timeoutAll) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        reject(new Error(`timeout all`));
      }
      try {
        result = win.document.querySelector(query);
      } catch(e) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        reject(new Error(`Page does NOT exist anymore, maybe user clicked manually?`));
        return;
      }
      if(result) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        resolve();
      }
    }, 1000);
  });

};

const waitUntil = async (testFn, timeoutInMS, win) => {
  let timeoutId = null;
  let intervalId = null;

  return new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      reject(new Error(`wait timeout, after ${timeoutInMS}ms!!`));
    }, timeoutInMS);

    intervalId = setInterval(() => {
      let result = null;
      if(timeoutAll) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        reject(new Error(`timeout all`));
      }
      try {
        result = testFn();
      } catch(e) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        reject(new Error(`Page does NOT exist anymore, maybe user clicked manually?`));
        return;
      }
      if(result) {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
        resolve();
      }
    }, 1000);
  });

};

const fetchIframeRetry = async (option, timesToRetry = 3) => {
  const { url, searchTxt, pageIndex } = option;
  let res = null;
  let body = null;

  console.info(`fetch url: ${url}`);
  let refreshDiv = document.querySelector('.refreshDiv');

  if(refreshDiv) {
    refreshDiv.classList.remove('hiddenEle'); // show the refreshDiv
  } else {
    document.querySelector('body').insertAdjacentHTML('beforeend', `
      <div class="refreshDiv">
        <div class="refreshHeader">
          <span class="refreshMsg">Please fix below Captcha!!!!!!!</span>
          <input type="button" name="CaptchaFixed" value="IFixedIt" class="CaptchaFixed" onClick="CaptchaFixed()" />
        </div>
        <iframe id="refreshIframe" name="refreshIframe" class="refreshIframe"></iframe>
      </div>
    `);
    refreshDiv = document.querySelector('.refreshDiv');
  }
  try {
    const refreshIframe = refreshDiv.querySelector('.refreshIframe');
    const refreshPromise = new Promise(resolve => {
      refreshResolver = resolve;
    });
    refreshIframe.setAttribute('src', 'https://skrbtdi.top/');
    // window_.frames["refreshIframe"].document.querySelectorAll(".itemBody:not([isFetched='true'])").length = 0;
    // window_.frames["refreshIframe"];
    
    await waitUntilQuery("input[name='keyword']", 3000, window_.frames["refreshIframe"]);
    window_.frames["refreshIframe"].document.querySelector("input[name='keyword']").value = searchTxt;
    await sleepMS(200);
    window_.frames["refreshIframe"].document.querySelector("button.search-btn").click();
    await waitUntilQuery("ul.pagination", 3000, window_.frames["refreshIframe"]); // wait until the pagination bar shown

    await waitUntil(() => {
      return !!window_.frames["refreshIframe"].searchWithPath;
    }, 5000, window_.frames["refreshIframe"]);

    window_.frames["refreshIframe"].searchWithPath(pageIndex); // switch to target page

    // wait until the target pageIndex is the active page number
    await waitUntil(() => {
      const item = window_.frames["refreshIframe"].document.querySelector("ul.pagination > li.active > a");
      if(item) {
        return item.textContent.trim() === ('' + pageIndex);
      }
      return false;
    }, 5000, window_.frames["refreshIframe"]);
    
    await waitUntil(() => {
      return !!window_.frames["refreshIframe"].patchA;
    }, 5000, window_.frames["refreshIframe"]);

    // trigger patchA to fetch torrent hrefs
    window_.frames["refreshIframe"].patchA();

    // wait until the all torrent hrefs has been fetched
    await waitUntil(() => {
      const fetchedCnt = window_.frames["refreshIframe"].document.querySelectorAll(".itemBody[isFetched='true']").length;
      const notFetchedCnt = window_.frames["refreshIframe"].document.querySelectorAll(".itemBody:not([isFetched='true'])").length;
      if(fetchedCnt > 0 && notFetchedCnt === 0) {
        return true;
      }
      return false;
    }, 150000, window_.frames["refreshIframe"]);

    const listItems = window_.frames["refreshIframe"].document.querySelectorAll(".itemBody[isFetched='true']");
    const retVal = {
      torrents: window_.frames["refreshIframe"].torrents,
      listItems,
    };
    refreshDiv.classList.add("hiddenEle"); // hide the refreshDiv
    return retVal;
  } catch(e) {
    // incase this error is result from 302/301
    console.error(e);
    captchaPromise = new Promise(resolve => {
      captchaResolver = resolve;
    });
    await captchaPromise;
    timeoutAll = true;
    await sleepMS(1200);
    timeoutAll = false;
    return fetchIframeRetry(option);
  } finally {
    
  }
};

const fetchBT4GRetry = async (url, timesToRetry = 3) => {
  let res = null;
  let body = null;
  try {
    console.info(`fetch url: ${url}`);
    res = await fetch(url
      , {
//      headers: {
//        'referer': 'https://skrbtdi.top/search?keyword=Uncensored-Leaked&sos=relevance&sofs=all&sot=all&soft=all&som=exact&p=1',
//      },
        redirect: 'error',
      },
    );

    const statusCode = res.status;
    if(statusCode === 200) {
      body = await res.text();
    } else if(statusCode === 404) {
      body = `fetch url failed - statusCode: 404, url: ${url}`;
      console.debug(body);
    } else {
      --timesToRetry;
      if(timesToRetry >= 0) {
        if(statusCode === 401 || statusCode === 403 || statusCode === 429) { // refresh page
          console.warn(`session expired, try to refresh token with iframe`);
          await sleepMS(randomIntFromInterval(1000, 5000));
          // TODO: how to refresh in nodejs?
          // await refershToken(url);
          return fetchBT4GRetry(url, timesToRetry);
        }
        console.warn(`unexpected statusCode: ${res.status} when accessing: ${url}`);
        await sleepMS(randomIntFromInterval(1000, 5000));
        return fetchBT4GRetry(url, timesToRetry);
      }

      body = `Retry exceed for url: ${url} with statusCode: ${statusCode}`; 
      console.error(body);
    }

    return {
      statusCode,
      body,
    };
  } catch(e) {
    // incase this error is result from 302/301
    console.info(`fetch url failed -s statusCode: 302, url: ${url}`);
    throw e;
  }
};





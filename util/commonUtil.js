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


const refershToken = async(url) => {
  const ifrm = document.createElement('iframe');
  document.querySelector('body').appendChild(ifrm);
  ifrm.setAttribute('src', url);
  return sleepInMS(6000);
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

  // also print to console
  console.info(str);
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

const sleepInMS = sleepMS;



function randomIntFromInterval(min, max) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// randomIntFromInterval(1, 6)

const fetchBT4GRetry = async (url, timesToRetry = 10) => {
  let res = null;
  let body = null;
  try {
    console.info(`fetch url: ${url}`);
    res = await fetch(url);
    const statusCode = res.status;
    if(statusCode === 200) {
      body = await res.text();
    } else if(statusCode === 404) {
      body = `fetch url failed - statusCode: 404, url: ${url}`;
      console.debug(body);
    } else {
      --timesToRetry;
      if(timesToRetry >= 0) {
        if(statusCode === 401 || statusCode === 403) { // refresh page
          console.warn(`session expired, try to refresh token with iframe`);
          await sleepMS(randomIntFromInterval(1000, 5000));
          // TODO: how to refresh in nodejs?
          await refershToken(url);
          return fetchBT4GRetry(url, timesToRetry);
        }
        console.warn(`unexpected statusCode: ${res.status} when accessing: ${url}`);
        await sleepMS(randomIntFromInterval(20000, 50000));
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
    console.warn(`unexpected error when accessing: ${url}`);
    console.info(e);
    throw e;
  }
};


/**
 * Interal use only. Fetch blob for download.
 */
const fetchBlobRetry = async (url, timesToRetry = 3, headers = {}) => {
  let res = null;
  let body = null;
  try {
    console.info(`fetchBlob url: ${url}`);
    res = await new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        url,
        headers,
        responseType: "blob",
        onload: resolve,
        onerror: reject,
      });
    });
    const {
      response: blob,
      status: statusCode,
      statusText,
    } = res;
    if(statusCode === 200) {
      body = blob;
    } else if(statusCode === 404) {
      body = `fetchBlob url failed - statusCode: 404, url: ${url}`;
      console.debug(body);
    } else {
      --timesToRetry;
      if(timesToRetry >= 0) {
        if(statusCode === 401 || statusCode === 403) { // refresh page
          console.warn(`session expired for url: ${url}`);
        } else {
          console.warn(`unexpected statusCode: ${res.status} when accessing: ${url}`);
          await sleepMS(randomIntFromInterval(1000, 5000));
          return fetchBlobRetry(url, timesToRetry, headers);
        }
      }

      body = `Retry exceed for url: ${url} with statusCode: ${statusCode}`;
      console.error(body);
    }

    return {
      statusCode,
      body,
    };
  } catch(e) {
    console.error(e);
    throw e;
  }
};

/**
 * use the browser's download behavior to the blob to a file in local
 */
const downloadBlob = (blob, name) => {
  const anchor = document.createElement("a");
  anchor.setAttribute("download", name || "");
  anchor.href = URL.createObjectURL(blob);
  anchor.click();
  setTimeout(_ => {
    URL.revokeObjectURL(blob);
    anchor.remove();
  }, 30000);
};

/**
 * download the given URL as a file in local
 */
const downloadViaBrowser = async (downloadURL, downloadFileName = '', headers = {}) => {
  const name = downloadFileName ? downloadFileName : url.match(/[^\/]+$/)[0];
  const { statusCode, body: blob } = await fetchBlobRetry(downloadURL, 3, headers);
  if(statusCode != 200) {
    const msg = `non-200/404 result for URL: ${url}, blob: ${blob}`;
    console.error(msg);
    showMsg(`run into error. Please check the console for details! Failed to fetch list`);
    await sleepMS(4000);
    throw new Error(msg);
  }
  downloadBlob(blob, name);
  console.log(`Downloaded : ${name}`);
};


/**
 * @url e.g. https://ccgga.me/forum.php?mod=viewthread&tid=835193&extra=page%3D1
 * @return e.g. mod=viewthread&tid=835193&extra=page%3D1 
 */
const getQueryFrmURL = (url) => {
  // return url.match(/(?<=^[^\?]+\?).*$/)[0]; 
  return url.match(/(?<=tid=)[^&]+/)[0]; 
};


/**
 *
 * @param itemURL the url used to avoid download duplicated item
 * @return true if downloaded successfully; false if the file has already been download in previouse time.
 * @ throw error if failed to download
 */
const downloadViaBrowserNative = async(downloadURL, filename, itemURL = '') => {
  if(!itemURL) itemURL = downloadURL;
  const urlQuery = getQueryFrmURL(itemURL);
  if(downloadedLinks_prev.indexOf(urlQuery) > -1) {
    // if already downloaded.
    return false;
  }

  var x = new XMLHttpRequest();
  try {
    x.open('GET', downloadURL, true);
  } catch(e) {
    debugger;
    console.error(`Failed to download filename: ${filename}, itemURL: ${itemURL}, downloadURL: ${downloadURL}`);
    throw e;
  }
  x.responseType = 'blob';
  let isResponseFile = false;
  x.onreadystatechange = function () {
    if (x.readyState == 2) {
      const ContentDisposition = x.getResponseHeader("Content-Disposition");
      if(ContentDisposition) {
        isResponseFile = true;
      }
    }
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error('onload事件未在10秒内触发');
      reject(new Error(`Failed to download file: ${filename}`));
    }, 20000);
    x.onload = (e) => {
      clearTimeout(timeoutId);
      if(!isResponseFile) {
        reject(new Error(`Failed to download file: ${filename}`));
        return;
      }
      // debugger;
      // console.info(e);
      // console.info(`filename: ${filename}, e.currentTarget.status: ${e.currentTarget.status}`);
      var url = window.URL.createObjectURL(x.response);
      const link = document.createElement('a');
      link.target = '_blank';
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve(true);
    };
    x.send();
  });
}




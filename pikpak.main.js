

(async function() {
  'use strict';
  console.info(`=================pikpak hacked`);
  let window_ = null;
  window_ = unsafeWindow;

  const sleepMS = (timeInMS) => new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeInMS);
  });

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

  const rightClick = (ele) => {
    if (window_.CustomEvent) {
      ele.dispatchEvent(new CustomEvent('contextmenu'));
    } else if (document.createEvent) {
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('contextmenu', true, false);
      ele.dispatchEvent(ev);
    } else { // Internet Explorer
      ele.fireEvent('oncontextmenu');
    }
  };

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
  .downloadFolder {
    position: absolute;
    right: 80px;
    top: 30px;
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

  window_.downloadFolder = async() => {
    console.info(`in downloadFolder`);
    const items = Array.from(document.querySelectorAll(".list-wrap ul > li"));
    const length = items.length;
    for(let i = 0; i < length; i++) {
      const item = items[i];
      // item.click();
      rightClick(item);
      await sleepMS(5000);
      // const downloadBtn = Array.from(document.querySelectorAll(".multi-operation > li"))[2];
      // const downloadBtn = Array.from(document.querySelectorAll(".multi-operation > li"))[2];
      var btns = Array.from(document.querySelectorAll(".context-menu > li"));
      let downloadBtn = null;
      for(let j = 0; j < btns.length; j++) {
        const currentBtn = btns[j];
        if(currentBtn.innerText.trim() === 'Download') {
          downloadBtn = currentBtn;
          break;
        }
      }
      if(!downloadBtn) {
        const msg = `Download button detect failed!`;
        console.error(msg);
        showMsg(msg);
        throw new Error(msg);
      }
      downloadBtn.click();
      showMsg(`adding to download queue ${i + 1}/${length}...`);
      await sleepMS(10000);
    }
      await sleepMS(3000);
    showMsg(`All items added to download queue ${length}/${length}!`);
  };

  const downloadFolderBtn = `
  <input type="button" name="downloadFolder" value="downloadFolder" class="downloadFolder" onClick="downloadFolder()" />
  `;

  let anchorEle = null;
  while(true) {
    anchorEle = document.querySelector(".file-explorer-header nav.folder-navigator");
    if(anchorEle) {
      anchorEle.insertAdjacentHTML('beforebegin', downloadFolderBtn);
      break;
    }
    await sleepMS(5000);
  }
  

//  document.querySelector("main > .container div:nth-child(4) > div > div > span").insertAdjacentHTML('beforeend', loadBtns);
//
//  document.querySelector('.pagination').insertAdjacentHTML('beforebegin', checkActionBtns);
//  document.querySelector('.pagination').insertAdjacentHTML('beforeend', loadBtns);

})();


const MAGNET_LINK = 'magnetLink';

(function() {
  'use strict';
  console.info(`=================bili hacked`);

  const loadCustomStyle = () => {
    var style = document.createElement('style');
    style.type='text/css';

      // a:has(+ .video-sections-content-list)
    const customCSS = `

      .video-sections-content-list {
        height: 70vh !important;
        max-height: unset !important;
      }
      #slide_ad + a
      ,#danmukuBox
      ,#slide_ad
      {
        display: none !important;
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

  // const domArr = [...document.querySelectorAll('.video-sections-content-list')];

})();

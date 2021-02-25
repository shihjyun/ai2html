
(function(){
  
  const ai2htmlElements = document.querySelectorAll('figure.ai2html')

  if (ai2htmlElements) {
    for (let i = 0; i < ai2htmlElements.length; i++) {
      loadAi2html(ai2htmlElements[i])
    }
  }
  
  async function loadAi2html(elm){

    // inject ai2html general css setting
    document.querySelector('head').insertAdjacentHTML('beforeend', '<style type="text/css">.article-content .ai2html .chart-title{font-size: 20px; padding: 0 0 0 0; color: #4d4d4d; line-height: 1.2;}.article-content .ai2html .chart-subtitle{font-size: 14px; padding: 0 0 6px 0;}.article-content .ai2html .ai2html-figcaption .chart-credit{font-size: 12px; color: #948d8d; line-height: 1.2; padding: 0 0 4px 0;}.article-content .ai2html .ai2html-figcaption .chart-sources{font-size: 12px; color: #948d8d; line-height: 1.2; padding: 0 0 4px 0;}.article-content .ai2html .ai2html-figcaption .chart-notes{font-size: 12px; color: #948d8d; line-height: 1.2; padding: 0 0 0 0; max-width: 80%;}.article-content .ai2html .ai2html-figcaption{position: relative; border: none; padding: 10px 0 0 0;}.article-content .ai2html .ai2html-figcaption .tnl-chart-logo{width: 30px; position: absolute; right: 0; top: 10px;}@media (min-width:640px){.article-content .ai2html .chart-title{font-size: 28px;}.article-content .ai2html .chart-subtitle{font-size: 20px; padding: 8px 0 10px 0;}.article-content .ai2html .ai2html-figcaption .chart-credit{font-size: 12px;}.article-content .ai2html .ai2html-figcaption .chart-sources{font-size: 12px;}.article-content .ai2html .ai2html-figcaption .chart-notes{font-size: 12px; max-width: 80%;}.article-content .ai2html .ai2html-figcaption{padding: 16px 0 0 0;}.article-content .ai2html .ai2html-figcaption .tnl-chart-logo{width: 40px; top: 16px;}}</style>')

    // ai2html preparation
    const graphElement = elm
    const project = graphElement.getAttribute('data-project')
    const graph = graphElement.getAttribute('data-graph')
    
    // get ai2html html file from GCS
    const data = await fetch(
      `https://datastore.thenewslens.com/infographic/tnl-ai2html/figures/${project}/${graph}.html`
    );

    // inject html content to graph element
    graphElement.insertAdjacentHTML('beforeend', await data.text());

    // let graph element can reponsively
    resizeAi2htmlFigure(`g-${graph}-box`, {namespace: 'g-', setup: window.setupInteractive || window.getComponent});
  }

  function resizeAi2htmlFigure(containerId, opts) {
    if (!('querySelector' in document)) return;
  
    var container = document.getElementById(containerId);
    var nameSpace = opts.namespace || '';
    var onResize = throttle(update, 200);
    var waiting = !!window.IntersectionObserver;
    var observer;
    update();
  
    document.addEventListener('DOMContentLoaded', update);
    window.addEventListener('resize', onResize);
  
    // NYT Scoop-specific code
    if (opts.setup) {
      opts.setup(container).on('cleanup', cleanup);
    }
  
    function cleanup() {
      document.removeEventListener('DOMContentLoaded', update);
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
    }
  
    function update() {
      var artboards = selectChildren('.' + nameSpace + 'artboard[data-min-width]', container),
        width = Math.round(container.getBoundingClientRect().width);
  
      // Set artboard visibility based on container width
      artboards.forEach(function (el) {
        var minwidth = el.getAttribute('data-min-width'),
          maxwidth = el.getAttribute('data-max-width');
        if (+minwidth <= width && (+maxwidth >= width || maxwidth === null)) {
          if (!waiting) {
            selectChildren('.' + nameSpace + 'aiImg', el).forEach(updateImgSrc);
          }
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      });
  
      // Initialize lazy loading on first call
      if (waiting && !observer) {
        if (elementInView(container)) {
          waiting = false;
          update();
        } else {
          observer = new IntersectionObserver(onIntersectionChange, {});
          observer.observe(container);
        }
      }
    }
  
    function elementInView(el) {
      var bounds = el.getBoundingClientRect();
      return bounds.top < window.innerHeight && bounds.bottom > 0;
    }
  
    // Replace blank placeholder image with actual image
    function updateImgSrc(img) {
      var src = img.getAttribute('data-src');
      if (src && img.getAttribute('src') != src) {
        img.setAttribute('src', src);
      }
    }
  
    function onIntersectionChange(entries) {
      // There may be multiple entries relating to the same container
      // (captured at different times)
      var isIntersecting = entries.reduce(function (memo, entry) {
        return memo || entry.isIntersecting;
      }, false);
      if (isIntersecting) {
        waiting = false;
        // update: don't remove -- we need the observer to trigger an update
        // when a hidden map becomes visible after user interaction
        // (e.g. when an accordion menu or tab opens)
        // observer.disconnect();
        // observer = null;
        update();
      }
    }
  
    function selectChildren(selector, parent) {
      return parent ? Array.prototype.slice.call(parent.querySelectorAll(selector)) : [];
    }
  
    // based on underscore.js
    function throttle(func, wait) {
      var timeout = null,
        previous = 0;
      function run() {
        previous = Date.now();
        timeout = null;
        func();
      }
      return function () {
        var remaining = wait - (Date.now() - previous);
        if (remaining <= 0 || remaining > wait) {
          clearTimeout(timeout);
          run();
        } else if (!timeout) {
          timeout = setTimeout(run, remaining);
        }
      };
    }
  }

})()


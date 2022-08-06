/* HELPERS / CUSTOM METHODS */
/* Object.prototype functions incompatibles con VANTA */

// Verificar si un objeto/array/string/int se encuentra vacío
Object.prototype.isEmpty = function(){
  return Object.entries(this).length === 0;
}
Array.prototype.isEmpty = function(){
  return this.length === 0;
}
String.prototype.isEmpty = function(){
  return this.length === 0;
}
Number.prototype.isEmpty = function(){
  return this.valueOf() === 0;
}

// Comparar Arrays
const compare = (...arrs) => {
  for(let arr of arrs){
    if(typeof(arr) != "object") return false;
  }
  let test = JSON.stringify(arrs[0]);
  for(let i = 0; i < arrs.length; i++){
    if(JSON.stringify(arrs[i]) != test) return false;
  }
  return true;
}

// Obtener colección de propiedades
Object.prototype.getEntries = function(){
  return Object.entries(this);
}

// JSON ordenado (array de objetos)
Array.prototype.sortBy = function(prop = "id"){
  let ordered = this.sort((a, b) => {
    return (a[prop] > b[prop]) ? 1 : -1;
  });
  return ordered;
}

// Freezar objetos y arrays
Object.prototype.freeze = function(){
  Object.freeze(this);
  return true;
}
Array.prototype.freeze = function(){
  Object.freeze(this);
  return true;
}

// Crear animación/es a destino desde estilo actual
HTMLElement.prototype.animateTo = function(property, durationMs, timingFunction = "ease", fillMode = "forwards") {
  let from = {},
      to = {};
  for(let prop in property){
    from[prop] = this.style.prop || window.getComputedStyle(this, null).getPropertyValue(prop) || undefined;
    to[prop] = property[prop];
  };
  this.animate([from, to], {
    duration: durationMs,
    easing: timingFunction,
    fill: fillMode
  });

  return this;
}
HTMLElement.prototype.appendChildren = function(...children){
  for(let child of children){
    this.appendChild(child);
  }

  return this;
}
HTMLElement.prototype.appendTree = function(...children){
  this.appendChild(children[0]);
  for(let i = 0; i < children.length - 1; i++){
    children[i].appendChild(children[i + 1]);
  }

  return this;
}

/* $_GET object */
const $_GET = {
  set newMembers(members) {
    for(let member in members){
      this[member] = members[member]
    }
  }
};
(function objGET(){
  let members = window.location.search.substr(1).split("&");
  for (let member of members) {
    if(member != ""){
      let temp = member.split("=");
      $_GET[decodeURIComponent(temp[0])] = decodeURIComponent(temp[1]);
    }
  }
})();

// Obtener nombre del archivo desde URL
const getFileName = url => {
  while(url.indexOf("\\") >= 0){
    url = url.replace("\\", "/");
  }
  return url.substring(url.lastIndexOf('/')+1);
}

/* LOADERS */

class Loader {
  constructor(){
    this.resources = [];
    this.loaded = this.percentage = 0;
    this._onChange = ()=>false;
    this._onLoad = ()=>false;
  }

  evalPercentage(){
    this.percentage = Math.round((100 / this.resources.length) * this.loaded);
    if(this.percentage){
      // código al aumentar el porcentaje
      return this._onChange();
    }
  }
  exit(){
    // código al finalizar la carga
    return this._onLoad();
  }

  set addResources(resourcesArray){
    for(let resource of resourcesArray){
      if(!this.resources.includes(resource)) this.resources.push(resource);
    }
    return this;
  }
  set onChange(fx){
    this._onChange = fx;
    return this;
  }
  set onLoad(fx){
    this._onLoad = fx;
    return this;
  }
}


class ImgLoader extends Loader {
  constructor(autosearch = true, autoinit = 0){
    super();
    // this.imgObj = new Image();
    if(autosearch === true){
      // Cargar tags IMG
      for(let img of document.getElementsByTagName("img")){
        let resource = img.getAttribute("src");
        if(!this.resources.includes(resource)) this.resources.push(resource);
      };
      // Cargar background-images
      let tagsWithBg = ["body", "header", "section", "article", "footer", "div"];
      for(let tag of tagsWithBg){
        for(let elem of document.getElementsByTagName(tag)){
          let resource = "";
          if(elem.style.backgroundImage != ""){ // Para background-images inline
            let backgroundImg = elem.style.backgroundImage;
            if(backgroundImg.startsWith("url")){
              resource = backgroundImg.substring(4, backgroundImg.length - 1);
              resource = resource.replace(/['"]+/g, '');
            }
          } else { // Para background-images por sheets
            let backgroundImg = getComputedStyle(elem).backgroundImage;
            if(backgroundImg.startsWith("url")){
              resource = backgroundImg.substring(4, backgroundImg.length - 1);
              resource = resource.replace(/['"]+/g, '');
            }
          }
          if(resource != "" && !this.resources.includes(resource)) this.resources.push(resource);
        };
      }
    }
    if(autoinit > 0){
      setTimeout(()=>{
        if(this._onLoad !== false){
          this.init();
        }
      }, autoinit);
    }
    return this;
  }

  init(){
    if(this.resources.length > 0 && this.loaded < this.resources.length){
      let src = this.resources[this.loaded];
      let imgObj = new Image();
      this.evalPercentage();
      imgObj.onload = ()=>{
        this.loaded++;
        this.init();
      }
      imgObj.src = src;
    } else {
      this.evalPercentage();
      this.exit();
    }
  }
}

class VideoLoader extends Loader {
  constructor(autosearch = true, autoinit = 0){
    super();
    this.element = document.createElement('video');
    if(autosearch === true){
      let videoElements = document.getElementsByTagName("video");
      for(let video of videoElements){
        if(video.getAttribute("src")){
          this.resources.push(video.getAttribute("src"));
        } else {
          let sources = video.getElementsByTagName("source");
          for(let source of sources){
            this.resources.push(source.getAttribute("src"));
          }
        }
      }
    };
    if(autoinit > 0){
      setTimeout(()=>{
        if(this._onLoad !== false){
          this.init();
        }
      }, autoinit);
    }
    return this;
  }

  init(){
    if(this.resources.length > 0 && this.loaded < this.resources.length){
      this.element.src = this.resources[this.loaded];
      this.element.autoplay = true;
      this.element.oncanplaythrough = ()=>{
        this.loaded++;
        this.evalPercentage();
        this.init();
      };
    } else {
      this.evalPercentage();
      this.exit();
    }
  }
}

class AudioLoader extends Loader {
  constructor(autosearch = true, autoinit = 0){
    super();
    this.element = document.createElement('audio');
    if(autosearch === true){
      let audioElements = document.getElementsByTagName("audio");
      for(let audio of audioElements){
        if(audio.getAttribute("src")){
          this.resources.push(audio.getAttribute("src"));
        } else {
          let sources = audio.getElementsByTagName("source");
          for(let source of sources){
            this.resources.push(source.getAttribute("src"));
          }
        }
      }
    };
    if(autoinit > 0){
      setTimeout(()=>{
        if(this._onLoad !== false){
          this.init();
        }
      }, autoinit);
    }
    return this;
  }

  init(){
    if(this.resources.length > 0 && this.loaded < this.resources.length){
      this.element.src = this.resources[this.loaded];
      this.element.autoplay = true;
      this.element.oncanplaythrough = ()=>{
        this.loaded++;
        this.evalPercentage();
        this.init();
      };
    } else {
      this.evalPercentage();
      this.exit();
    }
  }
}


/* SLIDESHOW */
class Slideshow {
  constructor(elem){
    this.element = elem;
    this.slides = this.element.querySelectorAll("slide");
    this._currentSlide = 0;
    this._animationDelay = parseInt(this.element.getAttribute("autoplay")) || 0;
    this._state;
    this._onChange = () => {};

    if(this.slides.length){
      this.slides[this._currentSlide].setAttribute("active", "");

      let hardcodedThumbs = this.element.querySelectorAll("thumb");
      if(hardcodedThumbs.length){
        this._hasThumbnails = true;
        this.thumbs = hardcodedThumbs;
        this.thumbs[this._currentSlide].setAttribute("active", "");

        for(let thumb of hardcodedThumbs){
          this.assign(thumb, () => {
            this.changeSlide(thumb.getAttribute("for"));
          });
        }
      }

      if(this.element.hasAttribute("thumbnails")){
        this._hasThumbnails = true;
        this.thumbnails = document.createElement("thumbnails");
        for(let i = 0; i < this.slides.length; i++){
          let thumb = document.createElement("thumb");
          thumb.setAttribute("for", i);
          this.thumbnails.append(thumb);

          thumb.addEventListener("click", () => {
            this.changeSlide(thumb.getAttribute("for"));
          })
        }
        this.element.append(this.thumbnails);
        this.thumbs = this.thumbnails.querySelectorAll("thumb");

        this.thumbs[this._currentSlide].setAttribute("active", "");
      } else {
        this._hasThumbnails = false;
      }

      if(this._animationDelay > 0){
        this._state = setTimeout(() => {
          this.next();
        }, this._animationDelay);
      }

      if(this.element.querySelector("button[type='prev']")){
        this.assign(this.element.querySelector("button[type='prev']"), () => this.prev());
      }
      if(this.element.querySelector("button[type='next']")){
        this.assign(this.element.querySelector("button[type='next']"), () => this.next());
      }

      // Drag on mobile
      this.element.addEventListener("touchstart", e => {
        this._initPageX = e.changedTouches[0].pageX;
      });
      this.element.addEventListener("touchmove", e => {
        this._currentPageX = e.changedTouches[0].pageX;
      });
      this.element.addEventListener("touchend", e => {
        if(this._currentPageX > (this._initPageX + (this.element.clientWidth / 3))){
          this.prev();
        } else if(this._currentPageX < (this._initPageX - (this.element.clientWidth / 3))){
          this.next();
        }
      });
    }
  }

  assign(elem, action){
    elem.addEventListener("click", action);
  }

  prev(){
    if (--this._currentSlide < 0) this._currentSlide = this.slides.length - 1;
    this.changeSlide();
  }

  next(){
    if (++this._currentSlide >= this.slides.length) this._currentSlide = 0;
    this.changeSlide();
  }

  changeSlide(slideNumber = null){
    this.element.querySelector("slide[active]").removeAttribute("active");
    if(slideNumber !== null){
      this._currentSlide = slideNumber;
    }
    // Nodo currentSlide
    let currentSlide = this.slides[this._currentSlide];
    currentSlide.setAttribute("active", "");
    // Thumbnail
    if(this._hasThumbnails){
      this.element.querySelector("thumb[active]").removeAttribute("active");
      this.thumbs[this._currentSlide].setAttribute("active", "");
    }
    // Autoplay setup
    let delay = parseInt(currentSlide.getAttribute("autoplay")) || this._animationDelay;
    if(delay > 0){
      clearTimeout(this._state);
      this._state = setTimeout(() => {
        this.next();
      }, delay);
    }

    this._onChange();
  }

  restate(){
    this.slides = () => this.element.querySelectorAll("slide");
    this._animationDelay = parseInt(this.element.getAttribute("autoplay")) || 0;
    this.slides[this._currentSlide].setAttribute("active", "");

    if(this._animationDelay > 0){
      this._state = setTimeout(() => {
        this.next();
      }, this._animationDelay);
    }
  }

  set onChange(fx){
    this._onChange = fx;
  }

}


/* carousel */
class Carousel {
  constructor(elem){
    this.element = elem;
    this.itemsNode = this.element.querySelector("items");
    this.items = this.element.querySelectorAll("item");
    this.mayLoop = true;
    this._currentItem = 0;
    this._animationDelay = parseInt(this.element.getAttribute("autoplay")) || 0;

    if(this.element.querySelector("button[type='prev']")){
      this.assign(this.element.querySelector("button[type='prev']"), () => this.prev());
    }
    if(this.element.querySelector("button[type='next']")){
      this.assign(this.element.querySelector("button[type='next']"), () => this.next());
    }

    let originPos = this._currentItem * this.getItemsWidth();
    window.requestAnimationFrame(() => {
      this.itemsNode.scrollTo(originPos, 0);
    });

    const dragSensibility = 9;

    // Drag on desktop
    const dragActionDesktop = event => {
      this.itemsNode.scrollBy((event.movementX * (-dragSensibility)), 0);
    }

    this.itemsNode.addEventListener("mousedown", e => {
      this.itemsNode.addEventListener("mousemove", dragActionDesktop);
    });
    this.itemsNode.addEventListener("mouseup", e => {
      this.itemsNode.removeEventListener("mousemove", dragActionDesktop);
      let closestItem = Math.round(this.itemsNode.scrollLeft / this.getItemsWidth());
      this._currentItem = closestItem;
      this.jumpToCurrentItem();
    });

    // Drag on mobile
    const dragActionMobile = event => {
      let targetPosX = (this.items[this._currentItem].offsetLeft) + (this._initPageX - event.changedTouches[0].pageX);
      this.itemsNode.scroll(targetPosX, 0);
    }

    this.itemsNode.addEventListener("touchstart", e => {
      this._initPageX = e.changedTouches[0].pageX;
      this.itemsNode.style.scrollBehavior = "auto";
      this.itemsNode.addEventListener("touchmove", dragActionMobile);
    });

    this.itemsNode.addEventListener("touchend", e => {
      this.itemsNode.removeEventListener("touchmove", dragActionMobile);
      let closestItem = Math.round(this.itemsNode.scrollLeft / this.getItemsWidth());
      this._currentItem = closestItem;
      this.itemsNode.style.scrollBehavior = "smooth";
      this.jumpToCurrentItem();
    });
  }

  getItemsWidth(){
    return this.items[0].clientWidth;
  }

  assign(elem, action){
    elem.addEventListener("click", action);
  }

  prev(){
    if(this._currentItem > 0){
      if(this.items[this._currentItem].offsetLeft > this.itemsNode.scrollLeft){
        while(this.items[this._currentItem].offsetLeft > this.itemsNode.scrollLeft){
          this._currentItem --;
        };
      } else {
        this._currentItem --;
      }
      this.jumpToCurrentItem();
    } else if(this.mayLoop) {
      this._currentItem = this.items.length - 1;
      this.jumpToCurrentItem();
    }
  }

  next(){
    let scrollLeftMax = this.itemsNode.scrollWidth - this.itemsNode.clientWidth - this.itemsNode.scrollLeft;
    // alert(scrollLeftMax);
    if(this._currentItem < (this.items.length - 1) && scrollLeftMax > 0){ // && this.itemsNode.scrollLeft < this.itemsNode.scrollLeftMax
      this._currentItem ++;
      this.jumpToCurrentItem();
    } else if(this.mayLoop) {
      this._currentItem = 0;
      this.jumpToCurrentItem();
    }
  }

  jumpToCurrentItem(){
    let target = this.items[this._currentItem].offsetLeft;
    this.itemsNode.scrollTo(target, 0);
  }
}


/* DROPDOWN */
class DropDown {
  constructor(elem){
    this.element = elem;
    this.forId = elem.getAttribute("drop-down");
    this.forNode = document.getElementById(this.forId);
    this.timing = '0.5s ease';
    this.chain = false;
    if(this.element.hasAttribute("chain")){
      this.chain = this.element.getAttribute("chain");
    }

    if(this.element.hasAttribute("active")){
      this.forNode.style.height = this.forNode.scrollHeight + 'px';
    } else {
      this.forNode.style.height = '0px';
    }
    this.forNode.style.overflow = 'hidden';
    this.forNode.style.transition = `height ${this.timing}`;

    this.element.addEventListener("click", () => {
      if(!this.element.hasAttribute("active")){
        this.drop();
      } else {
        this.rise();
      }
    });
  }

  drop(){
    if(this.chain != false){
      for(let chainElem of OGFramework.dropDowns.chains[this.chain]){
        chainElem.rise();
      }
    }
    window.requestAnimationFrame(() => {
      this.element.setAttribute("active", "");
      if(this.forNode.offsetHeight < 1){
        this.forNode.style.height = this.forNode.scrollHeight + 'px';
      } else {
        this.forNode.style.height = '0px';
      }
    })
  }

  rise(){
    this.element.removeAttribute("active");
    this.forNode.style.height = '0px';
  }
}

/* CLASES PARA REQUEST DE CONTENIDO */

class JSONRequest{
  // Requiere el nombre del controlador al que será dirigido
  constructor(controller, fxOnSuccess = res => this._responseHandler(res)) {
    this.controller = controller;
    this.xmlhttp = new XMLHttpRequest();
    this.xmlhttp.onreadystatechange = () => {
      if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200) {
        console.log(this.xmlhttp.responseText); // Solo para debug
        let response = JSON.parse(this.xmlhttp.responseText);
        // Ejecuta la respuesta
        fxOnSuccess(response);
      }
    };
  }

  execute(data, method = "POST") {
    this.xmlhttp.open(method, `${cPath}${this.controller}.php`, true);
    if(typeof(data) === 'string'){ // Enviar header de formato si no es un FormData
      this.xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    this.xmlhttp.setRequestHeader('cache-control', 'no-cache, max-age=0');
    this.xmlhttp.setRequestHeader('pragma', 'no-cache');

    this.xmlhttp.send(data);
  }

  _responseHandler() { /* Por defecto sin acciones */ }
  set responseHandler(fx) {
    this._responseHandler = fx;
  }
}

class XMLResourceRequest{
  // Requiere el nombre del asset que será cargado
  constructor(asset, fxOnSuccess = res => this._responseHandler(res)) {
    this.asset = asset;
    this.xmlhttp = new XMLHttpRequest();
    this.xmlhttp.onreadystatechange = () => {
      if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200) {
        let response = this.xmlhttp.responseText;
        // Ejecuta la respuesta
        fxOnSuccess(response);
      }
    };
  }

  execute(data = "", method = "GET") {
    this.xmlhttp.open(method, `${this.asset}`, true);
    if(typeof(data) === 'string'){ // Enviar header de formato si no es un FormData
      this.xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    this.xmlhttp.setRequestHeader('cache-control', 'no-cache, max-age=0');
    this.xmlhttp.setRequestHeader('pragma', 'no-cache');

    this.xmlhttp.send(data);
  }

  _responseHandler() { /* Por defecto sin acciones */ }
  set responseHandler(fx) {
    this._responseHandler = fx;
  }

  static loadStaticInto(asset, container, fxOnSuccess = res => true){
    let load = new XMLResourceRequest(asset);
    load.responseHandler = (res) => {
      container.innerHTML = res;
      fxOnSuccess(res);
    }
    load.execute();
    return true;
  }
}

class Dialog {
  constructor(msg = "", btnSet = ["Aceptar"], fxOnAccept = () => true){
    this.msg = msg;
    this.btnSet = btnSet;
    this._fxOnAccept = fxOnAccept;
    this.dialog;

    this.create();
    this.addEvents();
    document.body.append(this.dialog);

    return this;
  }

  create(){
    // Evita el elemento dialog por incompatibilidades de Safari
    // this.dialog = document.createElement("dialog");
    // this.dialog.setAttribute("open", "open");

    this.dialog = document.createElement("div");
    this.dialog.classList.add("__og-dialog");

    let message = document.createElement("p");
    message.innerHTML = this.msg;
    this.dialog.append(message);

    let buttons = document.createElement("div");
    buttons.classList.add("flex-row");
    this.dialog.append(buttons);

    for(let btnCaption of this.btnSet){
      let newButton = document.createElement("button");
      newButton.textContent = btnCaption;
      buttons.append(newButton);
    }
  }

  addEvents(){
    const mainBtn = this.element.querySelector("button");
    mainBtn.addEventListener("click", () => {
      this._fxOnAccept();
    });

    for(let button of this.element.querySelectorAll("button")){
      button.addEventListener("click", () => {
        document.body.removeChild(this.element);
      });
    }
  }
}

class ContextMenu {
  constructor(container, posX = "0px", posY = "0px", content = {}){
    this.container = container;
    this.safeArea = 10; // Márgen de seguridad
    this.elem = document.createElement("nav");

    this.render(posX, posY);
    if(typeof(content) == 'object'){
      for(let node of content) this.addToContext(node);
    } else {
      this.elem.innerHTML = content;
    }

    this._handleEvents();
  }

  render(posX, posY){
    this.elem.classList.add("__og-context-menu");
    this.elem.style.left = posX;
    this.elem.style.top = posY;

    let pointer = document.createElement("div");
    pointer.classList.add("__og-pointer");
    this.elem.append(pointer);

    this.container.append(this.elem);

    window.requestAnimationFrame(() => {
      let rightAberration = posX + (this.elem.offsetWidth / 2) - window.innerWidth;
      if(rightAberration > 0){
        this.elem.style.marginLeft = - (rightAberration + this.safeArea);
        pointer.style.marginLeft = rightAberration + this.safeArea;
      }
    })
  }

  addToContext(node){
    let nodeElement = node.element || node.node || "a";
    let childNode = document.createElement(nodeElement);

    if(node.text) childNode.textContent = node.text;
    if(node.href) childNode.setAttribute("href", node.href);
    if(node.class) childNode.classList.add(node.class);
    if(node.id) childNode.id = node.id;
    this.elem.append(childNode);

    if(node.click) childNode.addEventListener("click", node.click);
  }

  _handleEvents(){
    let bodyEvent = () => {
      this.container.removeChild(this.elem);
      document.body.removeEventListener("click", bodyEvent);
    }
    window.requestAnimationFrame(() => {
      document.body.addEventListener("click", bodyEvent);
    })
  }
}


// GLOBAL DEFS
const OGFramework = {
  slideshows: {
    "found": 0,
    "success": 0,
    "errors": 0,
    "instances": []
  },
  carousels: {
    "found": 0,
    "success": 0,
    "errors": 0,
    "instances": []
  },
  dropDowns: {
    "found": 0,
    "success": 0,
    "errors": 0,
    "chains": {},
    "instances": []
  },
  loadElements: function(){
    this.loadSlideshows();
    this.loadCarrousels();
    this.loadDropDowns();
  },
  loadSlideshows: function(){
    for(let slideshow of document.querySelectorAll("slideshow")){
      this.slideshows.found++;
      if(this.slideshows.instances[this.slideshows.instances.length] = new Slideshow(slideshow)){
        this.slideshows.success++;
      } else {
        this.slideshows.errors++;
      }
    }
  },
  loadSlideshow: function(slideshowNode){
    this.slideshows.found++;
    let slideshowNum = this.slideshows.instances.length;
    if(this.slideshows.instances[slideshowNum] = new Slideshow(slideshowNode)){
      this.slideshows.success++;
      return this.slideshows.instances[slideshowNum];
    }
    this.slideshows.errors++;
  },
  loadCarrousels: function(){
    for(let carousel of document.querySelectorAll("carousel")){
      this.carousels.found++;
      if(this.carousels.instances[this.carousels.instances.length] = new Carousel(carousel)){
        this.carousels.success++;
      } else {
        this.carousels.errors++;
      }
    }
  },
  loadCarrousel: function(carouselElement){
    this.carousels.found++;
    if(this.carousels.instances[this.carousels.instances.length] = new Carousel(carouselElement)){
      this.carousels.success++;
    } else {
      this.carousels.errors++;
    }
  },
  loadDropDowns: function(){
    for(let dropDown of document.querySelectorAll("*[drop-down]")){
      this.dropDowns.found++;
      if(this.dropDowns.instances[this.dropDowns.instances.length] = new DropDown(dropDown)){
        this.dropDowns.success++;
        let dropDownElem = this.dropDowns.instances[this.dropDowns.instances.length - 1];
        if(dropDownElem.chain != false){
          if(this.dropDowns.chains.hasOwnProperty(dropDownElem.chain)){
            this.dropDowns.chains[dropDownElem.chain].push(dropDownElem);
          } else {
            this.dropDowns.chains[dropDownElem.chain] = [dropDownElem];
          }
        }
      } else {
        this.dropDowns.errors++;
      };
    }
  }
}

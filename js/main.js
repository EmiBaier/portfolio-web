OGFramework.loadElements();

// Dates inputs
const lessBtns = document.querySelectorAll(".avlb-btns[data-math='less']"),
      plusBtns = document.querySelectorAll(".avlb-btns[data-math='plus']");

for(let btn of lessBtns){
  btn.addEventListener("click", () => {
    let input = btn.parentNode.querySelector("input"),
        v = parseInt(input.value);
    if(v > input.getAttribute("min")) input.value = v - 1;
  });
}
for(let btn of plusBtns){
  btn.addEventListener("click", () => {
    let input = btn.parentNode.querySelector("input"),
        v = parseInt(input.value);
    if(v < input.getAttribute("max")) input.value = v + 1;
  });
}

// Hamburger menu
const header = document.querySelector("header"),
      hamburguer = document.getElementById("hamburguer"),
      sideBar = document.getElementById("side-bar");

const toggleMenu = () => {
  hamburguer.classList.toggle("times");
  sideBar.classList.toggle("active");
}
hamburguer.addEventListener("click", toggleMenu);
sideBar.addEventListener("click", toggleMenu);


// Newsletterletter
const newsletterForm = document.getElementById("newsletter");
if(newsletterForm){
  newsletterForm.addEventListener("submit", e => {
    e.preventDefault();

    let xhttp = new XMLHttpRequest(),
        data = new FormData(newsletterForm);

    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        window.alert(xhttp.responseText);
      }
    };
    xhttp.open("POST", "php/subscribe.php", true);
    xhttp.send(data);
  });
}

// Check
const checkForm = document.getElementById("check-wrapper"),
      avlbBtns = checkForm.querySelectorAll(".avlb-btns");

if(checkForm){
  for(let btn of avlbBtns){
    btn.addEventListener("click", e => {
      e.preventDefault();
    });
  }

  checkForm.addEventListener("submit", e => {
    e.preventDefault();
    let data = new FormData(checkForm),
        dialog = new Dialog(
          `<p>Por favor ingresa tu email y te responderemos a la brevedad</p>
          <input type="email" placeholder="ejemplo@mail.com" id="check-mail-validation">`,
          ["Consultar", "Cancelar"],
          () => {
            let emailInput = document.getElementById("check-mail-validation");
            if(emailInput.value == ""){
              let invalid = new Dialog("El mail ingresado no es válido.<br>Por favor intente nuevamente.");
              return false;
            }
            data.append("email", emailInput.value);

            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
              if (this.readyState == 4 && this.status == 200) {
                let thx = new Dialog(xhttp.responseText);
              }
            };
            xhttp.open("POST", "php/check.php", true);
            xhttp.send(data);
          }
        );
  });
}

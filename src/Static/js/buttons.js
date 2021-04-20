const buttons = document.querySelectorAll(".button");

for (const button of buttons) {
  button.addEventListener("click", () => {
    button.classList.toggle("button--active");
    location.href = "/game"
  });
}


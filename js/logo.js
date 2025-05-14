// Data Science Logo Animation
document.addEventListener("DOMContentLoaded", () => {
  // Get the logo element
  const logoContainer = document.querySelector(".logo-container");

  if (!logoContainer) return;

  // Add hover effect to enhance interactivity
  logoContainer.addEventListener("mouseenter", () => {
    const orbits = document.querySelectorAll(".atom-orbit");
    const dataPoints = document.querySelectorAll(".data-point");

    // Speed up orbits on hover
    orbits.forEach((orbit) => {
      orbit.style.animationDuration = "10s";
    });

    // Enhance data point pulse on hover
    dataPoints.forEach((point) => {
      point.style.animation = "pulse 1s infinite alternate";
    });
  });

  // Reset animations on mouse leave
  logoContainer.addEventListener("mouseleave", () => {
    const orbits = document.querySelectorAll(".atom-orbit");
    const dataPoints = document.querySelectorAll(".data-point");

    // Reset orbit speed
    orbits.forEach((orbit) => {
      orbit.style.animationDuration = "20s";
    });

    // Reset data point animations
    dataPoints.forEach((point, index) => {
      point.style.animation = "";
      point.style.opacity = 1;
    });
  });
});

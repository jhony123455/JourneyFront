  //animatios for the calendar view
  import { gsap } from "gsap";

  export const seasonAnimations = {
    primavera: (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.to(el, {
        duration: 3,
        background: "linear-gradient(to top, #c1dfc4, #deecdd)",
      });
      // Flores flotando
      for (let i = 0; i < 10; i++) {
        const flower = document.createElement("div");
        flower.classList.add("flower");
        el.appendChild(flower);
        gsap.fromTo(
          flower,
          {
            x: Math.random() * 100 + "vw",
            y: "100vh",
            opacity: 1,
            scale: Math.random() * 0.5 + 0.5,
          },
          {
            y: "-10vh",
            duration: Math.random() * 3 + 2,
            ease: "linear",
            repeat: -1,
            delay: Math.random() * 2,
          }
        );
      }
    },
    verano: (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.to(el, {
        duration: 3,
        background: "linear-gradient(to top, #fddb92, #d1fdff)",
      });
      // Sol y brillo
      const sun = document.createElement("div");
      sun.classList.add("sun");
      el.appendChild(sun);
      gsap.to(sun, { rotation: 360, repeat: -1, duration: 10, ease: "linear" });
    },
    otoño: (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.to(el, {
        duration: 3,
        background: "linear-gradient(to top, #d1913c, #ffd194)",
      });
      // Hojas cayendo
      for (let i = 0; i < 15; i++) {
        const leaf = document.createElement("div");
        leaf.classList.add("leaf");
        el.appendChild(leaf);
        gsap.fromTo(
          leaf,
          {
            x: Math.random() * 100 + "vw",
            y: "-10vh",
            rotation: 0,
          },
          {
            y: "110vh",
            rotation: 360,
            duration: Math.random() * 4 + 2,
            ease: "sine.inOut",
            repeat: -1,
            delay: Math.random() * 3,
          }
        );
      }
    },
    invierno: (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.to(el, {
        duration: 3,
        background: "linear-gradient(to top, #83a4d4, #b6fbff)",
      });
      // Copos de nieve
      for (let i = 0; i < 20; i++) {
        const snow = document.createElement("div");
        snow.classList.add("snowflake");
        el.appendChild(snow);
        gsap.fromTo(
          snow,
          {
            x: Math.random() * 100 + "vw",
            y: "-10vh",
            opacity: 0.8,
          },
          {
            y: "110vh",
            opacity: 0,
            duration: Math.random() * 5 + 3,
            repeat: -1,
            delay: Math.random() * 2,
          }
        );
      }
    },
  };

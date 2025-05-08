import { nextTick } from "vue";
import gsap from "gsap";

export default function useAnimation() {
  function animateTearSheet() {
    nextTick(() => {
      const el = document.querySelector(".fc");
      if (!el) return;

      const timeline = gsap.timeline();
      timeline
        .to(el, {
          duration: 0.4,
          opacity: 0,
          scale: 0.95,
          transformOrigin: "top center",
          ease: "power2.in",
        })
        .to(el, {
          duration: 0.5,
          opacity: 1,
          scale: 1,
          ease: "elastic.out(1, 0.5)",
        });
    });
  }

  function showNotification(message, duration = 3000) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    gsap.fromTo(
      notification,
      { y: -50, opacity: 0 },
      { y: 20, opacity: 1, duration: 0.3, ease: "power2.out" }
    );

    setTimeout(() => {
      gsap.to(notification, {
        y: -50,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          document.body.removeChild(notification);
        },
      });
    }, duration);
  }

  function animateModalOpen(ref) {
    nextTick(() => {
      if (ref.value) {
        gsap.fromTo(
          ref.value,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }
    });
  }

  function animateModalClose(ref, onComplete) {
    gsap.to(ref.value, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete
    });
  }

  function animateNewTag(selector) {
    nextTick(() => {
      const tags = document.querySelectorAll(selector);
      const lastTag = tags[tags.length - 1];

      if (lastTag) {
        gsap.fromTo(
          lastTag,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
      }
    });
  }

  function animateTagRemove(element, onComplete) {
    gsap.to(element, {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      onComplete
    });
  }

  function animateDragStart(element) {
    gsap.to(element, {
      scale: 0.95,
      boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
      duration: 0.2,
    });
  }

  function animateDragEnd(element) {
    gsap.to(element, {
      scale: 1,
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
      duration: 0.2,
    });
  }

  function animateCalendarLoad(selector) {
    nextTick(() => {
      const calendarEl = document.querySelector(selector);
      if (calendarEl) {
        gsap.fromTo(
          calendarEl,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      }
    });
  }

  return {
    animateTearSheet,
    showNotification,
    animateModalOpen,
    animateModalClose,
    animateNewTag,
    animateTagRemove,
    animateDragStart,
    animateDragEnd,
    animateCalendarLoad
  };
}

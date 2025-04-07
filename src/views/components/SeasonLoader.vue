<template>
  <div ref="loader" class="season-loader" :class="seasonClass"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'

const loader = ref(null)
const seasonClass = ref('')
const emojiInterval = ref(null)

const seasonEmojis = {
  primavera: { emoji: '🌸', class: 'primavera' },
  verano: { emoji: '🌞', class: 'verano' },
  otoño: { emoji: '🍂', class: 'otono' },
  invierno: { emoji: '❄️', class: 'invierno' }
}

const spawnEmoji = (emoji) => {
  const el = document.createElement('span')
  el.classList.add('emoji', seasonClass.value)
  el.textContent = emoji
  loader.value.appendChild(el)

  gsap.set(el, {
    x: Math.random() * window.innerWidth,
    y: -50,
    opacity: 0
  })

  gsap.to(el, {
    y: window.innerHeight + 100,
    x: '+=random(-100, 100)',
    opacity: 1,
    duration: Math.random() * 2 + 3,
    ease: 'power1.out',
    onComplete: () => {
      el.remove()
    }
  })
}

onMounted(() => {
  const estaciones = Object.keys(seasonEmojis)
  const random = estaciones[Math.floor(Math.random() * estaciones.length)]
  const { emoji, class: emojiClass } = seasonEmojis[random]
  seasonClass.value = emojiClass
  emojiInterval.value = setInterval(() => {
    Array.from({ length: 5 }).forEach(() => spawnEmoji(emoji))
  }, 300)

  setTimeout(() => {
    clearInterval(emojiInterval.value)
    setTimeout(() => {
      loader.value.style.display = 'none'
    }, 1000) 
  }, 3500)
})
</script>

<style scoped>
.season-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  display: flex;
  background-color: #fff;
}

/* Fondos por estación */
.season-loader.primavera {
  background: linear-gradient(to bottom, #fef6e4, #d3f8e2);
}
.season-loader.verano {
  background: linear-gradient(to bottom, #fff3b0, #ffcc70);
}
.season-loader.otono {
  background: linear-gradient(to bottom, #fcd5ce, #d8a47f);
}
.season-loader.invierno {
  background: linear-gradient(to bottom, #e0f7fa, #b2ebf2);
}

/* Emoji animado */
.emoji {
  position: absolute;
  font-size: 24px;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 0 2px #00000033);
  animation: float 3s infinite ease-in-out;
}

/* Colores por estación */
.emoji.primavera {
  color: #e91e63;
}
.emoji.verano {
  color: #fbc02d;
}
.emoji.otono {
  color: #8d6e63;
}
.emoji.invierno {
  color: #03a9f4;
}

/* Animación suave al flotar */
@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(10deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}
</style>

